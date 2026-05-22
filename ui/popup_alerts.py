import tkinter as tk
import threading
import time
import logging

logger = logging.getLogger("PopupAlerts")

def show_popup(title, message, severity="WARN"):
    """
    Spins up a retro-styled Tkinter popup in a background thread
    so it does not block the main process.
    """
    thread = threading.Thread(
        target=self_contained_popup_thread,
        args=(title, message, severity),
        daemon=True
    )
    thread.start()

def self_contained_popup_thread(title, message, severity):
    try:
        root = tk.Tk()
        root.title("Guardian Alert")
        
        # Retro color scheme based on severity
        bg_color = "#0d0d0d"
        text_color = "#39ff14"  # Neon green default
        
        if severity.upper() == "CRIT":
            border_color = "#ff2d78"  # Hot pink for critical
            title_prefix = "☠️ [CRITICAL] "
        elif severity.upper() == "WARN":
            border_color = "#ffd700"  # Golden yellow for warning
            title_prefix = "⚠️ [WARNING] "
        else:
            border_color = "#9b5de5"  # Soft purple for info
            title_prefix = "👾 [INFO] "

        # Window dimensions
        width = 400
        height = 140
        
        # Calculate screen position (bottom right corner)
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        
        margin_x = 40
        margin_y = 60
        x = screen_width - width - margin_x
        y = screen_height - height - margin_y
        
        # Set geometry and attributes
        root.geometry(f"{width}x{height}+{x}+{y}")
        root.overrideredirect(True)       # Borderless
        root.attributes("-topmost", True)  # Always on top
        root.configure(bg=border_color)   # Outer border color
        
        # Main inner container
        main_frame = tk.Frame(
            root, 
            bg=bg_color, 
            bd=3, 
            relief="flat"
        )
        main_frame.pack(fill="both", expand=True, padx=4, pady=4)
        
        # Title Label
        title_label = tk.Label(
            main_frame,
            text=f"{title_prefix}{title}",
            fg=border_color,
            bg=bg_color,
            font=("Courier New", 12, "bold"),
            anchor="w",
            justify="left"
        )
        title_label.pack(fill="x", padx=15, pady=(15, 5))
        
        # Message Label
        message_label = tk.Label(
            main_frame,
            text=message,
            fg=text_color,
            bg=bg_color,
            font=("Courier New", 10),
            anchor="w",
            justify="left",
            wraplength=350
        )
        message_label.pack(fill="both", expand=True, padx=15, pady=(0, 10))
        
        # Dismiss Button / Row
        button_frame = tk.Frame(main_frame, bg=bg_color)
        button_frame.pack(fill="x", padx=15, pady=(0, 15))
        
        def dismiss():
            try:
                root.destroy()
            except Exception:
                pass
                
        # Style button to look like pixel art button
        ok_btn = tk.Button(
            button_frame,
            text="[ ok, ok ]",
            fg="#0d0d0d",
            bg=text_color,
            activeforeground=text_color,
            activebackground="#0d0d0d",
            font=("Courier New", 9, "bold"),
            relief="flat",
            bd=0,
            command=dismiss,
            cursor="hand2"
        )
        ok_btn.pack(side="right")
        
        # Auto-dismiss after 8 seconds
        root.after(8000, dismiss)
        
        # Run main loop for this specific popup window
        root.mainloop()
    except Exception as e:
        logger.error(f"Failed to display Tkinter popup alert: {e}")
