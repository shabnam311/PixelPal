import re

# PATCH index.css
with open("ui/web/index.css", "r", encoding="utf-8") as f:
    css = f.read()

# 3A - CSS Container Fix
container_css = """/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
    width: 100%; height: 100%;
    background: #0d1117;
    overflow: hidden;
    font-family: 'Press Start 2P', monospace;
    color: #e6edf3;
}

/* Center the app in whatever window size PyWebView gives us */
body {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background:
        radial-gradient(ellipse at 15% 25%, rgba(26,5,51,0.8) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 75%, rgba(10,31,61,0.8) 0%, transparent 50%),
        #0d1117;
}

.app-container {
    width: 520px;
    max-width: 520px;
    min-height: 100vh;
    position: relative;
    z-index: 1;
}

/* CRT overlay */
body::after {
    content: '';
    position: fixed; inset: 0;
    pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(
        0deg,
        transparent, transparent 3px,
        rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
    );
}
"""
css = container_css + "\n" + css

# 3B - Pet Animations
pet_css = """/* Pet container */
.pet-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0 16px;
}

/* Pet sprite — CSS pixel art using the round face */
.pet-sprite {
    width: 160px;
    height: 160px;
    position: relative;
    image-rendering: pixelated;
    animation: petFloat 2.8s ease-in-out infinite;
    filter: drop-shadow(0 0 12px #39d353) drop-shadow(0 0 28px #39d35544);
    transition: filter 0.5s ease;
}

/* If using an <img> or <canvas> for the sprite */
.pet-sprite img {
    width: 100%; height: 100%;
    image-rendering: pixelated;
}

/* Float animation */
@keyframes petFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
}

/* Pet shadow that shrinks as pet rises */
.pet-shadow {
    width: 80px; height: 16px;
    background: radial-gradient(ellipse, rgba(57,211,83,0.2), transparent);
    border-radius: 50%;
    animation: shadowPulse 2.8s ease-in-out infinite;
    margin-top: -8px;
}

@keyframes shadowPulse {
    0%, 100% { transform: scaleX(1); opacity: 0.4; }
    50% { transform: scaleX(0.65); opacity: 0.15; }
}

/* State variants */
.pet-sprite.warning {
    filter: drop-shadow(0 0 12px #ff4757) drop-shadow(0 0 28px #ff475744);
    animation: petFloat 2.8s ease-in-out infinite, petShake 0.3s ease infinite;
}

.pet-sprite.break {
    filter: drop-shadow(0 0 12px #74b9ff) drop-shadow(0 0 28px #74b9ff44);
    animation: petFloat 4s ease-in-out infinite;
}

@keyframes petShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px) rotate(-1deg); }
    75% { transform: translateX(3px) rotate(1deg); }
}

/* Violation flash on the whole screen */
@keyframes violationFlash {
    0%, 100% { box-shadow: inset 0 0 0 rgba(255,0,0,0); }
    50% { box-shadow: inset 0 0 80px rgba(255,50,50,0.45); }
}
.app-container.violation {
    animation: violationFlash 0.7s ease 3;
}
"""
css += "\n" + pet_css

# 3C - Timer Display CSS
timer_css_old = r"\.timer-display \{.*?\}"
timer_css_new = """.timer-display {
    font-size: 68px;
    font-family: 'Orbitron', 'Press Start 2P', monospace;
    font-weight: 700;
    letter-spacing: 6px;
    color: #39d353;
    text-shadow:
        0 0 10px #39d353,
        0 0 30px #39d35566,
        0 0 60px #39d35522;
    line-height: 1;
    text-align: center;
    padding: 8px 0;
    transition: color 0.5s ease, text-shadow 0.5s ease;
}

.timer-display.break-mode {
    color: #74b9ff;
    text-shadow:
        0 0 10px #74b9ff,
        0 0 30px #74b9ff66;
}

.timer-label {
    font-family: 'Press Start 2P';
    font-size: 9px;
    color: #39d35388;
    letter-spacing: 4px;
    text-align: center;
    margin-top: 4px;
}"""
# In case old timer display css doesn't exist or isn't replaced cleanly, we just append it
css += "\n" + timer_css_new

# 3D - Monitor Cards Grid CSS
monitor_css = """
.monitors-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 16px;
}

.monitor-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    padding: 12px;
    position: relative;
    transition: border-color 0.3s, background 0.3s;
}

.monitor-card:hover {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.14);
}

.monitor-card.status-ok { border-color: #39d35355; }
.monitor-card.status-warning { border-color: #ffd70077; }
.monitor-card.status-violation { border-color: #ff475777; }

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.monitor-icon { font-size: 16px; }

.monitor-label {
    font-family: 'Press Start 2P';
    font-size: 8px;
    color: #e6edf3;
    flex: 1;
}

.led {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #333;
    transition: background 0.3s, box-shadow 0.3s;
}

.led.ok { background: #39d353; box-shadow: 0 0 6px #39d353; }
.led.warning { background: #ffd700; box-shadow: 0 0 6px #ffd700; }
.led.violation { background: #ff4757; box-shadow: 0 0 6px #ff4757; animation: ledPulse 0.8s ease infinite; }
.led.active { animation: ledPulse 1.5s ease-in-out infinite; }

@keyframes ledPulse {
    0%, 100% { box-shadow: 0 0 4px currentColor; }
    50% { box-shadow: 0 0 12px currentColor, 0 0 20px currentColor; }
}

.monitor-status {
    font-family: 'Press Start 2P';
    font-size: 7px;
    color: #666;
    transition: color 0.3s;
}

.monitor-status.ok { color: #39d353; }
.monitor-status.warning { color: #ffd700; }
.monitor-status.violation { color: #ff4757; }

.ai-badge {
    position: absolute; top: 8px; right: 8px;
    font-family: 'Press Start 2P'; font-size: 6px;
    color: #9b59b644; border: 1px solid #9b59b633;
    border-radius: 3px; padding: 2px 4px;
}

.ai-badge.offline { color: #ff475766; border-color: #ff475744; }
"""
css += "\n" + monitor_css

# 3F - Log Console Styling
log_css = """
.log-section {
    padding: 0 16px 12px;
}

#log-console {
    font-family: 'VT323', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #39d353;
    background: rgba(0,255,0,0.018);
    border: 1px solid rgba(57,211,83,0.12);
    border-radius: 4px;
    padding: 10px 12px;
    height: 130px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #39d35344 transparent;
}

#log-console::-webkit-scrollbar { width: 4px; }
#log-console::-webkit-scrollbar-thumb {
    background: #39d35344;
    border-radius: 2px;
}
"""
css += "\n" + log_css

# 3G - Connecting Overlay HTML
connecting_css = """
.connecting-overlay {
    position: fixed; inset: 0;
    background: #0d1117;
    display: flex; align-items: center; justify-content: center;
    z-index: 10000;
    transition: opacity 0.5s;
}

.connecting-overlay.hidden {
    opacity: 0; pointer-events: none;
}

.connecting-text {
    font-family: 'Press Start 2P';
    font-size: 11px;
    color: #39d353;
    text-align: center;
    margin-top: 16px;
}

.connecting-dots span {
    animation: dotBlink 1.2s ease-in-out infinite;
    color: #39d353;
    font-size: 24px;
}

.connecting-dots span:nth-child(2) { animation-delay: 0.4s; }
.connecting-dots span:nth-child(3) { animation-delay: 0.8s; }

@keyframes dotBlink {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
}
"""
css += "\n" + connecting_css

with open("ui/web/index.css", "w", encoding="utf-8") as f:
    f.write(css)


# PATCH app.js (3E - WebSocket Reconnection)
app_js_new = """// app.js — WebSocket with reconnection

const STATUS_LABELS = {
    'ok': '✓ OK',
    'not_detected': 'SCANNING',
    'looking_away': '⚠ LOOK AHEAD',
    'uncalibrated': 'NEEDS SETUP',
    'uncalibrated_posture': 'CALIBRATE ME',
    'unknown': 'AI CHECKING',
    'violation': '✗ ALERT',
    'warning': '⚠ WARNING',
    'error': '! ERROR',
    'disabled': '— DISABLED',
};

let ws = null;
let wsReconnectTimer = null;
let lastMessageTime = Date.now();
let backendPort = 8000;

function connectWS() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(`ws://localhost:${backendPort}/ws`);

    ws.onopen = () => {
        console.log('WS connected');
        clearTimeout(wsReconnectTimer);
        document.querySelector('.connecting-overlay')?.classList.add('hidden');
    };

    ws.onmessage = (e) => {
        lastMessageTime = Date.now();
        try {
            const data = JSON.parse(e.data);
            updateUI(data);
        } catch (err) {
            console.error('Bad WS message:', err);
        }
    };

    ws.onclose = () => {
        console.log('WS closed — reconnecting in 2s');
        wsReconnectTimer = setTimeout(connectWS, 2000);
    };

    ws.onerror = () => ws.close();
}

// Heartbeat check — show "backend offline" after 5s of silence
setInterval(() => {
    if (Date.now() - lastMessageTime > 5000) {
        showBackendOffline();
    }
}, 1000);

function showBackendOffline() {
    const overlay = document.querySelector('.connecting-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.querySelector('.connecting-text').textContent = 'BACKEND OFFLINE';
    }
}

function updateUI(data) {
    // Session
    updateTimer(data.session);
    if (data.session) {
        updateHearts(data.session.hearts !== undefined ? data.session.hearts : 5);
        updateXP(data.session.xp !== undefined ? data.session.xp : 0, data.session.level !== undefined ? data.session.level : 1);
    }

    // Monitors
    updateMonitorCard('gaze',    data.gaze,    data.ollama_available);
    updateMonitorCard('posture', data.posture, data.ollama_available);
    updateMonitorCard('glasses', data.specs,   data.ollama_available);
    updateMonitorCard('phone',   data.phone,   data.ollama_available);

    // Violation flash
    if (['violation'].includes(data.gaze) || ['violation'].includes(data.phone)) {
        triggerViolationFlash();
    }

    // Sounds
    if (data.sound_trigger) {
        if(typeof playChiptune === 'function') {
            playChiptune(data.sound_trigger);
        }
    }

    // Logs
    if (data.logs?.length) {
        renderLogs(data.logs);
    }

    // Ollama offline badge
    const aiBadges = document.querySelectorAll('.ai-badge');
    aiBadges.forEach(b => b.classList.toggle('offline', !data.ollama_available));
}

function updateTimer(sessionData) {
    if(!sessionData) return;
    const timerDisplay = document.querySelector('.timer-display');
    if(timerDisplay) {
        let mins = Math.floor(sessionData.time_remaining_seconds / 60);
        let secs = sessionData.time_remaining_seconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if(sessionData.state === 'break') {
            timerDisplay.classList.add('break-mode');
        } else {
            timerDisplay.classList.remove('break-mode');
        }
    }
}

function updateHearts(hearts) {
    // implementation hook
}

function updateXP(xp, level) {
    // implementation hook
}

function updateMonitorCard(name, status, ollamaAvailable) {
    const card = document.getElementById(`card-${name}`);
    const led = document.getElementById(`led-${name}`);
    const statusEl = document.getElementById(`status-${name}`);
    if (!card || !led || !statusEl) return;

    const label = STATUS_LABELS[status] || (status ?? 'STANDBY').toUpperCase().replace('_', ' ');

    // Update status text
    statusEl.textContent = label;
    statusEl.className = `monitor-status ${status === 'ok' ? 'ok' : status === 'violation' ? 'violation' : status === 'warning' ? 'warning' : ''}`;

    // Update card border
    card.className = `monitor-card ${status === 'ok' ? 'status-ok' : status === 'violation' ? 'status-violation' : status === 'warning' ? 'status-warning' : ''}`;

    // Update LED
    led.className = `led ${status === 'ok' ? 'ok active' : status === 'violation' ? 'violation' : status === 'warning' ? 'warning active' : ''}`;
}

function triggerViolationFlash() {
    const app = document.querySelector('.app-container');
    if(!app) return;
    app.classList.remove('violation');
    void app.offsetWidth; // force reflow
    app.classList.add('violation');
    setTimeout(() => app.classList.remove('violation'), 2500);
}

function renderLogs(lines) {
    const logEl = document.getElementById('log-console');
    if (!logEl) return;
    logEl.innerHTML = lines.map(line => {
        const isViolation = line.includes('WARN') || line.includes('VIOLATION') || line.includes('⚠');
        const isGood = line.includes('✓') || line.includes('OK') || line.includes('COMPLETE');
        const color = isViolation ? '#ff4757' : isGood ? '#39d353' : '#74b9ffaa';
        return `<div style="color:${color}">${escapeHtml(line)}</div>`;
    }).join('');
    logEl.scrollTop = logEl.scrollHeight;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Connect on load
window.addEventListener('DOMContentLoaded', connectWS);
"""
with open("ui/web/app.js", "w", encoding="utf-8") as f:
    f.write(app_js_new)

# PATCH index.html
with open("ui/web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Add Orbitron font
if 'Orbitron' not in html:
    html = html.replace("</title>", "</title>\n    <link href=\"https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Press+Start+2P&family=VT323&display=swap\" rel=\"stylesheet\">")

# Add connecting overlay
connecting_html = """
<div class="connecting-overlay" id="connecting-overlay">
    <div class="connecting-content">
        <div class="pet-sprite idle-large"></div>
        <div class="connecting-text">LOADING PIXELPAL...</div>
        <div class="connecting-dots">
            <span>.</span><span>.</span><span>.</span>
        </div>
    </div>
</div>
</body>"""
if 'connecting-overlay' not in html:
    html = html.replace("</body>", connecting_html)

# Add monitor card grid
monitors_html = """
<div class="monitors-grid">
    <!-- Gaze -->
    <div class="monitor-card" id="card-gaze">
        <div class="card-header">
            <span class="monitor-icon">👀</span>
            <span class="monitor-label">GAZE</span>
            <span class="led" id="led-gaze"></span>
        </div>
        <div class="monitor-status" id="status-gaze">STANDBY</div>
    </div>
    <!-- Posture -->
    <div class="monitor-card" id="card-posture">
        <div class="card-header">
            <span class="monitor-icon">🧍</span>
            <span class="monitor-label">POSTURE</span>
            <span class="led" id="led-posture"></span>
        </div>
        <div class="monitor-status" id="status-posture">STANDBY</div>
    </div>
    <!-- Glasses -->
    <div class="monitor-card" id="card-glasses">
        <div class="card-header">
            <span class="monitor-icon">👓</span>
            <span class="monitor-label">GLASSES</span>
            <span class="led" id="led-glasses"></span>
        </div>
        <div class="monitor-status" id="status-glasses">STANDBY</div>
        <div class="ai-badge" id="ai-glasses">AI</div>
    </div>
    <!-- Phone -->
    <div class="monitor-card" id="card-phone">
        <div class="card-header">
            <span class="monitor-icon">📵</span>
            <span class="monitor-label">PHONE</span>
            <span class="led" id="led-phone"></span>
        </div>
        <div class="monitor-status" id="status-phone">STANDBY</div>
        <div class="ai-badge" id="ai-phone">AI</div>
    </div>
</div>
"""
# Assuming there is a place for monitors
html = re.sub(r'<div class="monitors-container">.*?</div>', monitors_html, html, flags=re.DOTALL)
if "monitors-grid" not in html:
    # If the old regex didn't match, just append it before log-console or body end
    html = html.replace('<div id="log-console"></div>', monitors_html + '\n<div id="log-console"></div>')

with open("ui/web/index.html", "w", encoding="utf-8") as f:
    f.write(html)
