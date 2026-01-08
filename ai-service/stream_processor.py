import cv2
import mediapipe as mp
import numpy as np
from aiortc import MediaStreamTrack
from av import VideoFrame


class AIStreamTrack(MediaStreamTrack):
    """
    A video stream track that transforms frames from an another track.
    Supports advanced AI processing modes including Face Mesh for avatars.
    """

    kind = "video"

    def __init__(self, track, mode="none", avatar_type="none"):
        super().__init__()
        self.track = track
        self.mode = mode
        self.avatar_type = avatar_type  # 'cartoon', 'mask', 'robot', 'none'
        self.frame_count = 0
        self.processing_times = []

        # Initialize MediaPipe solutions
        self.mp_selfie_segmentation = mp.solutions.selfie_segmentation
        self.segmentation = self.mp_selfie_segmentation.SelfieSegmentation(
            model_selection=1  # 1 = landscape model (better quality)
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

        # Initialize Face Mesh for avatar effects (468 landmarks)
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,  # Includes iris landmarks
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        # Initialize hands detection
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        # Face mesh drawing specs
        self.face_mesh_drawing_spec = self.mp_drawing.DrawingSpec(
            thickness=1, circle_radius=1, color=(0, 255, 0)
        )
        self.face_mesh_connection_spec = self.mp_drawing.DrawingSpec(
            thickness=1, color=(0, 200, 0)
        )

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
        elif self.mode == "face-mesh":
            img = self._apply_face_mesh(img)
        elif self.mode == "avatar":
            img = self._apply_avatar(img, self.avatar_type)
        elif self.mode == "hands":
            img = self._detect_hands(img)
        elif self.mode == "beauty":
            img = self._apply_beauty_filter(img)
        elif self.mode == "cartoon":
            img = self._apply_cartoon_effect(img)

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

    def _apply_face_mesh(self, image):
        """Draw 468 face mesh landmarks for AR effects"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # Draw face mesh tesselation
                self.mp_drawing.draw_landmarks(
                    image=image,
                    landmark_list=face_landmarks,
                    connections=self.mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_tesselation_style(),
                )
                # Draw face contours
                self.mp_drawing.draw_landmarks(
                    image=image,
                    landmark_list=face_landmarks,
                    connections=self.mp_face_mesh.FACEMESH_CONTOURS,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_contours_style(),
                )
                # Draw irises
                self.mp_drawing.draw_landmarks(
                    image=image,
                    landmark_list=face_landmarks,
                    connections=self.mp_face_mesh.FACEMESH_IRISES,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_iris_connections_style(),
                )

        return image

    def _apply_avatar(self, image, avatar_type="cartoon"):
        """Apply AI avatar effects using face mesh landmarks"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)
        h, w, _ = image.shape

        if not results.multi_face_landmarks:
            return image

        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark

            if avatar_type == "cartoon":
                image = self._draw_cartoon_avatar(image, landmarks, w, h)
            elif avatar_type == "robot":
                image = self._draw_robot_avatar(image, landmarks, w, h)
            elif avatar_type == "mask":
                image = self._draw_mask_overlay(image, landmarks, w, h)
            elif avatar_type == "neon":
                image = self._draw_neon_face(image, landmarks, w, h)

        return image

    def _draw_cartoon_avatar(self, image, landmarks, w, h):
        """Draw cartoon-style avatar overlay"""
        # Get key facial points
        left_eye_center = self._get_landmark_point(landmarks, 159, w, h)
        right_eye_center = self._get_landmark_point(landmarks, 386, w, h)
        nose_tip = self._get_landmark_point(landmarks, 1, w, h)
        mouth_center = self._get_landmark_point(landmarks, 13, w, h)

        # Draw cartoon eyes (larger circles)
        eye_radius = int(abs(right_eye_center[0] - left_eye_center[0]) * 0.25)
        cv2.circle(image, left_eye_center, eye_radius, (255, 255, 255), -1)
        cv2.circle(image, right_eye_center, eye_radius, (255, 255, 255), -1)
        cv2.circle(image, left_eye_center, eye_radius // 2, (50, 50, 50), -1)
        cv2.circle(image, right_eye_center, eye_radius // 2, (50, 50, 50), -1)
        # Eye highlights
        cv2.circle(
            image,
            (left_eye_center[0] - 3, left_eye_center[1] - 3),
            3,
            (255, 255, 255),
            -1,
        )
        cv2.circle(
            image,
            (right_eye_center[0] - 3, right_eye_center[1] - 3),
            3,
            (255, 255, 255),
            -1,
        )

        # Draw cartoon nose
        cv2.circle(image, nose_tip, 8, (255, 200, 180), -1)
        cv2.circle(image, nose_tip, 8, (200, 150, 130), 2)

        return image

    def _draw_robot_avatar(self, image, landmarks, w, h):
        """Draw robot-style avatar overlay"""
        left_eye = self._get_landmark_point(landmarks, 159, w, h)
        right_eye = self._get_landmark_point(landmarks, 386, w, h)
        nose = self._get_landmark_point(landmarks, 1, w, h)
        chin = self._get_landmark_point(landmarks, 152, w, h)
        forehead = self._get_landmark_point(landmarks, 10, w, h)

        # Draw robot eye rectangles
        eye_w, eye_h = 30, 15
        cv2.rectangle(
            image,
            (left_eye[0] - eye_w, left_eye[1] - eye_h),
            (left_eye[0] + eye_w, left_eye[1] + eye_h),
            (0, 255, 255),
            -1,
        )
        cv2.rectangle(
            image,
            (right_eye[0] - eye_w, right_eye[1] - eye_h),
            (right_eye[0] + eye_w, right_eye[1] + eye_h),
            (0, 255, 255),
            -1,
        )

        # Draw scanning line effect
        scan_y = (self.frame_count * 3) % h
        cv2.line(image, (0, scan_y), (w, scan_y), (0, 255, 0), 2)

        # Draw circuit patterns
        cv2.line(image, forehead, nose, (0, 200, 200), 2)
        cv2.line(image, left_eye, nose, (0, 200, 200), 1)
        cv2.line(image, right_eye, nose, (0, 200, 200), 1)

        return image

    def _draw_mask_overlay(self, image, landmarks, w, h):
        """Draw decorative mask overlay"""
        # Get face boundary points
        face_points = []
        face_indices = [
            10,
            338,
            297,
            332,
            284,
            251,
            389,
            356,
            454,
            323,
            361,
            288,
            397,
            365,
            379,
            378,
            400,
            377,
            152,
            148,
            176,
            149,
            150,
            136,
            172,
            58,
            132,
            93,
            234,
            127,
            162,
            21,
            54,
            103,
            67,
            109,
        ]
        for idx in face_indices:
            pt = self._get_landmark_point(landmarks, idx, w, h)
            face_points.append(pt)

        # Draw golden mask outline
        pts = np.array(face_points, np.int32).reshape((-1, 1, 2))
        cv2.polylines(image, [pts], True, (0, 215, 255), 3)

        # Add decorative elements around eyes
        left_eye = self._get_landmark_point(landmarks, 159, w, h)
        right_eye = self._get_landmark_point(landmarks, 386, w, h)
        cv2.ellipse(image, left_eye, (40, 20), 0, 0, 360, (0, 215, 255), 2)
        cv2.ellipse(image, right_eye, (40, 20), 0, 0, 360, (0, 215, 255), 2)

        return image

    def _draw_neon_face(self, image, landmarks, w, h):
        """Draw neon glow effect on face contours"""
        # Create glow overlay
        overlay = image.copy()

        # Draw neon contours for face outline
        face_oval_indices = list(self.mp_face_mesh.FACEMESH_FACE_OVAL)
        for connection in face_oval_indices:
            pt1 = self._get_landmark_point(landmarks, connection[0], w, h)
            pt2 = self._get_landmark_point(landmarks, connection[1], w, h)
            cv2.line(overlay, pt1, pt2, (255, 0, 255), 3)

        # Draw neon lips
        lips_indices = list(self.mp_face_mesh.FACEMESH_LIPS)
        for connection in lips_indices:
            pt1 = self._get_landmark_point(landmarks, connection[0], w, h)
            pt2 = self._get_landmark_point(landmarks, connection[1], w, h)
            cv2.line(overlay, pt1, pt2, (0, 255, 255), 2)

        # Draw neon eyes
        left_eye_indices = list(self.mp_face_mesh.FACEMESH_LEFT_EYE)
        right_eye_indices = list(self.mp_face_mesh.FACEMESH_RIGHT_EYE)
        for connection in left_eye_indices + right_eye_indices:
            pt1 = self._get_landmark_point(landmarks, connection[0], w, h)
            pt2 = self._get_landmark_point(landmarks, connection[1], w, h)
            cv2.line(overlay, pt1, pt2, (0, 255, 0), 2)

        # Blend with glow effect
        image = cv2.addWeighted(image, 0.7, overlay, 0.3, 0)

        return image

    def _get_landmark_point(self, landmarks, idx, w, h):
        """Helper to get landmark point as (x, y) tuple"""
        lm = landmarks[idx]
        return (int(lm.x * w), int(lm.y * h))

    def _detect_hands(self, image):
        """Detect and draw hand landmarks"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style(),
                )

        return image

    def _apply_beauty_filter(self, image):
        """Apply AI beauty/smoothing filter"""
        # Smooth skin while preserving edges
        smooth = cv2.bilateralFilter(image, 9, 75, 75)

        # Detect face regions for selective smoothing
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(image_rgb)

        if results.detections:
            h, w, _ = image.shape
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                bw = int(bbox.width * w)
                bh = int(bbox.height * h)

                # Ensure bounds are valid
                x, y = max(0, x), max(0, y)
                x2, y2 = min(w, x + bw), min(h, y + bh)

                # Apply smoothing only to face region
                face_region = smooth[y:y2, x:x2]
                image[y:y2, x:x2] = face_region

                # Slight brightness boost for face
                face_bright = cv2.convertScaleAbs(image[y:y2, x:x2], alpha=1.05, beta=5)
                image[y:y2, x:x2] = face_bright

        return image

    def _apply_cartoon_effect(self, image):
        """Apply cartoon/comic book style effect"""
        # Reduce color palette
        data = np.float32(image).reshape((-1, 3))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.001)
        _, labels, centers = cv2.kmeans(
            data, 8, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
        )
        centers = np.uint8(centers)
        quantized = centers[labels.flatten()].reshape(image.shape)

        # Apply bilateral filter for smooth regions
        smooth = cv2.bilateralFilter(quantized, 9, 300, 300)

        # Detect edges
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9
        )
        edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # Combine smooth colors with edges
        cartoon = cv2.bitwise_and(smooth, edges)

        return cartoon

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
