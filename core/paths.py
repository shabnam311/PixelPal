# core/paths.py
import os
import sys

def get_app_data_dir() -> str:
    """Returns %APPDATA%/PixelPal on Windows, ~/.pixelpal elsewhere."""
    if os.name == "nt":
        base = os.environ.get("APPDATA", os.path.expanduser("~"))
    else:
        base = os.path.expanduser("~")
    path = os.path.join(base, "PixelPal")
    os.makedirs(path, exist_ok=True)
    return path

def get_resource_path(relative_path: str) -> str:
    """Get path to bundled resource (works in dev and PyInstaller)."""
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    # Go up one level since core/ is a subdirectory
    root = os.path.dirname(base) if os.path.basename(base) == "core" else base
    return os.path.join(root, relative_path)

APP_DATA_DIR = get_app_data_dir()
LOG_DIR      = os.path.join(APP_DATA_DIR, "logs")
STATS_FILE   = os.path.join(APP_DATA_DIR, "stats.json")
CONFIG_FILE  = get_resource_path("config.json")
LOCK_FILE    = os.path.join(os.environ.get("TEMP", APP_DATA_DIR), "pixelpal.lock")

# Ensure directories exist
os.makedirs(LOG_DIR, exist_ok=True)
