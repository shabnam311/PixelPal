# icon.py — run this once to generate icon.ico from scratch
from PIL import Image, ImageDraw
import os

def create_pet_icon():
    sizes = [16, 32, 48, 64, 128, 256]
    images = []

    for size in sizes:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Background circle (dark)
        margin = size // 8
        draw.ellipse([margin, margin, size - margin, size - margin],
                     fill=(13, 17, 23, 255))

        # Pet body (green circle)
        body_margin = size // 6
        draw.ellipse([body_margin, body_margin, size - body_margin, size - body_margin],
                     fill=(57, 211, 83, 255))

        # Eyes (dark squares)
        eye_size = max(2, size // 10)
        eye_y = size // 2 - eye_size // 2
        left_eye_x = size // 3 - eye_size // 2
        right_eye_x = size * 2 // 3 - eye_size // 2
        draw.rectangle([left_eye_x, eye_y, left_eye_x + eye_size, eye_y + eye_size],
                       fill=(13, 17, 23, 255))
        draw.rectangle([right_eye_x, eye_y, right_eye_x + eye_size, eye_y + eye_size],
                       fill=(13, 17, 23, 255))

        # Blush marks (pink circles)
        blush_size = max(2, size // 8)
        blush_y = size * 3 // 5
        draw.ellipse([size // 5, blush_y, size // 5 + blush_size, blush_y + blush_size],
                     fill=(255, 110, 180, 160))
        draw.ellipse([size * 3 // 5, blush_y, size * 3 // 5 + blush_size, blush_y + blush_size],
                     fill=(255, 110, 180, 160))

        # Smile (arc)
        smile_margin = size // 3
        smile_y_start = size // 2
        draw.arc([smile_margin, smile_y_start, size - smile_margin, size - size // 6],
                 start=10, end=170,
                 fill=(13, 17, 23, 255), width=max(1, size // 20))

        images.append(img)

    # Save as .ico with all sizes
    images[0].save(
        "icon.ico",
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=images[1:]
    )
    print("icon.ico created")

    # Also save a PNG for tray icon
    images[-1].save("ui/web/assets/icon.png")
    print("ui/web/assets/icon.png created")

    # Save small tray versions
    for size, suffix in [(16, "tray_idle"), (32, "tray_active")]:
        images[sizes.index(size)].save(f"ui/assets/{suffix}.png")
    print("tray icons created")

if __name__ == "__main__":
    os.makedirs("ui/web/assets", exist_ok=True)
    os.makedirs("ui/assets", exist_ok=True)
    create_pet_icon()
