import os
import cv2
import time
import threading
import logging
from ai.ollama_helper import query_ollama_vision, check_ollama_status
from core.logger import log_event

logger = logging.getLogger("PhoneMonitor")

class PhoneMonitor:
    def __init__(self, config):
        self.config = config["phone"]
        self.enabled = self.config.get("enabled", True)
        self.check_interval_mins = self.config.get("check_every_minutes", 3)
        
        # Use specs ollama model settings as default or custom
        self.model_name = config["specs"].get("ollama_model", "llava")
        
        # State tracking
        self.last_check_time = 0
        self.is_checking = False
        self.last_result = "no"  # Assume no phone initially
        self.snapshot_path = os.path.join("data", "phone_snapshot.jpg")
        
        # Verify Ollama status once
        if self.enabled:
            threading.Thread(target=self._verify_ollama, daemon=True).start()

    def _verify_ollama(self):
        available, msg = check_ollama_status(self.model_name)
        if not available:
            logger.warning(f"Phone Monitor disabled or degraded: {msg}")

    def check_async(self, frame):
        """
        Triggers an asynchronous check if the interval has passed.
        Does not block the frame-processing thread.
        """
        if not self.enabled:
            return
            
        now = time.time()
        interval_seconds = self.check_interval_mins * 60
        
        if (now - self.last_check_time > interval_seconds) and not self.is_checking:
            self.is_checking = True
            self.last_check_time = now
            
            # Save frame to snapshot
            try:
                os.makedirs("data", exist_ok=True)
                # Resize to lower resolution (e.g. 400x300) to speed up Ollama inference
                small_frame = cv2.resize(frame, (400, 300))
                cv2.imwrite(self.snapshot_path, small_frame)
                
                # Start background thread
                thread = threading.Thread(target=self._run_inference, daemon=True)
                thread.start()
            except Exception as e:
                logger.error(f"Failed to save snapshot for phone check: {e}")
                self.is_checking = False

    def _run_inference(self):
        try:
            prompt = "Is there a smartphone visible in this image? Answer only yes or no."
            result = query_ollama_vision(self.snapshot_path, prompt, self.model_name)
            
            if result is not None:
                # Interpret result: look for 'yes' or 'no'
                if "yes" in result:
                    self.last_result = "yes"
                    log_event("PHONE_DETECTED", "Phone detected in camera frame")
                elif "no" in result:
                    self.last_result = "no"
                else:
                    logger.debug(f"Ambiguous phone answer: {result}")
            else:
                self.last_result = "unknown"
        except Exception as e:
            logger.error(f"Error in phone inference thread: {e}")
        finally:
            self.is_checking = False
            # Clean up snapshot file
            try:
                if os.path.exists(self.snapshot_path):
                    os.remove(self.snapshot_path)
            except Exception:
                pass

    def get_status(self):
        """
        Returns:
            status: "detected", "not_detected", "checking", "disabled", or "unknown"
        """
        if not self.enabled:
            return "disabled"
        if self.is_checking:
            return "checking"
        if self.last_result == "yes":
            return "detected"
        if self.last_result == "no":
            return "not_detected"
        return "unknown"
        
    def reset_status(self):
        """Used to reset phone state after it has been warned/acknowledged."""
        self.last_result = "no"
