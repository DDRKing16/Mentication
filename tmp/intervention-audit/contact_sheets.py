from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path("tmp/intervention-audit/screens")
out = Path("tmp/intervention-audit/contact-sheets")
out.mkdir(parents=True, exist_ok=True)

groups = {}
for path in sorted(root.glob("*.png")):
    stem = path.stem
    key = "-".join(stem.split("-")[:-1])
    groups.setdefault(key, []).append(path)

font = ImageFont.load_default(size=18)
for key, paths in groups.items():
    thumb_w, thumb_h = 292, 633
    cols = min(4, len(paths))
    rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + 34)), "#111820")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(paths):
        image = Image.open(path).convert("RGB")
        image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = (index % cols) * thumb_w + (thumb_w - image.width) // 2
        y = (index // cols) * (thumb_h + 34) + 30
        sheet.paste(image, (x, y))
        draw.text((x + 8, y - 24), f"SCREEN {index + 1}", fill="white", font=font)
    sheet.save(out / f"{key}.jpg", quality=88)
