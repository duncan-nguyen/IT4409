import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';

let segmentationModel: bodyPix.BodyPix | null = null;

export const loadSegmentationModel = async (): Promise<bodyPix.BodyPix> => {
  if (!segmentationModel) {
    await tf.ready();
    await tf.setBackend('webgl');
    
    segmentationModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });
    
    console.log('✅ BodyPix segmentation model loaded');
  }
  return segmentationModel;
};

export const applyVirtualBackground = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  backgroundType: 'blur' | 'image' | 'none',
  backgroundImage?: HTMLImageElement
) => {
  if (!segmentationModel) {
    segmentationModel = await loadSegmentationModel();
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    // Perform segmentation
    const segmentation = await segmentationModel.segmentPerson(video, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    });

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (backgroundType === 'none') {
      // No background replacement, just draw video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    // Create temporary canvas for background
    const backgroundCanvas = document.createElement('canvas');
    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;
    const bgCtx = backgroundCanvas.getContext('2d');
    if (!bgCtx) return;

    if (backgroundType === 'blur') {
      // Apply blur to background
      bgCtx.filter = 'blur(15px)';
      bgCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      bgCtx.filter = 'none';
    } else if (backgroundType === 'image' && backgroundImage) {
      // Draw custom background image
      bgCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw the background
    ctx.drawImage(backgroundCanvas, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Draw video on temporary canvas
    const personCanvas = document.createElement('canvas');
    personCanvas.width = canvas.width;
    personCanvas.height = canvas.height;
    const personCtx = personCanvas.getContext('2d');
    if (!personCtx) return;
    
    personCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const personImageData = personCtx.getImageData(0, 0, canvas.width, canvas.height);
    const personPixels = personImageData.data;

    // Apply mask: Replace pixels where person is detected
    const mask = segmentation.data;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 1) {
        // Person pixel - use original video
        const pixelIndex = i * 4;
        pixels[pixelIndex] = personPixels[pixelIndex]; // R
        pixels[pixelIndex + 1] = personPixels[pixelIndex + 1]; // G
        pixels[pixelIndex + 2] = personPixels[pixelIndex + 2]; // B
        pixels[pixelIndex + 3] = 255; // A
      }
    }

    // Put the composited image back
    ctx.putImageData(imageData, 0, 0);

  } catch (error) {
    console.error('Virtual background error:', error);
    // Fallback: just draw video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }
};

export const disposeSegmentationModel = () => {
  if (segmentationModel) {
    segmentationModel.dispose();
    segmentationModel = null;
    console.log('🗑️ Segmentation model disposed');
  }
};
