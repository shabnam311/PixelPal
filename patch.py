import sys
import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 2A: Paths
content = content.replace(
"""def get_resource_path(relative_path):
    \"\"\" Get absolute path to resource, works for dev and for PyInstaller \"\"\"
    base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_path, relative_path)""",
"from core.paths import APP_DATA_DIR, LOG_DIR, STATS_FILE, CONFIG_FILE, LOCK_FILE"
)

content = content.replace(
    'os.path.join("data", "pixelpal.log") if os.path.exists("data") else "pixelpal.log"',
    'os.path.join(APP_DATA_DIR, "pixelpal.log")'
)

content = content.replace('os.path.join("data", "logs", f"{today_str}.log")', 'os.path.join(LOG_DIR, f"{today_str}.log")')
content = content.replace('"config.json"', 'CONFIG_FILE')

# Fix 2B: Single-Instance Lock
lock_code = """# Single-instance lock — prevents two PixelPals running simultaneously
import msvcrt as _msvcrt

_lock_file_handle = None

def acquire_single_instance_lock():
    global _lock_file_handle
    try:
        _lock_file_handle = open(LOCK_FILE, "w")
        _msvcrt.locking(_lock_file_handle.fileno(), _msvcrt.LK_NBLCK, 1)
        return True
    except OSError:
        return False

def release_single_instance_lock():
    global _lock_file_handle
    if _lock_file_handle:
        try:
            _msvcrt.locking(_lock_file_handle.fileno(), _msvcrt.LK_UNLCK, 1)
            _lock_file_handle.close()
            os.remove(LOCK_FILE)
        except Exception:
            pass

if not acquire_single_instance_lock():
    import tkinter as tk
    from tkinter import messagebox
    root = tk.Tk(); root.withdraw()
    messagebox.showwarning("PixelPal", "PixelPal is already running!\\nCheck your system tray.")
    root.destroy()
    sys.exit(0)

"""
content = content.replace('if __name__ == "__main__":\n    import multiprocessing', 'if __name__ == "__main__":\n    ' + lock_code.replace('\n', '\n    ') + '\n    import multiprocessing')

# Fix 2C: Port Conflict
port_code = """def find_free_port(start: int = 8000, attempts: int = 10) -> int:
    import socket
    for port in range(start, start + attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError("No free ports available in range 8000-8009")

API_PORT = find_free_port(8000)
logger.info(f"Using port {API_PORT}")
"""
content = content.replace('    api_thread = threading.Thread', '    ' + port_code.replace('\n', '\n    ').strip() + '\n    api_thread = threading.Thread')
content = content.replace('uvicorn.run(app, host="127.0.0.1", port=8000', 'uvicorn.run(app, host="127.0.0.1", port=API_PORT')
content = content.replace('wait_for_port(8000)', 'wait_for_port(API_PORT)')
content = content.replace('"http://localhost:8000"', 'f"http://localhost:{API_PORT}"')

# Fix 2D: Graceful Shutdown
new_shutdown = """def cleanup_and_exit():
    global running
    if not running:
        return  # idempotent — safe to call multiple times
    running = False
    logger.info("PixelPal shutting down...")

    # Close monitors cleanly
    try:
        gaze_monitor.close()
    except Exception as e:
        logger.debug(f"Gaze monitor close error: {e}")

    try:
        posture_monitor.close()
    except Exception as e:
        logger.debug(f"Posture monitor close error: {e}")

    # Stop tray
    if tray_icon:
        try:
            tray_icon.stop()
        except Exception:
            pass

    # Release instance lock
    release_single_instance_lock()

    # Give background threads 1.5s to wind down
    logger.info("Waiting for threads to stop...")
    time.sleep(1.5)

    logger.info("Goodbye! 👾")
    sys.exit(0)  # graceful — NOT os._exit(0)
"""
content = re.sub(r'def cleanup_and_exit\(\):.*?os\._exit\(0\)', new_shutdown, content, flags=re.DOTALL)

# Fix 2E: Calibration non-blocking
new_calibrate = """@app.post("/api/calibrate")
async def api_calibrate():
    global calibrate_requested
    calibration_event.clear()
    calibrate_requested = True

    import asyncio
    # Non-blocking wait — uses asyncio executor so FastAPI stays responsive
    loop = asyncio.get_event_loop()
    success = await loop.run_in_executor(
        None,
        lambda: calibration_event.wait(timeout=6.0)
    )

    if success and calibration_result:
        return {"status": "success", "message": "Posture calibrated successfully"}
    else:
        return {"status": "error", "message": "Calibration failed — make sure your face is visible"}"""
content = re.sub(r'@app\.post\("/api/calibrate"\)\ndef api_calibrate\(\):.*?return \{"status": "error", "message": "Calibration timed out or failed"\}', new_calibrate, content, flags=re.DOTALL)

# Fix 2F: Webcam Loop error handling
webcam_inner_before = """        # 2. Gaze check interval
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
            phone_status = phone_monitor.get_status()"""
webcam_inner_after = """        # 2. Gaze check
        if now - last_gaze_check > gaze_monitor.check_interval:
            last_gaze_check = now
            try:
                status, _, _ = gaze_monitor.process_frame(frame)
                with state_lock:
                    gaze_status = status
            except Exception as e:
                logger.warning(f"Gaze monitor error (frame skipped): {e}")
                with state_lock:
                    gaze_status = "error"

        # 3. Posture check
        if now - last_posture_check > posture_monitor.check_interval:
            last_posture_check = now
            try:
                status, _ = posture_monitor.process_frame(frame)
                with state_lock:
                    posture_status = status
            except Exception as e:
                logger.warning(f"Posture monitor error (frame skipped): {e}")
                with state_lock:
                    posture_status = "error"

        # 4. AI checks — gate to prevent Ollama flooding
        AI_CHECK_INTERVAL = 60  # minimum seconds between Ollama calls
        if now - last_ai_check > AI_CHECK_INTERVAL:
            last_ai_check = now
            try:
                specs_monitor.check_async(frame)
                phone_monitor.check_async(frame)
            except Exception as e:
                logger.warning(f"AI monitor trigger error: {e}")

        with state_lock:
            specs_status = specs_monitor.get_status()
            phone_status = phone_monitor.get_status()"""

content = content.replace("last_posture_check = 0\n", "last_posture_check = 0\n    last_ai_check = 0\n")
content = content.replace(webcam_inner_before, webcam_inner_after)

# Fix 2G: WebSocket Thread Safety & 2H: Stats Caching
content = content.replace("websocket_clients = []", "from collections import deque\nwebsocket_clients = deque()")

ws_endpoint = """@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        try:
            websocket_clients.remove(websocket)
        except ValueError:
            pass"""
content = re.sub(r'@app\.websocket\("/ws"\).*?websocket_clients\.remove\(websocket\)', ws_endpoint, content, flags=re.DOTALL)

stats_cache = """_stats_cache = {}
_stats_cache_time = 0.0

def load_stats_cached() -> dict:
    global _stats_cache, _stats_cache_time
    now = time.monotonic()
    if now - _stats_cache_time > 5.0:  # refresh every 5 seconds
        try:
            _stats_cache = load_stats()
            _stats_cache_time = now
        except Exception as e:
            logger.warning(f"Stats load error: {e}")
    return _stats_cache"""
content = content.replace("# Helper to read recent log lines", stats_cache + "\n\n# Helper to read recent log lines")

broadcast_old = """    async def broadcast():
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
            await asyncio.sleep(1)"""

broadcast_new = """    async def broadcast():
        global last_sound_trigger, active_alert
        while running:
            clients = list(websocket_clients)  # snapshot to avoid mutation during iteration
            if clients:
                with state_lock:
                    payload = {
                        "session": session_manager.get_status(),
                        "gaze": gaze_status,
                        "posture": posture_status,
                        "specs": specs_status,
                        "phone": phone_status,
                        "ollama_available": _ollama_available,
                        "stats": load_stats_cached(),  # cached version (see below)
                        "sound_trigger": last_sound_trigger,
                        "active_alert": active_alert,
                        "logs": get_recent_log_lines(),
                        "port": API_PORT,
                    }
                    last_sound_trigger = None

                dead_clients = []
                for client in clients:
                    try:
                        await client.send_json(payload)
                    except Exception:
                        dead_clients.append(client)

                for dead in dead_clients:
                    try:
                        websocket_clients.remove(dead)
                    except ValueError:
                        pass

            await asyncio.sleep(1)"""
content = content.replace(broadcast_old, broadcast_new)


# Fix 2I: Ollama Health Check
ollama_check = """_ollama_available = False

def check_ollama() -> bool:
    import requests
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=2.0)
        return r.status_code == 200
    except Exception:
        return False

def refresh_ollama_status():
    \"\"\"Call periodically from the broadcast loop.\"\"\"
    global _ollama_available
    _ollama_available = check_ollama()
"""
content = content.replace("latest_frame_lock = threading.Lock()", "latest_frame_lock = threading.Lock()\n" + ollama_check)

content = content.replace("    api_thread.start()", "    api_thread.start()\n\n    global _ollama_available\n    _ollama_available = check_ollama()\n    if not _ollama_available:\n        logger.warning('Ollama not running — glasses/phone monitors disabled')")


# Fix 2J: Health Endpoint
health_code = """import time as _time
_start_time = _time.time()

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "uptime_seconds": round(_time.time() - _start_time, 1),
        "ollama_available": _ollama_available,
        "webcam_active": latest_frame is not None,
    }
"""
content = content.replace("# Serve Web UI files", health_code + "\n# Serve Web UI files")

# Fix 4B: Python check
py_check = """import sys
if sys.version_info >= (3, 12):
    print("ERROR: PixelPal requires Python 3.9–3.11.")
    print(f"       You are running Python {sys.version_info.major}.{sys.version_info.minor}.")
    print("       MediaPipe does not support Python 3.12+.")
    print("       Download Python 3.11 from https://python.org/downloads/")
    input("Press Enter to exit...")
    sys.exit(1)
"""
content = py_check + "\n" + content

with open("main.py", "w", encoding="utf-8") as f:
    f.write(content)
