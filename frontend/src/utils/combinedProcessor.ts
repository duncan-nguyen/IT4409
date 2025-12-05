/**
 * Combined Processor for Face Detection + Virtual Background
 * This processor can apply both face detection and virtual background simultaneously
 */

import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { loadSegmentationModel, applyVirtualBackground } from './virtualBackground';

let faceModel: blazeface.BlazeFaceModel | null = null;
let isLoadingFace = false;

/**
 * Load BlazeFace model
 */
async function loadFaceModel(): Promise<blazeface.BlazeFaceModel> {
  if (faceModel) {
    return faceModel;
  }

  if (isLoadingFace) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (faceModel) {
          clearInterval(checkInterval);
          resolve(faceModel);
        }
      }, 100);
    });
  }

  isLoadingFace = true;
  console.log('Loading BlazeFace model...');

  try {
    await tf.ready();
    await tf.setBackend('webgl');
    faceModel = await blazeface.load();
    console.log('✅ BlazeFace model loaded');
    isLoadingFace = false;
    return faceModel;
  } catch (error) {
    console.error('Failed to load BlazeFace model:', error);
    isLoadingFace = false;
    throw error;
  }
}

/**
 * Draw face detection boxes on canvas
 */
function drawFaceBoxes(
  ctx: CanvasRenderingContext2D,
  faces: blazeface.NormalizedFace[]
) {
  faces.forEach((face) => {
    const start = face.topLeft as [number, number];
    const end = face.bottomRight as [number, number];
    const size = [end[0] - start[0], end[1] - start[1]];

    // Draw bounding box
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.strokeRect(start[0], start[1], size[0], size[1]);

    // Draw confidence label
    const confidence = Math.round((face.probability?.[0] || 0) * 100);
    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Arial';
    ctx.fillText(`Face ${confidence}%`, start[0], start[1] - 5);

    // Draw landmarks
    if (face.landmarks) {
      ctx.fillStyle = '#FF0000';
      face.landmarks.forEach((landmark: any) => {
        const [x, y] = landmark as [number, number];
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });
}

export interface CombinedProcessorOptions {
  enableFaceDetection: boolean;
  backgroundType: 'none' | 'blur' | 'image';
  backgroundImageUrl?: string;
}

export class CombinedProcessor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private tempCanvas: HTMLCanvasElement | null = null; // For background processing
  private ctx: CanvasRenderingContext2D | null = null;
  private tempCtx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private faceModelReady = false;
  private segmentationModelReady = false;
  private backgroundImage: HTMLImageElement | null = null;
  private options: CombinedProcessorOptions;

  constructor(options: CombinedProcessorOptions) {
    this.options = options;
  }

  async initialize(stream: MediaStream): Promise<MediaStream> {
    this.stream = stream;

    // Load face detection model if needed
    if (this.options.enableFaceDetection) {
      try {
        await loadFaceModel();
        this.faceModelReady = true;
        console.log('✅ Face detection ready');
      } catch (error) {
        console.error('Failed to load face detection model:', error);
        this.faceModelReady = false;
      }
    }

    // Load segmentation model if background is enabled
    if (this.options.backgroundType !== 'none') {
      try {
        await loadSegmentationModel();
        this.segmentationModelReady = true;
        console.log('✅ Segmentation model ready');
      } catch (error) {
        console.error('Failed to load segmentation model:', error);
        this.segmentationModelReady = false;
      }

      // Load background image if provided
      if (this.options.backgroundImageUrl && this.options.backgroundType === 'image') {
        this.backgroundImage = new Image();
        this.backgroundImage.crossOrigin = 'anonymous';
        this.backgroundImage.src = this.options.backgroundImageUrl;
        
        try {
          await new Promise((resolve, reject) => {
            if (this.backgroundImage) {
              this.backgroundImage.onload = resolve;
              this.backgroundImage.onerror = reject;
            }
          });
          console.log('✅ Background image loaded');
        } catch (error) {
          console.error('Background image error:', error);
          this.backgroundImage = null;
        }
      }
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

    // Create main canvas for output
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.videoWidth || 1280;
    this.canvas.height = this.video.videoHeight || 720;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Create temp canvas for background processing
    if (this.options.backgroundType !== 'none') {
      this.tempCanvas = document.createElement('canvas');
      this.tempCanvas.width = this.canvas.width;
      this.tempCanvas.height = this.canvas.height;
      this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
    }

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

    console.log('✅ Combined processor initialized (Face:', this.options.enableFaceDetection, 'BG:', this.options.backgroundType, ')');
    return processedStream;
  }

  private processFrame = async () => {
    if (!this.isProcessing || !this.video || !this.canvas || !this.ctx) {
      return;
    }

    try {
      if (this.video.readyState === 4) {
        // Step 1: Apply background if enabled
        if (this.options.backgroundType !== 'none' && this.segmentationModelReady && this.tempCanvas && this.tempCtx) {
          // Apply background to temp canvas
          await applyVirtualBackground(
            this.video,
            this.tempCanvas,
            this.options.backgroundType,
            this.backgroundImage || undefined
          );
          
          // Draw temp canvas to main canvas
          this.ctx.drawImage(this.tempCanvas, 0, 0);
        } else {
          // No background, just draw video
          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Step 2: Apply face detection if enabled
        if (this.options.enableFaceDetection && this.faceModelReady && faceModel) {
          try {
            const predictions = await faceModel.estimateFaces(this.video, false);
            if (predictions.length > 0) {
              drawFaceBoxes(this.ctx, predictions);
            }
          } catch (error) {
            console.error('Face detection error:', error);
          }
        }
      } else {
        // Video not ready, just clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // Continue processing at 20 FPS
      this.timeoutId = setTimeout(() => {
        this.animationFrameId = requestAnimationFrame(this.processFrame);
      }, 1000 / 20);
    } catch (error) {
      console.error('Frame processing error:', error);
      this.animationFrameId = requestAnimationFrame(this.processFrame);
    }
  };

  async updateOptions(options: Partial<CombinedProcessorOptions>) {
    const oldOptions = { ...this.options };
    this.options = { ...this.options, ...options };
    
    // Load face model if enabling face detection
    if (options.enableFaceDetection && !this.faceModelReady) {
      try {
        await loadFaceModel();
        this.faceModelReady = true;
        console.log('✅ Face detection enabled');
      } catch (error) {
        console.error('Failed to load face detection model:', error);
      }
    }

    // Load segmentation model if enabling background
    if (options.backgroundType && options.backgroundType !== 'none' && !this.segmentationModelReady) {
      try {
        await loadSegmentationModel();
        this.segmentationModelReady = true;
        console.log('✅ Segmentation model loaded');
      } catch (error) {
        console.error('Failed to load segmentation model:', error);
      }
    }

    // Create temp canvas if switching from none to background
    if (oldOptions.backgroundType === 'none' && options.backgroundType && options.backgroundType !== 'none') {
      if (!this.tempCanvas && this.canvas) {
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = this.canvas.width;
        this.tempCanvas.height = this.canvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
      }
    }
    
    // Update background image if changed
    if (options.backgroundImageUrl && options.backgroundType === 'image') {
      this.backgroundImage = new Image();
      this.backgroundImage.crossOrigin = 'anonymous';
      this.backgroundImage.src = options.backgroundImageUrl;
      this.backgroundImage.onload = () => {
        console.log('✅ Background image updated');
      };
      this.backgroundImage.onerror = () => {
        console.error('Failed to load new background image');
        this.backgroundImage = null;
      };
    }

    console.log('🔄 Processor options updated:', this.options);
  }

  stop() {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }

    console.log('🛑 Combined processor stopped');
  }
}
