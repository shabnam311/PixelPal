# build_app.py — complete replacement
import os
import sys
import subprocess
import argparse

def check_prerequisites():
    """Verify all required files exist before building."""
    required = [
        ("icon.ico", "Run `python icon.py` first to generate the icon"),
        ("main.py", "main.py not found — wrong directory?"),
        ("config.json", "config.json not found"),
        ("ui/web/index.html", "ui/web/index.html not found"),
        ("requirements.txt", "requirements.txt not found"),
    ]
    ok = True
    for path, msg in required:
        if not os.path.exists(path):
            print(f"[ERROR] Missing: {path}")
            print(f"        Fix: {msg}")
            ok = False
    return ok

def install_pyinstaller():
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

def build(onefile=False, clean=False):
    if os.name != "nt":
        print("ERROR: PixelPal only builds on Windows (PyWebView + MediaPipe requirement).")
        sys.exit(1)

    if not check_prerequisites():
        sys.exit(1)

    install_pyinstaller()

    sep = ";"  # Windows path separator for PyInstaller

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconsole",
        "--onefile" if onefile else "--onedir",
        "--name", "PixelPal",
        "--icon", "icon.ico",

        # Bundle the web UI
        "--add-data", f"ui/web{sep}ui/web",
        "--add-data", f"config.json{sep}.",
        "--add-data", f"icon.ico{sep}.",

        # Collect all MediaPipe files (models + code)
        "--collect-all", "mediapipe",
        "--collect-data", "mediapipe",

        # Collect OpenCV
        "--collect-all", "cv2",

        # Collect PyWebView (includes native .NET DLLs on Windows)
        "--collect-all", "webview",

        # FastAPI / Starlette dynamic imports
        "--hidden-import", "uvicorn.protocols.http.h11_impl",
        "--hidden-import", "uvicorn.protocols.websockets.websockets_impl",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "starlette.routing",
        "--hidden-import", "starlette.middleware",
        "--hidden-import", "starlette.responses",
        "--hidden-import", "starlette.staticfiles",
        "--hidden-import", "fastapi",
        "--hidden-import", "anyio",
        "--hidden-import", "anyio._backends._asyncio",

        # PyWebView Windows backend
        "--hidden-import", "webview.platforms.winforms",
        "--hidden-import", "clr",

        # Other deps
        "--hidden-import", "pystray",
        "--hidden-import", "PIL._tkinter_finder",

        "main.py"
    ]

    if clean:
        cmd.insert(3, "--clean")

    print(f"\n{'='*50}")
    print(f"Building PixelPal ({'onefile' if onefile else 'onedir'} mode)")
    print(f"This will take 5–15 minutes (MediaPipe bundling).")
    print(f"DO NOT close this window.")
    print(f"{'='*50}\n")

    try:
        subprocess.check_call(cmd)
        output_path = "dist/PixelPal.exe" if onefile else "dist/PixelPal/PixelPal.exe"
        print(f"\n{'='*50}")
        print(f"[SUCCESS] Build complete!")
        print(f"Executable: {os.path.abspath(output_path)}")
        print(f"{'='*50}\n")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Build failed (exit code {e.returncode})")
        print("Common fixes:")
        print("  - Run: pip install -r requirements.txt")
        print("  - Delete build/ and dist/ folders, then retry with --clean")
        print("  - Make sure Python 3.9-3.11 is being used (not 3.12+)")
        sys.exit(e.returncode)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build PixelPal.exe")
    parser.add_argument("--onefile", action="store_true",
                        help="Bundle into single .exe (slower startup, easier to share)")
    parser.add_argument("--clean", action="store_true",
                        help="Delete previous build cache first")
    args = parser.parse_args()
    build(onefile=args.onefile, clean=args.clean)
