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
function startFocus() { playClickSound(); fetch('/api/start?minutes=45', { method: 'POST' }); }
function startPomodoro() { playClickSound(); fetch('/api/pomodoro', { method: 'POST' }); }
function togglePause() {
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
                        const mins = data.stats.total_focus_minutes_today;
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
        const badge = document.getElementById('session-state-badge');
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
    toast.innerHTML = `<strong>${title}</strong><br>${message}`;
    
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
                        const mins = data.stats.total_focus_minutes_today;
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
        const badge = document.getElementById('session-state-badge');
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
    toast.innerHTML = `<strong>${title}</strong><br>${message}`;
    
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
        const badge = document.getElementById('session-state-badge');
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
        const badge = document.getElementById('session-state-badge');
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
