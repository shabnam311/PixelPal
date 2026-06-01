import re

# 1. Patch main.py
with open("main.py", "r", encoding="utf-8") as f:
    main_code = f.read()

# Fix maximize to actually maximize, and add fullscreen
maximize_old = """@app.post("/api/maximize")
def api_maximize():
    global gui_window
    if gui_window:
        gui_window.toggle_fullscreen()
    return {"status": "success"}"""

maximize_new = """@app.post("/api/maximize")
def api_maximize():
    global gui_window
    if gui_window:
        gui_window.maximize()
    return {"status": "success"}

@app.post("/api/fullscreen")
def api_fullscreen():
    global gui_window
    if gui_window:
        gui_window.toggle_fullscreen()
    return {"status": "success"}"""

main_code = main_code.replace(maximize_old, maximize_new)
with open("main.py", "w", encoding="utf-8") as f:
    f.write(main_code)

# 2. Patch ui/web/index.html
with open("ui/web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

traffic_old = """            <div class="traffic-lights">
                <button id="btn-os-close" class="os-btn mac-close" title="Close"></button>
                <button id="btn-os-minimize" class="os-btn mac-minimize" title="Minimize"></button>
                <button id="btn-os-maximize" class="os-btn mac-maximize" title="Maximize"></button>
            </div>"""

traffic_new = """            <div class="traffic-lights">
                <button id="btn-os-close" class="os-btn mac-close" title="Close"></button>
                <button id="btn-os-minimize" class="os-btn mac-minimize" title="Minimize"></button>
                <button id="btn-os-maximize" class="os-btn mac-maximize" title="Maximize"></button>
                <button id="btn-os-fullscreen" class="os-btn-icon" title="Toggle Fullscreen (F11)">🖥️</button>
            </div>"""

html = html.replace(traffic_old, traffic_new)
with open("ui/web/index.html", "w", encoding="utf-8") as f:
    f.write(html)

# 3. Patch ui/web/index.css
with open("ui/web/index.css", "a", encoding="utf-8") as f:
    f.write('''
.os-btn-icon {
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 10px;
    padding: 0 4px;
    margin-left: 6px;
    transition: color 0.2s;
}
.os-btn-icon:hover {
    color: #fff;
}
''')

# 4. Patch ui/web/app.js
with open("ui/web/app.js", "a", encoding="utf-8") as f:
    f.write('''

// Point 2: Fullscreen toggle shortcut + button
let isFullscreen = localStorage.getItem("pixelpal_fullscreen") === "true";

function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    localStorage.setItem("pixelpal_fullscreen", isFullscreen);
    fetch('/api/fullscreen', { method: 'POST' }).catch(console.error);
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore fullscreen pref on load if it was set
    if (isFullscreen) {
        // slight delay to let pywebview initialize
        setTimeout(() => {
            fetch('/api/fullscreen', { method: 'POST' }).catch(console.error);
        }, 500);
    }
    
    // Listen for F11
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });

    const fsBtn = document.getElementById('btn-os-fullscreen');
    if(fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
});

// Update window controls
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-os-minimize')?.addEventListener('click', () => fetch('/api/minimize', { method: 'POST' }));
    document.getElementById('btn-os-maximize')?.addEventListener('click', () => fetch('/api/maximize', { method: 'POST' }));
    document.getElementById('btn-os-close')?.addEventListener('click', () => fetch('/api/shutdown', { method: 'POST' }));
});
''')
