/**
 * Canvas Video Processor
 * Process video stream with filters using Canvas API
 */

export class CanvasVideoProcessor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isProcessing = false;

  /**
   * Initialize processor with video stream
   */
  async initialize(stream: MediaStream): Promise<MediaStream> {
    this.stream = stream;

    // Create video element
    this.video = document.createElement('video');
    this.video.srcObject = stream;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;

    // Wait for video to be ready
    await new Promise<void>((resolve) => {
      if (this.video) {
        this.video.onloadedmetadata = () => {
          this.video!.play();
          resolve();
        };
      }
    });

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.videoWidth || 1280;
    this.canvas.height = this.video.videoHeight || 720;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Start processing
    this.isProcessing = true;
    this.processFrame();

    // Get processed stream from canvas
    const processedStream = this.canvas.captureStream(30);

    // Add audio track from original stream
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      processedStream.addTrack(audioTrack);
    }

    return processedStream;
  }

  /**
   * Process each frame
   */
  private processFrame = () => {
    if (!this.isProcessing || !this.video || !this.canvas || !this.ctx) {
      return;
    }

    try {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Continue processing
      this.animationFrameId = requestAnimationFrame(this.processFrame);
    } catch (error) {
      console.error('Frame processing error:', error);
    }
  };

  /**
   * Apply filter to current frame
   */
  applyFilter(filterType: string) {
    if (!this.ctx) return;

    switch (filterType) {
      case 'grayscale':
        this.ctx.filter = 'grayscale(100%)';
        break;
      case 'sepia':
        this.ctx.filter = 'sepia(100%)';
        break;
      case 'blur':
        this.ctx.filter = 'blur(5px)';
        break;
      default:
        this.ctx.filter = 'none';
    }
  }

  /**
   * Draw face detection boxes (simple placeholder)
   */
  drawFaceDetection() {
    if (!this.ctx || !this.canvas) return;

    // Simple face detection visualization
    // In real implementation, you would use TensorFlow.js or similar
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const boxWidth = 300;
    const boxHeight = 400;

    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(
      centerX - boxWidth / 2,
      centerY - boxHeight / 2,
      boxWidth,
      boxHeight
    );

    // Draw label
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Face Detected', centerX - boxWidth / 2, centerY - boxHeight / 2 - 10);
  }

  /**
   * Stop processing
   */
  stop() {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
  }

  /**
   * Get canvas element for debugging
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
}
