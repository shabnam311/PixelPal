import cv2
import time
import logging
from core.logger import log_event

logger = logging.getLogger("PostureMonitor")

class PostureMonitor:
    def __init__(self, config):
        self.config = config["posture"]
        self.enabled = self.config.get("enabled", True)
        self.slouch_threshold = self.config.get("slouch_threshold_percent", 15) / 100.0
        self.check_interval = self.config.get("check_interval_seconds", 5)
        self.cooldown_seconds = self.config.get("cooldown_minutes", 2) * 60
        
        # Calibration state
        self.is_calibrated = False
        self.calibrated_y = 0.0
        
        # Cooldown timer
        self.last_warning_time = 0
        self.last_check_time = 0
        
        self.face_mesh = None
        self.mp_face_mesh = None
        
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
            logger.info("MediaPipe Face Mesh initialized for Posture Monitoring.")
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe Face Mesh for posture: {e}")
            self.enabled = False

    def calibrate(self, frame):
        """
        Calibrates the upright position by measuring the nose Y-coordinate.
        Returns:
            bool: True if calibration succeeded, False otherwise
        """
        if not self.enabled or self.face_mesh is None:
            return False
            
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        try:
            results = self.face_mesh.process(rgb_frame)
            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0].landmark
                # Nose tip landmark index is 4
                nose_y = face_landmarks[4].y
                self.calibrated_y = nose_y
                self.is_calibrated = True
                log_event("CALIBRATION", f"Posture calibrated successfully. Nose Y: {nose_y:.4f}")
                logger.info(f"Posture calibrated. Nose Y base: {nose_y:.4f}")
                return True
        except Exception as e:
            logger.error(f"Error during calibration: {e}")
            
        return False

    def process_frame(self, frame):
        """
        Detects if user is slouching compared to calibrated position.
        Returns:
            status: "good", "slouching", "not_detected", "uncalibrated", or "disabled"
            deviation_pct: float (percentage deviation from calibrated y)
        """
        if not self.enabled or self.face_mesh is None:
            return "disabled", 0.0
            
        if not self.is_calibrated:
            return "uncalibrated", 0.0
            
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        try:
            results = self.face_mesh.process(rgb_frame)
        except Exception as e:
            logger.error(f"Error in posture process_frame: {e}")
            return "not_detected", 0.0
            
        if not results.multi_face_landmarks:
            return "not_detected", 0.0
            
        face_landmarks = results.multi_face_landmarks[0].landmark
        nose_y = face_landmarks[4].y
        
        # Calculate deviation percentage
        # Since image coordinates run top-to-bottom, a larger Y value means the head is lower
        # deviation = (current_y - calibrated_y) / calibrated_y
        deviation_pct = (nose_y - self.calibrated_y) / self.calibrated_y
        
        # Filter negative deviation (sitting even higher than calibrated)
        pct_value = max(0.0, deviation_pct) * 100.0
        
        if deviation_pct > self.slouch_threshold:
            now = time.time()
            # Check cooldown before flagging warning state
            if now - self.last_warning_time > self.cooldown_seconds:
                # We trigger a warning
                # Note: alert_engine will decide if we sound alert, but we flag it here
                status = "slouching"
            else:
                # Slouching, but in cooldown
                status = "good"  # Keep report clean during cooldown
        else:
            status = "good"
            
        return status, pct_value

    def trigger_warning(self):
        """Called when posture alert is fired to update the last warning timestamp."""
        self.last_warning_time = time.time()

    def close(self):
        if self.face_mesh:
            self.face_mesh.close()
