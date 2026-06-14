@echo off
echo Starting PixelPal...
if not exist venv\Scripts\activate.bat (
    echo [ERROR] Virtual environment not found!
    echo Please run install.bat first.
    pause
    exit /b
)
call venv\Scripts\activate.bat
python main.py
