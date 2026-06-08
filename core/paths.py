# core/paths.py
"""Centralised path management for PixelPal. All data is stored relative to the
application root directory for portability."""
import os
import sys

def get_app_root() -> str:
    """Returns the root directory of the PixelPal application.
    In PyInstaller mode: directory containing the .exe
    In dev mode: directory containing main.py (project root)
    """
    if getattr(sys, 'frozen', False):
        # Running as compiled exe
        return os.path.dirname(sys.executable)
    else:
        # Running as script — go up from core/ to project root
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_resource_path(relative_path: str) -> str:
    """Get path to bundled resource (works in dev and PyInstaller)."""
    base = getattr(sys, '_MEIPASS', get_app_root())
    return os.path.join(base, relative_path)

APP_ROOT    = get_app_root()
DATA_DIR    = os.path.join(APP_ROOT, "data")
LOG_DIR     = os.path.join(DATA_DIR, "logs")
STATS_FILE  = os.path.join(DATA_DIR, "stats.json")
CONFIG_FILE = os.path.join(APP_ROOT, "config.json")
LOCK_FILE   = os.path.join(DATA_DIR, "pixelpal.lock")
BASELINE_FILE = os.path.join(DATA_DIR, "posture_baseline.json")

# Ensure data directories exist on import
os.makedirs(LOG_DIR, exist_ok=True)
