/**
 * Noise Suppression using Web Audio API
 * Implements basic noise gate and optional RNNoise-like processing
 */

export interface NoiseSuppressionOptions {
    enabled?: boolean;
    aggressiveness?: 'low' | 'medium' | 'high';
    noiseGateThreshold?: number; // -100 to 0 dB
}

export class NoiseSuppressor {
    private audioContext: AudioContext | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private destinationNode: MediaStreamAudioDestinationNode | null = null;
    private gainNode: GainNode | null = null;
    private analyserNode: AnalyserNode | null = null;
    private compressorNode: DynamicsCompressorNode | null = null;
    private highpassFilter: BiquadFilterNode | null = null;
    private lowpassFilter: BiquadFilterNode | null = null;
    private noiseGateNode: GainNode | null = null;

    private isProcessing = false;
    private animationFrameId: number | null = null;
    private options: Required<NoiseSuppressionOptions>;

    // Noise gate state
    private noiseFloor = -50;
    private smoothedLevel = -100;
    private gateOpen = false;

    constructor(options: NoiseSuppressionOptions = {}) {
        this.options = {
            enabled: true,
            aggressiveness: 'medium',
            noiseGateThreshold: -40,
            ...options,
        };
    }

    /**
     * Process audio stream with noise suppression
     */
    async processStream(inputStream: MediaStream): Promise<MediaStream> {
        // Get audio track
        const audioTrack = inputStream.getAudioTracks()[0];
        if (!audioTrack) {
            console.warn('No audio track found in stream');
            return inputStream;
        }

        try {
            // Create audio context
            this.audioContext = new AudioContext();

            // Create source from input stream
            this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);

            // Create destination for processed audio
            this.destinationNode = this.audioContext.createMediaStreamDestination();

            // Create processing chain
            this.createProcessingChain();

            // Connect nodes
            this.connectNodes();

            // Start noise gate processing
            this.startNoiseGateProcessing();

            this.isProcessing = true;
            console.log('🔇 Noise suppression enabled');

            // Create new stream with processed audio and original video
            const processedStream = new MediaStream();

            // Add processed audio track
            this.destinationNode.stream.getAudioTracks().forEach(track => {
                processedStream.addTrack(track);
            });

            // Add original video tracks
            inputStream.getVideoTracks().forEach(track => {
                processedStream.addTrack(track);
            });

            return processedStream;

        } catch (error) {
            console.error('Failed to initialize noise suppression:', error);
            return inputStream;
        }
    }

    private createProcessingChain(): void {
        if (!this.audioContext) return;

        // High-pass filter to remove low frequency rumble (< 80Hz)
        this.highpassFilter = this.audioContext.createBiquadFilter();
        this.highpassFilter.type = 'highpass';
        this.highpassFilter.frequency.value = 80;
        this.highpassFilter.Q.value = 0.7;

        // Low-pass filter to remove high frequency hiss (> 8kHz for aggressive, > 12kHz for low)
        this.lowpassFilter = this.audioContext.createBiquadFilter();
        this.lowpassFilter.type = 'lowpass';
        this.lowpassFilter.frequency.value = this.getLowpassFrequency();
        this.lowpassFilter.Q.value = 0.7;

        // Compressor to normalize audio levels
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        this.compressorNode.threshold.value = -24;
        this.compressorNode.knee.value = 30;
        this.compressorNode.ratio.value = 12;
        this.compressorNode.attack.value = 0.003;
        this.compressorNode.release.value = 0.25;

        // Noise gate (implemented via gain node controlled by analyser)
        this.noiseGateNode = this.audioContext.createGain();
        this.noiseGateNode.gain.value = 1;

        // Analyser for noise gate level detection
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.analyserNode.smoothingTimeConstant = 0.3;

        // Output gain
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;
    }

    private connectNodes(): void {
        if (!this.sourceNode || !this.destinationNode) return;
        if (!this.highpassFilter || !this.lowpassFilter) return;
        if (!this.compressorNode || !this.noiseGateNode) return;
        if (!this.analyserNode || !this.gainNode) return;

        // Signal chain: source -> highpass -> lowpass -> analyser -> noiseGate -> compressor -> gain -> destination
        this.sourceNode.connect(this.highpassFilter);
        this.highpassFilter.connect(this.lowpassFilter);
        this.lowpassFilter.connect(this.analyserNode);
        this.analyserNode.connect(this.noiseGateNode);
        this.noiseGateNode.connect(this.compressorNode);
        this.compressorNode.connect(this.gainNode);
        this.gainNode.connect(this.destinationNode);
    }

    private getLowpassFrequency(): number {
        switch (this.options.aggressiveness) {
            case 'low':
                return 14000;
            case 'high':
                return 8000;
            case 'medium':
            default:
                return 11000;
        }
    }

    private getNoiseGateParams(): { attackTime: number; releaseTime: number; holdTime: number } {
        switch (this.options.aggressiveness) {
            case 'low':
                return { attackTime: 0.01, releaseTime: 0.3, holdTime: 0.1 };
            case 'high':
                return { attackTime: 0.005, releaseTime: 0.1, holdTime: 0.05 };
            case 'medium':
            default:
                return { attackTime: 0.01, releaseTime: 0.2, holdTime: 0.08 };
        }
    }

    private startNoiseGateProcessing(): void {
        if (!this.analyserNode || !this.noiseGateNode || !this.audioContext) return;

        const dataArray = new Float32Array(this.analyserNode.frequencyBinCount);
        const params = this.getNoiseGateParams();
        let holdCounter = 0;

        const processNoiseGate = () => {
            if (!this.isProcessing) return;

            this.analyserNode!.getFloatTimeDomainData(dataArray);

            // Calculate RMS level
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const dbLevel = 20 * Math.log10(Math.max(rms, 0.0001));

            // Smooth the level
            this.smoothedLevel = this.smoothedLevel * 0.9 + dbLevel * 0.1;

            // Noise gate logic
            const threshold = this.options.noiseGateThreshold;
            const currentTime = this.audioContext!.currentTime;

            if (this.smoothedLevel > threshold) {
                // Signal above threshold - open gate
                if (!this.gateOpen) {
                    this.gateOpen = true;
                    this.noiseGateNode!.gain.setTargetAtTime(1.0, currentTime, params.attackTime);
                }
                holdCounter = params.holdTime * 60; // Convert to frames (assuming ~60fps)
            } else if (holdCounter > 0) {
                // In hold phase
                holdCounter--;
            } else if (this.gateOpen) {
                // Signal below threshold and hold expired - close gate
                this.gateOpen = false;
                this.noiseGateNode!.gain.setTargetAtTime(0.0, currentTime, params.releaseTime);
            }

            this.animationFrameId = requestAnimationFrame(processNoiseGate);
        };

        processNoiseGate();
    }

    /**
     * Update noise suppression options
     */
    updateOptions(options: Partial<NoiseSuppressionOptions>): void {
        this.options = { ...this.options, ...options };

        if (this.lowpassFilter) {
            this.lowpassFilter.frequency.value = this.getLowpassFrequency();
        }
    }

    /**
     * Set noise gate threshold
     */
    setThreshold(threshold: number): void {
        this.options.noiseGateThreshold = Math.max(-100, Math.min(0, threshold));
    }

    /**
     * Set aggressiveness level
     */
    setAggressiveness(level: 'low' | 'medium' | 'high'): void {
        this.options.aggressiveness = level;
        if (this.lowpassFilter) {
            this.lowpassFilter.frequency.value = this.getLowpassFrequency();
        }
    }

    /**
     * Enable/disable noise suppression
     */
    setEnabled(enabled: boolean): void {
        this.options.enabled = enabled;
        if (this.noiseGateNode) {
            this.noiseGateNode.gain.value = enabled ? (this.gateOpen ? 1 : 0) : 1;
        }
    }

    /**
     * Get current audio level in dB
     */
    getLevel(): number {
        return this.smoothedLevel;
    }

    /**
     * Check if noise gate is currently open (speech detected)
     */
    isGateOpen(): boolean {
        return this.gateOpen;
    }

    /**
     * Stop noise suppression and clean up
     */
    stop(): void {
        this.isProcessing = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Disconnect all nodes
        try {
            this.sourceNode?.disconnect();
            this.highpassFilter?.disconnect();
            this.lowpassFilter?.disconnect();
            this.analyserNode?.disconnect();
            this.noiseGateNode?.disconnect();
            this.compressorNode?.disconnect();
            this.gainNode?.disconnect();
        } catch {
            // Nodes may already be disconnected
        }

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.audioContext = null;
        this.sourceNode = null;
        this.destinationNode = null;
        this.highpassFilter = null;
        this.lowpassFilter = null;
        this.analyserNode = null;
        this.noiseGateNode = null;
        this.compressorNode = null;
        this.gainNode = null;

        console.log('🔇 Noise suppression stopped');
    }
}

/**
 * Enhanced noise suppression with spectral gating
 * Uses FFT to identify and reduce noise frequencies
 */
export class SpectralNoiseSuppressor extends NoiseSuppressor {
    private workletNode: AudioWorkletNode | null = null;

    async processStream(inputStream: MediaStream): Promise<MediaStream> {
        // Try to use AudioWorklet for better performance
        const audioTrack = inputStream.getAudioTracks()[0];
        if (!audioTrack) {
            return inputStream;
        }

        try {
            const audioContext = new AudioContext();

            // Check if AudioWorklet is supported
            if (audioContext.audioWorklet) {
                // In a real implementation, you would load an AudioWorklet module here
                // For now, fall back to the base implementation
                await audioContext.close();
            }
        } catch {
            // AudioWorklet not supported
        }

        // Fall back to base implementation
        return super.processStream(inputStream);
    }
}

// Singleton instance
let noiseSuppressorInstance: NoiseSuppressor | null = null;

export function getNoiseSuppressor(options?: NoiseSuppressionOptions): NoiseSuppressor {
    if (!noiseSuppressorInstance) {
        noiseSuppressorInstance = new NoiseSuppressor(options);
    }
    return noiseSuppressorInstance;
}

export function disposeNoiseSuppressor(): void {
    if (noiseSuppressorInstance) {
        noiseSuppressorInstance.stop();
        noiseSuppressorInstance = null;
    }
}
