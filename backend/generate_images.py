import os
from PIL import Image, ImageDraw, ImageFont
import random

images_dir = os.path.join('static', 'images')
os.makedirs(images_dir, exist_ok=True)

def create_colored_image(width, height, color, text, filename):
    """Create a colored image with text"""
    img = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("Arial", 36)
    except IOError:
        font = ImageFont.load_default()
    
    # Draw text in the center
    text_width, text_height = draw.textsize(text, font=font) if hasattr(draw, 'textsize') else (width//2, height//2)
    position = ((width - text_width) // 2, (height - text_height) // 2)
    draw.text(position, text, fill="white", font=font)
    
    # Save the image
    img.save(os.path.join(images_dir, filename))
    print(f"Created {filename}")

# Generate dragon images
for i in range(1, 11):
    hue = (i * 36) % 360
    r, g, b = [int(x*255) for x in [random.random(), random.random(), random.random()]]
    color = (r, g, b)
    create_colored_image(400, 500, color, f"Dragon {i}", f"dragon_{i}.jpg")

# Generate model.png
create_colored_image(800, 1200, (0, 0, 0), "Model Image", "model.png")

# Generate bg.png
create_colored_image(1400, 900, (37, 40, 59), "Background", "bg.png")

print("All images generated successfully!")

