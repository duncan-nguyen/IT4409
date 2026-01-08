import { AvatarType, FilterType } from '@/types';

// AI processing modes supported by the server
export type AIProcessingMode =
    | 'none'
    | 'blur'
    | 'face-detection'
    | 'face-mesh'
    | 'avatar'
    | 'pose-estimation'
    | 'hands'
    | 'beauty'
    | 'cartoon'
    | 'edge-detection';

export class AIServiceConnection {
    private pc: RTCPeerConnection | null = null;
    private baseUrl: string;
    private currentMode: AIProcessingMode = 'none';
    private currentAvatarType: AvatarType = 'cartoon';

    constructor(baseUrl: string = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if AI service is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get available AI processing modes from server
     */
    async getAvailableModes(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/modes`);
            if (response.ok) {
                const data = await response.json();
                return data.modes || [];
            }
        } catch (error) {
            console.error('Failed to get AI modes:', error);
        }
        return [];
    }

    /**
     * Process video stream with AI effects
     */
    async processStream(
        inputStream: MediaStream,
        mode: AIProcessingMode,
        avatarType: AvatarType = 'cartoon'
    ): Promise<MediaStream> {
        if (mode === 'none') {
            return inputStream;
        }

        this.close(); // Close existing connection if any
        this.currentMode = mode;
        this.currentAvatarType = avatarType;

        this.pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Create promise for receiving the processed stream BEFORE any negotiation
        const trackPromise = new Promise<MediaStream>((resolve, reject) => {
            if (!this.pc) {
                reject(new Error('PeerConnection not initialized'));
                return;
            }

            const timeout = setTimeout(() => {
                console.error('Timeout waiting for AI processed stream');
                reject(new Error('Timeout waiting for AI processed stream'));
            }, 15000);

            this.pc.ontrack = (event) => {
                clearTimeout(timeout);
                console.log('Received AI processed track', event.track.kind);
                if (event.streams && event.streams[0]) {
                    resolve(event.streams[0]);
                } else {
                    // Create a new MediaStream with the received track
                    const newStream = new MediaStream([event.track]);
                    resolve(newStream);
                }
            };

            this.pc.onconnectionstatechange = () => {
                console.log('Connection state:', this.pc?.connectionState);
                if (this.pc?.connectionState === 'failed') {
                    clearTimeout(timeout);
                    reject(new Error('Connection failed'));
                }
            };

            this.pc.oniceconnectionstatechange = () => {
                console.log('ICE state:', this.pc?.iceConnectionState);
            };
        });

        // Add transceiver to receive video from server
        this.pc.addTransceiver('video', { direction: 'recvonly' });

        // Add video track to PC (send to server)
        const track = inputStream.getVideoTracks()[0];
        if (!track) {
            console.error('No video track found in input stream');
            return inputStream;
        }
        this.pc.addTrack(track, inputStream);

        // Create offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        // Wait for ICE gathering to complete
        await this.waitForIceGathering();

        // Send offer to AI service
        console.log(` Connecting to AI Service with mode: ${mode}, avatar: ${avatarType}`);
        const response = await fetch(`${this.baseUrl}/offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sdp: this.pc.localDescription?.sdp,
                type: this.pc.localDescription?.type,
                mode: mode,
                avatar_type: avatarType,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI Service error:', errorText);
            throw new Error(`Failed to connect to AI service: ${response.status}`);
        }

        const answer = await response.json();
        console.log('📥 Received SDP answer from AI Service');
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Wait for the track
        return trackPromise;
    }

    /**
     * Wait for ICE gathering to complete
     */
    private waitForIceGathering(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.pc) {
                resolve();
                return;
            }

            if (this.pc.iceGatheringState === 'complete') {
                resolve();
                return;
            }

            const checkState = () => {
                if (this.pc?.iceGatheringState === 'complete') {
                    resolve();
                }
            };

            this.pc.onicegatheringstatechange = checkState;

            // Timeout after 2 seconds
            setTimeout(resolve, 2000);
        });
    }

    /**
     * Get current processing mode
     */
    getMode(): AIProcessingMode {
        return this.currentMode;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.pc !== null && this.pc.connectionState === 'connected';
    }

    close() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this.currentMode = 'none';
    }
}

/**
 * Convert FilterType to AI processing mode
 */
export function filterTypeToAIMode(filterType: FilterType): AIProcessingMode {
    const aiModes: FilterType[] = [
        'blur',
        'face-detection',
        'face-mesh',
        'avatar',
        'pose-estimation',
        'hands',
        'beauty',
        'cartoon',
        'edge-detection',
    ];

    if (aiModes.includes(filterType)) {
        return filterType as AIProcessingMode;
    }
    return 'none';
}
