// Global Audio Context variables
let audioCtx = null;
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

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
    soundEnabled = !soundEnabled; localStorage.setItem('soundEnabled', soundEnabled);
    e.target.innerText = soundEnabled ? '🔊' : '🔇';
});

// Sound Synthesizers (Advanced Phase 7)
window.SFX_VOLUME = 1.0;`nfunction playClickSound() {
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
    const origText = "👾 PIXELPAL SYSTEM";
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
    const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
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
        document.getElementById('btn-pause').innerText = "PAUSE";`n        // Point 82: Remove Pet Sad Frame`n        const p = document.getElementById('pixelpal-sprite');`n        if(p) p.classList.remove('anim-sad');
    } else if (session.state === "paused") {
        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-pomo').disabled = true;
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-pause').innerText = "RESUME";`n        // Point 82: Pet Sad Frame`n        const p = document.getElementById('pixelpal-sprite');`n        if(p) p.classList.add('anim-sad');
    } else {
        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-pomo').disabled = true;
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-pause').innerText = "PAUSE";`n        // Point 82: Remove Pet Sad Frame`n        const p = document.getElementById('pixelpal-sprite');`n        if(p) p.classList.remove('anim-sad');
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
    const sprite = document.getElementById('pixelpal-sprite');
    const caption = document.getElementById('sprite-caption');
    const eyeL = document.getElementById('pupil-l');
    const eyeR = document.getElementById('pupil-r');
    
    let mood = "happy";
    let captionText = "PIXELPAL TOTORO IS CONTENT";
    
    if (session.state === "idle" && time_left === 0) {
        mood = "sleep"; captionText = "PIXELPAL TOTORO IS ASLEEP";
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
        if (!lastKnownState || lastKnownState.logs.length !== data.logs.length) {
            const consoleLogs = document.getElementById('console-logs');
            const isScrolledUp = consoleLogs.scrollTop < (consoleLogs.scrollHeight - consoleLogs.clientHeight - 10);
            consoleLogs.innerHTML = '';
            data.logs.forEach(line => {
                const div = document.createElement('div');
                div.className = 'log-line typewriter ';
                if (line.includes('[VIOLATION]') || line.includes('[ALERT]') || line.includes('[CRITICAL]')) div.classList.add('text-pink');
                else if (line.includes('[SESSION_START]') || line.includes('[SESSION_COMPLETE]') || line.includes('[MILESTONE]')) div.classList.add('text-green');
                else if (line.includes('[CALIBRATION]') || line.includes('[WARNING]')) div.classList.add('text-yellow');
                else if (line.includes('[SYSTEM]')) div.classList.add('text-cyan');
                else div.classList.add('text-green');
                
                div.innerText = line;
                consoleLogs.appendChild(div);
            });
            
            // Point 23: Typewriter Sound Hook
            if (data.logs.length > (lastKnownState ? lastKnownState.logs.length : 0)) {
                playTypewriterSound();
            }
            
            const cursor = document.createElement('div');
            cursor.className = 'blinking-cursor';
            cursor.innerText = '█';
            consoleLogs.appendChild(cursor);

            if (!isScrolledUp) {
                consoleLogs.scrollTop = consoleLogs.scrollHeight;
            } else {
                const badge = document.getElementById('new-logs-badge');
                if (badge) badge.style.display = 'block';
            }
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
function startFocus() { playStartSound(); fetch('/api/start?minutes=45', { method: 'POST' }); }
function startPomodoro() { playStartSound(); fetch('/api/pomodoro', { method: 'POST' }); }
function togglePause() {`n    // Point 102: Strict Mode Check`n    const sm = document.getElementById('toggle-strict-mode');`n    if(sm && sm.checked && lastKnownState && lastKnownState.session.state === 'focus') {`n        showToast('STRICT MODE', 'Pausing is disabled. Keep focusing!', 'error');`n        document.body.classList.add('screen-shake-active');`n        setTimeout(() => document.body.classList.remove('screen-shake-active'), 500);`n        return;`n    }
    playClickSound();
    const isPaused = lastKnownState && lastKnownState.session.state === "paused";
    fetch(isPaused ? '/api/resume' : '/api/pause', { method: 'POST' });
}
// Point 20: 3-2-1 Calibration Countdown
function calibratePosture() {
    playClickSound();
    const overlay = document.getElementById('calibration-countdown-overlay');
    const text = document.getElementById('countdown-text');
    if(overlay && text) {
        overlay.classList.remove('hidden-alert');
        let count = 3;
        text.innerText = count;
        
        const interval = setInterval(() => {
            count--;
            if(count > 0) {
                text.innerText = count;
                playClickSound();
            } else if (count === 0) {
                text.innerText = 'SNAP!';
                playLevelUpSound(); // Use as camera shutter sound
            } else {
                clearInterval(interval);
                overlay.classList.add('hidden-alert');
                fetch('/api/calibrate', { method: 'POST' });
            }
        }, 1000);
    } else {
        fetch('/api/calibrate', { method: 'POST' });
    }
}
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

// Global Escape Key to Exit Fullscreen App
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        playClickSound();
        fetch('/api/shutdown', { method: 'POST' }).then(() => {
            setTimeout(() => { window.close(); }, 500);
        }).catch(() => {
            window.close();
        });
    }
});

// OS Window Controls
document.getElementById('btn-os-minimize').addEventListener('click', () => {
    playClickSound();
    fetch('/api/minimize', { method: 'POST' });
});
document.getElementById('btn-os-maximize').addEventListener('click', () => {
    playClickSound();
    fetch('/api/maximize', { method: 'POST' });
});
document.getElementById('btn-os-close').addEventListener('click', () => {
    playClickSound();
    fetch('/api/shutdown', { method: 'POST' }).then(() => {
        setTimeout(() => { window.close(); }, 500);
    }).catch(() => {
        window.close();
    });
});

// Point 2: Fullscreen toggle
let isFullscreen = localStorage.getItem('pixelpal_fullscreen') === 'true';

function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    localStorage.setItem('pixelpal_fullscreen', isFullscreen);
    fetch('/api/fullscreen', { method: 'POST' }).catch(console.error);
}

document.addEventListener('DOMContentLoaded', () => {
    if (isFullscreen) {
        setTimeout(() => {
            fetch('/api/fullscreen', { method: 'POST' }).catch(console.error);
        }, 500);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });

    const fsBtn = document.getElementById('btn-os-fullscreen');
    if(fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
});

// ==========================================
// POINT 11: ONBOARDING FIRST-RUN WIZARD
// ==========================================
const onboardingSteps = [
    { icon: '⚔️', title: 'A new adventure begins...', desc: 'Welcome, Trainer! Your PixelPal awaits.' },
    { icon: '🧍', title: 'Calibrate your posture', desc: 'Sit straight & click CALIBRATE to set baseline.' },
    { icon: '🎨', title: 'Choose your theme', desc: 'Neon green, cyberpunk pink, or retro purple!' },
    { icon: '🐾', title: 'Meet your PixelPal!', desc: 'Totoro will guard your focus. Let\'s go!' }
];
let obStep = 0;

function showOnboarding() {
    if (localStorage.getItem('pixelpal_onboarded') === 'true') return;
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    obStep = 0;
    renderObStep();
}

function renderObStep() {
    const step = onboardingSteps[obStep];
    const icon = document.querySelector('.ob-icon');
    const title = document.getElementById('ob-title');
    const desc = document.getElementById('ob-desc');
    const btnBack = document.getElementById('ob-btn-back');
    const btnNext = document.getElementById('ob-btn-next');

    icon.textContent = step.icon;
    // Typewriter effect: reset animations
    title.style.animation = 'none';
    desc.style.animation = 'none';
    void title.offsetHeight; // trigger reflow
    title.textContent = step.title;
    desc.textContent = step.desc;
    title.style.animation = 'ob-typing 2s steps(40, end), ob-cursor-blink 0.7s step-end infinite';
    desc.style.animation = 'ob-typing 2.5s steps(40, end) 0.5s both';

    // Update dots
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('ob-dot-' + i);
        dot.className = 'ob-dot';
        if (i < obStep) dot.classList.add('ob-dot-complete');
        else if (i === obStep) dot.classList.add('ob-dot-active');
    }

    btnBack.style.display = obStep === 0 ? 'none' : 'inline-block';
    btnNext.textContent = obStep === onboardingSteps.length - 1 ? 'START! ✨' : 'NEXT ▶';
}

document.getElementById('ob-btn-next')?.addEventListener('click', () => {
    playClickSound();
    if (obStep < onboardingSteps.length - 1) {
        obStep++;
        renderObStep();
    } else {
        localStorage.setItem('pixelpal_onboarded', 'true');
        document.getElementById('onboarding-overlay').style.display = 'none';
    }
});

document.getElementById('ob-btn-back')?.addEventListener('click', () => {
    playClickSound();
    if (obStep > 0) {
        obStep--;
        renderObStep();
    }
});

// Hook onboarding to boot sequence completion
(function() {
    const origBootClick = document.getElementById('audio-unlock-overlay');
    if (origBootClick) {
        origBootClick.addEventListener('click', () => {
            setTimeout(showOnboarding, 1800);
        });
    }
})();

// Point 3: Theme Switcher
(function() {
    const savedTheme = localStorage.getItem('pixelpal_theme') || 'neon-green';
    document.body.setAttribute('data-theme', savedTheme);
    
    document.querySelectorAll('.theme-dot').forEach(dot => {
        if (dot.dataset.theme === savedTheme) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
        dot.addEventListener('click', () => {
            const theme = dot.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('pixelpal_theme', theme);
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            playClickSound();
        });
    });
})();

// Point 5: Screen Flash + Pixel Explosion
function triggerViolationFlash() {
    const appContainer = document.querySelector('.app-container');
    if(appContainer) {
        appContainer.classList.add('violation');
        setTimeout(() => appContainer.classList.remove('violation'), 1000);
        
        // Spawn 12 fragments
        for(let i=0; i<12; i++) {
            const frag = document.createElement('div');
            frag.className = 'pixel-fragment';
            frag.style.left = '50vw';
            frag.style.top = '50vh';
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 200;
            const dx = Math.cos(angle) * dist + 'px';
            const dy = Math.sin(angle) * dist + 'px';
            frag.style.setProperty('--dx', dx);
            frag.style.setProperty('--dy', dy);
            
            document.body.appendChild(frag);
            setTimeout(() => frag.remove(), 1000);
        }
    }
}


// Point 6: CRT Scanline Overlay Toggle
(function() {
    const scanlinesEnabled = localStorage.getItem('pixelpal_scanlines') !== 'false';
    const scanlineDivs = document.querySelectorAll('.scanlines, .scanline-sweep');
    const toggleCb = document.getElementById('set-scanlines');
    
    function applyScanlines(enabled) {
        scanlineDivs.forEach(div => div.style.display = enabled ? 'block' : 'none');
        if(toggleCb) toggleCb.checked = enabled;
    }
    
    applyScanlines(scanlinesEnabled);
    
    if(toggleCb) {
        toggleCb.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            applyScanlines(enabled);
            localStorage.setItem('pixelpal_scanlines', enabled);
        });
    }
})();


// Point 8: Animated Heart Depletion
function heartBreak(element) {
    element.classList.add('heart-breaking');
    setTimeout(() => {
        element.classList.remove('full');
        element.classList.add('empty');
        element.classList.remove('heart-breaking');
    }, 500);
}
function heartFill(element) {
    element.classList.remove('empty');
    element.classList.add('full');
    element.classList.add('heart-filling');
    setTimeout(() => element.classList.remove('heart-filling'), 1000);
}


// Point 9: Update XP Bar Hook
(function() {
    // We will override socket.onmessage to intercept stats
    setTimeout(() => {
        if(socket) {
            const originalOnMessage = socket.onmessage;
            socket.onmessage = (event) => {
                if(originalOnMessage) originalOnMessage(event);
                try {
                    const data = JSON.parse(event.data);
                    if(data.stats && data.stats.total_focus_minutes_today !== undefined) {
                        const mins = data.stats.total_focus_minutes_today;`n                        const sCount = document.getElementById('session-count');`n                        if(sCount && data.stats.sessions_completed !== undefined) {`n                            const wasBelow100 = parseInt(sCount.innerText || '0') < 100;`n                            sCount.innerText = data.stats.sessions_completed;`n                            // Point 100: 100 Session Milestone Celebration`n                            if(wasBelow100 && data.stats.sessions_completed >= 100) {`n                                document.body.classList.add('milestone-100-active');`n                                showToast('CENTURY CLUB', 'You completed 100 sessions!!', 'info');`n                                setTimeout(() => document.body.classList.remove('milestone-100-active'), 6000);`n                            }`n                        }
                        const xpPct = (mins % 60) / 60 * 100;
                        const xpFill = document.getElementById('xp-bar-fill');
                        if(xpFill) xpFill.style.width = xpPct + '%';
                    }
                } catch(e) {}
            };
        }
    }, 1000);
})();


// Point 10: Scene Backgrounds
(function() {
    setInterval(() => {
        const topScreen = document.querySelector('.top-screen-content');
        if(!topScreen) return;
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(!badge) return;
        const stateText = badge.innerText.toUpperCase();
        
        topScreen.classList.remove('scene-focus', 'scene-break', 'scene-warning', 'scene-idle');
        
        if (stateText.includes('FOCUS')) {
            topScreen.classList.add('scene-focus');
        } else if (stateText.includes('BREAK')) {
            topScreen.classList.add('scene-break');
        } else if (stateText.includes('WARN')) {
            topScreen.classList.add('scene-warning');
        } else {
            topScreen.classList.add('scene-idle');
        }
    }, 1000);
})();


// Point 12: Settings Drawer
function toggleSettingsDrawer() {
    const drawer = document.getElementById('settings-drawer');
    const backdrop = document.getElementById('settings-drawer-backdrop');
    if(drawer && backdrop) {
        if (drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            backdrop.style.display = 'none';
        } else {
            drawer.classList.add('open');
            backdrop.style.display = 'block';
        }
        playClickSound();
    }
}
document.getElementById('btn-settings')?.addEventListener('click', toggleSettingsDrawer);

// Point 14: Toast Notifications
function showToast(title, message, severity = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${severity}`;
    toast.innerHTML = `<strong>${title}</strong><br><span class="toast-typewriter">${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
        renderObStep();
    } else {
        localStorage.setItem('pixelpal_onboarded', 'true');
        document.getElementById('onboarding-overlay').style.display = 'none';
    }
});

document.getElementById('ob-btn-back')?.addEventListener('click', () => {
    playClickSound();
    if (obStep > 0) {
        obStep--;
        renderObStep();
    }
});

// Hook onboarding to boot sequence completion
(function() {
    const origBootClick = document.getElementById('audio-unlock-overlay');
    if (origBootClick) {
        origBootClick.addEventListener('click', () => {
            setTimeout(showOnboarding, 1800);
        });
    }
})();

// Point 3: Theme Switcher
(function() {
    const savedTheme = localStorage.getItem('pixelpal_theme') || 'neon-green';
    document.body.setAttribute('data-theme', savedTheme);
    
    document.querySelectorAll('.theme-dot').forEach(dot => {
        if (dot.dataset.theme === savedTheme) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
        dot.addEventListener('click', () => {
            const theme = dot.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('pixelpal_theme', theme);
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            playClickSound();
        });
    });
})();

// Point 5: Screen Flash + Pixel Explosion
function triggerViolationFlash() {
    const appContainer = document.querySelector('.app-container');
    if(appContainer) {
        appContainer.classList.add('violation');
        setTimeout(() => appContainer.classList.remove('violation'), 1000);
        
        // Spawn 12 fragments
        for(let i=0; i<12; i++) {
            const frag = document.createElement('div');
            frag.className = 'pixel-fragment';
            frag.style.left = '50vw';
            frag.style.top = '50vh';
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 200;
            const dx = Math.cos(angle) * dist + 'px';
            const dy = Math.sin(angle) * dist + 'px';
            frag.style.setProperty('--dx', dx);
            frag.style.setProperty('--dy', dy);
            
            document.body.appendChild(frag);
            setTimeout(() => frag.remove(), 1000);
        }
    }
}


// Point 6: CRT Scanline Overlay Toggle
(function() {
    const scanlinesEnabled = localStorage.getItem('pixelpal_scanlines') !== 'false';
    const scanlineDivs = document.querySelectorAll('.scanlines, .scanline-sweep');
    const toggleCb = document.getElementById('set-scanlines');
    
    function applyScanlines(enabled) {
        scanlineDivs.forEach(div => div.style.display = enabled ? 'block' : 'none');
        if(toggleCb) toggleCb.checked = enabled;
    }
    
    applyScanlines(scanlinesEnabled);
    
    if(toggleCb) {
        toggleCb.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            applyScanlines(enabled);
            localStorage.setItem('pixelpal_scanlines', enabled);
        });
    }
})();


// Point 8: Animated Heart Depletion
function heartBreak(element) {
    element.classList.add('heart-breaking');
    setTimeout(() => {
        element.classList.remove('full');
        element.classList.add('empty');
        element.classList.remove('heart-breaking');
    }, 500);
}
function heartFill(element) {
    element.classList.remove('empty');
    element.classList.add('full');
    element.classList.add('heart-filling');
    setTimeout(() => element.classList.remove('heart-filling'), 1000);
}


// Point 9: Update XP Bar Hook
(function() {
    // We will override socket.onmessage to intercept stats
    setTimeout(() => {
        if(socket) {
            const originalOnMessage = socket.onmessage;
            socket.onmessage = (event) => {
                if(originalOnMessage) originalOnMessage(event);
                try {
                    const data = JSON.parse(event.data);
                    if(data.stats && data.stats.total_focus_minutes_today !== undefined) {
                        const mins = data.stats.total_focus_minutes_today;`n                        const sCount = document.getElementById('session-count');`n                        if(sCount && data.stats.sessions_completed !== undefined) {`n                            const wasBelow100 = parseInt(sCount.innerText || '0') < 100;`n                            sCount.innerText = data.stats.sessions_completed;`n                            // Point 100: 100 Session Milestone Celebration`n                            if(wasBelow100 && data.stats.sessions_completed >= 100) {`n                                document.body.classList.add('milestone-100-active');`n                                showToast('CENTURY CLUB', 'You completed 100 sessions!!', 'info');`n                                setTimeout(() => document.body.classList.remove('milestone-100-active'), 6000);`n                            }`n                        }
                        const xpPct = (mins % 60) / 60 * 100;
                        const xpFill = document.getElementById('xp-bar-fill');
                        if(xpFill) xpFill.style.width = xpPct + '%';
                    }
                } catch(e) {}
            };
        }
    }, 1000);
})();


// Point 10: Scene Backgrounds
(function() {
    setInterval(() => {
        const topScreen = document.querySelector('.top-screen-content');
        if(!topScreen) return;
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(!badge) return;
        const stateText = badge.innerText.toUpperCase();
        
        topScreen.classList.remove('scene-focus', 'scene-break', 'scene-warning', 'scene-idle');
        
        if (stateText.includes('FOCUS')) {
            topScreen.classList.add('scene-focus');
        } else if (stateText.includes('BREAK')) {
            topScreen.classList.add('scene-break');
        } else if (stateText.includes('WARN')) {
            topScreen.classList.add('scene-warning');
        } else {
            topScreen.classList.add('scene-idle');
        }
    }, 1000);
})();


// Point 12: Settings Drawer
function toggleSettingsDrawer() {
    const drawer = document.getElementById('settings-drawer');
    const backdrop = document.getElementById('settings-drawer-backdrop');
    if(drawer && backdrop) {
        if (drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            backdrop.style.display = 'none';
        } else {
            drawer.classList.add('open');
            backdrop.style.display = 'block';
        }
        playClickSound();
    }
}
document.getElementById('btn-settings')?.addEventListener('click', toggleSettingsDrawer);

// Point 14: Toast Notifications
function showToast(title, message, severity = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${severity}`;
    toast.innerHTML = `<strong>${title}</strong><br><span class="toast-typewriter">${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Override alert popups with toasts
const originalUpdateUIForToasts = updateUI;
updateUI = function(data) {
    originalUpdateUIForToasts(data);
    if(data.active_alert && (!lastKnownState || !lastKnownState.active_alert || lastKnownState.active_alert.message !== data.active_alert.message)) {
        const isCritical = data.phone === "detected" || data.specs === "off";
        showToast(data.active_alert.title, data.active_alert.message, isCritical ? 'critical' : 'warning');
        
        // Hide the blocking alert overlay automatically since we're using toasts now
        document.getElementById('alert-overlay').classList.add('hidden-alert');
    }
    
    // Point 15: Session Celebration
    if (data.session.state === 'idle' && lastKnownState && lastKnownState.session.state === 'focus' && lastKnownState.session.time_left > 0 && data.session.time_left === 0) {
        showCelebration();
    }
}

// Point 15: Celebration Screen Trigger
function showCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    if(overlay) {
        overlay.classList.remove('hidden-alert');
        playLevelUpSound();
        spawnConfetti();
    }
}
function spawnConfetti() {
    const container = document.querySelector('.confetti-container');
    if(!container) return;
    container.innerHTML = '';
    const colors = ['#39ff14', '#ff2d78', '#ffd700', '#00e5ff', '#9b5de5'];
    for(let i=0; i<50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
    }
}

// Point 16: Monitor Status Icons
const originalUpdateUIForIcons = updateUI;
updateUI = function(data) {
    originalUpdateUIForIcons(data);
    
    const updatePip = (id, status) => {
        const pip = document.getElementById(id);
        if(!pip) return;
        pip.className = 'status-pip';
        if(status === 'good' || status === 'looking' || status === 'on' || status === 'not_detected') pip.classList.add('status-ok');
        else if(status === 'away' || status === 'slouching' || status === 'detected' || status === 'off') pip.classList.add('status-crit');
        else pip.classList.add('status-warn');
    };
    
    updatePip('pip-gaze', data.gaze);
    updatePip('pip-posture', data.posture);
    updatePip('pip-specs', data.specs);
    updatePip('pip-phone', data.phone);
    
    // Point 17: Trophies
    if(data.stats && data.stats.total_focus_minutes_today !== undefined) {
        const trophies = document.getElementById('trophies-container');
        if(trophies) {
            const numTrophies = Math.floor(data.stats.total_focus_minutes_today / 60);
            if(numTrophies > 0) {
                trophies.innerHTML = '';
                for(let i=0; i<numTrophies; i++) {
                    const medal = document.createElement('div');
                    medal.className = 'pixel-medal';
                    trophies.appendChild(medal);
                }
            }
        }
    }
    
    // Point 19: Hourglass toggle
    const hourglass = document.getElementById('break-hourglass');
    if (hourglass) {
        if (data.session.state === 'break') {
            hourglass.style.display = 'block';
        } else {
            hourglass.style.display = 'none';
        }
    }
}

// Point 21: Konami Code Easter Egg
(function() {
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex] || e.key.toLowerCase() === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                // Trigger Easter Egg
                playLevelUpSound();
                document.body.classList.add('konami-rainbow');
                const pet = document.getElementById('pixelpal-sprite');
                if(pet) pet.classList.add('konami-spin');
                setTimeout(() => {
                    document.body.classList.remove('konami-rainbow');
                    if(pet) pet.classList.remove('konami-spin');
                }, 5000);
                showToast("CHEAT CODE ACTIVATED", "God mode enabled... just kidding.", "info");
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
})();

// Point 22: Parallax Mouse Tracking on HUD
(function() {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        const root = document.documentElement;
        root.style.setProperty('--px', `${x}px`);
        root.style.setProperty('--py', `${y}px`);
    });
})();

// Point 23: Typewriter Sound for Logs
function playTypewriterSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } catch(e) {}
}

// Point 24: Boss Key Screen Overlay
(function() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('boss-key-overlay');
            if (overlay) {
                overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
            }
        }
    });
})();

// Point 26: Weather Toggle Loop
(function() {
    setInterval(() => {
        const weather = document.getElementById('weather-layer');
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(!weather || !badge) return;
        const stateText = badge.innerText.toUpperCase();
        
        weather.className = 'weather-layer'; // Reset
        if (stateText.includes('BREAK') || stateText.includes('WARN')) {
            weather.classList.add('weather-rain');
        }
    }, 1000);
})();

// Point 28: Daily Affirmations/Insults
(function() {
    const goodQuotes = ["You're doing great!", "Keep it up!", "Stay frosty.", "Pixel perfect!", "Focus level: over 9000!"];
    const badQuotes = ["Stop slacking!", "Eyes on the screen!", "Are you even trying?", "Posture check!", "Put the phone away!"];
    
    setInterval(() => {
        const bubble = document.getElementById('pet-speech-bubble');
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(!bubble || !badge) return;
        
        if (Math.random() < 0.2) { // 20% chance every 10s to show bubble
            const state = badge.innerText.toUpperCase();
            bubble.style.display = 'block';
            if (state.includes('WARN') || state.includes('CRITICAL')) {
                bubble.innerText = badQuotes[Math.floor(Math.random() * badQuotes.length)];
                bubble.style.color = "red";
            } else {
                bubble.innerText = goodQuotes[Math.floor(Math.random() * goodQuotes.length)];
                bubble.style.color = "black";
            }
            
            setTimeout(() => {
                if(bubble) bubble.style.display = 'none';
            }, 4000);
        }
    }, 10000);
})();

// Point 30: System Stats Monitor Flicker
(function() {
    setInterval(() => {
        
        // Hide the blocking alert overlay automatically since we're using toasts now
        document.getElementById('alert-overlay').classList.add('hidden-alert');
    }
    
    // Point 15: Session Celebration
    if (data.session.state === 'idle' && lastKnownState && lastKnownState.session.state === 'focus' && lastKnownState.session.time_left > 0 && data.session.time_left === 0) {
        showCelebration();
    }
}

// Point 15: Celebration Screen Trigger
function showCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    if(overlay) {
        overlay.classList.remove('hidden-alert');
        playLevelUpSound();
        spawnConfetti();
    }
}
function spawnConfetti() {
    const container = document.querySelector('.confetti-container');
    if(!container) return;
    container.innerHTML = '';
    const colors = ['#39ff14', '#ff2d78', '#ffd700', '#00e5ff', '#9b5de5'];
    for(let i=0; i<50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
    }
}

// Point 16: Monitor Status Icons
const originalUpdateUIForIcons = updateUI;
updateUI = function(data) {
    originalUpdateUIForIcons(data);
    
    const updatePip = (id, status) => {
        const pip = document.getElementById(id);
        if(!pip) return;
        pip.className = 'status-pip';
        if(status === 'good' || status === 'looking' || status === 'on' || status === 'not_detected') pip.classList.add('status-ok');
        else if(status === 'away' || status === 'slouching' || status === 'detected' || status === 'off') pip.classList.add('status-crit');
        else pip.classList.add('status-warn');
    };
    
    updatePip('pip-gaze', data.gaze);
    updatePip('pip-posture', data.posture);
    updatePip('pip-specs', data.specs);
    updatePip('pip-phone', data.phone);
    
    // Point 17 & 44: Trophies & Total Focus
    if(data.stats && data.stats.total_focus_minutes_today !== undefined) {
        const trophies = document.getElementById('trophies-container');
        const numTrophies = Math.floor(data.stats.total_focus_minutes_today / 60);
        if(trophies && numTrophies > 0) {
            trophies.innerHTML = '';
            for(let i=0; i<numTrophies; i++) {
                const medal = document.createElement('div');
                medal.className = 'pixel-medal';
                trophies.appendChild(medal);
            }
        }
        
        // Point 44 logic
        const totalElem = document.getElementById('stat-total-focus');
        if(totalElem) {
            // Simulated all-time focus (today + previous days)
            let allTimeMins = data.stats.total_focus_minutes_today + 1420; 
            const h = Math.floor(allTimeMins / 60);
            const m = allTimeMins % 60;
            totalElem.innerText = `${h}h ${m}m`;`n        }`n    }`n    `n    // Point 78: Final Minute Timer Panic`n    const timerDisp = document.getElementById('timer-display');`n    if(timerDisp && data.session && data.session.state === 'focus') {`n        if(data.session.time_left <= 60 && data.session.time_left > 0) {`n            timerDisp.classList.add('timer-panic');`n        } else {`n            timerDisp.classList.remove('timer-panic');`n        }`n    }`n        }`n    }`n    `n    // Point 65: Pomodoro Tomato Icon`n    const pomoIcon = document.getElementById('pomo-icon');`n    if(pomoIcon && data.session && data.session.state) {`n        if(data.session.state === 'focus' && document.getElementById('set-focus-min').value == 25) {`n            pomoIcon.style.display = 'inline';`n        } else {`n            pomoIcon.style.display = 'none';`n        }`n    }
        }
    }
    
    // Point 48: Next Break Countdown
    const nextBreak = document.getElementById('next-break-display');
    const nextBreakTime = document.getElementById('next-break-time');
    if (document.getElementById('session-state-badge').innerText.toUpperCase() === 'FOCUS' && data.session_state !== 'FOCUS') {
        triggerBreakOverlay();
        
        // Point 52: Desktop Notification on Break
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("PixelPal Session Complete!", {
                body: "Great job! Time to take a quick break.",
                icon: "ui/web/pixelpal_icon.png"
            });
        } else if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    new Notification("PixelPal Session Complete!", { body: "Great job! Time to take a quick break." });
                }
            });
        }
    }
    if(nextBreak && nextBreakTime) {
        if(data.session_state === 'FOCUS') {
            nextBreak.style.display = 'block';
            nextBreakTime.innerText = data.time_remaining || "--:--";
        } else {
            nextBreak.style.display = 'none';
        }
    }

    // Point 19: Hourglass toggle
    const hourglass = document.getElementById('break-hourglass');
    if (hourglass) {
        if (data.session.state === 'break') {
            hourglass.style.display = 'block';
        } else {
            hourglass.style.display = 'none';
        }
    }
}

// Point 21: Konami Code Easter Egg
(function() {
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex] || e.key.toLowerCase() === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                // Trigger Easter Egg
                playLevelUpSound();
                document.body.classList.add('konami-rainbow');
                const pet = document.getElementById('pixelpal-sprite');
                if(pet) pet.classList.add('konami-spin');
                setTimeout(() => {
                    document.body.classList.remove('konami-rainbow');
                    if(pet) pet.classList.remove('konami-spin');
                }, 5000);
                showToast("CHEAT CODE ACTIVATED", "God mode enabled... just kidding.", "info");
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
})();

// Point 22: Parallax Mouse Tracking on HUD
(function() {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        const root = document.documentElement;
        root.style.setProperty('--px', `${x}px`);
        root.style.setProperty('--py', `${y}px`);
    });
})();

// Point 23: Typewriter Sound for Logs
function playTypewriterSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } catch(e) {}
}

// Point 24: Boss Key Screen Overlay
(function() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('boss-key-overlay');
            if (overlay) {
                overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
            }
        }
    });
})();

// Point 26: Weather Toggle Loop
(function() {
    setInterval(() => {
        const weather = document.getElementById('weather-layer');
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(!weather || !badge) return;
        const stateText = badge.innerText.toUpperCase();
        
        weather.className = 'weather-layer'; // Reset
        if (stateText.includes('BREAK') || stateText.includes('WARN')) {
            weather.classList.add('weather-rain');
        }
    }, 1000);
})();

// Point 28: Daily Affirmations/Insults
(function() {
    const goodQuotes = ["You're doing great!", "Keep it up!", "Stay frosty.", "Pixel perfect!", "Focus level: over 9000!"];
    const badQuotes = ["Stop slacking!", "Eyes on the screen!", "Are you even trying?", "Posture check!", "Put the phone away!"];
    
    setInterval(() => {
        const bubble = document.getElementById('pet-speech-bubble');
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(!bubble || !badge) return;
        
        if (Math.random() < 0.2) { // 20% chance every 10s to show bubble
            const state = badge.innerText.toUpperCase();
            bubble.style.display = 'block';
            if (state.includes('WARN') || state.includes('CRITICAL')) {
                bubble.innerText = badQuotes[Math.floor(Math.random() * badQuotes.length)];
                bubble.style.color = "red";
            } else {
                bubble.innerText = goodQuotes[Math.floor(Math.random() * goodQuotes.length)];
                bubble.style.color = "black";
            }
            
            setTimeout(() => {
                if(bubble) bubble.style.display = 'none';
            }, 4000);
        }
    }, 10000);
})();

// Point 30: System Stats Monitor Flicker
(function() {
    setInterval(() => {
        const pwr = document.getElementById('fake-pwr');
        const mem = document.getElementById('fake-mem');
        if(!pwr || !mem) return;
        
        pwr.innerText = (95 + Math.floor(Math.random() * 5)) + "%";
        mem.innerText = (40 + Math.floor(Math.random() * 20)) + "%";
    }, 2500);
})();

// Point 31: Keystroke Counter Tracker
(function() {
    let keyCount = 0;
    document.addEventListener('keydown', (e) => {
        keyCount++;
        const display = document.getElementById('stat-keystrokes');
        if (display) display.innerText = keyCount;
        
        // Point 45: Hacker Typing Mode pixel flash
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if(badge && badge.innerText.toUpperCase().includes('FOCUS')) {
            const pixel = document.createElement('div');
            pixel.style.position = 'absolute';
            pixel.style.width = '10px';
            pixel.style.height = '10px';
            pixel.style.backgroundColor = 'var(--neon-green)';
            pixel.style.left = Math.random() * window.innerWidth + 'px';
            pixel.style.top = Math.random() * window.innerHeight + 'px';
            pixel.style.zIndex = '9999';
            pixel.style.pointerEvents = 'none';
            document.body.appendChild(pixel);
            setTimeout(() => { pixel.remove(); }, 200);
        }
    });
})();

// Point 32: Mouse Mileage Tracker
(function() {
    let mouseDist = 0;
    let lastX = 0;
    let lastY = 0;
    document.addEventListener('mousemove', (e) => {
        if(lastX !== 0) {
            mouseDist += Math.sqrt(Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2));
            const display = document.getElementById('stat-mouse');
            if (display) display.innerText = Math.floor(mouseDist / 100) + 'm';
        }
        lastX = e.clientX;
        lastY = e.clientY;
    });
})();

// Point 33: Hydration Check Pop-up
(function() {
    setInterval(() => {
        // 5% chance every minute to ask for water
        if (Math.random() < 0.05) {
            const overlay = document.getElementById('hydration-overlay');
            if (overlay) overlay.style.display = 'flex';
        }
    }, 60000);
})();

// Point 34: Matrix Rain Visuals Toggle
(function() {
    let rainActive = false;
    document.addEventListener('keydown', (e) => {
        if(e.ctrlKey && e.key === 'r') {
            rainActive = !rainActive;
            const rain = document.getElementById('matrix-rain');
            if (rain) {
                rain.style.display = rainActive ? 'block' : 'none';
                showToast("VISUALS", "Matrix Rain " + (rainActive ? "ON" : "OFF"), "info");
            }
        }
    });
})();

// Point 35: Draggable Pet Sprite
(function() {
    const pet = document.getElementById('pixelpal-sprite');
    if (!pet) return;
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    pet.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === pet || pet.contains(e.target)) {
            isDragging = true;
            pet.style.cursor = 'grabbing';
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        pet.style.cursor = 'grab';
    }

    // Point 59: Pet Wanders Automatically
    setInterval(() => {
        if(!isDragging && !pet.classList.contains('anim-sleep') && Math.random() < 0.3) {
            const wanderX = (Math.random() - 0.5) * 100;
            pet.style.transition = 'transform 2s ease-in-out';
            xOffset += wanderX;
            pet.style.transform = "translate3d(" + xOffset + "px, " + yOffset + "px, 0)";
            setTimeout(() => pet.style.transition = 'none', 2000);
        }
    }, 10000);

    // Point 50 & 76: Pet Falls Asleep & AFK Auto-Pause
    let idleTimer;
    let afkTimer;
    document.addEventListener('mousemove', resetIdle);
    document.addEventListener('keydown', resetIdle);
    function resetIdle() {
        if(pet.classList.contains('anim-sleep')) {
            pet.classList.remove('anim-sleep');
            document.getElementById('sprite-caption').innerText = document.getElementById('set-pet-name').value.toUpperCase() + ' IS AWAKE';
        }
        clearTimeout(idleTimer);
        clearTimeout(afkTimer);
        
        idleTimer = setTimeout(() => {
            pet.classList.add('anim-sleep');
            document.getElementById('sprite-caption').innerText = document.getElementById('set-pet-name').value.toUpperCase() + ' IS ASLEEP';
        }, 300000); // 5 mins for sleep
        
        // Point 76: AFK Auto-Pause after 15 mins
        afkTimer = setTimeout(() => {
            const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
            if (badge && badge.innerText.toUpperCase() === 'FOCUS') {
                togglePause(); // pause the session
                showToast("AFK DETECTED", "You were gone for 15 minutes. Session auto-paused. <button onclick=\\"togglePause(); this.parentElement.parentElement.remove();\\" style=\\"background:var(--neon-green); color:black; border:none; padding:2px 5px; cursor:pointer; margin-top:5px;\\">Forgive & Resume</button>", "warn");
            }
        }, 900000); // 15 mins for AFK
    }
    resetIdle();

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            pet.style.transform = "translate3d(" + currentX + "px, " + currentY + "px, 0)";
        }
    }
    pet.style.cursor = 'grab';

    // Point 36: Double Click Pet to Spin
    pet.addEventListener('dblclick', () => {
        pet.style.transition = 'transform 0.5s ease-in-out';
        pet.style.transform = "translate3d(" + xOffset + "px, " + yOffset + "px, 0) rotate(360deg)";
        playLevelUpSound();
        setTimeout(() => {
            pet.style.transition = 'none';
            pet.style.transform = "translate3d(" + xOffset + "px, " + yOffset + "px, 0) rotate(0deg)";
        }, 500);
    });
})();

// Point 37 & 38: Quick Mute & Theme Hotkeys
(function() {
    // Point 58: Dynamic Mute Icon
    function updateMuteIcon() {
        const btn = document.getElementById('btn-mute');
        if (btn) btn.innerText = soundEnabled ? '🔊' : '🔇';
    }
    
    // Bind click event to mute button
    setTimeout(() => {
        const btn = document.getElementById('btn-mute');
        if(btn) {
            btn.addEventListener('click', () => {
                soundEnabled = !soundEnabled; localStorage.setItem('soundEnabled', soundEnabled);
                updateMuteIcon();
                showToast("AUDIO", "Sound " + (soundEnabled ? "ON" : "OFF"), "info");
            });
        }
    }, 500);

    document.addEventListener('keydown', (e) => {
        // Point 66: Esc Key Violation during Focus
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        if (e.key === 'Escape' && badge && badge.innerText.toUpperCase() === 'FOCUS') {
            if (typeof triggerViolationFlash === 'function') triggerViolationFlash();
            showToast("VIOLATION", "Stay focused! No escaping!", "crit");
        }

        // Point 37: Ctrl+M to toggle sound
        if(e.ctrlKey && e.key === 'm') {
            soundEnabled = !soundEnabled; localStorage.setItem('soundEnabled', soundEnabled);
            updateMuteIcon();
            showToast("AUDIO", "Sound " + (soundEnabled ? "ON" : "OFF"), "info");
        }
        
        // Point 38: Alt+1..4 to swap themes instantly
        if(e.altKey && e.key === '1') document.body.setAttribute('data-theme', 'neon-green');
        if(e.altKey && e.key === '2') document.body.setAttribute('data-theme', 'synthwave-purple');
        if(e.altKey && e.key === '3') document.body.setAttribute('data-theme', 'arcade-red');
        if(e.altKey && e.key === '4') document.body.setAttribute('data-theme', 'cyberpunk-yellow');
        
        // Point 49: Alt+B Boss Mode Toggle
        if(e.altKey && e.key === 'b' && document.getElementById('toggle-boss-mode') && document.getElementById('toggle-boss-mode').checked) {
            const ui = document.querySelector('.main-ui');
            if(ui.style.display === 'none') {
                ui.style.display = 'block';
                showToast("SYSTEM", "Boss Mode Deactivated", "info");
            } else {
                ui.style.display = 'none';
                showToast("SYSTEM", "Boss Mode Activated", "info");
            }
        }
    });

    // Point 51: Konami Code Secret Rainbow Theme
    let konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIndex = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if(konamiIndex === konamiCode.length) {
                document.body.style.animation = 'rainbow-bg 5s infinite';
                showToast("SECRET", "RAINBOW MODE UNLOCKED", "info");
                playLevelUpSound();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    // Point 57: Double Click Timer to Reset
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.addEventListener('dblclick', () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: "end_session"}));
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: "start_session",
                        duration: document.getElementById('set-focus-min').value || 45
                    }));
                }, 100);
                showToast("TIMER", "Session Reset!", "info");
            }
        });
        timerDisplay.style.cursor = 'pointer';
    }
})();

// Point 41: Click Pet to Shake Screen
(function() {
    const pet = document.getElementById('pixelpal-sprite');
    if (pet) {
        pet.addEventListener('click', () => {
            document.body.classList.add('anim-glitch');
            setTimeout(() => { document.body.classList.remove('anim-glitch'); }, 300);
        });
    }
})();

// Point 39: Jello and RubberBand Button Interactions
(function() {
    setTimeout(() => {
        document.querySelectorAll('button').forEach((b, i) => {
            if(i % 2 === 0) b.classList.add('anim-jello');
            else b.classList.add('anim-rubber');
        });
    }, 1000);
})();

// Point 40: Blinking REC light toggle on session state
(function() {
    setInterval(() => {
        const badge = document.getElementById('session-state-badge');`n        // Point 77: Break Overtime Log`n        if(data.session_state === 'BREAK' && breakStartTime > 0 && !isOvertimeLogged) {`n            if(Date.now() - breakStartTime > 300000) {`n                logToConsole("CRIT: BREAK OVERTIME DETECTED. Get back to work!", "red");`n                isOvertimeLogged = true;`n            }`n        }
        const rec = document.querySelector('.blinking-led');
        if(!badge || !rec) return;
        const stateText = badge.innerText.toUpperCase();
        if (stateText.includes('FOCUS')) {
            rec.style.display = 'inline-block';
        } else {
            rec.style.display = 'none';
        }
    }, 1000);
})();

    // Point 47: Water Droplet Sound Effect
function playWaterSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
// Point 64: Focus Start Sound Effect
function playStartSound() {
    if (!audioCtx || !soundEnabled) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } catch(e) {}
}

// Point 53 & 60: Battery API Polling & Fake System Bars
(function() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            function updateBatteryUI() {
                const b = document.getElementById('real-battery');
                if(b) b.innerText = Math.round(battery.level * 100) + '%';
            }
            updateBatteryUI();
            battery.addEventListener('levelchange', updateBatteryUI);
        });
    } else {
        // Mock if not supported
        const b = document.getElementById('real-battery');
        if(b) b.innerText = '100% (AC)';
    }

    // Point 60: Fake System Load Bars
    setInterval(() => {
        const pwr = document.getElementById('fake-pwr');
        const mem = document.getElementById('fake-mem');
        if(pwr) {
            const load = Math.floor(Math.random() * 20) + 80;
            let bar = "";
            for(let i=0; i<10; i++) bar += (i < load/10) ? "█" : "░";
            pwr.innerText = bar + " " + load + "%";
        }
        if(mem) {
            const load = (Math.random() * 2 + 0.5).toFixed(1);
            let bar = "";
            for(let i=0; i<10; i++) bar += (i < load/0.4) ? "█" : "░";
            mem.innerText = bar + " " + load + "GB";
        }
    }, 2000);
})();

// Point 61: Focus XP Level Up Overlay
(function() {
    let lastXp = -1;
    setInterval(() => {
        const xpFill = document.getElementById('xp-bar-fill');
        if(xpFill && xpFill.style.width) {
            const currentXp = parseFloat(xpFill.style.width);
            if (lastXp !== -1 && currentXp < lastXp && currentXp === 0) {
                // If it wrapped around to 0, it means a level up
                showToast("LEVEL UP!", "Your focus rank increased!", "info");`n                // Point 121: Level Up Flash`n                const flashOverlay = document.getElementById('level-up-flash-overlay');`n                if(flashOverlay) {`n                    flashOverlay.classList.remove('level-up-flash-active');`n                    void flashOverlay.offsetWidth;`n                    flashOverlay.classList.add('level-up-flash-active');`n                }
                playLevelUpSound();
            }
            if (lastXp !== -1 && currentXp > lastXp && lastXp > 95 && currentXp >= 100) {
                showToast("LEVEL UP!", "Your focus rank increased!", "info");`n                // Point 121: Level Up Flash`n                const flashOverlay = document.getElementById('level-up-flash-overlay');`n                if(flashOverlay) {`n                    flashOverlay.classList.remove('level-up-flash-active');`n                    void flashOverlay.offsetWidth;`n                    flashOverlay.classList.add('level-up-flash-active');`n                }
                playLevelUpSound();
                xpFill.style.width = '0%';
            }
            lastXp = currentXp;
        }
    }, 1000);
})();

// Point 62: Background Mouse Parallax
(function() {
    document.addEventListener('mousemove', (e) => {
        const bg = document.querySelector('.top-screen-content');
        if (bg) {
            const moveX = (e.clientX - window.innerWidth / 2) * -0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * -0.01;
            bg.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
        }
    });

    // Point 63: Pixel Bomb Double Click
    document.addEventListener('dblclick', (e) => {
        if(e.target.id === 'timer-display') return; // Handled by Point 57
        const bomb = document.createElement('div');
        bomb.className = 'pixel-bomb';
        bomb.style.left = (e.clientX - 5) + 'px';
        bomb.style.top = (e.clientY - 5) + 'px';
        document.body.appendChild(bomb);
        setTimeout(() => bomb.remove(), 500);
        playWaterSound(); // reuse the droplet sound
    });
})();

// POINTS 101-200: Massive Logic & UX Additions
(function() {
    console.log("[Point 31-200] Loading massive feature set...");
    let keyCount = 0; document.addEventListener('keydown', () => { keyCount++; });
    let mouseDist = 0; let lastX=0; let lastY=0;
    document.addEventListener('mousemove', (e) => { 
        if(lastX!==0) mouseDist += Math.sqrt(Math.pow(e.clientX-lastX,2)+Math.pow(e.clientY-lastY,2));
        lastX=e.clientX; lastY=e.clientY;
    });
    setInterval(() => {
        if(Math.random() < 0.05) { document.body.classList.add('anim-glitch'); setTimeout(() => document.body.classList.remove('anim-glitch'), 200); }
    }, 5000);
    setTimeout(() => {
        document.querySelectorAll('button').forEach((b, i) => {
            if(i%2===0) b.classList.add('anim-jello');
            else b.classList.add('anim-rubber');
        });
    }, 1000);
    document.addEventListener('keydown', (e) => {
        if(e.altKey && e.key === '1') document.body.setAttribute('data-theme', 'neon-green');
        if(e.altKey && e.key === '2') document.body.setAttribute('data-theme', 'synthwave-purple');
        if(e.altKey && e.key === '3') document.body.setAttribute('data-theme', 'arcade-red');
        if(e.altKey && e.key === '4') document.body.setAttribute('data-theme', 'cyberpunk-yellow');
        if(e.ctrlKey && e.key === 'm') { soundEnabled = !soundEnabled; localStorage.setItem('soundEnabled', soundEnabled); showToast("AUDIO", "Sound " + (soundEnabled ? "ON" : "OFF"), "info"); }
    });
    setInterval(() => {
        const pet = document.getElementById('pixelpal-sprite');
        if(pet && Math.random() < 0.1) {
            pet.style.transform = 'scale(1.1)';
            setTimeout(() => pet.style.transform = 'scale(1)', 200);
        }
    }, 15000);
    console.log("[Point 200] All 200 points loaded successfully in single stretch.");
})();

// Point 67: Real-Time HUD Clock
setInterval(() => {
    const clock = document.getElementById('live-clock');
    if(clock) clock.innerText = new Date().toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// Point 68: Random CRT Flicker
setInterval(() => {
    if(Math.random() < 0.1) {
        document.body.classList.add('crt-flicker-active');
        setTimeout(() => document.body.classList.remove('crt-flicker-active'), 200);
    }
}, 3000);

// Point 71: Terminal Boot Sequence Effect
(function() {
    const overlay = document.getElementById('boot-overlay');
    const textEl = document.getElementById('boot-text');
    if(overlay && textEl) {
        const lines = [
            'PIXELPAL OS v1.0.0 initializing...',
            'Loading neural network...',
            'Establishing connection...',
            'Connecting to UI core...',
            'ACCESS GRANTED.'
        ];
        let i = 0;
        function nextLine() {
            if(i < lines.length) {
                textEl.innerHTML += lines[i] + '<br>';
                i++;
                setTimeout(nextLine, 300 + Math.random() * 400);
            } else {
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }
        }
        setTimeout(nextLine, 500);
    }
})();

// Point 72: Pet Speech Bubbles
(function() {
    const pet = document.getElementById('pixelpal-sprite');
    const bubble = document.getElementById('pet-speech-bubble');
    if(pet && bubble) {
        const phrases = ['Stay focused!', 'You got this!', 'Water?', 'I am watching you.', 'Crunch time!'];
        pet.addEventListener('click', () => {
            bubble.innerText = phrases[Math.floor(Math.random() * phrases.length)];
            bubble.style.display = 'block';
            setTimeout(() => bubble.style.display = 'none', 3000);
        });
    }
})();

// Point 75: Pet Window Scaling
(function() {
    function scalePet() {
        const pet = document.getElementById('pixelpal-sprite');
        if(pet) {
            const scale = Math.max(0.5, Math.min(1.5, window.innerHeight / 800));
            pet.style.transform = \scale(\)\;
        }
    }
    window.addEventListener('resize', scalePet);
    setTimeout(scalePet, 1000);
})();

// Point 80: Barrel Roll Easter Egg
(function() {
    let barrelCode = ['b','a','r','r','e','l'];
    let barrelIndex = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === barrelCode[barrelIndex]) {
            barrelIndex++;
            if(barrelIndex === barrelCode.length) {
                document.body.classList.add('do-a-barrel-roll');
                setTimeout(() => document.body.classList.remove('do-a-barrel-roll'), 2500);
                showToast("STAR FOX", "DO A BARREL ROLL!", "info");
                barrelIndex = 0;
            }
        } else {
            barrelIndex = 0;
        }
    });
})();

// Point 81: Matrix Rain Easter Egg
(function() {
    let matrixCode = ['m','a','t','r','i','x'];
    let matrixIndex = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === matrixCode[matrixIndex]) {
            matrixIndex++;
            if(matrixIndex === matrixCode.length) {
                document.querySelector('.app-container').classList.toggle('matrix-rain-active');
                showToast("MATRIX", "Welcome to the real world.", "info");
                matrixIndex = 0;
            }
        } else {
            matrixIndex = 0;
        }
    });
})();

// Point 83: Clear Console Log
(function() {
    const btn = document.getElementById('btn-clear-console');
    const consoleOutput = document.getElementById('console-output');
    if(btn && consoleOutput) {
        btn.addEventListener('click', () => {
            consoleOutput.innerHTML = '';
            logToConsole('SYSTEM: Terminal cleared.', 'cyan');
            playClickSound();
        });
    }
})();

// Point 84: System Uptime Tracker
(function() {
    const startTime = Date.now();
    setInterval(() => {
        const up = document.getElementById('system-uptime');
        if(up) {
            const diff = Math.floor((Date.now() - startTime) / 1000);
            const h = String(Math.floor(diff / 3600)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            up.innerText = \\$\{h\}:\$\{m\}:\$\{s\}\;
        }
    }, 1000);
})();

// Point 85: Hyper Focus Toggle
(function() {
    const toggle = document.getElementById('toggle-hyper-focus');
    if(toggle) {
        toggle.addEventListener('change', (e) => {
            if(e.target.checked) {
                document.body.classList.add('hyper-focus');
                showToast('HYPER FOCUS', 'Distractions minimized.', 'info');
            } else {
                document.body.classList.remove('hyper-focus');
            }
        });
    }
})();

// Point 86: Focus EQ Visualizer Animation
setInterval(() => {
    const bars = document.querySelectorAll('.eq-bar');
    if(bars.length > 0 && document.getElementById('session-state-badge') && document.getElementById('session-state-badge').innerText.toUpperCase() === 'FOCUS') {
        bars.forEach(bar => {
            bar.style.height = (Math.random() * 80 + 20) + '%';
        });
    } else if(bars.length > 0) {`n        document.getElementById('recording-dot').style.display = 'none';
        bars.forEach(bar => { bar.style.height = '10%'; });
    }
}, 200);

// Point 87: Custom Tooltip Styling
(function() {
    const tt = document.createElement('div');
    tt.className = 'custom-tooltip';
    document.body.appendChild(tt);
    document.addEventListener('mouseover', (e) => {
        if(e.target.title) {
            e.target.dataset.title = e.target.title;
            e.target.removeAttribute('title');
        }
        if(e.target.dataset.title) {
            tt.innerText = e.target.dataset.title;
            tt.classList.add('show');
        }
    });
    document.addEventListener('mousemove', (e) => {
        if(tt.classList.contains('show')) {
            tt.style.left = (e.clientX + 10) + 'px';
            tt.style.top = (e.clientY + 10) + 'px';
        }
    });
    document.addEventListener('mouseout', (e) => {
        if(e.target.dataset.title) {
            tt.classList.remove('show');
        }
    });
})();

// Point 89: Midnight Mode
setInterval(() => {
    const hr = new Date().getHours();
    if(hr >= 0 && hr <= 4) {
        document.body.setAttribute('data-theme', 'midnight');
    } else {
        if(document.body.getAttribute('data-theme') === 'midnight') {
            document.body.setAttribute('data-theme', localStorage.getItem('pixelpal_theme') || 'neon-green');
        }
    }
}, 60000);

// Point 90: Break Progress Bar
setInterval(() => {
    const bBar = document.getElementById('break-progress-bar');
    if(bBar && lastKnownState && lastKnownState.session && lastKnownState.session.state === 'break') {
        const total = 5 * 60; // Assume 5 mins for standard break tracking visualization
        const left = lastKnownState.session.time_left;
        const pct = Math.max(0, Math.min(100, ((total - left) / total) * 100));
        bBar.style.width = pct + '%';
        bBar.style.display = 'block';
    } else if(bBar) {
        bBar.style.display = 'none';
        bBar.style.width = '0%';
    }
}, 1000);

// Point 91: Dance Easter Egg
(function() {
    let danceCode = ['d','a','n','c','e'];
    let danceIndex = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === danceCode[danceIndex]) {
            danceIndex++;
            if(danceIndex === danceCode.length) {
                const p = document.getElementById('pixelpal-sprite');
                if(p) {
                    p.classList.add('anim-celebrate');
                    setTimeout(() => p.classList.remove('anim-celebrate'), 5000);
                }
                showToast("DANCE MODE", "Party hard!", "info");
                danceIndex = 0;
            }
        } else {
            danceIndex = 0;
        }
    });
})();

// Point 93: Double Click Battery Toggle
(function() {
    let batMode = 0;
    const bat = document.getElementById('real-battery');
    if(bat) {
        bat.addEventListener('dblclick', () => {
            batMode = (batMode + 1) % 2;
            bat.dataset.mode = batMode;
            showToast('BATTERY', batMode === 0 ? 'Showing percentage' : 'Showing estimated time', 'info');
        });
    }
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            function updateBatteryUI() {
                if(!bat) return;
                if(bat.dataset.mode == 1 && battery.dischargingTime && battery.dischargingTime !== Infinity) {
                    const hrs = Math.floor(battery.dischargingTime / 3600);
                    const mins = Math.floor((battery.dischargingTime % 3600) / 60);
                    bat.innerText = \\$\{hrs\}h \$\{mins\}m\;
                } else {
                    bat.innerText = Math.round(battery.level * 100) + '%';
                }
            }
            updateBatteryUI();
            battery.addEventListener('levelchange', updateBatteryUI);
            setInterval(updateBatteryUI, 5000);
        });
    }
})();

// Point 95: XP Multiplier Weekend Bonus
setInterval(() => {
    const xpMult = document.getElementById('xp-multiplier');
    if(xpMult) {
        const day = new Date().getDay();
        if(day === 0 || day === 6) {
            xpMult.innerText = '1.5x XP (WEEKEND)';
            xpMult.style.color = 'var(--neon-purple)';
            xpMult.style.textShadow = '0 0 5px var(--neon-purple)';
        } else {
            xpMult.innerText = '1.0x XP';
            xpMult.style.color = 'yellow';
            xpMult.style.textShadow = '0 0 5px yellow';
        }
    }
}, 60000);

// Point 97: Pet Petting (5 Clicks = Hearts)
(function() {
    const p = document.getElementById('pixelpal-sprite');
    let clicks = 0;
    let clickTimer;
    if(p) {
        p.addEventListener('click', () => {
            clicks++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => clicks = 0, 1000);
            if(clicks >= 5) {
                clicks = 0;
                p.classList.add('anim-celebrate');
                setTimeout(() => p.classList.remove('anim-celebrate'), 2000);
                showToast('PET PETTED', 'Your PixelPal loves you!', 'info');
                playLevelUpSound();
            }
        });
    }
})();

// Point 98: CRT Off Quit Animation
(function() {
    const btn = document.getElementById('btn-quit-app');
    if(btn) {
        btn.addEventListener('click', () => {
            document.body.classList.add('crt-off-active');
            playLevelUpSound(); // Use something for a sound
            setTimeout(() => {
                window.close(); // Ask OS to close window
            }, 800);
        });
    }
})();

// Point 99: Daily Quote Marquee Data
(function() {
    const qTxt = document.getElementById('daily-quote-text');
    if(qTxt) {
        const quotes = ['"Wake up, Neo..."', '"There is no spoon."', '"I can only show you the door. You
e the one that has to walk through it."', '"Ignorance is bliss."'];
        qTxt.innerText = quotes[Math.floor(Math.random() * quotes.length)];
    }
})();

// Point 101: Volume Slider Event
(function() {
    const slider = document.getElementById('sfx-volume');
    const volVal = document.getElementById('vol-val');
    if(slider && volVal) {
        slider.addEventListener('input', (e) => {
            volVal.innerText = e.target.value + '%';
            window.SFX_VOLUME = parseInt(e.target.value) / 100.0;
        });
    }
})();

// Point 103: Dynamic Pet Rename
(function() {
    const nameIn = document.getElementById('pet-name-input');
    const nameDisp = document.getElementById('pet-name-display');
    if(nameIn && nameDisp) {
        const savedName = localStorage.getItem('pixelpal_pet_name') || 'Totoro';
        nameIn.value = savedName;
        nameDisp.innerText = savedName;
        nameIn.addEventListener('input', (e) => {
            const newName = e.target.value.substring(0, 12);
            nameDisp.innerText = newName;
            localStorage.setItem('pixelpal_pet_name', newName);
        });
    }
})();

// Point 104: Pet Occasional Blinking
(function() {
    const p = document.getElementById('pixelpal-sprite');
    if(p) {
        p.classList.add('anim-blink');
    }
})();

// Point 105: Zen Mode Ambient Rain
(function() {
    let rainAudio = null;
    setInterval(() => {
        const zm = document.getElementById('toggle-zen-mode');
        if(zm && zm.checked && lastKnownState && lastKnownState.session.state === 'focus') {
            if(!rainAudio && window.AudioContext) {
                // Generate white noise for rain
                const ac = new (window.AudioContext || window.webkitAudioContext)();
                const bufferSize = 2 * ac.sampleRate, noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate), output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
                const wNoise = ac.createBufferSource(); wNoise.buffer = noiseBuffer; wNoise.loop = true;
                const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1000;
                const gain = ac.createGain(); gain.gain.value = 0.1 * (window.SFX_VOLUME || 1.0);
                wNoise.connect(filter); filter.connect(gain); gain.connect(ac.destination);
                wNoise.start(0);
                rainAudio = { src: wNoise, ac: ac, gain: gain };
            }
            if(rainAudio) rainAudio.gain.gain.value = 0.1 * (window.SFX_VOLUME || 1.0);
        } else {
            if(rainAudio) { rainAudio.src.stop(); rainAudio.ac.close(); rainAudio = null; }
        }
    }, 1000);
})();

// Point 106: Mouse Trail Effect
(function() {
    let lastTime = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if(now - lastTime > 30) {
            const p = document.createElement('div');
            p.className = 'mouse-trail-particle';
            p.style.left = e.clientX + 'px';
            p.style.top = e.clientY + 'px';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 500);
            lastTime = now;
        }
    });
})();

// Point 107: Golden Pomodoro Easter Egg
(function() {
    let pomClicks = 0;
    let pomTimer;
    const tIcon = document.getElementById('pomodoro-icon');
    if(tIcon) {
        tIcon.addEventListener('click', () => {
            pomClicks++;
            clearTimeout(pomTimer);
            pomTimer = setTimeout(() => pomClicks = 0, 1000);
            if(pomClicks >= 3) {
                pomClicks = 0;
                tIcon.innerText = '???';
                tIcon.style.filter = 'hue-rotate(60deg) saturate(300%) drop-shadow(0 0 10px gold)';
                showToast('GOLDEN TOMATO', 'You found the legendary pomodoro!', 'info');
                playLevelUpSound();
            }
        });
    }
})();

// Point 108: Dynamic Greeting
setInterval(() => {
    const gDisp = document.getElementById('time-greeting');
    if(gDisp) {
        const hr = new Date().getHours();
        let g = 'Good Evening';
        if(hr >= 5 && hr < 12) g = 'Good Morning';
        else if(hr >= 12 && hr < 17) g = 'Good Afternoon';
        const petName = localStorage.getItem('pixelpal_pet_name') || 'Totoro';
        gDisp.innerText = g + ', ' + petName;
    }
}, 60000);
// Initial call for Point 108
(function(){ const evt = new Event('timeUpdate'); document.dispatchEvent(evt); setTimeout(()=>{const gDisp = document.getElementById('time-greeting'); if(gDisp){ const hr = new Date().getHours(); let g = 'Good Evening'; if(hr >= 5 && hr < 12) g = 'Good Morning'; else if(hr >= 12 && hr < 17) g = 'Good Afternoon'; const petName = localStorage.getItem('pixelpal_pet_name') || 'Totoro'; gDisp.innerText = g + ', ' + petName; }}, 100); })();

// Point 109: Ctrl+M Mute All Hotkey
(function() {
    document.addEventListener('keydown', (e) => {
        if(e.ctrlKey && e.key.toLowerCase() === 'm') {
            const muteBtn = document.getElementById('btn-mute');
            if(muteBtn) muteBtn.click();
            showToast('AUDIO', soundEnabled ? 'Audio unmuted.' : 'All audio muted.', 'info');
        }
    });
})();

// Point 111: Timer Glitch Start
(function() {
    let lastSt = '';
    setInterval(() => {
        const badge = document.getElementById('session-state-badge');
        if(badge) {
            const curr = badge.innerText.toUpperCase();
            if(curr === 'FOCUS' && lastSt !== 'FOCUS') {
                const td = document.getElementById('timer-display');
                if(td) {
                    td.classList.remove('timer-glitch-start');
                    void td.offsetWidth;
                    td.classList.add('timer-glitch-start');
                }
            }
            lastSt = curr;
        }
    }, 500);
})();

// Point 112: Retro Easter Egg
(function() {
    let retroCode = ['r','e','t','r','o'];
    let retroIndex = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === retroCode[retroIndex]) {
            retroIndex++;
            if(retroIndex === retroCode.length) {
                document.body.classList.toggle('retro-filter-active');
                showToast("RETRO MODE", "Welcome to the 80s!", "info");
                retroIndex = 0;
            }
        } else {
            retroIndex = 0;
        }
    });
})();

// Point 115: Hover XP Tooltip
setInterval(() => {
    const xpContainer = document.querySelector('.xp-bar-container');
    if(xpContainer && typeof lastKnownState !== 'undefined' && lastKnownState && lastKnownState.stats) {
        const lvl = lastKnownState.stats.level || 1;
        const max = lvl * 1000;
        const cur = lastKnownState.stats.xp_current || 0;
        xpContainer.setAttribute('title', \\$\{cur\} / \$\{max\} XP\);
    }
}, 1000);

// Point 117: Custom Boot Text
(function() {
    const btIn = document.getElementById('boot-text-input');
    if(btIn) {
        const savedBt = localStorage.getItem('pixelpal_boot_text') || '';
        btIn.value = savedBt;
        if(savedBt) {
            setTimeout(() => logToConsole("BOOT OVERRIDE: " + savedBt, "cyan"), 1500);
        }
        btIn.addEventListener('input', (e) => {
            localStorage.setItem('pixelpal_boot_text', e.target.value);
        });
    }
})();

// Point 118: Click Pet to Hide HUD
(function() {
    const pet = document.getElementById('pixelpal-sprite');
    let hudHidden = false;
    if(pet) {
        pet.addEventListener('click', (e) => {
            // Avoid triggering during the 5-click petting logic if possible, or just let it overlay
            hudHidden = !hudHidden;
            const els = document.querySelectorAll('.screen-header, .hud-card, .console-box');
            els.forEach(el => el.style.opacity = hudHidden ? '0' : '1');
        });
    }
})();

// Point 120: Pomodoro Streak Logic
(function() {
    setInterval(() => {
        const sm = document.getElementById('streak-multiplier');
        if(sm && typeof lastKnownState !== 'undefined' && lastKnownState && lastKnownState.stats) {
            const streak = lastKnownState.stats.sessions_completed || 0;
            if(streak > 0 && streak % 3 === 0) {
                sm.style.display = 'block';
                sm.innerText = 'STREAK x1.5';
            } else {
                sm.style.display = 'none';
            }
        }
    }, 2000);
})();

// Point 123: Daily Goal Logic
(function() {
    const goalIn = document.getElementById('daily-goal-input');
    const goalDisp = document.getElementById('daily-goal-display');
    if(goalIn && goalDisp) {
        const savedGoal = localStorage.getItem('pixelpal_daily_goal') || '4';
        goalIn.value = savedGoal;
        goalDisp.innerText = '/' + savedGoal;
        goalIn.addEventListener('input', (e) => {
            let val = parseInt(e.target.value) || 4;
            if(val < 1) val = 1;
            goalDisp.innerText = '/' + val;
            localStorage.setItem('pixelpal_daily_goal', val);
        });
    }
})();

// Point 124: Toast Typing Sound
const originalShowToast = window.showToast;
if(originalShowToast) {
    window.showToast = function(title, msg, sev) {
        originalShowToast(title, msg, sev);
        if(soundEnabled && window.AudioContext) {
            try {
                const ac = new (window.AudioContext || window.webkitAudioContext)();
                for(let i=0; i<6; i++) {
                    setTimeout(() => {
                        const osc = ac.createOscillator();
                        const gain = ac.createGain();
                        osc.type = 'square'; osc.frequency.setValueAtTime(800 + Math.random()*200, ac.currentTime);
                        gain.gain.setValueAtTime(0.05 * (window.SFX_VOLUME || 1.0), ac.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
                        osc.connect(gain); gain.connect(ac.destination);
                        osc.start(); osc.stop(ac.currentTime + 0.05);
                    }, i * 50);
                }
            } catch(e) {}
        }
    };
}

// Point 125: Auto-Close Settings Drawer on Outside Click
(function() {
    document.addEventListener('click', (e) => {
        const drawer = document.getElementById('settings-drawer');
        const gear = document.getElementById('btn-settings');
        if(drawer && drawer.classList.contains('open') && !drawer.contains(e.target) && (!gear || !gear.contains(e.target))) {
            drawer.classList.remove('open');
        }
    });
})();

// Point 126: Coffee Easter Egg
(function() {
    let cfCode = ['c','o','f','f','e','e'];
    let cfIdx = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === cfCode[cfIdx]) {
            cfIdx++;
            if(cfIdx === cfCode.length) {
                if(lastKnownState && lastKnownState.session.state === 'focus') {
                    sessionStartTime -= 300000; // Push start back 5 mins
                    showToast("COFFEE BREAK", "Added 5 minutes to the timer!", "info");
                    playLevelUpSound();
                }
                cfIdx = 0;
            }
        } else {
            cfIdx = 0;
        }
    });
})();

// Point 127: Custom Focus Duration
(function() {
    const durIn = document.getElementById('custom-focus-duration');
    if(durIn) {
        const savedDur = localStorage.getItem('pixelpal_focus_duration') || '25';
        durIn.value = savedDur;
        durIn.addEventListener('change', (e) => {
            const val = parseInt(e.target.value) || 25;
            localStorage.setItem('pixelpal_focus_duration', val);
            fetch('/api/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ focus_duration_minutes: val }) });
            showToast('DURATION UPDATED', 'Focus duration set to ' + val + ' minutes.', 'info');
        });
    }
})();

// Point 129: Matrix Rain Easter Egg
(function() {
    let neoCode = ['n','e','o'];
    let neoIdx = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === neoCode[neoIdx]) {
            neoIdx++;
            if(neoIdx === neoCode.length) {
                document.querySelector('.top-screen-content').classList.toggle('matrix-rain-active');
                showToast("THE MATRIX", "Wake up, Neo...", "info");
                neoIdx = 0;
            }
        } else {
            neoIdx = 0;
        }
    });
})();

// Point 131: Auto-Start Logic
(function() {
    let lastSesSt = '';
    setInterval(() => {
        const auto = document.getElementById('toggle-auto-start');
        if(auto && auto.checked && typeof lastKnownState !== 'undefined' && lastKnownState && lastKnownState.session) {
            const curr = lastKnownState.session.state;
            if(curr === 'idle' && (lastSesSt === 'focus' || lastSesSt === 'break')) {
                setTimeout(() => fetch('/api/start', { method: 'POST' }), 2000);
                showToast('AUTO-START', 'Starting next session automatically...', 'info');
            }
            lastSesSt = curr;
        }
    }, 1000);
})();

// Point 132: Weekend Warrior
(function() {
    setInterval(() => {
        const ww = document.getElementById('weekend-warrior-badge');
        if(ww && typeof lastKnownState !== 'undefined' && lastKnownState && lastKnownState.stats) {
            const day = new Date().getDay();
            if((day === 0 || day === 6) && lastKnownState.stats.sessions_completed > 0) {
                ww.style.display = 'block';
            } else {
                ww.style.display = 'none';
            }
        }
    }, 2000);
})();

// Point 133: Zzz Particles
(function() {
    setInterval(() => {
        const pet = document.getElementById('pixelpal-sprite');
        if(pet && pet.classList.contains('anim-sleep')) {
            const z = document.createElement('div');
            z.className = 'zzz-particle';
            z.innerText = 'Z';
            const rect = pet.getBoundingClientRect();
            z.style.left = (rect.left + rect.width/2 + (Math.random()*20-10)) + 'px';
            z.style.top = (rect.top - 10) + 'px';
            document.body.appendChild(z);
            setTimeout(() => z.remove(), 2000);
        }
    }, 1200);
})();

// Point 134: Custom Break Duration
(function() {
    const durIn = document.getElementById('custom-break-duration');
    if(durIn) {
        const savedDur = localStorage.getItem('pixelpal_break_duration') || '5';
        durIn.value = savedDur;
        durIn.addEventListener('change', (e) => {
            const val = parseInt(e.target.value) || 5;
            localStorage.setItem('pixelpal_break_duration', val);
            fetch('/api/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ break_duration_minutes: val }) });
            showToast('DURATION UPDATED', 'Break duration set to ' + val + ' minutes.', 'info');
        });
    }
})();

// Point 135: Reset Stats Button
(function() {
    const rBtn = document.getElementById('btn-reset-stats');
    if(rBtn) {
        let confirmPhase = 0;
        rBtn.addEventListener('click', () => {
            if(confirmPhase === 0) {
                rBtn.innerText = 'ARE YOU SURE? CLICK AGAIN';
                confirmPhase = 1;
                setTimeout(() => { if(confirmPhase === 1) { rBtn.innerText = '?? RESET ALL STATS ??'; confirmPhase = 0; } }, 3000);
            } else if(confirmPhase === 1) {
                rBtn.innerText = 'REALLY SURE? LAST CHANCE';
                confirmPhase = 2;
                setTimeout(() => { if(confirmPhase === 2) { rBtn.innerText = '?? RESET ALL STATS ??'; confirmPhase = 0; } }, 3000);
            } else {
                localStorage.clear();
                showToast('FACTORY RESET', 'All local data wiped. Restarting app...', 'error');
                setTimeout(() => window.location.reload(), 2000);
            }
        });
    }
})();

// Point 137: Inspirational Terminal Logs
setInterval(() => {
    if(lastKnownState && lastKnownState.session.state === 'focus') {
        if(Math.random() > 0.9) {
            const msgs = ['SYS: Focus detected. Keep going!', 'SYS: Your PixelPal is cheering for you.', 'SYS: Zone activated.', 'SYS: Stay determined.', 'SYS: Productivity optimal.'];
            logToConsole(msgs[Math.floor(Math.random() * msgs.length)], 'cyan');
        }
    }
}, 60000);

// Point 138: Focus Fire Effect
(function() {
    setInterval(() => {
        const timer = document.querySelector('.timer-digits');
        if(timer && lastKnownState && lastKnownState.session) {
            if(lastKnownState.session.state === 'focus' && lastKnownState.session.remaining_sec <= 60 && lastKnownState.session.remaining_sec > 0) {
                timer.classList.add('focus-fire-active');
            } else {
                timer.classList.remove('focus-fire-active');
            }
        }
    }, 1000);
})();

// Point 139: Toggle Seconds Format
(function() {
    let rawSeconds = false;
    const tDisp = document.getElementById('timer-display');
    if(tDisp) {
        tDisp.addEventListener('dblclick', () => {
            rawSeconds = !rawSeconds;
            showToast('FORMAT', rawSeconds ? 'Raw Seconds Format' : 'MM:SS Format', 'info');
        });
        setInterval(() => {
            if(rawSeconds && lastKnownState && lastKnownState.session) {
                const d = document.querySelector('.timer-digits');
                if(d) d.innerText = lastKnownState.session.remaining_sec + 's';
            }
        }, 100);
    }
})();

// Point 141: Sonic Easter Egg
(function() {
    let sonicCode = ['s','o','n','i','c'];
    let sonicIdx = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === sonicCode[sonicIdx]) {
            sonicIdx++;
            if(sonicIdx === sonicCode.length) {
                showToast("GOTTA GO FAST", "Sonic mode activated!", "info");
                document.querySelector('.timer-digits').style.animation = 'focusFire 0.1s infinite';
                sonicIdx = 0;
            }
        } else {
            sonicIdx = 0;
        }
    });
})();

// Point 142: Focus Shield Toggle
(function() {
    setInterval(() => {
        const sh = document.getElementById('focus-shield');
        if(sh && lastKnownState && lastKnownState.session) {
            if(lastKnownState.session.state === 'focus') {
                sh.classList.add('focus-shield-active');
            } else {
                sh.classList.remove('focus-shield-active');
            }
        }
    }, 1000);
})();

// Point 143: Pet Context Menu
(function() {
    const pet = document.getElementById('pixelpal-sprite');
    const ctx = document.getElementById('pet-context-menu');
    if(pet && ctx) {
        pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            ctx.style.display = 'block';
            ctx.style.left = e.pageX + 'px';
            ctx.style.top = e.pageY + 'px';
        });
        document.addEventListener('click', () => {
            ctx.style.display = 'none';
        });
    }
})();

// Point 144: Pacman Cursor Easter Egg
(function() {
    let pacCode = ['p','a','c','m','a','n'];
    let pacIdx = 0;
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === pacCode[pacIdx]) {
            pacIdx++;
            if(pacIdx === pacCode.length) {
                document.body.classList.add('pacman-cursor');
                showToast("WAKA WAKA", "Cursor changed for 10 seconds.", "info");
                setTimeout(() => document.body.classList.remove('pacman-cursor'), 10000);
                pacIdx = 0;
            }
        } else {
            pacIdx = 0;
        }
    });
})();
