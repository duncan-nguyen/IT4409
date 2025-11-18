
import logging
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger("ai-config")


class ModelType(Enum):
    """Available AI model types"""
    SELFIE_SEGMENTATION = "selfie_segmentation"
    FACE_DETECTION = "face_detection"
    FACE_MESH = "face_mesh"
    POSE_ESTIMATION = "pose"
    HAND_TRACKING = "hands"
    HOLISTIC = "holistic"
    OBJECTRON = "objectron"


class SegmentationModel(Enum):
    """Selfie segmentation model options"""
    GENERAL = 0  # Faster, less accurate
    LANDSCAPE = 1  # Slower, more accurate for landscape images


class FaceDetectionModel(Enum):
    """Face detection model options"""
    SHORT_RANGE = 0  # Best for faces within 2 meters
    FULL_RANGE = 1  # Best for faces within 5 meters


@dataclass
class ModelConfig:
    """Configuration for a single AI model"""
    model_type: ModelType
    enabled: bool = True
    min_detection_confidence: float = 0.5
    min_tracking_confidence: float = 0.5
    max_num_faces: int = 1
    max_num_hands: int = 2
    model_complexity: int = 1
    static_image_mode: bool = False
    refine_landmarks: bool = True
    enable_segmentation: bool = False
    smooth_segmentation: bool = True
    custom_options: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        return {
            "model_type": self.model_type.value,
            "enabled": self.enabled,
            "min_detection_confidence": self.min_detection_confidence,
            "min_tracking_confidence": self.min_tracking_confidence,
            "max_num_faces": self.max_num_faces,
            "max_num_hands": self.max_num_hands,
            "model_complexity": self.model_complexity,
            "static_image_mode": self.static_image_mode,
            "refine_landmarks": self.refine_landmarks,
            "enable_segmentation": self.enable_segmentation,
            "smooth_segmentation": self.smooth_segmentation,
            "custom_options": self.custom_options,
        }


@dataclass
class ProcessingConfig:
    """Global processing configuration"""
    target_fps: int = 30
    max_resolution: Tuple[int, int] = (1920, 1080)
    enable_gpu: bool = False
    thread_count: int = 4
    buffer_size: int = 3
    quality_preset: str = "balanced"
    debug_mode: bool = False
    save_debug_frames: bool = False
    debug_output_path: str = "./debug_frames"
    enable_performance_logging: bool = True
    performance_log_interval: int = 100  # Log every N frames


@dataclass
class DrawingConfig:
    """Configuration for landmark and overlay drawing"""
    landmark_color: Tuple[int, int, int] = (0, 255, 0)
    landmark_thickness: int = 2
    landmark_circle_radius: int = 2
    connection_color: Tuple[int, int, int] = (0, 200, 0)
    connection_thickness: int = 1
    bounding_box_color: Tuple[int, int, int] = (255, 0, 0)
    bounding_box_thickness: int = 2
    text_color: Tuple[int, int, int] = (255, 255, 255)
    text_font_scale: float = 0.6
    text_thickness: int = 1
    overlay_alpha: float = 0.7
    enable_labels: bool = True
    enable_confidence_display: bool = True


@dataclass
class AvatarConfig:
    """Configuration for avatar overlay effects"""
    avatar_type: str = "cartoon"
    face_scale: float = 1.2
    offset_x: float = 0.0
    offset_y: float = -0.1
    rotation_smoothing: float = 0.8
    position_smoothing: float = 0.7
    enable_expression_tracking: bool = True
    mirror_avatar: bool = False
    avatar_assets_path: str = "./assets/avatars"


@dataclass
class BeautyFilterConfig:
    """Configuration for beauty/enhancement filters"""
    skin_smoothing: float = 0.5
    brightness: float = 1.1
    contrast: float = 1.05
    saturation: float = 1.1
    sharpening: float = 0.2
    eye_enhancement: float = 0.3
    teeth_whitening: float = 0.2
    face_slimming: float = 0.0
    enable_auto_adjustment: bool = True


class AIConfigManager:
    """Manager for AI model configurations"""

    def __init__(self):
        self.models: Dict[ModelType, ModelConfig] = {}
        self.processing = ProcessingConfig()
        self.drawing = DrawingConfig()
        self.avatar = AvatarConfig()
        self.beauty = BeautyFilterConfig()
        self._initialize_default_models()

    def _initialize_default_models(self):
        """Initialize default model configurations"""
        self.models[ModelType.SELFIE_SEGMENTATION] = ModelConfig(
            model_type=ModelType.SELFIE_SEGMENTATION,
            enabled=True,
            model_complexity=1,
        )

        self.models[ModelType.FACE_DETECTION] = ModelConfig(
            model_type=ModelType.FACE_DETECTION,
            enabled=True,
            min_detection_confidence=0.5,
        )

        self.models[ModelType.FACE_MESH] = ModelConfig(
            model_type=ModelType.FACE_MESH,
            enabled=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self.models[ModelType.POSE_ESTIMATION] = ModelConfig(
            model_type=ModelType.POSE_ESTIMATION,
            enabled=True,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            enable_segmentation=False,
            smooth_segmentation=True,
        )

        self.models[ModelType.HAND_TRACKING] = ModelConfig(
            model_type=ModelType.HAND_TRACKING,
            enabled=True,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def get_model_config(self, model_type: ModelType) -> Optional[ModelConfig]:
        """Get configuration for a specific model"""
        return self.models.get(model_type)

    def set_model_config(self, model_type: ModelType, config: ModelConfig):
        """Set configuration for a specific model"""
        self.models[model_type] = config

    def enable_model(self, model_type: ModelType, enabled: bool = True):
        """Enable or disable a specific model"""
        if model_type in self.models:
            self.models[model_type].enabled = enabled

    def set_quality_preset(self, preset: str):
        """Set quality preset (performance, balanced, quality)"""
        self.processing.quality_preset = preset

        if preset == "performance":
            self.processing.target_fps = 30
            self.processing.max_resolution = (1280, 720)
            for model in self.models.values():
                model.model_complexity = 0
                model.min_detection_confidence = 0.6
                model.min_tracking_confidence = 0.6

        elif preset == "balanced":
            self.processing.target_fps = 30
            self.processing.max_resolution = (1920, 1080)
            for model in self.models.values():
                model.model_complexity = 1
                model.min_detection_confidence = 0.5
                model.min_tracking_confidence = 0.5

        elif preset == "quality":
            self.processing.target_fps = 24
            self.processing.max_resolution = (1920, 1080)
            for model in self.models.values():
                model.model_complexity = 2
                model.min_detection_confidence = 0.4
                model.min_tracking_confidence = 0.4
                model.refine_landmarks = True

    def get_enabled_models(self) -> List[ModelType]:
        """Get list of enabled model types"""
        return [
            model_type
            for model_type, config in self.models.items()
            if config.enabled
        ]

    def to_dict(self) -> Dict[str, Any]:
        """Export all configurations to dictionary"""
        return {
            "models": {
                model_type.value: config.to_dict()
                for model_type, config in self.models.items()
            },
            "processing": {
                "target_fps": self.processing.target_fps,
                "max_resolution": self.processing.max_resolution,
                "enable_gpu": self.processing.enable_gpu,
                "quality_preset": self.processing.quality_preset,
            },
            "drawing": {
                "landmark_color": self.drawing.landmark_color,
                "connection_color": self.drawing.connection_color,
                "enable_labels": self.drawing.enable_labels,
            },
            "avatar": {
                "avatar_type": self.avatar.avatar_type,
                "face_scale": self.avatar.face_scale,
                "enable_expression_tracking": self.avatar.enable_expression_tracking,
            },
            "beauty": {
                "skin_smoothing": self.beauty.skin_smoothing,
                "brightness": self.beauty.brightness,
                "contrast": self.beauty.contrast,
            },
        }

    def from_dict(self, data: Dict[str, Any]):
        """Import configurations from dictionary"""
        if "processing" in data:
            proc_data = data["processing"]
            self.processing.target_fps = proc_data.get("target_fps", 30)
            self.processing.max_resolution = tuple(proc_data.get("max_resolution", [1920, 1080]))
            self.processing.enable_gpu = proc_data.get("enable_gpu", False)
            if "quality_preset" in proc_data:
                self.set_quality_preset(proc_data["quality_preset"])

        if "beauty" in data:
            beauty_data = data["beauty"]
            self.beauty.skin_smoothing = beauty_data.get("skin_smoothing", 0.5)
            self.beauty.brightness = beauty_data.get("brightness", 1.1)
            self.beauty.contrast = beauty_data.get("contrast", 1.05)

        if "avatar" in data:
            avatar_data = data["avatar"]
            self.avatar.avatar_type = avatar_data.get("avatar_type", "cartoon")
            self.avatar.face_scale = avatar_data.get("face_scale", 1.2)


# Global configuration instance
config_manager = AIConfigManager()


def get_config() -> AIConfigManager:
    """Get global configuration manager instance"""
    return config_manager


def load_config_from_env():
    """Load configuration from environment variables"""
    config = get_config()

    # Processing settings
    if os.getenv("AI_TARGET_FPS"):
        config.processing.target_fps = int(os.getenv("AI_TARGET_FPS"))

    if os.getenv("AI_ENABLE_GPU"):
        config.processing.enable_gpu = os.getenv("AI_ENABLE_GPU").lower() == "true"

    if os.getenv("AI_QUALITY_PRESET"):
        config.set_quality_preset(os.getenv("AI_QUALITY_PRESET"))

    if os.getenv("AI_DEBUG_MODE"):
        config.processing.debug_mode = os.getenv("AI_DEBUG_MODE").lower() == "true"

    # Beauty filter settings
    if os.getenv("AI_BEAUTY_SMOOTHING"):
        config.beauty.skin_smoothing = float(os.getenv("AI_BEAUTY_SMOOTHING"))

    logger.info("Configuration loaded from environment variables")
    return config


def validate_config(config: AIConfigManager) -> List[str]:
    """Validate configuration and return list of warnings"""
    warnings = []

    if config.processing.target_fps > 60:
        warnings.append("Target FPS > 60 may cause performance issues")

    if config.processing.enable_gpu and not _check_gpu_available():
        warnings.append("GPU enabled but no compatible GPU detected")

    enabled_models = config.get_enabled_models()
    if len(enabled_models) > 3:
        warnings.append(f"Running {len(enabled_models)} models simultaneously may impact performance")

    for model_type, model_config in config.models.items():
        if model_config.min_detection_confidence < 0.3:
            warnings.append(f"{model_type.value}: Low detection confidence may cause false positives")
        if model_config.model_complexity > 1 and config.processing.target_fps > 25:
            warnings.append(f"{model_type.value}: High complexity with high FPS may not be achievable")

    return warnings


def _check_gpu_available() -> bool:
    """Check if GPU is available for processing"""
    try:
        # Try to build with CUDA
        return cv2.cuda.getCudaEnabledDeviceCount() > 0
    except Exception:
        return False


def get_recommended_config(device_type: str = "desktop") -> AIConfigManager:
    """Get recommended configuration based on device type"""
    config = AIConfigManager()

    if device_type == "mobile":
        config.set_quality_preset("performance")
        config.processing.max_resolution = (640, 480)
        config.processing.target_fps = 24
        # Disable some models for mobile
        config.enable_model(ModelType.HOLISTIC, False)
        config.enable_model(ModelType.OBJECTRON, False)

    elif device_type == "tablet":
        config.set_quality_preset("balanced")
        config.processing.max_resolution = (1280, 720)
        config.processing.target_fps = 30

    elif device_type == "desktop":
        config.set_quality_preset("balanced")
        config.processing.max_resolution = (1920, 1080)
        config.processing.target_fps = 30

    elif device_type == "high_end":
        config.set_quality_preset("quality")
        config.processing.enable_gpu = True
        config.processing.max_resolution = (1920, 1080)
        config.processing.target_fps = 30

    return config


def create_model_from_config(model_type: ModelType) -> Any:
    """Create MediaPipe model instance from configuration"""
    config = get_config()
    model_config = config.get_model_config(model_type)

    if not model_config or not model_config.enabled:
        return None

    try:
        import mediapipe as mp

        if model_type == ModelType.SELFIE_SEGMENTATION:
            return mp.solutions.selfie_segmentation.SelfieSegmentation(
                model_selection=model_config.model_complexity
            )

        elif model_type == ModelType.FACE_DETECTION:
            return mp.solutions.face_detection.FaceDetection(
                model_selection=model_config.model_complexity,
                min_detection_confidence=model_config.min_detection_confidence,
            )

        elif model_type == ModelType.FACE_MESH:
            return mp.solutions.face_mesh.FaceMesh(
                max_num_faces=model_config.max_num_faces,
                refine_landmarks=model_config.refine_landmarks,
                min_detection_confidence=model_config.min_detection_confidence,
                min_tracking_confidence=model_config.min_tracking_confidence,
            )

        elif model_type == ModelType.POSE_ESTIMATION:
            return mp.solutions.pose.Pose(
                static_image_mode=model_config.static_image_mode,
                model_complexity=model_config.model_complexity,
                enable_segmentation=model_config.enable_segmentation,
                smooth_segmentation=model_config.smooth_segmentation,
                min_detection_confidence=model_config.min_detection_confidence,
                min_tracking_confidence=model_config.min_tracking_confidence,
            )

        elif model_type == ModelType.HAND_TRACKING:
            return mp.solutions.hands.Hands(
                static_image_mode=model_config.static_image_mode,
                max_num_hands=model_config.max_num_hands,
                min_detection_confidence=model_config.min_detection_confidence,
                min_tracking_confidence=model_config.min_tracking_confidence,
            )

    except ImportError as e:
        logger.error(f"Failed to import MediaPipe: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to create model {model_type.value}: {e}")
        return None

    return None
