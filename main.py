import os
import sys
import time
import json
import threading
import argparse
import logging
from datetime import datetime, date

# Standard libraries
try:
    import msvcrt  # Windows specific non-blocking key presses
except ImportError:
    msvcrt = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join("data", "pixelpal.log") if os.path.exists("data") else "pixelpal.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("PixelPalMain")

# Import Core Components
from core.logger import init_folders, load_stats, save_stats, log_event
from core.session_manager import SessionManager
from core.alert_engine import AlertEngine
from monitors.gaze_monitor import GazeMonitor
from monitors.posture_monitor import PostureMonitor
from monitors.specs_monitor import SpecsMonitor
from monitors.phone_monitor import PhoneMonitor
from ui.terminal_ui import TerminalUI
from ui.popup_alerts import show_popup
from ui.tray_icon import TrayIcon

# Check if winsound is available (Windows)
try:
    import winsound
except ImportError:
    winsound = None

# FastAPI imports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
import uvicorn

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_path, relative_path)

# Global state variables
running = True
config = {}
latest_frame = None
latest_frame_lock = threading.Lock()

# Monitor States (Thread Safe)
state_lock = threading.Lock()
gaze_status = "not_detected"
posture_status = "uncalibrated"
specs_status = "unknown"
phone_status = "unknown"

# API State Triggers
calibrate_requested = False
calibration_result = None
calibration_event = threading.Event()

last_sound_trigger = None
active_alert = None

# WebSocket clients list
websocket_clients = []

# FastAPI Application Definition
app = FastAPI(title="PixelPal Retro API")

# Serve Web UI files
@app.get("/")
def serve_index():
    return FileResponse(get_resource_path(os.path.join("ui", "web", "index.html")))

@app.get("/index.css")
def serve_css():
    return FileResponse(get_resource_path(os.path.join("ui", "web", "index.css")))

@app.get("/app.js")
def serve_js():
    return FileResponse(get_resource_path(os.path.join("ui", "web", "app.js")))

# FastAPI API Endpoints
@app.post("/api/start")
def api_start(minutes: int = 45):
    session_manager.start_focus(minutes)
    return {"status": "success", "message": f"Started focus session for {minutes} mins"}

@app.post("/api/pomodoro")
def api_pomodoro():
    session_manager.start_pomodoro()
    return {"status": "success", "message": "Started Pomodoro mode"}

@app.post("/api/pause")
def api_pause():
    session_manager.pause()
    return {"status": "success", "message": "Paused session"}

@app.post("/api/resume")
def api_resume():
    session_manager.resume()
    return {"status": "success", "message": "Resumed session"}

@app.post("/api/calibrate")
def api_calibrate():
    global calibrate_requested, calibration_result
    calibration_event.clear()
    calibrate_requested = True
    
    # Wait for webcam thread to complete calibration
    success = calibration_event.wait(timeout=5.0)
    if success and calibration_result:
        return {"status": "success", "message": "Posture calibrated"}
    else:
        return {"status": "error", "message": "Calibration timed out or failed"}

@app.post("/api/dismiss-alert")
def api_dismiss_alert():
    global active_alert
    active_alert = None
    return {"status": "success"}

@app.post("/api/shutdown")
def api_shutdown():
    logger.info("Shutdown requested via Web UI (Escape key)")
    def delayed_exit():
        time.sleep(0.5)
        cleanup_and_exit()
    threading.Thread(target=delayed_exit).start()
    return {"status": "success"}

# WebSocket server handler
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.append(websocket)
    try:
        while True:
            # We just keep connection open; data is pushed in broadcast loop
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_clients.remove(websocket)
    except Exception:
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)

# Native Chiptunes Speaker Fallback for Windows
def play_native_beeps(sound_file):
    if not winsound or config.get("alerts", {}).get("sound_enabled") is False:
        return
        
    # Check quiet hours
    if alert_engine.is_quiet_hours():
        return
        
    def beep_thread():
        try:
            if sound_file == "warning.wav":
                # Chime: A5 -> C6
                winsound.Beep(880, 120)
                winsound.Beep(1047, 180)
            elif sound_file == "alert_beep.wav":
                # High pitch siren
                winsound.Beep(1200, 300)
                winsound.Beep(800, 300)
            elif sound_file == "levelup.wav":
                # Rapid arpeggio
                for freq in [261, 329, 392, 523, 659, 783, 1046]:
                    winsound.Beep(freq, 70)
        except Exception as e:
            logger.debug(f"Failed to play native beep: {e}")
            
    threading.Thread(target=beep_thread, daemon=True).start()

# Helper to read recent log lines
def get_recent_log_lines(count=15):
    today_str = date.today().isoformat()
    log_file = os.path.join("data", "logs", f"{today_str}.log")
    if not os.path.exists(log_file):
        return []
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        return [line.strip() for line in lines[-count:]]
    except Exception:
        return []

# WebSocket Broadcaster Loop
def websocket_broadcast_loop():
    global last_sound_trigger
    import asyncio
    
    # We must run asyncio loop in this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def broadcast():
        global last_sound_trigger, active_alert
        while running:
            if websocket_clients:
                with state_lock:
                    payload = {
                        "session": session_manager.get_status(),
                        "gaze": gaze_status,
                        "posture": posture_status,
                        "specs": specs_status,
                        "phone": phone_status,
                        "stats": load_stats(),
                        "sound_trigger": last_sound_trigger,
                        "active_alert": active_alert,
                        "logs": get_recent_log_lines()
                    }
                # Reset sound trigger once sent
                last_sound_trigger = None
                
                # Send to all clients
                tasks = []
                for client in list(websocket_clients):
                    tasks.append(client.send_json(payload))
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(1)
            
    loop.run_until_complete(broadcast())

# Webcam processing background thread
def webcam_loop():
    global latest_frame, gaze_status, posture_status, specs_status, phone_status
    global calibrate_requested, calibration_result
    
    import cv2
    
    # Open camera index 0
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW if os.name == 'nt' else cv2.CAP_ANY)
    if not cap.isOpened():
        logger.error("CRITICAL: Camera index 0 could not be opened.")
        log_event("SYSTEM_ERROR", "Webcam could not be opened")
        # Fallback to keep app running without camera
        while running:
            time.sleep(1)
        return

    # Optimize camera parameters
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    logger.info("Webcam stream started successfully.")
    
    last_gaze_check = 0
    last_posture_check = 0
    
    # Read first frame to initialize shape
    ret, frame = cap.read()
    if ret:
        with latest_frame_lock:
            latest_frame = frame.copy()
            
    while running:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.03)
            continue
            
        with latest_frame_lock:
            latest_frame = frame.copy()
            
        now = time.time()
        
        # 1. Check calibration request
        if calibrate_requested:
            calibrate_requested = False
            success = posture_monitor.calibrate(frame)
            calibration_result = success
            calibration_event.set()
            
        # 2. Gaze check interval
        if now - last_gaze_check > gaze_monitor.check_interval:
            last_gaze_check = now
            status, _, _ = gaze_monitor.process_frame(frame)
            with state_lock:
                gaze_status = status
                
        # 3. Posture check interval
        if now - last_posture_check > posture_monitor.check_interval:
            last_posture_check = now
            status, _ = posture_monitor.process_frame(frame)
            with state_lock:
                posture_status = status
                
        # 4. Specs & Phone Check (Trigger async verification internally)
        specs_monitor.check_async(frame)
        phone_monitor.check_async(frame)
        
        with state_lock:
            specs_status = specs_monitor.get_status()
            phone_status = phone_monitor.get_status()
            
        # Limit CPU usage slightly
        time.sleep(0.03)
        
    cap.release()
    logger.info("Webcam stream released.")

# Callback for alerts triggered in alert_engine
def alert_callback(level, title, message, sound_file):
    global last_sound_trigger, active_alert
    
    # Keep track of sound for Web sockets
    last_sound_trigger = sound_file
    
    # Keep track of active alert
    active_alert = {
        "level": level,
        "title": title,
        "message": message
    }
    
    # Play local speaker chiptunes
    if sound_file:
        play_native_beeps(sound_file)
        
    # Trigger Tkinter Desktop Popup warning
    if config["alerts"].get("popup_enabled", True) and level in ["WARN", "CRIT"]:
        # Don't show posture popup too rapidly
        show_popup(title, message, severity=level)
        
    # Notify posture monitor about warning to trigger its cooldown
    if "posture" in title.lower() or "posture" in message.lower():
        posture_monitor.trigger_warning()
        
    # Notify tray icon state
    if tray_icon:
        if level == "CRIT":
            tray_icon.set_state("critical")
        elif level == "WARN":
            tray_icon.set_state("warning")

# Callback for session manager complete events
def session_complete_callback(minutes, milestones, is_pomodoro):
    global last_sound_trigger
    last_sound_trigger = "levelup.wav"
    play_native_beeps("levelup.wav")
    
    msg = f"Level Up! Finished focus session of {minutes} mins!"
    show_popup("LEVEL UP! 🎉", msg, severity="INFO")
    
    for m in milestones:
        # Show unlock popup
        show_popup("MILESTONE UNLOCKED! 🏆", f"{m['name']}: {m['description']}", severity="INFO")
        
    if tray_icon:
        tray_icon.set_state("happy")

def break_complete_callback(is_pomodoro):
    global last_sound_trigger
    last_sound_trigger = "levelup.wav"
    play_native_beeps("levelup.wav")
    show_popup("BREAK OVER! 👾", "Ready to focus? Let's go!", severity="INFO")

def state_change_callback(status):
    # Reset tray icon state back to happy on idle / transition
    if tray_icon and status["state"] in ["idle", "break"]:
        tray_icon.set_state("happy")

# Cleanup and Shutdown
def cleanup_and_exit():
    global running
    running = False
    logger.info("Shutting down PixelPal app...")
    
    # Close monitors
    gaze_monitor.close()
    posture_monitor.close()
    
    # Stop tray icon
    if tray_icon:
        tray_icon.stop()
        
    os._exit(0)

# Entry point
if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    init_folders()
    
    # Load configuration
    config_path = "config.json"
    if not os.path.exists(config_path):
        config_path = get_resource_path("config.json")
        
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            config = json.load(f)
    else:
        logger.error("config.json not found! Using hardcoded defaults.")
        config = {
            "session": {"default_minutes": 45, "break_minutes": 10, "pomodoro_work": 25, "pomodoro_break": 5},
            "gaze": {"grace_seconds": 10, "soft_warn_seconds": 10, "hard_warn_seconds": 30, "pause_session_seconds": 60, "check_interval_seconds": 2, "enabled": True},
            "posture": {"slouch_threshold_percent": 15, "check_interval_seconds": 5, "cooldown_minutes": 2, "enabled": True},
            "specs": {"check_every_minutes": 5, "ollama_model": "llava", "enabled": True},
            "phone": {"check_every_minutes": 3, "enabled": True},
            "alerts": {"sound_enabled": True, "popup_enabled": True, "max_warnings_before_cooldown": 3, "quiet_hours_start": "22:00", "quiet_hours_end": "08:00"},
            "ui": {"theme": "neon_green", "tray_icon_enabled": True, "terminal_refresh_seconds": 1}
        }
        
    # Setup argument parser
    parser = argparse.ArgumentParser(description="PIXELPAL - Retro Pixel Focus App")
    parser.add_argument("mode", choices=["start", "pomodoro", "watch", "stats", "calibrate"], nargs="?", default="watch",
                        help="Action mode: start (standard timer), pomodoro (work/break loops), watch (monitor only), stats (view metrics), calibrate (posture baseline)")
    parser.add_argument("minutes", type=int, nargs="?", default=config["session"]["default_minutes"],
                        help="Focus session duration in minutes (used with 'start' mode)")
    parser.add_argument("--cli", action="store_true", default=False,
                        help="Run in CLI Terminal HUD mode instead of GUI Window mode")
    args = parser.parse_args()

    # Initializing Monitors & Core
    session_manager = SessionManager(config)
    alert_engine = AlertEngine(config, session_manager)
    gaze_monitor = GazeMonitor(config)
    posture_monitor = PostureMonitor(config)
    specs_monitor = SpecsMonitor(config)
    phone_monitor = PhoneMonitor(config)
    terminal_ui = TerminalUI()
    
    # Wire callbacks
    alert_engine.register_alert_callback(alert_callback)
    session_manager.register_callbacks(session_complete_callback, break_complete_callback, state_change_callback)
    
    # Initialize System Tray
    tray_icon = None
    if config["ui"].get("tray_icon_enabled", True):
        tray_icon = TrayIcon(session_manager, cleanup_and_exit)
        tray_icon.run_async()

    # Parse and Execute Initial Action Modes
    if args.mode == "stats":
        stats = load_stats()
        print("\n=== PIXELPAL HABIT STATS ===")
        print(f"🔥 Current Focus Streak: {stats['current_streak']} days")
        print(f"📦 Focus Sessions Completed Today: {stats['sessions_completed_today']}")
        print(f"⌛ Total Focus Time Today: {stats['total_focus_minutes_today']} minutes")
        print(f"📱 Phone Pickups Detected: {stats['phone_pickups_today']}")
        print(f"👓 Times UV Specs Detected Off: {stats['times_specs_off_today']}")
        print(f"🧍 Posture slouch warnings: {stats['posture_warnings_today']}")
        print("\nUnlocked Trophies:")
        for m_id in stats.get("milestones", []):
            print(f" 🏆 Unlocked Milestone: {m_id}")
        cleanup_and_exit()
        
    # Start Webcam Thread
    webcam_thread = threading.Thread(target=webcam_loop, daemon=True)
    webcam_thread.start()

    # Calibrate Posture baseline before starting if selected
    if args.mode == "calibrate":
        print("\n[CALIBRATION] Please sit up straight, look at the camera, and stay still...")
        time.sleep(2)
        # Try to capture from thread
        success = posture_monitor.calibrate(latest_frame) if latest_frame is not None else False
        if success:
            print("[CALIBRATION] Success! Baseline vertical posture saved.")
            # Play success chiptune
            play_native_beeps("levelup.wav")
            time.sleep(1)
        else:
            print("[CALIBRATION] Failed! Make sure webcam is working and face is in frame.")
        cleanup_and_exit()

    # Start FastAPI server thread
    def start_api_server():
        try:
            uvicorn.run(app, host="127.0.0.1", port=8000, log_config=None)
        except Exception as e:
            logger.error(f"Failed to start FastAPI server: {e}")
            
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()

    # Start WebSocket Broadcaster thread
    ws_thread = threading.Thread(target=websocket_broadcast_loop, daemon=True)
    ws_thread.start()

    # Apply Startup Mode Action
    if args.mode == "start":
        session_manager.start_focus(args.minutes)
    elif args.mode == "pomodoro":
        session_manager.start_pomodoro()
    elif args.mode == "watch":
        log_event("MONITOR", "Started monitoring engine (watch mode)")

    # Open local dashboard automatically in browser or open in PyWebView GUI window
    use_gui = False
    if not args.cli:
        try:
            import webview
            use_gui = True
        except ImportError:
            logger.warning("pywebview not installed. Falling back to browser + terminal.")

    if use_gui:
        # Start background timer and monitor evaluator loop since main thread is blocked by webview
        def background_tick_loop():
            while running:
                session_manager.tick()
                with state_lock:
                    current_g = gaze_status
                    current_post = posture_status
                    current_sp = specs_status
                    current_ph = phone_status
                alert_engine.process_monitors(
                    current_g, current_post, current_sp, current_ph, phone_monitor
                )
                time.sleep(1)
                
        tick_thread = threading.Thread(target=background_tick_loop, daemon=True)
        tick_thread.start()

        # Wait for FastAPI server to be ready before launching WebView
        import socket
        def wait_for_port(port, host='127.0.0.1', timeout=10.0):
            start_time = time.time()
            while time.time() - start_time < timeout:
                try:
                    with socket.create_connection((host, port), timeout=0.1):
                        return True
                except OSError:
                    time.sleep(0.1)
            return False
            
        logger.info("Waiting for FastAPI server to boot...")
        wait_for_port(8000)

        # Start desktop app window
        try:
            logger.info("PixelPal GUI dashboard window booting...")
            webview.create_window(
                "PIXELPAL v1.0 👾", 
                "http://localhost:8000", 
                width=1000, 
                height=780, 
                resizable=False,
                fullscreen=True
            )
            webview.start()
        except Exception as e:
            logger.error(f"Failed to run GUI window: {e}. Falling back to terminal.")
            use_gui = False
        finally:
            cleanup_and_exit()

    if not use_gui:
        # Open browser separately as fallback
        try:
            import webbrowser
            threading.Timer(1.5, lambda: webbrowser.open("http://localhost:8000")).start()
        except Exception:
            pass

        # Main UI Event Loop (Terminal display + keyboard controls)
        logger.info("PixelPal Terminal dashboard booted. Type [q] to quit, [p] to pause.")
        
        try:
            while running:
                # 1. Tick Session Manager timer
                session_manager.tick()
                
                # 2. Evaluate Alerts
                with state_lock:
                    current_g = gaze_status
                    current_post = posture_status
                    current_sp = specs_status
                    current_ph = phone_status
                    
                alert_engine.process_monitors(
                    current_g, current_post, current_sp, current_ph, phone_monitor
                )
                
                # 3. Render Terminal HUD
                stats = load_stats()
                session_status = session_manager.get_status()
                
                terminal_ui.render(
                    session_status, current_g, current_post, current_sp, current_ph, stats
                )
                
                # 4. Handle Terminal Inputs (Non-blocking)
                if msvcrt:
                    handle_terminal_input()
                    
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received.")
        finally:
            cleanup_and_exit()

def handle_terminal_input():
    if msvcrt.kbhit():
        try:
            key = msvcrt.getch().decode('utf-8', errors='ignore').lower()
            if key == 'q':
                cleanup_and_exit()
            elif key == 'p':
                status = session_manager.get_status()
                if status["state"] == "paused":
                    session_manager.resume()
                elif status["state"] in ["focus", "break"]:
                    session_manager.pause()
            elif key == 's':
                session_manager.start_focus(45)
            elif key == 'o':
                session_manager.start_pomodoro()
            elif key == 'c':
                posture_monitor.calibrate(latest_frame) if latest_frame is not None else False
        except Exception as e:
            logger.debug(f"Input handling error: {e}")
