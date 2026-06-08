import os
import cv2
import time
import threading
import logging
from ai.ollama_helper import query_ollama_vision, check_ollama_status
from core.logger import log_event

logger = logging.getLogger("SpecsMonitor")

class SpecsMonitor:
    def __init__(self, config):
        self.config = config["specs"]
        self.enabled = self.config.get("enabled", True)
        self.check_interval_mins = self.config.get("check_every_minutes", 5)
        self.model_name = self.config.get("ollama_model", "llava")
        
        # State tracking
        self.last_check_time = 0
        self.is_checking = False
        self.last_result = "yes"  # Assume glasses are on initially to prevent false alerts
        self.snapshot_path = os.path.join("data", "specs_snapshot.jpg")
        
        # Verify Ollama status once
        if self.enabled:
            threading.Thread(target=self._verify_ollama, daemon=True).start()

    def _verify_ollama(self):
        available, msg = check_ollama_status(self.model_name)
        if not available:
            logger.warning(f"Specs Monitor disabled or degraded: {msg}")
            # We don't disable self.enabled, just in case Ollama starts later,
            # but we log it and verify_ollama checks it periodically.

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
                logger.error(f"Failed to save snapshot for specs check: {e}")
                self.is_checking = False

    def _run_inference(self):
        try:
            prompt = "Is the person wearing glasses? Answer only yes or no."
            result = query_ollama_vision(self.snapshot_path, prompt, self.model_name)
            
            if result is not None:
                # Interpret result: look for 'yes' or 'no'
                if "yes" in result:
                    self.last_result = "yes"
                elif "no" in result:
                    self.last_result = "no"
                    log_event("SPECS_OFF", "Glasses not detected on user face")
                else:
                    logger.debug(f"Ambiguous specs answer: {result}")
            else:
                self.last_result = "unknown"
        except Exception as e:
            logger.error(f"Error in specs inference thread: {e}")
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
            status: "on", "off", "checking", "disabled", or "unknown"
        """
        if not self.enabled:
            return "disabled"
        if self.is_checking:
            return "checking"
        if self.last_result == "yes":
            return "on"
        if self.last_result == "no":
            return "off"
        return "unknown"

    def close(self):
        """Cleanup resources."""
        self.enabled = False
