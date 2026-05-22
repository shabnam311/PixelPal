// Global Audio Context variables
let audioCtx = null;
let soundEnabled = true;

// Initialize Web Audio Context on boot overlay click
document.getElementById('audio-unlock-overlay').addEventListener('click', () => {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        document.getElementById('audio-unlock-overlay').classList.add('hidden-alert');
        document.getElementById('audio-unlock-overlay').style.display = 'none';
        
        // Trigger Power On Sequence
        document.getElementById('power-on-flash').classList.add('active');
        
        console.log("Web Audio Context initialized.");
        playLevelUpSound(); // Boot chime
    } catch(e) {
        console.error("Audio Context failed: ", e);
    }
});

// Sound toggle
document.getElementById('btn-mute').addEventListener('click', (e) => {
    soundEnabled = !soundEnabled;
    e.target.innerText = soundEnabled ? '🔊' : '🔇';
});

// Sound Synthesizers (Advanced Phase 7)
function playClickSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        // Shorter, sharper attack
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } catch (e) {}
}

function playWarningSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } catch (e) {}
}

function playAlertSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 329.63, 261.63]; // C4 -> E4 -> G4 -> E4 -> C4
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            const t = now + idx * 0.1;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        });
    } catch (e) {}
}

function playLevelUpSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        
        // Pseudo Reverb Delay Node
        const delay = audioCtx.createDelay();
        delay.delayTime.value = 0.15;
        const feedback = audioCtx.createGain();
        feedback.gain.value = 0.3;
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(audioCtx.destination);

        scale.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.connect(delay); // Send to reverb
            
            osc.type = 'triangle';
            const t = now + idx * 0.08;
            osc.frequency.setValueAtTime(freq, t);
            
            gain.gain.setValueAtTime(0.08, t);
            // Long fade out for reverb effect
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
            
            osc.start(t);
            osc.stop(t + 1.5);
        });
    } catch (e) {}
}

// Ambient JS Glitch & Flicker Effects
setInterval(() => {
    // CRT random opacity flicker
    const topScreen = document.getElementById('top-screen');
    topScreen.style.opacity = (Math.random() * (1 - 0.95) + 0.95).toFixed(2);
}, 2000);

setInterval(() => {
    // Logo glitch
    const logo = document.getElementById('logo-glitch');
    const origText = "👾 GUARDIAN SYSTEM";
    const chars = "!@#$%^&*()<>{}[]X";
    
    // Briefly swap a random character
    let charsArr = origText.split("");
    const rIdx = Math.floor(Math.random() * charsArr.length);
    if(charsArr[rIdx] !== " ") {
        charsArr[rIdx] = chars.charAt(Math.floor(Math.random() * chars.length));
        logo.innerText = charsArr.join("");
        
        setTimeout(() => {
            logo.innerText = origText;
        }, 100);
    }
}, 8000);

// Visual Tab Views list
const views = ['pet', 'sensors', 'stats'];
let activeViewIndex = 0;

function switchTab(viewName) {
    playClickSound();
    document.getElementById('view-companion').classList.remove('active-view');
    document.getElementById('view-sensors').classList.remove('active-view');
    document.getElementById('view-stats').classList.remove('active-view');
    
    let tabTitle = "TAB: RETRO PET";
    
    if (viewName === 'pet') {
        document.getElementById('view-companion').classList.add('active-view');
        tabTitle = "TAB: RETRO PET";
        activeViewIndex = 0;
    } else if (viewName === 'sensors') {
        document.getElementById('view-sensors').classList.add('active-view');
        tabTitle = "TAB: SENSORS HUD";
        activeViewIndex = 1;
    } else if (viewName === 'stats') {
        document.getElementById('view-stats').classList.add('active-view');
        tabTitle = "TAB: STATS & TROPHIES";
        activeViewIndex = 2;
    }
    
    document.getElementById('top-tab-title').innerText = tabTitle;
}

// WebSocket Setup
const socketProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socketUrl = `${socketProtocol}//${window.location.host}/ws`;
let socket = null;
let lastKnownState = null;

function connectWebSocket() {
    socket = new WebSocket(socketUrl);
    socket.onopen = () => {
        document.getElementById('led-power').className = "led-light online";
        addLogLine("SYSTEM", "Connected to Python daemon.");
    };
    socket.onmessage = (event) => {
        updateUI(JSON.parse(event.data));
    };
    socket.onclose = () => {
        document.getElementById('led-power').className = "led-light";
        setTimeout(connectWebSocket, 3000);
    };
}

function renderHearts(pct, isAlerting) {
    const heartsContainer = document.getElementById('hearts-container');
    heartsContainer.innerHTML = '';
    const totalHearts = 5;
    
    for (let i = 0; i < totalHearts; i++) {
        const heartEl = document.createElement('div');
        heartEl.className = 'pixel-heart pulse-anim';
        const threshold = (i + 1) * 20;
        const previousThreshold = i * 20;
        
        if (pct >= threshold) heartEl.classList.add('full');
        else if (pct > previousThreshold && pct < threshold) heartEl.classList.add(pct - previousThreshold >= 10 ? 'half' : 'empty');
        else heartEl.classList.add('empty');
        
        if (isAlerting) heartEl.classList.add('shake-heart');
        heartsContainer.appendChild(heartEl);
    }
}

function updateUI(data) {
    const session = data.session;
    const time_left = session.time_left;
    const total = session.total_duration;
    
    // Timer digits
    const mins = Math.floor(time_left / 60);
    const secs = time_left % 60;
    document.getElementById('timer-display').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
    // Badge status
    const badge = document.getElementById('session-state-badge');
    badge.innerText = session.state.toUpperCase();
    badge.className = `state-badge badge-${session.state.toLowerCase()}`;
    
    let pct = total > 0 ? (time_left / total) * 100 : (session.state === "idle" ? 100 : 0);
    const isAlertActive = (data.gaze === "away" || data.posture === "slouching" || data.specs === "off" || data.phone === "detected");
    
    renderHearts(pct, isAlertActive);

    // LEDs
    const ledPower = document.getElementById('led-power');
    if (isAlertActive) ledPower.className = (data.phone === "detected" || data.specs === "off") ? "led-light critical" : "led-light warning";
    else ledPower.className = "led-light online";

    // Buttons
    if (session.state === "idle") {
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-pomo').disabled = false;
        document.getElementById('btn-pause').disabled = true;
        document.getElementById('btn-pause').innerText = "PAUSE";
    } else if (session.state === "paused") {
        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-pomo').disabled = true;
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-pause').innerText = "RESUME";
    } else {
        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-pomo').disabled = true;
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-pause').innerText = "PAUSE";
    }

    // Sensors
    updateSensorCard("card-gaze", "status-gaze", "GAZE", data.gaze);
    updateSensorCard("card-posture", "status-posture", "POSTURE", data.posture);
    updateSensorCard("card-specs", "status-specs", "SPECS", data.specs);
    updateSensorCard("card-phone", "status-phone", "PHONE", data.phone);

    // Stats
    document.getElementById('tab-streak').innerHTML = `🔥 ${data.stats.current_streak}`;
    document.getElementById('tab-sessions').innerHTML = `📦 ${data.stats.sessions_completed_today}`;
    document.getElementById('tab-posture').innerHTML = `🧍 ${data.stats.posture_warnings_today}`;
    document.getElementById('tab-phone').innerHTML = `📱 ${data.stats.phone_pickups_today}`;

    // Totoro Sprite
    const sprite = document.getElementById('guardian-sprite');
    const caption = document.getElementById('sprite-caption');
    const eyeL = document.getElementById('pupil-l');
    const eyeR = document.getElementById('pupil-r');
    
    let mood = "happy";
    let captionText = "GUARDIAN TOTORO IS CONTENT";
    
    if (session.state === "idle" && time_left === 0) {
        mood = "sleep"; captionText = "GUARDIAN TOTORO IS ASLEEP";
    } else if (isAlertActive) {
        if (data.phone === "detected" || data.specs === "off") { mood = "critical"; captionText = "PANIC! PHONE OR NO SPECS"; }
        else { mood = "warning"; captionText = "WARNING! LOOK SCREEN OR POSTURE"; }
    }

    if (data.gaze === "away") {
        if (Math.floor(Date.now() / 800) % 2 === 0) {
            eyeL.setAttribute("x", "4"); eyeR.setAttribute("x", "9");
        } else {
            eyeL.setAttribute("x", "6"); eyeR.setAttribute("x", "11");
        }
    } else {
        eyeL.setAttribute("x", "5"); eyeR.setAttribute("x", "10");
    }
    
    sprite.className = `sprite-${mood}`;
    caption.innerText = captionText;

    // Trigger sounds from backend
    if (data.sound_trigger) {
        if (data.sound_trigger === "warning.wav") playWarningSound();
        else if (data.sound_trigger === "alert_beep.wav") playAlertSound();
        else if (data.sound_trigger === "levelup.wav") playLevelUpSound();
    }

    // Alert Dialogue
    const alertOverlay = document.getElementById('alert-overlay');
    if (data.active_alert) {
        document.getElementById('alert-title').innerText = data.active_alert.title;
        document.getElementById('alert-desc').innerText = data.active_alert.message;
        alertOverlay.classList.remove('hidden-alert');
    } else {
        alertOverlay.classList.add('hidden-alert');
    }

    // Logs (Typewriter style append)
    if (data.logs && data.logs.length > 0) {
        // Only append new logs to prevent re-rendering everything
        if (!lastKnownState || lastKnownState.logs.length !== data.logs.length) {
            const consoleLogs = document.getElementById('console-logs');
            consoleLogs.innerHTML = '';
            data.logs.forEach(line => {
                const div = document.createElement('div');
                div.className = 'log-line typewriter ';
                if (line.includes('[VIOLATION]') || line.includes('[ALERT]') || line.includes('[CRITICAL]')) div.classList.add('text-pink');
                else if (line.includes('[SESSION_START]') || line.includes('[SESSION_COMPLETE]') || line.includes('[MILESTONE]')) div.classList.add('text-green');
                else if (line.includes('[CALIBRATION]') || line.includes('[WARNING]')) div.classList.add('text-yellow');
                else div.classList.add('text-purple');
                
                div.innerText = line;
                consoleLogs.appendChild(div);
            });
            consoleLogs.scrollTop = consoleLogs.scrollHeight;
        }
    }
    
    lastKnownState = data;
}

function updateSensorCard(cardId, statusId, label, value) {
    const card = document.getElementById(cardId);
    const statusEl = document.getElementById(statusId);
    
    if (value === "looking" || value === "good" || value === "on" || value === "not_detected") {
        statusEl.innerText = getSensorLabel(label, value);
        statusEl.className = "hud-status text-green";
        card.style.borderColor = "#39ff14";
    } else if (value === "away" || value === "slouching" || value === "off" || value === "detected") {
        statusEl.innerText = getSensorLabel(label, value);
        statusEl.className = "hud-status text-pink";
        card.style.borderColor = "#ff2d78";
    } else {
        statusEl.innerText = "⏳ CHECKING";
        statusEl.className = "hud-status text-purple";
        card.style.borderColor = "#1a1a2e";
    }
}

function getSensorLabel(sensor, val) {
    if (sensor === "GAZE") return val === "looking" ? "👁️ ACTIVE" : "⚠️ AWAY";
    if (sensor === "POSTURE") return val === "good" ? "🧍 UPRIGHT" : "❌ SLOUCHING";
    if (sensor === "SPECS") return val === "on" ? "👓 WEARING" : "❌ NO SPECS";
    if (sensor === "PHONE") return val === "not_detected" ? "📵 CLEAR" : "📱 DETECTED";
    return val;
}

function addLogLine(source, text) {
    const consoleLogs = document.getElementById('console-logs');
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    div.className = 'log-line text-purple typewriter';
    div.innerText = `[${time}] [${source}] ${text}`;
    consoleLogs.appendChild(div);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Button Hooks
function startFocus() { playClickSound(); fetch('/api/start?minutes=45', { method: 'POST' }); }
function startPomodoro() { playClickSound(); fetch('/api/pomodoro', { method: 'POST' }); }
function togglePause() {
    playClickSound();
    const isPaused = lastKnownState && lastKnownState.session.state === "paused";
    fetch(isPaused ? '/api/resume' : '/api/pause', { method: 'POST' });
}
function calibratePosture() { playClickSound(); fetch('/api/calibrate', { method: 'POST' }); }
function dismissWarning() { playClickSound(); fetch('/api/dismiss-alert', { method: 'POST' }); }

document.getElementById('btn-start').addEventListener('click', startFocus);
document.getElementById('btn-pomo').addEventListener('click', startPomodoro);
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-calibrate').addEventListener('click', calibratePosture);
document.getElementById('btn-alert-dismiss').addEventListener('click', dismissWarning);

document.getElementById('btn-console-a').addEventListener('click', startFocus);
document.getElementById('btn-console-b').addEventListener('click', togglePause);
document.getElementById('btn-console-x').addEventListener('click', calibratePosture);
document.getElementById('btn-console-y').addEventListener('click', startPomodoro);
document.getElementById('btn-console-select').addEventListener('click', () => {
    activeViewIndex = (activeViewIndex + 1) % views.length;
    switchTab(views[activeViewIndex]);
});
document.getElementById('btn-console-start').addEventListener('click', dismissWarning);

document.getElementById('dpad-left').addEventListener('click', () => switchTab('pet'));
document.getElementById('dpad-right').addEventListener('click', () => switchTab('stats'));
document.getElementById('dpad-up').addEventListener('click', () => switchTab(views[(activeViewIndex + views.length - 1) % views.length]));
document.getElementById('dpad-down').addEventListener('click', () => switchTab(views[(activeViewIndex + 1) % views.length]));

connectWebSocket();
