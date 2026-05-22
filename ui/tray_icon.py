import os
import webbrowser
import threading
import logging
from PIL import Image, ImageDraw

logger = logging.getLogger("TrayIcon")

class TrayIcon:
    def __init__(self, session_manager, on_quit_callback):
        self.session_manager = session_manager
        self.on_quit = on_quit_callback
        self.icon = None
        self.state = "happy"  # happy, warning, critical
        self.icons = {}
        
        self._generate_images()
        self._init_tray()

    def _generate_images(self):
        """Programmatically generates pixel character tray icons so no image assets are required."""
        colors = {
            "happy": "#39ff14",     # Neon green
            "warning": "#ffd700",   # Golden yellow
            "critical": "#ff2d78"   # Hot pink
        }
        
        for state, color in colors.items():
            # 16x16 pixel tray icon
            img = Image.new("RGBA", (16, 16), color=(0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Draw simple pixelated face character
            # Outer box
            draw.rectangle([1, 1, 14, 14], fill="#0d0d0d", outline=color, width=1)
            
            # Eyes
            draw.point((4, 5), fill=color)
            draw.point((11, 5), fill=color)
            
            # Mouth based on state
            if state == "happy":
                # Smile
                draw.point((4, 9), fill=color)
                draw.point((5, 10), fill=color)
                draw.rectangle([6, 10, 9, 10], fill=color)
                draw.point((10, 10), fill=color)
                draw.point((11, 9), fill=color)
            elif state == "warning":
                # Straight line
                draw.rectangle([5, 10, 10, 10], fill=color)
            elif state == "critical":
                # Frown / Angry
                draw.point((4, 11), fill=color)
                draw.point((5, 10), fill=color)
                draw.rectangle([6, 9, 9, 9], fill=color)
                draw.point((10, 10), fill=color)
                draw.point((11, 11), fill=color)
                
            self.icons[state] = img

    def _init_tray(self):
        try:
            import pystray
            from pystray import MenuItem as item
            
            def start_focus_45(icon):
                self.session_manager.start_focus(45)
                
            def start_pomodoro(icon):
                self.session_manager.start_pomodoro()
                
            def toggle_pause(icon):
                status = self.session_manager.get_status()
                if status["state"] == "paused":
                    self.session_manager.resume()
                elif status["state"] in ["focus", "break"]:
                    self.session_manager.pause()
                    
            def take_break(icon):
                self.session_manager.start_break(10)
                
            def open_dashboard(icon):
                webbrowser.open("http://localhost:8000")
                
            def quit_app(icon):
                icon.stop()
                if self.on_quit:
                    self.on_quit()

            # Define right-click menu
            menu = (
                item("Open Web Dashboard", open_dashboard, default=True),
                pystray.Menu.SEPARATOR,
                item("Start Focus (45 min)", start_focus_45),
                item("Start Pomodoro Mode", start_pomodoro),
                item("Pause / Resume", toggle_pause),
                item("Take Break (10 min)", take_break),
                pystray.Menu.SEPARATOR,
                item("Quit Guardian", quit_app)
            )

            self.icon = pystray.Icon(
                "guardian",
                icon=self.icons["happy"],
                title="GUARDIAN 👾 Focus Monitor",
                menu=menu
            )
        except Exception as e:
            logger.error(f"Failed to initialize pystray icon: {e}")

    def run_async(self):
        """Runs the tray icon mainloop in a separate thread."""
        if self.icon:
            thread = threading.Thread(target=self.icon.run, daemon=True)
            thread.start()
            logger.info("Tray Icon thread started.")

    def set_state(self, state):
        """Updates the tray icon image based on current state (happy, warning, critical)."""
        if self.icon and state in self.icons:
            self.state = state
            self.icon.icon = self.icons[state]
            
    def stop(self):
        if self.icon:
            self.icon.stop()
