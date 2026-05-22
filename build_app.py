import os
import sys
import subprocess

def install_and_import(package):
    try:
        __import__(package)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def build():
    print("Checking dependencies...")
    install_and_import("PyInstaller")
    
    # Define PyInstaller arguments
    # Semicolon is used for Windows, colon for Linux/Mac
    sep = ";" if os.name == "nt" else ":"
    
    # We bundle the web UI directory and the config.json
    add_data_ui = f"ui/web{sep}ui/web"
    add_data_config = f"config.json{sep}."
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--clean",
        "--noconsole",
        "--onefile",
        "--name", "PixelPal",
        "--add-data", add_data_ui,
        "--add-data", add_data_config,
        "--collect-all", "mediapipe",
        # Hidden imports to ensure FastAPI/Uvicorn/Websockets are bundled correctly
        "--hidden-import", "uvicorn.protocols.http.h11_impl",
        "--hidden-import", "uvicorn.protocols.websockets.websockets_impl",
        "--hidden-import", "uvicorn.lifespan.on",
        "main.py"
    ]
    
    print(f"Running command: {' '.join(cmd)}")
    try:
        subprocess.check_call(cmd)
        print("\n=============================================")
        print("[SUCCESS] PixelPal successfully built!")
        print(f"Executable is located in: {os.path.abspath('dist/PixelPal.exe')}")
        print("=============================================")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Build failed with exit code {e.returncode}")
        sys.exit(e.returncode)

if __name__ == "__main__":
    build()
