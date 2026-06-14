import os
import sys
import time
import json
import threading
import threading
import time
import json
import logging
from datetime import datetime, date

# Standard libraries
try:
    import msvcrt  # Windows specific non-blocking key presses
except ImportError:
    msvcrt = None

from core.paths import DATA_DIR

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(DATA_DIR, "pixelpal.log") if os.path.exists(DATA_DIR) else "pixelpal.log"),
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
gui_window = None

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

@app.post("/api/minimize")
def api_minimize():
    global gui_window
    if gui_window:
        gui_window.minimize()
    return {"status": "success"}

@app.post("/api/maximize")
def api_maximize():
    global gui_window
    if gui_window:
        gui_window.maximize()
    return {"status": "success"}

@app.post("/api/fullscreen")
def api_fullscreen():
    global gui_window
    if gui_window:
        gui_window.toggle_fullscreen()
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
    from core.paths import LOG_DIR
    today_str = date.today().isoformat()
    log_file = os.path.join(LOG_DIR, f"{today_str}.log")
    if not os.path.exists(log_file):
        return []
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        return [line.strip() for line in lines[-count:]]
    except Exception:
        return []

# WebSocket Broadcaster Loop
@app.on_event("startup")
async def start_broadcaster():
    import asyncio
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
                for client in list(websocket_clients):
                    try:
                        await client.send_json(payload)
                    except Exception:
                        pass
            await asyncio.sleep(1)
            
    asyncio.create_task(broadcast())

# Webcam processing background thread
def webcam_loop():
    global latest_frame, gaze_status, posture_status, specs_status, phone_status
    global calibrate_requested, calibration_result
    
    import cv2
    
    # Open camera index 0
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW if os.name == 'nt' else cv2.CAP_ANY)
    
    # Wait up to 5 seconds for camera to become available
    timeout = time.time() + 5.0
    while not cap.isOpened() and time.time() < timeout:
        time.sleep(0.5)
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
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
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
            time.sleep(0.1)
            continue
            
        with latest_frame_lock:
            latest_frame = frame.copy()
            
        now = time.time()
        
        # Resize frame for monitors to improve performance
        small_frame = cv2.resize(frame, (320, 240))
        
        # 1. Check calibration request
        if calibrate_requested:
            calibrate_requested = False
            success = posture_monitor.calibrate(small_frame)
            calibration_result = success
            calibration_event.set()
            
        # 2. Gaze check interval
        if now - last_gaze_check > gaze_monitor.check_interval:
            last_gaze_check = now
            status, _, _ = gaze_monitor.process_frame(small_frame)
            with state_lock:
                gaze_status = status
                
        # 3. Posture check interval
        if now - last_posture_check > posture_monitor.check_interval:
            last_posture_check = now
            status, _ = posture_monitor.process_frame(small_frame)
            with state_lock:
                posture_status = status
                
        # 4. Specs & Phone Check (Trigger async verification internally)
        specs_monitor.check_async(small_frame)
        phone_monitor.check_async(small_frame)
        
        with state_lock:
            specs_status = specs_monitor.get_status()
            phone_status = phone_monitor.get_status()
            
        # Limit CPU usage slightly
        time.sleep(0.1)
        
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
    specs_monitor.close()
    phone_monitor.close()
    
    # Stop tray icon
    if tray_icon:
        tray_icon.stop()
        
    os._exit(0)

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

# Entry point
if __name__ == "__main__":
    global gui_window
    import multiprocessing
    multiprocessing.freeze_support()
    
    from core.paths import LOCK_FILE, CONFIG_FILE
    import atexit
    
    # Single-instance lock
    try:
        if os.path.exists(LOCK_FILE):
            try:
                os.remove(LOCK_FILE)
            except OSError:
                print("Another instance of PixelPal is already running!")
                sys.exit(1)
                
        lock_fd = open(LOCK_FILE, 'w')
        lock_fd.write(str(os.getpid()))
        
        if msvcrt:
            msvcrt.locking(lock_fd.fileno(), msvcrt.LK_NBLCK, 1)
            
        def remove_lock():
            try:
                lock_fd.close()
                os.remove(LOCK_FILE)
            except:
                pass
        atexit.register(remove_lock)
    except Exception as e:
        print("Another instance of PixelPal is already running!")
        sys.exit(1)

    init_folders()
    
    # Load configuration
    config_path = CONFIG_FILE
        
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
    # App defaults
    cli_mode = False
    action_mode = "watch"

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

    # Start Webcam Thread
    webcam_thread = threading.Thread(target=webcam_loop, daemon=True)
    webcam_thread.start()


    # Start FastAPI server thread
    def start_api_server():
        try:
            uvicorn.run(app, host="127.0.0.1", port=8000, log_config=None)
        except Exception as e:
            logger.error(f"Failed to start FastAPI server: {e}")
            
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()

    # Default Action
    log_event("MONITOR", "Started monitoring engine (watch mode)")

    # Open local dashboard automatically in browser or open in PyWebView GUI window
    use_gui = False
    if not cli_mode:
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
            gui_window = webview.create_window(
                "PIXELPAL v1.0", 
                "http://localhost:8000", 
                width=1024, 
                height=768, 
                min_size=(520, 600),
                resizable=True,
                fullscreen=False,
                frameless=False,
                background_color="#0d1117",
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
