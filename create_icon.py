#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create directories if they don't exist
os.makedirs("Lego Search.app/Contents/Resources", exist_ok=True)

# Create a 1024x1024 image with a white background
icon = Image.new('RGB', (1024, 1024), color='white')
draw = ImageDraw.Draw(icon)

# Draw the background with a light blue color
draw.rectangle([(0, 0), (1024, 1024)], fill=(50, 150, 255))

# Draw the search symbol (magnifying glass)
draw.ellipse([(200, 200), (650, 650)], outline='white', width=40)
draw.rectangle([(550, 550), (800, 650)], fill=(50, 150, 255))
draw.line([(600, 600), (800, 800)], fill='white', width=60)

# Draw "LEGO" text
try:
    font = ImageFont.truetype("Arial Bold.ttf", 150)
except:
    font = ImageFont.load_default()

draw.text((300, 700), "LEGO", fill='white', font=font)

# Save as .icns file
icon_path = "Lego Search.app/Contents/Resources/AppIcon.icns"
icon.save(icon_path)

print(f"Icon created at {icon_path}")