import os
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.align import Align

console = Console()

class TerminalUI:
    def __init__(self):
        pass

    def clear(self):
        # Clears the terminal screen
        os.system('cls' if os.name == 'nt' else 'clear')

    def render(self, session_status, gaze_status, posture_status, specs_status, phone_status, stats):
        """
        Renders the retro console HUD.
        """
        self.clear()
        
        # Color palette config
        green = "#39ff14"
        pink = "#ff2d78"
        yellow = "#ffd700"
        purple = "#9b5de5"
        
        # Build Title
        title_text = Text("[ GUARDIAN v1.0 ] 👾", style=f"bold {green}")
        
        # Build Session Row
        state = session_status["state"].upper()
        mode = session_status["mode"].upper()
        time_left_sec = session_status["time_left"]
        total_sec = session_status["total_duration"]
        
        mins = time_left_sec // 60
        secs = time_left_sec % 60
        time_str = f"{mins:02d}:{secs:02d} left"
        
        # Draw depleting health bar
        bar_width = 15
        if total_sec > 0:
            pct = time_left_sec / total_sec
        else:
            pct = 0.0
            
        filled_width = int(pct * bar_width)
        empty_width = bar_width - filled_width
        
        # Color change based on time percentage
        if pct > 0.5:
            bar_color = green
        elif pct > 0.2:
            bar_color = yellow
        else:
            bar_color = pink
            
        bar_str = "█" * filled_width + "░" * empty_width
        
        session_text = Text()
        session_text.append("  SESSION  ", style="bold white")
        session_text.append(bar_str, style=bar_color)
        session_text.append(f"  {time_str} ({state})", style="white")
        
        # Build Posture Row
        posture_text = Text()
        posture_text.append("  POSTURE  ", style="bold white")
        if posture_status == "good":
            posture_text.append("✅ GOOD", style=green)
        elif posture_status == "slouching":
            posture_text.append("❌ SLOUCHING", style=pink)
        elif posture_status == "uncalibrated":
            posture_text.append("⚠️ UNCALIBRATED (run 'calibrate')", style=yellow)
        elif posture_status == "disabled":
            posture_text.append("📵 DISABLED", style="grey50")
        else:
            posture_text.append("🔍 NOT DETECTED", style="grey50")
            
        # Build Specs Row
        specs_text = Text()
        specs_text.append("  SPECS    ", style="bold white")
        if specs_status == "on":
            specs_text.append("✅ ON", style=green)
        elif specs_status == "off":
            specs_text.append("❌ OFF (PUT SPECS ON!)", style=pink)
        elif specs_status == "checking":
            specs_text.append("⏳ CHECKING...", style=purple)
        elif specs_status == "disabled":
            specs_text.append("📵 DISABLED", style="grey50")
        else:
            specs_text.append("🔍 UNKNOWN", style="grey50")
            
        # Build Gaze Row
        gaze_text = Text()
        gaze_text.append("  GAZE     ", style="bold white")
        if gaze_status == "looking":
            gaze_text.append("👁️  TRACKING", style=green)
        elif gaze_status == "away":
            gaze_text.append("⚠️  LOOKING AWAY", style=pink)
        elif gaze_status == "not_detected":
            gaze_text.append("🚫 NOT DETECTED", style="grey70")
        elif gaze_status == "disabled":
            gaze_text.append("📵 DISABLED", style="grey50")
            
        # Build Phone Row
        phone_text = Text()
        phone_text.append("  PHONE    ", style="bold white")
        if phone_status == "not_detected":
            phone_text.append("📵 NOT DETECTED", style=green)
        elif phone_status == "detected":
            phone_text.append("📱 DETECTED (PHONE DOWN!)", style=pink)
        elif phone_status == "checking":
            phone_text.append("⏳ CHECKING...", style=purple)
        elif phone_status == "disabled":
            phone_text.append("📵 DISABLED", style="grey50")
        else:
            phone_text.append("🔍 UNKNOWN", style="grey50")

        # Today Stats Row
        today_text = Text()
        today_text.append(f"  TODAY: {stats['sessions_completed_today']} sessions | {stats['phone_pickups_today']} phone pickups | {stats['total_focus_minutes_today']} focus mins", style="white")
        
        # Streak Row
        streak_text = Text()
        streak_text.append(f"  STREAK: {'🔥' * min(10, stats['current_streak'])} {stats['current_streak']} days clean", style=f"bold {yellow}")

        # Combine items inside terminal layout
        hud_content = Text()
        hud_content.append(session_text)
        hud_content.append("\n")
        hud_content.append(posture_text)
        hud_content.append("\n")
        hud_content.append(specs_text)
        hud_content.append("\n")
        hud_content.append(gaze_text)
        hud_content.append("\n")
        hud_content.append(phone_text)
        hud_content.append("\n\n")
        hud_content.append(today_text)
        hud_content.append("\n")
        hud_content.append(streak_text)
        
        # Create Retro HUD panel
        panel = Panel(
            Align.left(hud_content),
            title=title_text,
            border_style=green,
            width=50,
            padding=(1, 1)
        )
        
        console.print(panel)
        
        # Footer Menu
        footer_text = Text("  commands: [p]ause  [s]tart  [pom]odoro  [c]alibrate  [q]uit", style="grey60")
        console.print(footer_text)
