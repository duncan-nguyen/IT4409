

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger("ai-utils")


class ProcessingMode(Enum):
    """Available AI processing modes"""
    NONE = "none"
    BLUR = "blur"
    FACE_DETECTION = "face-detection"
    POSE_ESTIMATION = "pose-estimation"
    EDGE_DETECTION = "edge-detection"
    FACE_MESH = "face-mesh"
    AVATAR = "avatar"
    HANDS = "hands"
    BEAUTY = "beauty"
    CARTOON = "cartoon"
    SEGMENTATION = "segmentation"


class AvatarType(Enum):
    """Available avatar overlay types"""
    CARTOON = "cartoon"
    ROBOT = "robot"
    MASK = "mask"
    NEON = "neon"
    ANIME = "anime"


@dataclass
class ProcessingStats:
    """Statistics for AI processing performance"""
    total_frames: int = 0
    total_processing_time: float = 0.0
    min_processing_time: float = float('inf')
    max_processing_time: float = 0.0
    last_processing_time: float = 0.0
    dropped_frames: int = 0
    errors: int = 0
    processing_times: List[float] = field(default_factory=list)

    @property
    def average_processing_time(self) -> float:
        if self.total_frames == 0:
            return 0.0
        return self.total_processing_time / self.total_frames

    @property
    def fps(self) -> float:
        if self.average_processing_time == 0:
            return 0.0
        return 1.0 / self.average_processing_time

    def update(self, processing_time: float) -> None:
        """Update statistics with new processing time"""
        self.total_frames += 1
        self.total_processing_time += processing_time
        self.last_processing_time = processing_time
        self.min_processing_time = min(self.min_processing_time, processing_time)
        self.max_processing_time = max(self.max_processing_time, processing_time)
        
        # Keep last 100 processing times for moving average
        self.processing_times.append(processing_time)
        if len(self.processing_times) > 100:
            self.processing_times.pop(0)

    def get_moving_average(self, window: int = 30) -> float:
        """Calculate moving average of processing times"""
        if not self.processing_times:
            return 0.0
        recent = self.processing_times[-window:]
        return sum(recent) / len(recent)

    def reset(self) -> None:
        """Reset all statistics"""
        self.total_frames = 0
        self.total_processing_time = 0.0
        self.min_processing_time = float('inf')
        self.max_processing_time = 0.0
        self.last_processing_time = 0.0
        self.dropped_frames = 0
        self.errors = 0
        self.processing_times.clear()


@dataclass
class ImageDimensions:
    """Image dimension information"""
    width: int
    height: int
    channels: int = 3

    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height if self.height > 0 else 0

    @property
    def total_pixels(self) -> int:
        return self.width * self.height


def resize_image(
    image: np.ndarray,
    target_width: Optional[int] = None,
    target_height: Optional[int] = None,
    maintain_aspect: bool = True,
    interpolation: int = cv2.INTER_LINEAR
) -> np.ndarray:
    """
    Resize image with optional aspect ratio preservation
    
    Args:
        image: Input image as numpy array
        target_width: Target width (optional)
        target_height: Target height (optional)
        maintain_aspect: Whether to maintain aspect ratio
        interpolation: OpenCV interpolation method
    
    Returns:
        Resized image
    """
    if target_width is None and target_height is None:
        return image

    h, w = image.shape[:2]
    
    if maintain_aspect:
        if target_width and target_height:
            scale = min(target_width / w, target_height / h)
            new_w = int(w * scale)
            new_h = int(h * scale)
        elif target_width:
            scale = target_width / w
            new_w = target_width
            new_h = int(h * scale)
        else:
            scale = target_height / h
            new_w = int(w * scale)
            new_h = target_height
    else:
        new_w = target_width or w
        new_h = target_height or h

    return cv2.resize(image, (new_w, new_h), interpolation=interpolation)


def normalize_image(image: np.ndarray) -> np.ndarray:
    """Normalize image to 0-1 range"""
    return image.astype(np.float32) / 255.0


def denormalize_image(image: np.ndarray) -> np.ndarray:
    """Denormalize image from 0-1 range to 0-255"""
    return (image * 255).astype(np.uint8)


def convert_color_space(
    image: np.ndarray,
    from_space: str = "BGR",
    to_space: str = "RGB"
) -> np.ndarray:
    """
    Convert image between color spaces
    
    Supported spaces: BGR, RGB, GRAY, HSV, LAB, YUV
    """
    conversion_map = {
        ("BGR", "RGB"): cv2.COLOR_BGR2RGB,
        ("RGB", "BGR"): cv2.COLOR_RGB2BGR,
        ("BGR", "GRAY"): cv2.COLOR_BGR2GRAY,
        ("RGB", "GRAY"): cv2.COLOR_RGB2GRAY,
        ("GRAY", "BGR"): cv2.COLOR_GRAY2BGR,
        ("GRAY", "RGB"): cv2.COLOR_GRAY2RGB,
        ("BGR", "HSV"): cv2.COLOR_BGR2HSV,
        ("HSV", "BGR"): cv2.COLOR_HSV2BGR,
        ("BGR", "LAB"): cv2.COLOR_BGR2LAB,
        ("LAB", "BGR"): cv2.COLOR_LAB2BGR,
        ("BGR", "YUV"): cv2.COLOR_BGR2YUV,
        ("YUV", "BGR"): cv2.COLOR_YUV2BGR,
    }
    
    key = (from_space.upper(), to_space.upper())
    if key not in conversion_map:
        raise ValueError(f"Unsupported color conversion: {from_space} to {to_space}")
    
    return cv2.cvtColor(image, conversion_map[key])


def apply_gaussian_blur(
    image: np.ndarray,
    kernel_size: int = 21,
    sigma: float = 0
) -> np.ndarray:
    """Apply Gaussian blur to image"""
    if kernel_size % 2 == 0:
        kernel_size += 1
    return cv2.GaussianBlur(image, (kernel_size, kernel_size), sigma)


def apply_bilateral_filter(
    image: np.ndarray,
    d: int = 9,
    sigma_color: float = 75,
    sigma_space: float = 75
) -> np.ndarray:
    """Apply bilateral filter for edge-preserving smoothing"""
    return cv2.bilateralFilter(image, d, sigma_color, sigma_space)


def apply_edge_detection(
    image: np.ndarray,
    low_threshold: int = 50,
    high_threshold: int = 150
) -> np.ndarray:
    """Apply Canny edge detection"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    edges = cv2.Canny(gray, low_threshold, high_threshold)
    return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)


def apply_cartoon_effect(
    image: np.ndarray,
    num_bilateral: int = 7,
    sigma_color: float = 9,
    sigma_space: float = 7,
    block_size: int = 9
) -> np.ndarray:
    """Apply cartoon/comic effect to image"""
    # Apply bilateral filter for smoothing while preserving edges
    color = image.copy()
    for _ in range(num_bilateral):
        color = cv2.bilateralFilter(color, 9, sigma_color, sigma_space)
    
    # Convert to grayscale and apply median blur
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 7)
    
    # Detect edges and threshold
    edges = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        block_size, 2
    )
    
    # Combine color and edges
    edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    cartoon = cv2.bitwise_and(color, edges)
    
    return cartoon


def apply_beauty_filter(
    image: np.ndarray,
    smoothing: float = 0.5,
    brightness: float = 1.1,
    contrast: float = 1.05
) -> np.ndarray:
    """Apply beauty/skin smoothing filter"""
    # Bilateral filter for skin smoothing
    smoothed = cv2.bilateralFilter(image, 9, 75 * smoothing, 75 * smoothing)
    
    # Blend with original
    blend_ratio = 0.7
    result = cv2.addWeighted(image, 1 - blend_ratio, smoothed, blend_ratio, 0)
    
    # Adjust brightness and contrast
    result = cv2.convertScaleAbs(result, alpha=contrast, beta=int((brightness - 1) * 50))
    
    return result


def create_segmentation_mask(
    segmentation_result: np.ndarray,
    threshold: float = 0.5
) -> np.ndarray:
    """Create binary mask from segmentation result"""
    mask = (segmentation_result > threshold).astype(np.uint8) * 255
    return mask


def blend_with_background(
    foreground: np.ndarray,
    background: np.ndarray,
    mask: np.ndarray,
    blur_edges: bool = True
) -> np.ndarray:
    """Blend foreground with background using mask"""
    if blur_edges:
        mask = cv2.GaussianBlur(mask, (7, 7), 0)
    
    # Normalize mask to 0-1
    if mask.max() > 1:
        mask = mask.astype(np.float32) / 255.0
    
    # Expand mask dimensions if needed
    if len(mask.shape) == 2:
        mask = np.expand_dims(mask, axis=-1)
    
    # Ensure same size
    if foreground.shape[:2] != background.shape[:2]:
        background = cv2.resize(background, (foreground.shape[1], foreground.shape[0]))
    
    # Blend
    result = (foreground * mask + background * (1 - mask)).astype(np.uint8)
    
    return result


def draw_landmarks(
    image: np.ndarray,
    landmarks: List[Tuple[int, int]],
    color: Tuple[int, int, int] = (0, 255, 0),
    radius: int = 2,
    thickness: int = -1
) -> np.ndarray:
    """Draw landmarks on image"""
    result = image.copy()
    for x, y in landmarks:
        cv2.circle(result, (x, y), radius, color, thickness)
    return result


def draw_connections(
    image: np.ndarray,
    landmarks: List[Tuple[int, int]],
    connections: List[Tuple[int, int]],
    color: Tuple[int, int, int] = (0, 200, 0),
    thickness: int = 1
) -> np.ndarray:
    """Draw connections between landmarks"""
    result = image.copy()
    for start_idx, end_idx in connections:
        if start_idx < len(landmarks) and end_idx < len(landmarks):
            start = landmarks[start_idx]
            end = landmarks[end_idx]
            cv2.line(result, start, end, color, thickness)
    return result


def draw_bounding_box(
    image: np.ndarray,
    bbox: Tuple[int, int, int, int],
    color: Tuple[int, int, int] = (0, 255, 0),
    thickness: int = 2,
    label: Optional[str] = None
) -> np.ndarray:
    """Draw bounding box on image"""
    result = image.copy()
    x, y, w, h = bbox
    cv2.rectangle(result, (x, y), (x + w, y + h), color, thickness)
    
    if label:
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        cv2.putText(result, label, (x, y - 10), font, font_scale, color, 1)
    
    return result


def calculate_iou(box1: Tuple[int, int, int, int], box2: Tuple[int, int, int, int]) -> float:
    """Calculate Intersection over Union between two bounding boxes"""
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2
    
    # Calculate intersection
    xi1 = max(x1, x2)
    yi1 = max(y1, y2)
    xi2 = min(x1 + w1, x2 + w2)
    yi2 = min(y1 + h1, y2 + h2)
    
    if xi2 <= xi1 or yi2 <= yi1:
        return 0.0
    
    intersection = (xi2 - xi1) * (yi2 - yi1)
    
    # Calculate union
    area1 = w1 * h1
    area2 = w2 * h2
    union = area1 + area2 - intersection
    
    return intersection / union if union > 0 else 0.0


def non_max_suppression(
    boxes: List[Tuple[int, int, int, int]],
    scores: List[float],
    threshold: float = 0.5
) -> List[int]:
    """Apply non-maximum suppression to bounding boxes"""
    if not boxes:
        return []
    
    indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    keep = []
    
    while indices:
        current = indices.pop(0)
        keep.append(current)
        
        indices = [
            i for i in indices
            if calculate_iou(boxes[current], boxes[i]) < threshold
        ]
    
    return keep


class PerformanceTimer:
    """Context manager for timing code blocks"""
    
    def __init__(self, name: str = "Operation", logger: Optional[logging.Logger] = None):
        self.name = name
        self.logger = logger or logging.getLogger(__name__)
        self.start_time = 0.0
        self.end_time = 0.0
    
    @property
    def elapsed(self) -> float:
        return self.end_time - self.start_time
    
    def __enter__(self):
        self.start_time = time.perf_counter()
        return self
    
    def __exit__(self, *args):
        self.end_time = time.perf_counter()
        self.logger.debug(f"{self.name} took {self.elapsed * 1000:.2f}ms")


def create_color_palette(num_colors: int) -> List[Tuple[int, int, int]]:
    """Generate a color palette with distinct colors"""
    colors = []
    for i in range(num_colors):
        hue = int(180 * i / num_colors)
        color = cv2.cvtColor(
            np.uint8([[[hue, 255, 255]]]),
            cv2.COLOR_HSV2BGR
        )[0][0]
        colors.append(tuple(map(int, color)))
    return colors


def add_overlay_text(
    image: np.ndarray,
    text: str,
    position: Tuple[int, int] = (10, 30),
    font_scale: float = 0.7,
    color: Tuple[int, int, int] = (255, 255, 255),
    thickness: int = 2,
    background: bool = True
) -> np.ndarray:
    """Add text overlay to image with optional background"""
    result = image.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX
    
    if background:
        (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)
        x, y = position
        cv2.rectangle(
            result,
            (x - 5, y - text_height - 5),
            (x + text_width + 5, y + baseline + 5),
            (0, 0, 0),
            -1
        )
    
    cv2.putText(result, text, position, font, font_scale, color, thickness)
    return result


def get_fps_text(stats: ProcessingStats) -> str:
    """Generate FPS display text from stats"""
    fps = 1.0 / stats.get_moving_average() if stats.get_moving_average() > 0 else 0
    return f"FPS: {fps:.1f} | Avg: {stats.average_processing_time * 1000:.1f}ms"
