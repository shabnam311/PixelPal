import time
import threading
from core.logger import log_event, add_session

class SessionManager:
    def __init__(self, config):
        self.config = config
        self.state = "idle"         # idle, focus, break, paused
        self.saved_state = "focus"  # saved state for pause/resume
        self.mode = "normal"        # normal, pomodoro
        self.time_left = 0
        self.total_duration = 0
        
        # Pomodoro settings
        self.pomo_work_time = config["session"]["pomodoro_work"] * 60
        self.pomo_break_time = config["session"]["pomodoro_break"] * 60
        self.pomo_stage = "work"    # work, break
        self.pomo_cycles = 0
        
        # Hearts (HP) system
        self.hearts = 5.0
        self.max_hearts = 5.0
        
        # Threading lock
        self.lock = threading.Lock()
        self.last_tick_time = time.time()
        
        # Callbacks
        self.on_session_complete = None
        self.on_break_complete = None
        self.on_state_change = None

    def damage(self, amount=0.5):
        """Reduce hearts when bad habits are detected."""
        with self.lock:
            self.hearts = max(0.0, self.hearts - amount)
            
    def heal(self, amount=0.1):
        """Regenerate hearts during clean focus time."""
        with self.lock:
            self.hearts = min(self.max_hearts, self.hearts + amount)

    def start_focus(self, minutes):
        with self.lock:
            self.state = "focus"
            self.mode = "normal"
            self.total_duration = minutes * 60
            self.time_left = self.total_duration
            self.last_tick_time = time.time()
            self.hearts = self.max_hearts
            log_event("SESSION_START", f"Started standard focus session for {minutes} minutes")
        self._notify_state_change()

    def start_pomodoro(self):
        with self.lock:
            self.state = "focus"
            self.mode = "pomodoro"
            self.pomo_stage = "work"
            self.total_duration = self.pomo_work_time
            self.time_left = self.total_duration
            self.last_tick_time = time.time()
            self.hearts = self.max_hearts
            log_event("SESSION_START", f"Started Pomodoro mode. Work stage: {self.pomo_work_time // 60} minutes")
        self._notify_state_change()

    def start_break(self, minutes):
        with self.lock:
            self.state = "break"
            self.total_duration = minutes * 60
            self.time_left = self.total_duration
            self.last_tick_time = time.time()
            log_event("BREAK_START", f"Started break for {minutes} minutes")
        self._notify_state_change()

    def pause(self):
        with self.lock:
            if self.state in ["focus", "break"]:
                self.saved_state = self.state
                self.state = "paused"
                log_event("SESSION_PAUSE", "Session paused")
                self._notify_state_change()

    def resume(self):
        with self.lock:
            if self.state == "paused":
                self.state = getattr(self, "saved_state", "focus")
                self.last_tick_time = time.time()
                log_event("SESSION_RESUME", f"Session resumed in {self.state} state")
                self._notify_state_change()

    def stop(self):
        with self.lock:
            log_event("SESSION_STOP", f"Session stopped early. Remaining time: {self.time_left // 60}m {self.time_left % 60}s")
            self.state = "idle"
            self.mode = "normal"
            self.time_left = 0
            self.total_duration = 0
            self.pomo_cycles = 0
        self._notify_state_change()

    def tick(self):
        now = time.time()
        elapsed = int(now - self.last_tick_time)
        if elapsed < 1:
            return None
            
        self.last_tick_time = now
        trigger_event = None
        
        with self.lock:
            if self.state not in ["focus", "break"]:
                return None
                
            self.time_left -= elapsed
            if self.time_left <= 0:
                self.time_left = 0
                trigger_event = self._handle_timer_completion()
                
        if trigger_event:
            self._notify_state_change()
            
        return trigger_event

    def _handle_timer_completion(self):
        if self.state == "focus":
            focused_mins = self.total_duration // 60
            unlocked_milestones = add_session(focused_mins)
            
            if self.mode == "pomodoro":
                self.pomo_cycles += 1
                self.state = "break"
                self.pomo_stage = "break"
                
                # Long break every 4 cycles
                if self.pomo_cycles % 4 == 0:
                    self.total_duration = self.pomo_break_time * 3  # 15 min long break
                    log_event("BREAK_START", f"Long break! Pomodoro cycle {self.pomo_cycles} complete.")
                else:
                    self.total_duration = self.pomo_break_time
                    log_event("SESSION_COMPLETE", f"Pomodoro work cycle {self.pomo_cycles} complete. Starting break.")
                    
                self.time_left = self.total_duration
                
                if self.on_session_complete:
                    threading.Thread(target=self.on_session_complete, args=(focused_mins, unlocked_milestones, True)).start()
                return "pomodoro_work_complete"
            else:
                self.state = "idle"
                self.total_duration = 0
                log_event("SESSION_COMPLETE", "Standard focus session complete.")
                
                if self.on_session_complete:
                    threading.Thread(target=self.on_session_complete, args=(focused_mins, unlocked_milestones, False)).start()
                return "session_complete"
                
        elif self.state == "break":
            if self.mode == "pomodoro":
                self.state = "focus"
                self.pomo_stage = "work"
                self.total_duration = self.pomo_work_time
                self.time_left = self.total_duration
                self.hearts = self.max_hearts
                log_event("BREAK_COMPLETE", "Pomodoro break complete. Starting next work cycle.")
                
                if self.on_break_complete:
                    threading.Thread(target=self.on_break_complete, args=(True,)).start()
                return "pomodoro_break_complete"
            else:
                self.state = "idle"
                self.total_duration = 0
                log_event("BREAK_COMPLETE", "Break complete.")
                
                if self.on_break_complete:
                    threading.Thread(target=self.on_break_complete, args=(False,)).start()
                return "break_complete"
                
        return None

    def get_status(self):
        with self.lock:
            return {
                "state": self.state,
                "mode": self.mode,
                "time_left": self.time_left,
                "total_duration": self.total_duration,
                "pomodoro_stage": self.pomo_stage if self.mode == "pomodoro" else None,
                "pomodoro_cycles": self.pomo_cycles if self.mode == "pomodoro" else 0,
                "hearts": self.hearts
            }

    def register_callbacks(self, on_session_complete, on_break_complete, on_state_change=None):
        self.on_session_complete = on_session_complete
        self.on_break_complete = on_break_complete
        self.on_state_change = on_state_change

    def _notify_state_change(self):
        if self.on_state_change:
            status = self.get_status()
            threading.Thread(target=self.on_state_change, args=(status,)).start()
