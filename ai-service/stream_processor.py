import cv2
import mediapipe as mp
import numpy as np
from aiortc import MediaStreamTrack
from av import VideoFrame


class AIStreamTrack(MediaStreamTrack):
    """
    A video stream track that transforms frames from an another track.
    """

    kind = "video"

    def __init__(self, track, mode="none"):
        super().__init__()  # don't forget this!
        self.track = track
        self.mode = mode
        self.frame_count = 0
        self.processing_times = []

        # Initialize MediaPipe solutions
        self.mp_selfie_segmentation = mp.solutions.selfie_segmentation
        self.segmentation = self.mp_selfie_segmentation.SelfieSegmentation(
            model_selection=1
        )

        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5
        )

        # Initialize pose detection
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5, min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

    async def recv(self):
        import time

        start_time = time.time()

        frame = await self.track.recv()

        if self.mode == "none":
            return frame

        # Convert to numpy array (YUV -> BGR)
        img = frame.to_ndarray(format="bgr24")

        # Process based on mode
        if self.mode == "blur":
            img = self._apply_blur(img)
        elif self.mode == "face-detection":
            img = self._detect_faces(img)
        elif self.mode == "pose-estimation":
            img = self._estimate_pose(img)
        elif self.mode == "edge-detection":
            img = self._apply_edge_detection(img)

        # Track performance
        self.frame_count += 1
        processing_time = time.time() - start_time
        self.processing_times.append(processing_time)

        # Keep only last 100 measurements
        if len(self.processing_times) > 100:
            self.processing_times.pop(0)

        # Rebuild a VideoFrame, preserving timing information
        new_frame = VideoFrame.from_ndarray(img, format="bgr24")
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base
        return new_frame

    def _apply_blur(self, image):
        # Convert the BGR image to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Get segmentation mask
        results = self.segmentation.process(image_rgb)
        condition = np.stack((results.segmentation_mask,) * 3, axis=-1) > 0.1

        # Create blurred background
        bg_image = cv2.GaussianBlur(image, (55, 55), 0)

        # Combine
        output_image = np.where(condition, image, bg_image)
        return output_image

    def _detect_faces(self, image):
        # Convert the BGR image to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        results = self.face_detection.process(image_rgb)

        if results.detections:
            for detection in results.detections:
                mp.solutions.drawing_utils.draw_detection(image, detection)

        return image

    def _estimate_pose(self, image):
        """Detect and draw pose landmarks on the image"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)

        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                image,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style(),
            )

        return image

    def _apply_edge_detection(self, image):
        """Apply Canny edge detection with colored edges"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Apply Canny edge detection
        edges = cv2.Canny(blurred, 50, 150)

        # Create colored edge overlay
        edge_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        edge_colored[:, :, 0] = 0  # Remove blue channel
        edge_colored[:, :, 1] = edges  # Green edges
        edge_colored[:, :, 2] = edges  # Red edges (yellow result)

        # Combine with original image
        result = cv2.addWeighted(image, 0.7, edge_colored, 0.3, 0)

        return result

    def get_average_processing_time(self) -> float:
        """Get average frame processing time in milliseconds"""
        if not self.processing_times:
            return 0.0
        return (sum(self.processing_times) / len(self.processing_times)) * 1000

    def get_fps(self) -> float:
        """Get average frames per second"""
        avg_time = self.get_average_processing_time()
        if avg_time == 0:
            return 0.0
        return 1000.0 / avg_time
