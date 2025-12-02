/**
 * Background Processor using BodyPix
 */

import { loadSegmentationModel, applyVirtualBackground } from './virtualBackground';

export class BackgroundProcessor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isProcessing = false;
  private modelReady = false;
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundType: 'none' | 'blur' | 'image' = 'none';

  async initialize(
    stream: MediaStream,
    backgroundType: 'none' | 'blur' | 'image',
    imageUrl?: string
  ): Promise<MediaStream> {
    this.stream = stream;
    this.backgroundType = backgroundType;

    // Load background image if provided
    if (imageUrl && backgroundType === 'image') {
      this.backgroundImage = new Image();
      this.backgroundImage.crossOrigin = 'anonymous';
      this.backgroundImage.src = imageUrl;
      
      try {
        await new Promise((resolve, reject) => {
          if (this.backgroundImage) {
            this.backgroundImage.onload = resolve;
            this.backgroundImage.onerror = () => {
              console.error('Failed to load background image');
              reject(new Error('Failed to load background image'));
            };
          }
        });
        console.log('✅ Background image loaded');
      } catch (error) {
        console.error('Background image error:', error);
        this.backgroundImage = null;
      }
    }

    // Load model
    try {
      await loadSegmentationModel();
      this.modelReady = true;
      console.log('✅ Segmentation model ready');
    } catch (error) {
      console.error('Failed to load segmentation model:', error);
      this.modelReady = false;
      return stream;
    }

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
    const processedStream = this.canvas.captureStream(20); // 20 FPS for performance

    // Add audio track from original stream
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      processedStream.addTrack(audioTrack);
    }

    console.log('✅ Background processor initialized');
    return processedStream;
  }

  private processFrame = async () => {
    if (!this.isProcessing || !this.video || !this.canvas || !this.ctx) {
      return;
    }

    try {
      if (this.modelReady && this.video.readyState === 4) {
        await applyVirtualBackground(
          this.video,
          this.canvas,
          this.backgroundType,
          this.backgroundImage || undefined
        );
      } else {
        // Model not ready, just draw video
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      }

      // Continue processing at lower FPS for performance
      setTimeout(() => {
        this.animationFrameId = requestAnimationFrame(this.processFrame);
      }, 1000 / 20); // 20 FPS
    } catch (error) {
      console.error('Frame processing error:', error);
      // Continue even if processing fails
      this.animationFrameId = requestAnimationFrame(this.processFrame);
    }
  };

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

    console.log('🛑 Background processor stopped');
  }
}
