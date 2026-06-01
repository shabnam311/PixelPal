<div align="center">

# 👾 PIXELPAL 👾
### *The Ultimate Cyberpunk Productivity Companion*

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Webview](https://img.shields.io/badge/PyWebView-FF2D78?style=for-the-badge&logo=windows&logoColor=white)](https://pywebview.flowrl.com/)
[![Local AI](https://img.shields.io/badge/100%25_Local-AI-00FF94?style=for-the-badge&logo=ai&logoColor=black)](#)

*Your personal Ghibli-inspired digital pet that uses local AI to fix your posture, save your eyes, and crush your distractions.*

[Download .EXE Release](#) | [Features](#features) | [How it Works](#architecture)

<img src="https://i.pinimg.com/736x/24/44/61/244461086017795919.jpg" width="400" style="border-radius:10px; box-shadow: 0 0 20px #00FF94;">

</div>

---

## 🚀 WHY PIXELPAL?

Most productivity apps just give you a timer. PixelPal gives you a **companion**. 

Built with a **dark-neon cyberpunk pixel-art aesthetic**, PixelPal watches your physical habits in real-time. If you slouch, look at your phone, or take off your computer glasses, your PixelPal reacts, sweats, and loses health. Keep focused, and you both level up.

**🔥 100% OFFLINE. 0% CLOUD STORAGE. CAMERA FOOTAGE IS NEVER SAVED.**  
*Highly memory-efficient and battery-friendly architecture.*

---

## 🌟 CORE FEATURES

### 🎮 The Ultimate Retro Interface
- **Dynamic Themes**: Switch instantly between *Neon Green, Synthwave Purple, Cyberpunk Yellow,* and *Arcade Red*.
- **The PixelPal Pet**: A responsive pixel-art companion that breathes, bobs, dances, and panics based on your behavior.
- **Classic HUD**: Zelda-style heart containers, chunky JRPG experience bars, and a CRT scanline toggle.
- **Pixel Terminal**: A fully functional, color-coded ANSI terminal log that tracks your session milestones in real-time.

### 🧠 On-Device AI Monitors
*No footage saved. No data collected. Processing happens in milliseconds.*

| Monitor | Technology | What it Does |
| :--- | :--- | :--- |
| **👀 Gaze** | MediaPipe Face Mesh | Detects if you're staring off into space. |
| **🧍 Posture** | MediaPipe Pose | Calibrates to your body and warns if you slouch. |
| **👓 Specs** | LLaVA Vision Model | Ensures you wear your blue-light blockers. |
| **📱 Phone** | LLaVA Vision Model | Instantly detects if you pick up your phone. |

### ⚡ Gamified Productivity
- **Pomodoro & Deep Focus**: Custom session durations.
- **Level Up!**: Hit your goals to trigger confetti celebrations and chiptune level-up sounds.
- **Toast Notifications**: Non-intrusive, cyberpunk-styled slide-in alerts.
- **Quiet Mode**: Slide-out settings drawer to mute alarms and pause monitors on the fly.

---

## 🛠️ INSTALLATION & RUNNING

No command prompt required. No "npm install". Just run the app!

### Option 1: The `.EXE` (Recommended)
1. Download `PixelPal.exe` from the latest release.
2. Double click it. That's it. 
*(No Python required, fully portable).*

### Option 2: Running from Source
If you want to tweak the neon CSS or add features:
```bash
# Clone the repo
git clone https://github.com/shabnam311/PixelPal.git

# Install dependencies (only needed once)
pip install -r requirements.txt

# Run the app
python main.py
```

---

## 🏗️ ARCHITECTURE (For Nerds)

PixelPal is designed to be **lightweight** and **memory-efficient**.

- **Backend**: `FastAPI` handles the local WebSocket server and asynchronous AI processing.
- **Frontend**: Vanilla `HTML/CSS/JS` (No heavy React/Electron bloat here!) powered by `PyWebView` for a native Windows borderless feel.
- **AI Engine**: Frames are captured by `OpenCV`, downscaled for memory efficiency, fed directly into RAM for `MediaPipe`/`Ollama`, and immediately discarded.

---

<div align="center">
  <i>Stay focused, protect your eyes, and keep your PixelPal happy.</i>
  <br>
  👾 👾 👾
</div>
