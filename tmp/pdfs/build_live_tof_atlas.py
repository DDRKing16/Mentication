from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('/Users/dylandesai-rogers/Documents/Mentication App Build (Code)/output/live-thought-or-fact-screens')
output = root.parent / 'live-thought-or-fact-screen-atlas.png'
files = sorted(root.glob('*.png'))
cols, width, gap, label = 3, 250, 18, 34
images = []
for file in files:
    image = Image.open(file).convert('RGB')
    height = int(width * image.height / image.width)
    images.append((file, image.resize((width, height))))
row_height = max(image.height for _, image in images) + label
rows = (len(images) + cols - 1) // cols
canvas = Image.new('RGB', (cols * width + (cols + 1) * gap, rows * row_height + (rows + 1) * gap + 45), '#071B1A')
draw = ImageDraw.Draw(canvas); font = ImageFont.load_default()
draw.text((gap, 16), 'Mentication - Thought or Fact - live app screenshots', fill='#F3E8D2', font=font)
for index, (file, image) in enumerate(images):
    row, col = divmod(index, cols)
    x = gap + col * (width + gap); y = 45 + gap + row * row_height
    canvas.paste(image, (x, y))
    draw.text((x, y + image.height + 8), file.stem.replace('-', ' ').title(), fill='#F3E8D2', font=font)
canvas.save(output, quality=92)
print(output)
