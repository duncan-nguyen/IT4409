import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as bodyPix from '@tensorflow-models/body-pix';

let faceModel: blazeface.BlazeFaceModel | null = null;
let segmentationModel: bodyPix.BodyPix | null = null;

export const loadFaceDetectionModel = async (): Promise<blazeface.BlazeFaceModel> => {
  if (!faceModel) {
    await tf.ready();
    await tf.setBackend('webgl');
    faceModel = await blazeface.load();
    console.log('BlazeFace model loaded');
  }
  return faceModel;
};

export const loadSegmentationModel = async (): Promise<bodyPix.BodyPix> => {
  if (!segmentationModel) {
    await tf.ready();
    await tf.setBackend('webgl');
    segmentationModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.50,
      quantBytes: 2,
    });
    console.log('BodyPix segmentation model loaded');
  }
  return segmentationModel;
};

export const detectFaces = async (
  video: HTMLVideoElement
): Promise<blazeface.NormalizedFace[]> => {
  if (!faceModel) {
    faceModel = await loadFaceDetectionModel();
  }

  try {
    const predictions = await faceModel.estimateFaces(video, false);
    return predictions;
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
};

export const drawFaceDetection = (
  ctx: CanvasRenderingContext2D,
  faces: blazeface.NormalizedFace[]
) => {
  faces.forEach((face) => {
    const start = face.topLeft as [number, number];
    const end = face.bottomRight as [number, number];
    const size = [end[0] - start[0], end[1] - start[1]];

    // Draw bounding box
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.strokeRect(start[0], start[1], size[0], size[1]);

    // Draw landmarks (eyes, nose, mouth, ears)
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
};

export const applyBlurFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'blur(5px)';
};

export const applyBackgroundBlur = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) => {
  if (!segmentationModel) {
    segmentationModel = await loadSegmentationModel();
  }

  const segmentation = await segmentationModel.segmentPerson(video, {
    flipHorizontal: false,
    internalResolution: 'low',
    segmentationThreshold: 0.5,
  });

  // Create offscreen canvases for better performance
  const blurredCanvas = document.createElement('canvas');
  blurredCanvas.width = canvas.width;
  blurredCanvas.height = canvas.height;
  const blurredCtx = blurredCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!blurredCtx) return;
  
  // Draw and blur background
  blurredCtx.filter = 'blur(15px)';
  blurredCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
  blurredCtx.filter = 'none';

  // Draw the blurred background to main canvas
  ctx.drawImage(blurredCanvas, 0, 0);

  // Use bodyPix's built-in blur background function for better performance
  const backgroundBlurAmount = 6;
  const edgeBlurAmount = 3;
  const flipHorizontal = false;

  await bodyPix.drawBokehEffect(
    canvas,
    video,
    segmentation,
    backgroundBlurAmount,
    edgeBlurAmount,
    flipHorizontal
  );
};

export const applyVirtualBackground = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  backgroundImage: HTMLImageElement
) => {
  if (!segmentationModel) {
    segmentationModel = await loadSegmentationModel();
  }

  const segmentation = await segmentationModel.segmentPerson(video, {
    flipHorizontal: false,
    internalResolution: 'low',
    segmentationThreshold: 0.5,
  });

  // Use bodyPix's built-in function for better performance
  const backgroundDarkeningMask = bodyPix.toMask(segmentation);
  
  // Draw background image
  ctx.save();
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  
  // Draw person on top with proper masking
  const opacity = 1;
  const maskBlurAmount = 3;
  const flipHorizontal = false;
  
  await bodyPix.drawMask(
    canvas,
    video,
    backgroundDarkeningMask,
    opacity,
    maskBlurAmount,
    flipHorizontal
  );
};

export const applyGrayscaleFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'grayscale(100%)';
};

export const applySepiaFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'sepia(100%)';
};

// New creative filters
export const applyVintageFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'sepia(50%) contrast(110%) brightness(110%) saturate(120%)';
};

export const applyWarmFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
};

export const applyCoolFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'saturate(120%) hue-rotate(20deg) brightness(105%)';
};

export const applyHighContrastFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'contrast(150%) brightness(105%)';
};

export const applyInvertFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'invert(100%)';
};

export const applyNightVisionFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'brightness(150%) hue-rotate(90deg) saturate(150%) contrast(120%)';
};

export const applyDramaticFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.filter = 'grayscale(100%) contrast(140%) brightness(95%)';
};

export const resetFilters = (ctx: CanvasRenderingContext2D) => {
  ctx.filter = 'none';
};
