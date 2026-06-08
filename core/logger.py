import os
import json
from datetime import datetime, date
from core.paths import DATA_DIR, LOG_DIR, STATS_FILE

DEFAULT_STATS = {
    "sessions_completed_today": 0,
    "total_focus_minutes_today": 0,
    "phone_pickups_today": 0,
    "times_specs_off_today": 0,
    "posture_warnings_today": 0,
    "current_streak": 0,
    "last_active_date": "",
    "milestones": []
}

MILESTONES_LIST = [
    {"id": "first_session", "name": "First Steps", "description": "Completed your first focus session!", "req_sessions": 1},
    {"id": "three_sessions", "name": "Deep Work Initiate", "description": "Completed 3 sessions in a single day!", "req_sessions": 3},
    {"id": "five_sessions", "name": "Focus Master", "description": "Completed 5 sessions in a single day!", "req_sessions": 5},
    {"id": "streak_3", "name": "Consistent Focus", "description": "Maintained a 3-day streak!", "req_streak": 3},
    {"id": "streak_7", "name": "Focus Wizard", "description": "Maintained a 7-day streak!", "req_streak": 7}
]

def init_folders():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    if not os.path.exists(STATS_FILE):
        with open(STATS_FILE, "w") as f:
            json.dump(DEFAULT_STATS, f, indent=2)

def load_stats():
    init_folders()
    try:
        with open(STATS_FILE, "r") as f:
            stats = json.load(f)
        
        # Ensure all default keys exist
        updated = False
        for k, v in DEFAULT_STATS.items():
            if k not in stats:
                stats[k] = v
                updated = True
        
        # Check if it's a new day to reset daily stats
        today_str = date.today().isoformat()
        if stats["last_active_date"] != today_str:
            # Check streak continuity before resetting
            if stats["last_active_date"]:
                last_active = datetime.fromisoformat(stats["last_active_date"]).date()
                delta = date.today() - last_active
                if delta.days > 1:
                    # Reset streak if they missed a day
                    stats["current_streak"] = 0
            
            stats["sessions_completed_today"] = 0
            stats["total_focus_minutes_today"] = 0
            stats["phone_pickups_today"] = 0
            stats["times_specs_off_today"] = 0
            stats["posture_warnings_today"] = 0
            stats["last_active_date"] = today_str
            updated = True
            
            # Clean up old logs periodically when a new day starts
            cleanup_old_logs()
            
        if updated:
            save_stats(stats)
            
        return stats
    except Exception as e:
        print(f"Error loading stats: {e}")
        return DEFAULT_STATS.copy()

def save_stats(stats):
    init_folders()
    tmp_path = STATS_FILE + ".tmp"
    try:
        with open(tmp_path, "w") as f:
            json.dump(stats, f, indent=2)
        # Verify the temp file is valid JSON
        with open(tmp_path, "r") as f:
            json.load(f)
        # Atomic rename
        os.replace(tmp_path, STATS_FILE)
    except Exception as e:
        print(f"Error saving stats: {e}")
        # Clean up temp file
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except:
            pass

def log_event(event_type, description=""):
    init_folders()
    today_str = date.today().isoformat()
    log_file = os.path.join(LOG_DIR, f"{today_str}.log")
    time_str = datetime.now().strftime("%H:%M:%S")
    
    log_line = f"[{time_str}] [{event_type.upper()}] {description}\n"
    
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_line)
    except Exception as e:
        print(f"Error writing log: {e}")

def add_session(minutes):
    stats = load_stats()
    stats["sessions_completed_today"] += 1
    stats["total_focus_minutes_today"] += minutes
    
    # Update streak logic
    today_str = date.today().isoformat()
    if stats["last_active_date"] == today_str:
        pass
        
    if stats["sessions_completed_today"] == 1:
        stats["current_streak"] += 1
        
    unlocked_milestones = []
    
    # Check milestones
    for m in MILESTONES_LIST:
        if m["id"] in stats["milestones"]:
            continue
            
        unlocked = False
        if "req_sessions" in m and stats["sessions_completed_today"] >= m["req_sessions"]:
            unlocked = True
        elif "req_streak" in m and stats["current_streak"] >= m["req_streak"]:
            unlocked = True
            
        if unlocked:
            stats["milestones"].append(m["id"])
            unlocked_milestones.append(m)
            log_event("MILESTONE", f"Unlocked: {m['name']} - {m['description']}")
            
    stats["last_active_date"] = today_str
    save_stats(stats)
    log_event("SESSION", f"Completed a {minutes}-minute focus session. Total today: {stats['sessions_completed_today']}")
    
    return unlocked_milestones

def add_violation(violation_type):
    stats = load_stats()
    key = None
    if violation_type == "phone":
        key = "phone_pickups_today"
        stats["current_streak"] = 0
    elif violation_type == "specs":
        key = "times_specs_off_today"
    elif violation_type == "posture":
        key = "posture_warnings_today"
        
    if key:
        stats[key] += 1
        save_stats(stats)
        log_event("VIOLATION", f"Violation detected: {violation_type}")

def cleanup_old_logs(max_age_days=30):
    """Delete log files older than max_age_days."""
    try:
        cutoff = date.today().toordinal() - max_age_days
        for fname in os.listdir(LOG_DIR):
            if fname.endswith('.log'):
                try:
                    fdate = date.fromisoformat(fname.replace('.log', ''))
                    if fdate.toordinal() < cutoff:
                        os.remove(os.path.join(LOG_DIR, fname))
                except (ValueError, OSError):
                    pass
    except Exception:
        pass
