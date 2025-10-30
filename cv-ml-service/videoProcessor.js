/**
 * Video Processor
 * Core module for real-time video processing with requestAnimationFrame loop
 */

import { VIDEO_CONFIG, CANVAS_IDS, VIDEO_ID, ERROR_MESSAGES, PERFORMANCE } from './constants.js';
import { FilterManager } from './filterManager.js';

/**
 * VideoProcessor class
 * Handles video capture, processing loop, and stream output
 */
export class VideoProcessor {
    constructor() {
        this.video = null;
        this.sourceCanvas = null;
        this.sourceCtx = null;
        this.resultCanvas = null;
        this.resultCtx = null;
        this.filterManager = new FilterManager();
        
        this.isRunning = false;
        this.animationFrameId = null;
        this.stream = null;
        this.processedStream = null;
        
        // Performance metrics
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        
        // Callbacks
        this.onFpsUpdate = null;
        this.onError = null;
        this.onReady = null;
    }

    /**
     * Initialize video processor
     */
    async initialize() {
        console.log('Initializing Video Processor...');

        try {
            // Check browser support
            this.checkBrowserSupport();

            // Create video elements and canvases
            this.createElements();

            // Initialize filter manager
            await this.filterManager.initialize();

            // Request camera access
            await this.requestCameraAccess();

            console.log('Video Processor initialized successfully!');
            
            if (this.onReady) {
                this.onReady();
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Check if browser supports required features
     */
    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
        }

        if (!window.requestAnimationFrame) {
            throw new Error(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
        }
    }

    /**
     * Create video and canvas elements
     */
    createElements() {
        // Get or create video element
        this.video = document.getElementById(VIDEO_ID);
        if (!this.video) {
            this.video = document.createElement('video');
            this.video.id = VIDEO_ID;
            this.video.width = VIDEO_CONFIG.WIDTH;
            this.video.height = VIDEO_CONFIG.HEIGHT;
            this.video.autoplay = true;
            this.video.playsInline = true;
            this.video.style.display = 'none';
            document.body.appendChild(this.video);
        }

        // Get or create source canvas
        this.sourceCanvas = document.getElementById(CANVAS_IDS.SOURCE);
        if (!this.sourceCanvas) {
            this.sourceCanvas = document.createElement('canvas');
            this.sourceCanvas.id = CANVAS_IDS.SOURCE;
            this.sourceCanvas.width = VIDEO_CONFIG.WIDTH;
            this.sourceCanvas.height = VIDEO_CONFIG.HEIGHT;
            this.sourceCanvas.style.display = 'none';
            document.body.appendChild(this.sourceCanvas);
        }
        this.sourceCtx = this.sourceCanvas.getContext('2d');

        // Get or create result canvas
        this.resultCanvas = document.getElementById(CANVAS_IDS.RESULT);
        if (!this.resultCanvas) {
            this.resultCanvas = document.createElement('canvas');
            this.resultCanvas.id = CANVAS_IDS.RESULT;
            this.resultCanvas.width = VIDEO_CONFIG.WIDTH;
            this.resultCanvas.height = VIDEO_CONFIG.HEIGHT;
            document.body.appendChild(this.resultCanvas);
        }
        this.resultCtx = this.resultCanvas.getContext('2d');
    }

    /**
     * Request camera and microphone access
     */
    async requestCameraAccess() {
        try {
            console.log('Requesting camera access...');

            const constraints = {
                video: {
                    width: { ideal: VIDEO_CONFIG.WIDTH },
                    height: { ideal: VIDEO_CONFIG.HEIGHT },
                    frameRate: { ideal: VIDEO_CONFIG.TARGET_FPS }
                },
                audio: true
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });

            console.log('✓ Camera access granted');
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error(ERROR_MESSAGES.CAMERA_DENIED);
            } else {
                throw new Error(ERROR_MESSAGES.CAMERA_ERROR);
            }
        }
    }

    /**
     * Start the processing loop
     */
    start() {
        if (this.isRunning) {
            console.warn('Video processor already running');
            return;
        }

        console.log('Starting video processor...');
        this.isRunning = true;
        this.lastFpsUpdate = Date.now();
        this.frameCount = 0;
        this.processFrame();
    }

    /**
     * Stop the processing loop
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('Stopping video processor...');
        this.isRunning = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main processing loop (heart of the module)
     * This is the requestAnimationFrame loop mentioned in the requirements
     */
    async processFrame() {
        if (!this.isRunning) {
            return;
        }

        try {
            // 1. Draw original video frame to source canvas
            this.sourceCtx.drawImage(this.video, 0, 0, VIDEO_CONFIG.WIDTH, VIDEO_CONFIG.HEIGHT);

            // 2. Copy to result canvas
            this.resultCtx.drawImage(this.sourceCanvas, 0, 0);

            // 3. Apply filters to result canvas
            await this.filterManager.applyFilters(this.resultCtx, this.video);

            // 4. Update FPS
            this.updateFps();

            // 5. Request next frame
            this.animationFrameId = requestAnimationFrame(() => this.processFrame());
        } catch (error) {
            console.error('Error in processing loop:', error);
            this.handleError(error);
        }
    }

    /**
     * Update FPS counter
     */
    updateFps() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= PERFORMANCE.FPS_UPDATE_INTERVAL) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;

            if (this.onFpsUpdate) {
                this.onFpsUpdate(this.fps);
            }

            // Performance warning
            if (this.fps < PERFORMANCE.MIN_TARGET_FPS) {
                console.warn(`FPS below target: ${this.fps} FPS`);
            }
        }
    }

    /**
     * Get processed video stream with audio
     * This is the output stream that will be used by WebRTC module
     * @returns {MediaStream}
     */
    getProcessedStream() {
        if (!this.resultCanvas) {
            throw new Error('Result canvas not initialized');
        }

        // Capture video stream from result canvas
        const videoStream = this.resultCanvas.captureStream(VIDEO_CONFIG.TARGET_FPS);

        // Get audio track from original stream
        const audioTracks = this.stream.getAudioTracks();

        // Create combined stream
        const combinedStream = new MediaStream();

        // Add video track from canvas
        videoStream.getVideoTracks().forEach(track => {
            combinedStream.addTrack(track);
        });

        // Add audio track from original stream
        audioTracks.forEach(track => {
            combinedStream.addTrack(track);
        });

        this.processedStream = combinedStream;
        return combinedStream;
    }

    /**
     * Get filter manager instance
     * @returns {FilterManager}
     */
    getFilterManager() {
        return this.filterManager;
    }

    /**
     * Get current FPS
     * @returns {number}
     */
    getCurrentFps() {
        return this.fps;
    }

    /**
     * Get result canvas for UI display
     * @returns {HTMLCanvasElement}
     */
    getResultCanvas() {
        return this.resultCanvas;
    }

    /**
     * Handle errors
     * @param {Error} error
     */
    handleError(error) {
        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * Cleanup and release resources
     */
    cleanup() {
        this.stop();

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        if (this.processedStream) {
            this.processedStream.getTracks().forEach(track => track.stop());
        }

        console.log('Video processor cleaned up');
    }
}

