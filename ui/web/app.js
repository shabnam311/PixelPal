// =============================================
// PIXELPAL — Clean App.js (Complete Rewrite)
// =============================================

// ===== AUDIO SYSTEM =====
let audioCtx = null;
let soundEnabled = localStorage.getItem('pp_sound') !== 'false';

function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio not available');
    }
}

function playTone(freq, duration, type = 'square', volume = 0.08) {
    if (!audioCtx || !soundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {}
}

function playClickSound() { playTone(200, 0.05); }
function playWarningSound() {
    if (!audioCtx || !soundEnabled) return;
    const now = audioCtx.currentTime;
    [440, 880].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.05, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.15);
    });
}
function playAlertSound() {
    if (!audioCtx || !soundEnabled) return;
    const now = audioCtx.currentTime;
    [261.63, 329.63, 392, 329.63, 261.63].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        const t = now + i * 0.1;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    });
}
function playLevelUpSound() {
    if (!audioCtx || !soundEnabled) return;
    const now = audioCtx.currentTime;
    [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        const t = now + i * 0.08;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.start(t); osc.stop(t + 0.8);
    });
}

// ===== BOOT SEQUENCE =====
const bootOverlay = document.getElementById('audio-unlock-overlay');
if (bootOverlay) {
    bootOverlay.addEventListener('click', function onBootClick() {
        bootOverlay.removeEventListener('click', onBootClick); // Prevent multiple clicks
        initAudio();
        
        const prompt = document.getElementById('boot-prompt-msg');
        if (prompt) prompt.style.display = 'none';
        
        const linesContainer = document.getElementById('boot-lines');
        if (linesContainer) {
            const bootText = [
                "PIXELOS v1.0",
                "Copyright (c) 1985-2024 PixelPal Inc.",
                "BIOS Date 06/14/24 10:00:00 Ver 1.00",
                "CPU: Quantum Processor @ 4.2GHz",
                "Memory Test: 640K OK",
                "Initializing Sensors...",
                "Loading UI Modules...",
                "Boot Complete. Welcome!"
            ];
            
            let i = 0;
            bootOverlay.style.pointerEvents = 'none';
            playLevelUpSound();
            
            const interval = setInterval(() => {
                if (i < bootText.length) {
                    const line = document.createElement('div');
                    line.className = 'boot-line';
                    line.textContent = bootText[i];
                    linesContainer.appendChild(line);
                    i++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        bootOverlay.style.display = 'none';
                        const flash = document.getElementById('power-on-flash');
                        if (flash) {
                            flash.classList.add('active');
                            setTimeout(() => flash.classList.remove('active'), 1000);
                        }
                        setTimeout(showOnboarding, 500);
                    }, 800);
                }
            }, 150);
        } else {
            bootOverlay.style.display = 'none';
            const flash = document.getElementById('power-on-flash');
            if (flash) {
                flash.classList.add('active');
                setTimeout(() => flash.classList.remove('active'), 1000);
            }
            playLevelUpSound();
            setTimeout(showOnboarding, 1500);
        }
    });
}

// ===== MUTE TOGGLE =====
const muteBtn = document.getElementById('btn-mute');
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('pp_sound', soundEnabled);
        muteBtn.textContent = soundEnabled ? '🔊' : '🔇';
    });
}

// ===== TAB NAVIGATION =====
const views = ['companion', 'sensors', 'stats'];
let activeViewIndex = 0;

function switchTab(viewName) {
    playClickSound();
    const viewIds = { companion: 'view-companion', sensors: 'view-sensors', stats: 'view-stats' };
    const titles = { companion: 'COMPANION', sensors: 'SENSORS HUD', stats: 'STATS & TROPHIES' };

    Object.values(viewIds).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-view');
    });

    const targetId = viewIds[viewName];
    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.classList.add('active-view');
    }

    const titleEl = document.getElementById('top-tab-title');
    if (titleEl) titleEl.textContent = titles[viewName] || 'COMPANION';
    activeViewIndex = views.indexOf(viewName);
    if (activeViewIndex < 0) activeViewIndex = 0;
}

// ===== WEBSOCKET =====
const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProto}//${window.location.host}/ws`;
let socket = null;
let lastData = null;

function connectWebSocket() {
    try {
        socket = new WebSocket(wsUrl);
    } catch (e) {
        setTimeout(connectWebSocket, 3000);
        return;
    }

    socket.onopen = () => {
        const led = document.getElementById('led-power');
        if (led) led.className = 'led-light online';
        addLog('SYSTEM', 'Connected to PixelPal daemon.');
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            updateUI(data);
            lastData = data;
        } catch (e) {}
    };

    socket.onclose = () => {
        const led = document.getElementById('led-power');
        if (led) led.className = 'led-light';
        setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = () => {};
}

// ===== HEARTS RENDERER =====
function renderHearts(pct, isAlert) {
    const container = document.getElementById('hearts-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.className = 'pixel-heart';
        const threshold = (i + 1) * 20;
        if (pct >= threshold) heart.classList.add('full');
        else if (pct > i * 20) heart.classList.add('half');
        else heart.classList.add('empty');
        if (isAlert) heart.classList.add('shake-heart');
        container.appendChild(heart);
    }
}

// ===== MAIN UI UPDATE =====
function updateUI(data) {
    const session = data.session;
    if (!session) return;

    const timeLeft = session.time_left;
    const total = session.total_duration;

    // Timer
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // State badge
    const badge = document.getElementById('session-state-badge');
    if (badge) {
        badge.textContent = session.state.toUpperCase();
        badge.className = `state-badge badge-${session.state.toLowerCase()}`;
    }

    // Hearts
    const pct = total > 0 ? (timeLeft / total) * 100 : (session.state === 'idle' ? 100 : 0);
    const isAlert = data.gaze === 'away' || data.posture === 'slouching' || data.specs === 'off' || data.phone === 'detected';
    renderHearts(pct, isAlert);

    // Power LED
    const led = document.getElementById('led-power');
    if (led) {
        if (data.phone === 'detected' || data.specs === 'off') led.className = 'led-light critical';
        else if (isAlert) led.className = 'led-light warning';
        else led.className = 'led-light online';
    }

    // Buttons
    const btnStart = document.getElementById('btn-start');
    const btnPomo = document.getElementById('btn-pomo');
    const btnPause = document.getElementById('btn-pause');

    if (session.state === 'idle') {
        if (btnStart) btnStart.disabled = false;
        if (btnPomo) btnPomo.disabled = false;
        if (btnPause) { btnPause.disabled = true; btnPause.textContent = 'PAUSE'; }
    } else if (session.state === 'paused') {
        if (btnStart) btnStart.disabled = true;
        if (btnPomo) btnPomo.disabled = true;
        if (btnPause) { btnPause.disabled = false; btnPause.textContent = 'RESUME'; }
    } else {
        if (btnStart) btnStart.disabled = true;
        if (btnPomo) btnPomo.disabled = true;
        if (btnPause) { btnPause.disabled = false; btnPause.textContent = 'PAUSE'; }
    }

    // Sensor cards
    updateSensor('card-gaze', 'status-gaze', 'pip-gaze', data.gaze, {
        looking: ['👁️ TRACKING', 'ok'], soft_warn: ['👁️ GLANCING', 'warn'],
        away: ['⚠️ AWAY', 'bad'], not_detected: ['🚫 N/A', ''], disabled: ['📵 OFF', '']
    });
    updateSensor('card-posture', 'status-posture', 'pip-posture', data.posture, {
        good: ['🧍 UPRIGHT', 'ok'], slouching: ['❌ SLOUCHING', 'bad'],
        uncalibrated: ['⚠️ UNCALIB', 'warn'], not_detected: ['🚫 N/A', ''], disabled: ['📵 OFF', '']
    });
    updateSensor('card-specs', 'status-specs', 'pip-specs', data.specs, {
        on: ['👓 WEARING', 'ok'], off: ['❌ NO SPECS', 'bad'], unknown: ['⏳ CHECK', ''], disabled: ['📵 OFF', '']
    });
    updateSensor('card-phone', 'status-phone', 'pip-phone', data.phone, {
        not_detected: ['📵 CLEAR', 'ok'], detected: ['📱 DETECTED!', 'bad'],
        unknown: ['⏳ CHECK', ''], disabled: ['📵 OFF', '']
    });

    // Stats
    if (data.stats) {
        setText('tab-streak', `🔥 ${data.stats.current_streak || 0}`);
        setText('tab-sessions', `📦 ${data.stats.sessions_completed_today || 0}`);
        setText('tab-posture', `🧍 ${data.stats.posture_warnings_today || 0}`);
        setText('tab-phone', `📱 ${data.stats.phone_pickups_today || 0}`);

        // Companion stats
        setText('stat-streak', data.stats.current_streak || 0);
        const focusMins = data.stats.total_focus_minutes_today || 0;
        setText('stat-focus-time', `${focusMins}m`);
        setText('stat-sessions', data.stats.sessions_completed_today || 0);

        // XP bar
        const xpPct = (focusMins % 60) / 60 * 100;
        const xpFill = document.getElementById('xp-bar-fill');
        if (xpFill) xpFill.style.width = xpPct + '%';
    }

    // Sprite mood
    const sprite = document.getElementById('pixelpal-sprite');
    const caption = document.getElementById('sprite-caption');
    if (sprite && caption) {
        let mood = 'idle';
        let capText = 'PIXELPAL IS SLEEPING...';

        if (session.state === 'focus' && !isAlert) {
            mood = 'happy'; capText = 'PIXELPAL IS HAPPY!';
        } else if (session.state === 'break') {
            mood = 'happy'; capText = 'BREAK TIME! RELAX~';
        } else if (data.phone === 'detected' || data.specs === 'off') {
            mood = 'critical'; capText = 'PIXELPAL IS PANICKING!';
        } else if (isAlert) {
            mood = 'warning'; capText = 'PIXELPAL IS WORRIED...';
        } else if (session.state === 'focus') {
            mood = 'happy'; capText = 'PIXELPAL IS FOCUSED!';
        }

        sprite.className = `sprite-${mood}`;
        caption.textContent = capText;

        // Eye tracking
        const eyeL = document.getElementById('pupil-l');
        const eyeR = document.getElementById('pupil-r');
        if (eyeL && eyeR) {
            if (data.gaze === 'away') {
                const dir = Math.floor(Date.now() / 800) % 2 === 0;
                eyeL.setAttribute('x', dir ? '4' : '6');
                eyeR.setAttribute('x', dir ? '9' : '11');
            } else {
                eyeL.setAttribute('x', '5');
                eyeR.setAttribute('x', '10');
            }
        }
    }

    // Scene background
    const topContent = document.getElementById('top-screen-content');
    if (topContent) {
        topContent.classList.remove('scene-focus', 'scene-break', 'scene-warning', 'scene-idle');
        if (isAlert) topContent.classList.add('scene-warning');
        else if (session.state === 'focus') topContent.classList.add('scene-focus');
        else if (session.state === 'break') topContent.classList.add('scene-break');
        else topContent.classList.add('scene-idle');
    }

    // Sound triggers
    if (data.sound_trigger) {
        if (data.sound_trigger === 'warning.wav') playWarningSound();
        else if (data.sound_trigger === 'alert_beep.wav') playAlertSound();
        else if (data.sound_trigger === 'levelup.wav') playLevelUpSound();
    }

    // Alert dialog
    const alertOverlay = document.getElementById('alert-overlay');
    if (alertOverlay) {
        if (data.active_alert) {
            setText('alert-title', data.active_alert.title);
            setText('alert-desc', data.active_alert.message);
            alertOverlay.classList.remove('overlay-hidden');
        } else {
            alertOverlay.classList.add('overlay-hidden');
        }
    }

    // Ticker
    const ticker = document.getElementById('status-ticker');
    if (ticker) {
        let msg = `[SYS] STATUS: ${session.state.toUpperCase()} 👾 `;
        msg += `GAZE: ${data.gaze.toUpperCase()} 👁️ `;
        msg += `POSTURE: ${data.posture.toUpperCase()} 🧍 `;
        if (data.phone === 'detected') msg += `⚠️ PHONE DETECTED ⚠️ `;
        if (data.specs === 'off') msg += `⚠️ SPECS OFF ⚠️ `;
        if (data.stats) msg += `🔥STREAK: ${data.stats.current_streak} `;
        
        // Only update text if changed to prevent animation reset
        if (ticker.dataset.lastMsg !== msg) {
            ticker.textContent = msg.repeat(3); // Repeat to fill space if needed
            ticker.dataset.lastMsg = msg;
        }
    }

    // Logs
    if (data.logs && data.logs.length > 0) {
        if (!lastData || JSON.stringify(lastData.logs) !== JSON.stringify(data.logs)) {
            const logsEl = document.getElementById('console-logs');
            if (logsEl) {
                logsEl.innerHTML = '';
                data.logs.forEach(line => {
                    const div = document.createElement('div');
                    div.className = 'log-line';
                    if (line.includes('[VIOLATION]') || line.includes('[ALERT]') || line.includes('[CRITICAL]')) div.classList.add('text-pink');
                    else if (line.includes('[SESSION_START]') || line.includes('[SESSION_COMPLETE]') || line.includes('[MILESTONE]')) div.classList.add('text-green');
                    else if (line.includes('[CALIBRATION]') || line.includes('[WARNING]')) div.classList.add('text-yellow');
                    else if (line.includes('[SYSTEM]')) div.classList.add('text-cyan');
                    else div.classList.add('text-green');
                    div.textContent = line;
                    logsEl.appendChild(div);
                });
                // Blinking cursor
                const cursor = document.createElement('span');
                cursor.className = 'blinking-cursor';
                cursor.textContent = '█';
                logsEl.appendChild(cursor);
                logsEl.scrollTop = logsEl.scrollHeight;
            }
        }
    }
}

// ===== HELPERS =====
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateSensor(cardId, statusId, pipId, value, map) {
    const card = document.getElementById(cardId);
    const statusEl = document.getElementById(statusId);
    const pip = document.getElementById(pipId);

    const entry = map[value] || map['unknown'] || ['⏳ ...', ''];
    const [label, level] = entry;

    if (statusEl) {
        statusEl.textContent = label;
        statusEl.className = 'hud-status';
        if (level === 'ok') statusEl.classList.add('text-green');
        else if (level === 'warn') statusEl.classList.add('text-yellow');
        else if (level === 'bad') statusEl.classList.add('text-pink');
        else statusEl.classList.add('text-purple');
    }

    if (card) {
        card.classList.remove('card-ok', 'card-warn', 'card-bad');
        if (level === 'ok') card.classList.add('card-ok');
        else if (level === 'warn') card.classList.add('card-warn');
        else if (level === 'bad') card.classList.add('card-bad');
    }

    if (pip) {
        pip.classList.remove('pip-ok', 'pip-warn', 'pip-bad');
        if (level === 'ok') pip.classList.add('pip-ok');
        else if (level === 'warn') pip.classList.add('pip-warn');
        else if (level === 'bad') pip.classList.add('pip-bad');
    }
}

function addLog(source, text) {
    const logsEl = document.getElementById('console-logs');
    if (!logsEl) return;
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    div.className = 'log-line text-cyan';
    div.textContent = `[${time}] [${source}] ${text}`;
    logsEl.appendChild(div);
    logsEl.scrollTop = logsEl.scrollHeight;
}

// ===== API ACTIONS =====
function startFocus() {
    playClickSound();
    const mins = document.getElementById('set-focus-min');
    const m = mins ? parseInt(mins.value) || 45 : 45;
    fetch(`/api/start?minutes=${m}`, { method: 'POST' });
}

function startPomodoro() {
    playClickSound();
    fetch('/api/pomodoro', { method: 'POST' });
}

function togglePause() {
    playClickSound();
    const isPaused = lastData && lastData.session && lastData.session.state === 'paused';
    fetch(isPaused ? '/api/resume' : '/api/pause', { method: 'POST' });
}

function calibratePosture() {
    playClickSound();
    const overlay = document.getElementById('calibration-overlay');
    const countText = document.getElementById('countdown-text');

    if (overlay && countText) {
        overlay.classList.remove('overlay-hidden');
        let count = 3;
        countText.textContent = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countText.textContent = count;
                playClickSound();
            } else if (count === 0) {
                countText.textContent = 'SNAP!';
                playLevelUpSound();
            } else {
                clearInterval(interval);
                overlay.classList.add('overlay-hidden');
                fetch('/api/calibrate', { method: 'POST' })
                    .then(r => r.json())
                    .then(d => showToast(d.status === 'success' ? 'CALIBRATED' : 'FAILED', d.message, d.status === 'success' ? 'info' : 'error'))
                    .catch(() => showToast('ERROR', 'Calibration failed', 'error'));
            }
        }, 1000);
    } else {
        fetch('/api/calibrate', { method: 'POST' });
    }
}

function dismissAlert() {
    playClickSound();
    fetch('/api/dismiss-alert', { method: 'POST' });
}

// ===== TOAST SYSTEM =====
function showToast(title, message, severity = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${severity}`;
    toast.innerHTML = `<strong>${title}</strong><br><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== SETTINGS DRAWER =====
function toggleSettings() {
    const drawer = document.getElementById('settings-drawer');
    const backdrop = document.getElementById('settings-backdrop');
    if (!drawer || !backdrop) return;

    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        backdrop.style.display = 'none';
    } else {
        drawer.classList.add('open');
        backdrop.style.display = 'block';
    }
    playClickSound();
}

// ===== THEME SWITCHER =====
(function initTheme() {
    const saved = localStorage.getItem('pp_theme') || 'neon-green';
    document.body.setAttribute('data-theme', saved);

    document.querySelectorAll('.theme-dot').forEach(dot => {
        if (dot.dataset.theme === saved) dot.classList.add('active');
        else dot.classList.remove('active');

        dot.addEventListener('click', () => {
            const theme = dot.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('pp_theme', theme);
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            playClickSound();
        });
    });
})();

// ===== SCANLINE TOGGLE =====
(function initScanlines() {
    const enabled = localStorage.getItem('pp_scanlines') !== 'false';
    const scanEl = document.getElementById('scanlines-overlay');
    const toggle = document.getElementById('set-scanlines');

    if (scanEl) scanEl.style.display = enabled ? 'block' : 'none';
    if (toggle) {
        toggle.checked = enabled;
        toggle.addEventListener('change', () => {
            const on = toggle.checked;
            if (scanEl) scanEl.style.display = on ? 'block' : 'none';
            localStorage.setItem('pp_scanlines', on);
        });
    }
})();

// ===== ONBOARDING =====
const obSteps = [
    { icon: '⚔️', title: 'A new adventure begins...', desc: 'Welcome, Trainer! Your PixelPal awaits.' },
    { icon: '🧍', title: 'Calibrate your posture', desc: 'Sit straight & click CALIBRATE to set baseline.' },
    { icon: '🎨', title: 'Choose your theme', desc: 'Pick a color from the dots in the bottom-left!' },
    { icon: '🐾', title: 'Meet your PixelPal!', desc: 'Totoro will guard your focus. Let\'s go!' }
];
let obStep = 0;

function showOnboarding() {
    if (localStorage.getItem('pp_onboarded') === 'true') return;
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    obStep = 0;
    renderObStep();
}

function renderObStep() {
    const step = obSteps[obStep];
    setText('ob-icon', step.icon);
    setText('ob-title', step.title);
    setText('ob-desc', step.desc);

    // Update dots
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('ob-dot-' + i);
        if (!dot) continue;
        dot.className = 'ob-dot';
        if (i < obStep) dot.classList.add('ob-done');
        else if (i === obStep) dot.classList.add('ob-active');
    }

    const backBtn = document.getElementById('ob-btn-back');
    const nextBtn = document.getElementById('ob-btn-next');
    if (backBtn) backBtn.style.display = obStep === 0 ? 'none' : 'inline-block';
    if (nextBtn) nextBtn.textContent = obStep === obSteps.length - 1 ? 'START! ✨' : 'NEXT ▶';
}

document.getElementById('ob-btn-next')?.addEventListener('click', () => {
    playClickSound();
    if (obStep < obSteps.length - 1) {
        obStep++;
        renderObStep();
    } else {
        localStorage.setItem('pp_onboarded', 'true');
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) overlay.style.display = 'none';
    }
});

document.getElementById('ob-btn-back')?.addEventListener('click', () => {
    playClickSound();
    if (obStep > 0) { obStep--; renderObStep(); }
});

// ===== AMBIENT EFFECTS =====
// CRT flicker
setInterval(() => {
    const top = document.getElementById('top-screen');
    if (top) top.style.opacity = (0.95 + Math.random() * 0.05).toFixed(3);
}, 2000);

// Logo glitch
setInterval(() => {
    const logo = document.getElementById('logo-glitch');
    if (!logo) return;
    const orig = '👾 PIXELPAL SYSTEM';
    const glitchChars = '!@#$%^&*<>{}[]X░▒▓';
    const arr = orig.split('');
    const idx = Math.floor(Math.random() * arr.length);
    if (arr[idx] !== ' ') {
        arr[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        logo.textContent = arr.join('');
        setTimeout(() => { logo.textContent = orig; }, 100);
    }
}, 6000);

// Pet speech bubbles
const speechMessages = [
    "You can do it!", "Stay focused!", "Keep going!", "Great work!",
    "Take a break soon!", "Posture check!", "You're amazing!", "Almost there!",
    "Don't touch that phone!", "Eyes on screen!"
];
setInterval(() => {
    if (!lastData || !lastData.session || lastData.session.state !== 'focus') return;
    const bubble = document.getElementById('pet-speech-bubble');
    const text = document.getElementById('speech-text');
    if (!bubble || !text) return;

    text.textContent = speechMessages[Math.floor(Math.random() * speechMessages.length)];
    bubble.style.display = 'block';
    setTimeout(() => { bubble.style.display = 'none'; }, 3000);
}, 30000);

// ===== EVENT LISTENERS =====
// Buttons
document.getElementById('btn-start')?.addEventListener('click', startFocus);
document.getElementById('btn-pomo')?.addEventListener('click', startPomodoro);
document.getElementById('btn-pause')?.addEventListener('click', togglePause);
document.getElementById('btn-calibrate')?.addEventListener('click', calibratePosture);
document.getElementById('btn-alert-dismiss')?.addEventListener('click', dismissAlert);

// Console buttons (ABXY)
document.getElementById('btn-console-a')?.addEventListener('click', startFocus);
document.getElementById('btn-console-b')?.addEventListener('click', togglePause);
document.getElementById('btn-console-x')?.addEventListener('click', calibratePosture);
document.getElementById('btn-console-y')?.addEventListener('click', startPomodoro);

// SELECT / START
document.getElementById('btn-console-select')?.addEventListener('click', () => {
    activeViewIndex = (activeViewIndex + 1) % views.length;
    switchTab(views[activeViewIndex]);
});
document.getElementById('btn-console-start')?.addEventListener('click', dismissAlert);

// D-Pad navigation
document.getElementById('dpad-up')?.addEventListener('click', () => {
    activeViewIndex = (activeViewIndex + views.length - 1) % views.length;
    switchTab(views[activeViewIndex]);
});
document.getElementById('dpad-down')?.addEventListener('click', () => {
    activeViewIndex = (activeViewIndex + 1) % views.length;
    switchTab(views[activeViewIndex]);
});
document.getElementById('dpad-left')?.addEventListener('click', () => switchTab('companion'));
document.getElementById('dpad-right')?.addEventListener('click', () => switchTab('stats'));

// Settings
document.getElementById('btn-settings')?.addEventListener('click', toggleSettings);
document.getElementById('btn-settings-close')?.addEventListener('click', toggleSettings);
document.getElementById('settings-backdrop')?.addEventListener('click', toggleSettings);

// Celebration dismiss
document.getElementById('celebration-overlay')?.addEventListener('click', function() {
    this.classList.add('overlay-hidden');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        playClickSound();
        fetch('/api/shutdown', { method: 'POST' }).then(() => {
            setTimeout(() => window.close(), 500);
        }).catch(() => window.close());
    }
});

// ===== CONNECT =====
connectWebSocket();
