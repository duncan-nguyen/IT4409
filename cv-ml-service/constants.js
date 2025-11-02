/**
 * Configuration constants for CV/ML Service
 * Centralized configuration following clean code principles
 */

// Video Processing Constants
export const VIDEO_CONFIG = {
    WIDTH: 640,
    HEIGHT: 480,
    TARGET_FPS: 30,
    FACE_DETECTION_CONFIDENCE: 0.5
};

// Canvas IDs
export const CANVAS_IDS = {
    SOURCE: 'canvas_goc',
    RESULT: 'canvas_ket_qua'
};

// Video Element ID
export const VIDEO_ID = 'video_source';

// Filter Types
export const FILTER_TYPES = {
    NONE: 'none',
    GRAYSCALE: 'grayscale',
    BLUR: 'blur',
    FACE_DETECTION: 'face_detection',
    FACE_MESH: 'face_mesh',
    SUNGLASSES: 'sunglasses'
};

// TensorFlow.js Model URLs
export const TF_MODELS = {
    FACE_DETECTION: 'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1',
    FACE_MESH: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh'
};

// AR Filter Assets (landmarks indices for MediaPipe Face Mesh)
export const FACE_LANDMARKS = {
    LEFT_EYE: [33, 133, 160, 159, 158, 157, 173],
    RIGHT_EYE: [362, 263, 387, 386, 385, 384, 398],
    LEFT_EYE_CENTER: 468,
    RIGHT_EYE_CENTER: 473,
    NOSE_TIP: 1,
    LIPS: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
};

// Performance Metrics
export const PERFORMANCE = {
    FPS_UPDATE_INTERVAL: 1000,
    MIN_TARGET_FPS: 20
};

// Error Messages
export const ERROR_MESSAGES = {
    CAMERA_DENIED: 'Không thể truy cập camera. Vui lòng cấp quyền truy cập.',
    CAMERA_ERROR: 'Lỗi khi truy cập camera. Vui lòng kiểm tra thiết bị.',
    MODEL_LOAD_ERROR: 'Lỗi khi tải model AI. Vui lòng thử lại.',
    BROWSER_NOT_SUPPORTED: 'Trình duyệt không hỗ trợ các tính năng cần thiết.'
};

// UI Messages
export const UI_MESSAGES = {
    LOADING: 'Đang tải...',
    READY: 'Sẵn sàng',
    PROCESSING: 'Đang xử lý...',
    ERROR: 'Lỗi'
};

