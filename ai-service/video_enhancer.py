from typing import Tuple

import cv2
import numpy as np


class VideoEnhancer:
    """Utility class for video enhancement and processing"""

    @staticmethod
    def apply_brightness_contrast(
        image: np.ndarray, brightness: float = 0, contrast: float = 0
    ) -> np.ndarray:
        """
        Adjust brightness and contrast of an image.

        Args:
            image: Input image
            brightness: Brightness adjustment (-100 to 100)
            contrast: Contrast adjustment (-100 to 100)

        Returns:
            Enhanced image
        """
        if brightness != 0:
            if brightness > 0:
                shadow = brightness
                highlight = 255
            else:
                shadow = 0
                highlight = 255 + brightness
            alpha_b = (highlight - shadow) / 255
            gamma_b = shadow
            image = cv2.addWeighted(image, alpha_b, image, 0, gamma_b)

        if contrast != 0:
            f = 131 * (contrast + 127) / (127 * (131 - contrast))
            alpha_c = f
            gamma_c = 127 * (1 - f)
            image = cv2.addWeighted(image, alpha_c, image, 0, gamma_c)

        return image

    @staticmethod
    def apply_color_filter(image: np.ndarray, filter_type: str) -> np.ndarray:
        """
        Apply color filters to image.

        Args:
            image: Input image
            filter_type: Type of filter ('warm', 'cool', 'vintage', 'vivid')

        Returns:
            Filtered image
        """
        if filter_type == "warm":
            # Add warm tones (more red and yellow)
            image[:, :, 2] = np.clip(image[:, :, 2] * 1.1, 0, 255)  # Red
            image[:, :, 1] = np.clip(image[:, :, 1] * 1.05, 0, 255)  # Green

        elif filter_type == "cool":
            # Add cool tones (more blue)
            image[:, :, 0] = np.clip(image[:, :, 0] * 1.1, 0, 255)  # Blue
            image[:, :, 2] = np.clip(image[:, :, 2] * 0.95, 0, 255)  # Red

        elif filter_type == "vintage":
            # Sepia tone effect
            kernel = np.array(
                [[0.272, 0.534, 0.131], [0.349, 0.686, 0.168], [0.393, 0.769, 0.189]]
            )
            image = cv2.transform(image, kernel)
            image = np.clip(image, 0, 255).astype(np.uint8)

        elif filter_type == "vivid":
            # Increase saturation
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.3, 0, 255)
            image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        return image

    @staticmethod
    def apply_noise_reduction(image: np.ndarray, strength: int = 10) -> np.ndarray:
        """
        Apply noise reduction to image.

        Args:
            image: Input image
            strength: Denoising strength (higher = more smoothing)

        Returns:
            Denoised image
        """
        return cv2.fastNlMeansDenoisingColored(image, None, strength, strength, 7, 21)

    @staticmethod
    def apply_sharpening(image: np.ndarray, strength: float = 1.0) -> np.ndarray:
        """
        Apply sharpening filter to image.

        Args:
            image: Input image
            strength: Sharpening strength (0.0 to 2.0)

        Returns:
            Sharpened image
        """
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]]) * strength
        return cv2.filter2D(image, -1, kernel)

    @staticmethod
    def detect_motion(
        prev_frame: np.ndarray, curr_frame: np.ndarray, threshold: int = 25
    ) -> Tuple[bool, float]:
        """
        Detect motion between two frames.

        Args:
            prev_frame: Previous frame
            curr_frame: Current frame
            threshold: Motion detection threshold

        Returns:
            Tuple of (motion_detected, motion_percentage)
        """
        # Convert to grayscale
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(curr_frame, cv2.COLOR_BGR2GRAY)

        # Calculate difference
        frame_diff = cv2.absdiff(prev_gray, curr_gray)

        # Threshold the difference
        _, thresh = cv2.threshold(frame_diff, threshold, 255, cv2.THRESH_BINARY)

        # Calculate motion percentage
        motion_pixels = np.count_nonzero(thresh)
        total_pixels = thresh.shape[0] * thresh.shape[1]
        motion_percentage = (motion_pixels / total_pixels) * 100

        return motion_percentage > 1.0, motion_percentage
