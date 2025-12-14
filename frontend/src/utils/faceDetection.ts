/**
 * Client-side Face Detection using TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

let model: blazeface.BlazeFaceModel | null = null;
let isLoading = false;

/**
 * Load BlazeFace model
 */
export async function loadFaceDetectionModel(): Promise<blazeface.BlazeFaceModel> {
  if (model) {
    return model;
  }

  if (isLoading) {
    // Wait for loading to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (model) {
          clearInterval(checkInterval);
          resolve(model);
        }
      }, 100);
    });
  }

  isLoading = true;
  console.log('Loading BlazeFace model...');

  try {
    await tf.ready();
    await tf.setBackend('webgl');
    model = await blazeface.load();
    console.log('✅ BlazeFace model loaded successfully');
    isLoading = false;
    return model;
  } catch (error) {
    console.error('Failed to load BlazeFace model:', error);
    isLoading = false;
    throw error;
  }
}

/**
 * Detect faces in video element
 */
export async function detectFaces(
  video: HTMLVideoElement
): Promise<blazeface.NormalizedFace[]> {
  if (!model) {
    model = await loadFaceDetectionModel();
  }

  try {
    const predictions = await model.estimateFaces(video, false);
    return predictions;
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
}

/**
 * Draw face detection boxes on canvas
 */
export function drawFaceBoxes(
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

    // Draw confidence label (number | Tensor1D)
    let probValue = 0;
    const prob = face.probability as unknown;
    if (typeof prob === 'number') {
      probValue = prob;
    } else if (prob && typeof (prob as any).dataSync === 'function') {
      const arr = (prob as any).dataSync();
      probValue = arr && arr.length ? arr[0] : 0;
    }
    const confidence = Math.round(probValue * 100);
    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Arial';
    ctx.fillText(`Face ${confidence}%`, start[0], start[1] - 5);

    // Draw landmarks (eyes, nose, mouth, ears) — number[][] | Tensor2D
    if (face.landmarks) {
      ctx.fillStyle = '#FF0000';
      const lm = face.landmarks as unknown;
      let points: [number, number][] = [];
      if (Array.isArray(lm)) {
        points = lm as [number, number][];
      } else if (lm && typeof (lm as any).arraySync === 'function') {
        const arr = (lm as any).arraySync() as number[][];
        points = arr.map((p) => [p[0], p[1]] as [number, number]);
      }
      points.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });
}

/**
 * Process video stream with face detection
 */
export class FaceDetectionProcessor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isProcessing = false;
  private modelReady = false;

  async initialize(stream: MediaStream): Promise<MediaStream> {
    this.stream = stream;

    // Load model
    try {
      await loadFaceDetectionModel();
      this.modelReady = true;
    } catch (error) {
      console.error('Failed to load face detection model:', error);
      this.modelReady = false;
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
    const processedStream = this.canvas.captureStream(30);

    // Add audio track from original stream
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      processedStream.addTrack(audioTrack);
    }

    return processedStream;
  }

  private processFrame = async () => {
    if (!this.isProcessing || !this.video || !this.canvas || !this.ctx) {
      return;
    }

    try {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Detect and draw faces
      if (this.modelReady && this.video.readyState === 4) {
        const faces = await detectFaces(this.video);
        if (faces.length > 0) {
          drawFaceBoxes(this.ctx, faces);
        }
      }

      // Continue processing
      this.animationFrameId = requestAnimationFrame(this.processFrame);
    } catch (error) {
      console.error('Frame processing error:', error);
      // Continue even if face detection fails
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
  }
}
