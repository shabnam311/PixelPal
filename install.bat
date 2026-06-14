@echo off
echo ========================================
echo 👾 PIXELPAL — INSTALLATION
echo ========================================

echo 1. Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b
)

echo 2. Creating virtual environment...
if not exist venv (
    python -m venv venv
)

echo 3. Activating venv and installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

echo 4. Creating data directories...
mkdir data\logs 2>nul
mkdir data\stats 2>nul
mkdir data\calibration 2>nul
echo.> data\logs\.gitkeep
echo.> data\stats\.gitkeep
echo.> data\calibration\.gitkeep

echo 5. Checking Ollama...
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is installed.
) else (
    echo [WARNING] Ollama not found. AI specs/phone monitors will be disabled.
)

echo.
echo ========================================
echo [SUCCESS] Installation complete!
echo You can now launch the app using run.bat
echo ========================================
pause
