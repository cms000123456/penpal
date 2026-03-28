#!/usr/bin/env python3
"""Generate simple placeholder icons for the app."""

from PIL import Image, ImageDraw
import os

def create_icon(size, filename):
    """Create a simple gradient icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(size):
        for x in range(size):
            # Diagonal gradient from purple to blue
            t = (x + y) / (2 * size)
            r = int(138 + t * (59 - 138))  # Purple to blue
            g = int(43 + t * (130 - 43))
            b = int(226 + t * (246 - 226))
            img.putpixel((x, y), (r, g, b, 255))
    
    # Draw a simple brush/pen shape
    margin = size // 4
    brush_width = max(2, size // 20)
    
    # Draw brush stroke
    draw.line(
        [(margin, size - margin), (size - margin, margin)],
        fill=(255, 255, 255, 230),
        width=brush_width * 3
    )
    
    img.save(filename)
    print(f"Created: {filename}")

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), 'src-tauri', 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate different sizes
    sizes = [32, 128]
    for size in sizes:
        filename = os.path.join(icons_dir, f"{size}x{size}.png")
        create_icon(size, filename)
        
        # Also create @2x version for 128
        if size == 128:
            filename_2x = os.path.join(icons_dir, f"{size}x{size}@2x.png")
            create_icon(size * 2, filename_2x)
    
    # Create ICO for Windows (using 256x256)
    ico_path = os.path.join(icons_dir, "icon.ico")
    img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    for y in range(256):
        for x in range(256):
            t = (x + y) / 512
            r = int(138 + t * (59 - 138))
            g = int(43 + t * (130 - 43))
            b = int(226 + t * (246 - 226))
            img.putpixel((x, y), (r, g, b, 255))
    
    draw.line([(64, 192), (192, 64)], fill=(255, 255, 255, 230), width=20)
    img.save(ico_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
    print(f"Created: {ico_path}")
    
    # Create ICNS for macOS (using 512x512)
    icns_path = os.path.join(icons_dir, "icon.icns")
    img_512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img_512)
    
    for y in range(512):
        for x in range(512):
            t = (x + y) / 1024
            r = int(138 + t * (59 - 138))
            g = int(43 + t * (130 - 43))
            b = int(226 + t * (246 - 226))
            img_512.putpixel((x, y), (r, g, b, 255))
    
    draw.line([(128, 384), (384, 128)], fill=(255, 255, 255, 230), width=40)
    
    # Save as PNG first (icns requires special handling)
    img_512.save(icns_path.replace('.icns', '.png'))
    print(f"Created: {icns_path.replace('.icns', '.png')} (use for macOS)")
    
    print("\nIcons generated successfully!")
    print("Note: For macOS, you'll need to convert the PNG to ICNS format manually or use iconutil.")

if __name__ == '__main__':
    try:
        from PIL import Image, ImageDraw
        main()
    except ImportError:
        print("PIL/Pillow not installed. Installing...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'Pillow'])
        from PIL import Image, ImageDraw
        main()
