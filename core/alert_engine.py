import time
import logging
from datetime import datetime
from core.logger import add_violation, log_event

logger = logging.getLogger("AlertEngine")

class AlertEngine:
    def __init__(self, config, session_manager):
        self.config = config["alerts"]
        self.gaze_config = config["gaze"]
        self.session_manager = session_manager
        
        # State tracking
        self.gaze_away_start = None
        self.specs_off_start = None
        self.last_posture_warn = 0
        self.last_phone_warn = 0
        self.last_specs_warn = 0
        
        # Cooldown intervals (seconds)
        self.phone_cooldown = 180  # 3 minutes
        self.specs_cooldown = 300  # 5 minutes
        
        # Warning counts
        self.gaze_warned_levels = {10: False, 30: False, 60: False}
        
        # Alert callback
        # Callback arguments: (level, title, message, sound_file)
        self.alert_callback = None

    def is_quiet_hours(self):
        """Checks if current time lies in the configured quiet hours."""
        start_str = self.config.get("quiet_hours_start", "22:00")
        end_str = self.config.get("quiet_hours_end", "08:00")
        try:
            now_time = datetime.now().time()
            start_time = datetime.strptime(start_str, "%H:%M").time()
            end_time = datetime.strptime(end_str, "%H:%M").time()
            
            if start_time < end_time:
                return start_time <= now_time <= end_time
            else:  # Quiet hours cross midnight
                return now_time >= start_time or now_time <= end_time
        except Exception as e:
            logger.error(f"Error parsing quiet hours: {e}")
            return False

    def process_monitors(self, gaze_status, posture_status, specs_status, phone_status, phone_monitor=None):
        """
        Processes current statuses of all monitors and triggers appropriate alerts.
        Returns:
            list of dicts containing active alerts.
        """
        alerts = []
        now = time.time()
        session_status = self.session_manager.get_status()
        
        # Only trigger focus warnings if session is in 'focus' state
        is_focusing = (session_status["state"] == "focus")
        
        # 1. GAZE MONITOR
        if is_focusing and self.gaze_config.get("enabled", True):
            if gaze_status == "away":
                if self.gaze_away_start is None:
                    self.gaze_away_start = now
                
                away_duration = now - self.gaze_away_start
                
                # Check intervals
                # 10s: INFO / soft chime
                if away_duration >= self.gaze_config.get("soft_warn_seconds", 10) and not self.gaze_warned_levels[10]:
                    self.gaze_warned_levels[10] = True
                    alerts.append(self._create_alert(
                        "INFO", "GAZE ALERT", "Hey, eyes back on screen!", "warning.wav"
                    ))
                
                # 30s: WARN / popup
                if away_duration >= self.gaze_config.get("hard_warn_seconds", 30) and not self.gaze_warned_levels[30]:
                    self.gaze_warned_levels[30] = True
                    alerts.append(self._create_alert(
                        "WARN", "GAZE ALERT", "FOCUS! You are drifting away.", "warning.wav"
                    ))
                
                # 60s+: CRIT / pause session
                if away_duration >= self.gaze_config.get("pause_session_seconds", 60) and not self.gaze_warned_levels[60]:
                    self.gaze_warned_levels[60] = True
                    self.session_manager.pause()
                    alerts.append(self._create_alert(
                        "CRIT", "SESSION PAUSED", "FOCUS! Session paused due to inactivity.", "alert_beep.wav"
                    ))
            elif gaze_status == "looking":
                self._reset_gaze_warnings()
        else:
            self._reset_gaze_warnings()

        # 2. POSTURE MONITOR
        if is_focusing and posture_status == "slouching":
            # Posture monitor manages its own cooldown, but we do double-check here
            alerts.append(self._create_alert(
                "WARN", "POSTURE CHECK", "SIT UP STRAIGHT! Posture check failed ↑", "warning.wav"
            ))
            add_violation("posture")
            
        # 3. SPECS MONITOR
        if is_focusing and specs_status == "off":
            if self.specs_off_start is None:
                self.specs_off_start = now
            
            off_duration = now - self.specs_off_start
            
            # Check if 20 mins off -> CRIT
            if off_duration >= 1200: # 20 minutes
                if now - self.last_specs_warn > self.specs_cooldown:
                    self.last_specs_warn = now
                    alerts.append(self._create_alert(
                        "CRIT", "SPECS CRITICAL", "PUT YOUR GLASSES ON! Your eyes are frying rn (20m+ off)!", "alert_beep.wav"
                    ))
                    add_violation("specs")
            else:
                # Normal warning with cooldown
                if now - self.last_specs_warn > self.specs_cooldown:
                    self.last_specs_warn = now
                    alerts.append(self._create_alert(
                        "WARN", "SPECS CHECK", "PUT YOUR SPECS ON! Your eyes are crying rn.", "warning.wav"
                    ))
                    add_violation("specs")
        elif specs_status == "on":
            self.specs_off_start = None

        # 4. PHONE MONITOR
        if is_focusing and phone_status == "detected":
            if now - self.last_phone_warn > self.phone_cooldown:
                self.last_phone_warn = now
                alerts.append(self._create_alert(
                    "WARN", "PHONE ALERT", "PHONE DOWN! You were doing so good tho 😭", "alert_beep.wav"
                ))
                add_violation("phone")
                # Reset phone status on monitor so it doesn't double-trigger
                if phone_monitor:
                    phone_monitor.reset_status()

        # Dispatch alerts if callback is set
        if self.alert_callback and alerts:
            for alert in alerts:
                # Check quiet hours before passing sound file
                sound_to_play = None if self.is_quiet_hours() else alert["sound"]
                self.alert_callback(alert["level"], alert["title"], alert["message"], sound_to_play)

        return alerts

    def _reset_gaze_warnings(self):
        self.gaze_away_start = None
        self.gaze_warned_levels = {10: False, 30: False, 60: False}

    def _create_alert(self, level, title, message, sound_file):
        log_event("ALERT", f"[{level}] {title}: {message}")
        return {
            "level": level,
            "title": title,
            "message": message,
            "sound": sound_file
        }

    def register_alert_callback(self, callback):
        self.alert_callback = callback
