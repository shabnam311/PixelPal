import cv2
import numpy as np
import logging
import time
from datetime import datetime

logger = logging.getLogger("GazeMonitor")

class GazeMonitor:
    def __init__(self, config):
        self.config = config["gaze"]
        self.enabled = self.config.get("enabled", True)
        self.check_interval = self.config.get("check_interval_seconds", 2)
        
        # Thresholds
        self.yaw_threshold = 30.0    # degrees to turn left/right
        self.pitch_threshold = 25.0  # degrees to look up/down
        
        # Gaze state machine
        self.gaze_away_since = None
        self.grace_seconds = self.config.get('grace_seconds', 10)
        self.soft_warn_seconds = self.config.get('soft_warn_seconds', 10) 
        self.hard_warn_seconds = self.config.get('hard_warn_seconds', 30)
        
        # State tracking
        self.last_check_time = 0
        self.face_mesh = None
        self.mp_face_mesh = None
        
        # 3D model points of a standard head (for solvePnP)
        self.model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ], dtype=np.float32)
        
        self._init_mediapipe()

    def _init_mediapipe(self):
        if not self.enabled:
            return
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            logger.info("MediaPipe Face Mesh initialized successfully for Gaze Monitoring.")
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe Face Mesh: {e}")
            self.enabled = False

    def process_frame(self, frame):
        """
        Processes a single camera frame to detect head pose.
        Returns:
            status: "looking", "away", "not_detected", or "disabled"
            yaw: float (degrees)
            pitch: float (degrees)
        """
        if not self.enabled or self.face_mesh is None:
            return "disabled", 0.0, 0.0
            
        if frame is None:
            return "not_detected", 0.0, 0.0
            
        h, w, c = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        try:
            results = self.face_mesh.process(rgb_frame)
        except Exception as e:
            logger.error(f"Error processing frame in Face Mesh: {e}")
            return "not_detected", 0.0, 0.0
            
        if not results.multi_face_landmarks:
            return "not_detected", 0.0, 0.0
            
        face_landmarks = results.multi_face_landmarks[0].landmark
        
        # Extract corresponding 2D coordinates
        # Nose tip: 4, Chin: 152, L eye L corner: 33, R eye R corner: 263, L mouth: 61, R mouth: 291
        indices = [4, 152, 33, 263, 61, 291]
        image_points = []
        
        for idx in indices:
            lm = face_landmarks[idx]
            image_points.append((lm.x * w, lm.y * h))
            
        image_points = np.array(image_points, dtype=np.float32)
        
        # Camera matrix approximation
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float32)
        
        dist_coeffs = np.zeros((4, 1), dtype=np.float32)  # Assuming no lens distortion
        
        success, rotation_vector, translation_vector = cv2.solvePnP(
            self.model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return "looking", 0.0, 0.0  # Fallback to default
            
        # Get rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        
        # Deconstruct projection matrix to Euler angles
        proj_matrix = np.hstack((rotation_matrix, translation_vector))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)
        
        pitch = float(euler_angles[0][0])
        yaw = float(euler_angles[1][0])
        roll = float(euler_angles[2][0])
        
        abs_yaw = abs(yaw)
        abs_pitch = abs(pitch)
        
        if abs_yaw > self.yaw_threshold or abs_pitch > self.pitch_threshold:
            if self.gaze_away_since is None:
                self.gaze_away_since = time.time()
            away_duration = time.time() - self.gaze_away_since
            if away_duration < self.grace_seconds:
                status = "looking"  # grace period
            elif away_duration < self.grace_seconds + self.soft_warn_seconds:
                status = "soft_warn"
            else:
                status = "away"
        else:
            self.gaze_away_since = None
            status = "looking"
            
        return status, yaw, pitch

    def close(self):
        if self.face_mesh:
            self.face_mesh.close()
