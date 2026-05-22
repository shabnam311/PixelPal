# 👾 PIXELPAL
**Your Pixel-Art Screen Habit Monitor**

PIXELPAL is a 100% local, offline, desktop application designed to keep you focused, maintain healthy posture, and prevent digital eye strain. Built with a gamified retro "Nintendo DS" aesthetic, it acts as a digital pet that actively monitors your physical habits in real-time.

---

## 🌟 Core Features

### 1. Gamified Visual Interface
- **The PixelPal Pet**: A pixel-art, Ghibli-inspired "Totoro" companion that lives on your screen. It visually reacts to your behavior:
  - **Happy State**: Bobs gently, wags tail, and displays a neon green glow when you are focused.
  - **Warning State**: Starts sweating and shaking frantically if it detects bad habits.
  - **Sleep State**: Snoozes with pixel "Z" bubbles during scheduled breaks.
- **Zelda-style Heart Containers**: Your session health is represented by 5 chunky pixel hearts. Bad habits deplete your hearts, and maintaining focus slowly regenerates them.
- **Retro Console Layout**: The UI mimics a classic dual-screen handheld console, complete with glowing LED strips, CRT scanlines, screen curvature, physical D-Pad tabs, and chunky A/B interaction buttons.
- **Chiptune Audio**: Built-in Web Audio API synthesizers that play retro arpeggios, click sounds, and level-up jingles.

### 2. AI-Powered Habit Monitors
PixelPal uses your webcam and advanced local AI models to track 4 distinct physical habits. **All processing happens locally on your machine—no data is sent to the cloud.**

- **👀 Gaze Monitor (MediaPipe Face Mesh)**
  - Calculates horizontal and vertical head-pose angles.
  - Warns you if you are looking away from your monitor (e.g., staring into space) for extended periods during a focus session.
- **🧍 Posture Monitor (MediaPipe Pose)**
  - Uses a calibration system to capture your baseline "healthy" sitting position.
  - Measures your nose-to-shoulder vertical distance to detect severe slouching or leaning unhealthily close to the screen.
- **👓 Specs Monitor (Ollama + LLaVA Vision Model)**
  - Uses local Generative AI to analyze frames every 15 seconds.
  - Detects whether you are wearing your blue-light blocking glasses. If not, PixelPal gets upset!
- **📱 Phone Monitor (Ollama + LLaVA Vision Model)**
  - Scans for smartphone usage in your hands.
  - Instantly flags if you get distracted by scrolling on your phone.

### 3. Session & Productivity Management
- **Pomodoro Timer**: Standard 25-minute focus blocks followed by 5-minute breaks.
- **Custom Focus Mode**: Set an exact custom timer (e.g., 45 minutes) for deep work.
- **Watch Mode**: Runs the AI monitors passively in the background without a strict timer constraint.
- **Log System**: A typewriter-style retro console log that keeps a running history of your violations and achievements.

---

## ⚙️ How it Works (Architecture)

PIXELPAL is built using a modern, multi-threaded tech stack to ensure high performance while rendering a heavy frontend:

1. **The Brain (Python / FastAPI)**
   - A multithreaded Python backend runs the OpenCV webcam capture loop and feeds frames to the MediaPipe and Ollama models.
   - It acts as a local FastAPI web server (`localhost:8000`), maintaining state and enforcing warning logic/cooldowns.
2. **The Nerves (WebSockets)**
   - The backend pushes state updates (timer ticks, eye movement, heart depletion, alerts) to the UI 10+ times a second via a high-speed WebSocket connection.
3. **The Face (HTML/CSS/JS + PyWebView)**
   - The UI is a beautifully crafted vanilla web app (`index.html`, `index.css`, `app.js`).
   - `PyWebView` wraps this local web server in a native Windows borderless container, making it feel like a standard `.exe` desktop application.
4. **Standalone Packaging (PyInstaller)**
   - The entire Python environment, AI dependencies, and web assets are bundled into a single `PixelPal.exe` file, meaning you don't even need Python installed to run it!

---

## 🛠️ Calibration & Setup

1. **Booting Up**: Launch `PixelPal.exe`.
2. **Postural Calibration**: Sit up straight, put on your glasses, look directly at the screen, and hit the **CALIBRATE** button. PixelPal takes a snapshot of your baseline posture to compare against during the session.
3. **Start Focusing**: Hit **POMODORO** or **START** to begin. The AI monitors will immediately start tracking your behavior in the background.

*Stay focused, protect your eyes, and keep your PixelPal happy!*
