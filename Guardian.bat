@echo off
title Guardian Launcher 👾
echo =========================================
echo  👾 BOOTING GUARDIAN FOCUS COMPANION...  
echo =========================================
echo.

:: Ensure we are in the correct workspace directory
cd /d "%~dp0"

:: Check for py launcher or python
set PYTHON_CMD=
where py >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python was not found in your system PATH.
    echo Please install Python 3.8+ and check "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

:: Run app in standard GUI mode
%PYTHON_CMD% main.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Guardian exited with code %errorlevel%.
    echo Make sure you installed all requirements by running:
    echo %PYTHON_CMD% -m pip install -r requirements.txt
    echo.
    pause
)
