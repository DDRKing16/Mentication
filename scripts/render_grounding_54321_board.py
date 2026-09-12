from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design-boards"
OUT.mkdir(exist_ok=True)
FIGURE_PATH = ROOT / "public/media/images/grounding-figure.png"

W, H = 2000, 1250
BLACK = "#111111"
INK = "#1A2E26"
BLUE = "#3f7fe8"
MINT = "#a7ecc9"
LIME = "#b8ff52"
PINK = "#f0c9f5"
CREAM = "#fff4ca"
IVORY = "#FDF9F3"
SAGE = "#9CC4A8"
APRICOT = "#F2C9A0"
POWDER = "#A8C8E0"
LAVENDER = "#C9B8E0"
GOLD = "#E8D9A8"
WHITE = "#ffffff"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"

def font(size, bold=False, serif=False):
    return ImageFont.truetype(SERIF if serif else (BOLD if bold else FONT), size)

def rounded(draw, box, radius=20, fill=WHITE, outline=BLACK, width=4):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def wrap_lines(draw, text, max_width, f):
    out = []
    for paragraph in text.split("\n"):
        if not paragraph:
            out.append("")
            continue
        current = ""
        for word in paragraph.split():
            trial = (current + " " + word).strip()
            if draw.textbbox((0, 0), trial, font=f)[2] <= max_width:
                current = trial
            else:
                if current: out.append(current)
                current = word
        if current: out.append(current)
    return out

def fit_text(draw, text, box, size=25, bold=False, fill=BLACK, spacing=7, serif=False):
    x1, y1, x2, y2 = box
    f = font(size, bold, serif)
    lines = wrap_lines(draw, text, x2-x1, f)
    y = y1
    for line in lines:
        draw.text((x1, y), line, font=f, fill=fill)
        y += size + spacing
        if y > y2: break
    return y

def label(draw, xy, text, fill=BLUE, width=300):
    x, y = xy
    rounded(draw, (x, y, x+width, y+56), 16, fill, fill, 0)
    tw = draw.textbbox((0,0), text, font=font(24, True))[2]
    draw.text((x+(width-tw)/2, y+14), text, font=font(24, True), fill=WHITE)

def paste_contain(canvas, source, box):
    x1, y1, x2, y2 = box
    im = source.copy()
    im.thumbnail((x2-x1, y2-y1), Image.Resampling.LANCZOS)
    x = x1 + ((x2-x1)-im.width)//2
    y = y1 + ((y2-y1)-im.height)//2
    if im.mode == "RGBA":
        canvas.paste(im, (x, y), im)
    else:
        canvas.paste(im, (x, y))
    return (x, y, x+im.width, y+im.height)

figure = Image.open(FIGURE_PATH).convert("RGBA")

# ------------------------------------------------------------------
# Intervention design board
# ------------------------------------------------------------------
img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)
d.text((65, 35), "INTERVENTION DESIGN BOARD", font=font(72, True), fill=BLACK)

# Purpose
rounded(d, (40, 175, 500, 540), 8, WHITE, BLACK, 5)
d.text((80, 205), "1", font=font(58, True), fill=BLUE)
d.text((140, 218), "PURPOSE", font=font(33, True), fill=BLACK)
purpose = (
    "WHAT — A guided 5–4–3–2–1 sensory return to the present.\n\n"
    "WHO — For overthinking, panic, overwhelm or feeling disconnected.\n\n"
    "WHY — Concrete sensory evidence competes with internal threat loops and restores contact with the room.\n\n"
    "PSYCHOEDUCATION — The aim is not to force calm. Ordinary details count; each noticed sensation is a step back into here and now."
)
fit_text(d, purpose, (72, 280, 468, 520), 16, False, BLACK, 2)

# Identity bubble
d.ellipse((560, 180, 1020, 520), fill=WHITE, outline=BLACK, width=5)
label(d, (615, 258), "5–4–3–2–1 GROUNDING", BLUE, 360)
label(d, (710, 345), "GROUND", BLUE, 170)

# Video/audio direction
rounded(d, (1060, 175, 1455, 540), 8, WHITE, BLACK, 5)
d.text((1080, 194), "4", font=font(58, True), fill=BLUE)
d.rectangle((1150, 210, 1418, 295), fill=MINT)
d.text((1170, 223), "VIDEO & AUDIO", font=font(26, True), fill=BLACK)
d.text((1170, 257), "DIRECTION", font=font(26, True), fill=BLACK)
direction = (
    "Warm ivory pearl field. One continuous seated glass figure remains centred throughout.\n\n"
    "SEE: 5 lights • FEEL: 4 ripples • HEAR: 3 waves • SMELL: 2 wisps • TASTE: 1 droplet.\n\n"
    "The figure becomes clearer and more saturated across stages. Word-synced narration, ambient sound and distinct sense haptics."
)
fit_text(d, direction, (1090, 315, 1428, 520), 16, False, BLACK, 2)

# Upgrade
rounded(d, (1060, 585, 1455, 1190), 8, WHITE, BLACK, 5)
d.text((1080, 600), "3", font=font(58, True), fill=BLUE)
d.rectangle((1150, 615, 1418, 696), fill=LIME)
d.text((1170, 628), "MENTICATION", font=font(26, True), fill="#d81717")
d.text((1170, 660), "UPGRADE", font=font(26, True), fill="#d81717")
upgrade = (
    "THE WORLD COMES BACK INTO FOCUS\n\n"
    "• The user can tap each sensory point as they find it—recognition without typing or memory load.\n\n"
    "• The pearl figure progressively sharpens and gains colour, making reconnection visible.\n\n"
    "• If a sense is unavailable, the system substitutes intelligently: smell or taste can become temperature, pressure or one steady breath.\n\n"
    "• Before/after intensity plus stage engagement builds a personal grounding fingerprint and learns which senses work fastest.\n\n"
    "• ‘This isn’t helping’ switches to Orienting Scan or another mechanism without restarting the journey."
)
fit_text(d, upgrade, (1090, 725, 1425, 1160), 15, False, BLACK, 2)

# User flow
rounded(d, (40, 585, 1015, 1190), 8, WHITE, BLACK, 5)
d.text((62, 600), "2", font=font(58, True), fill=BLUE)
d.rounded_rectangle((130, 610, 905, 705), radius=45, fill=PINK)
d.text((160, 630), "USER FLOW", font=font(30, True), fill=BLACK)
d.text((160, 668), "The complete pathway, including all five sensory stages", font=font(18, True), fill=BLACK)

steps = [
    ("HOME", "Tap Ground"),
    ("CHECK-IN", "Set intensity"),
    ("RESET", "5-4-3-2-1 is\nrecommended"),
    ("BEGIN", "See the five\nsense markers"),
    ("SEE 5", "Notice five\nthings"),
    ("FEEL 4", "Notice four\nsensations"),
    ("HEAR 3", "Listen for\nthree sounds"),
    ("SMELL 2", "Notice two\nscents"),
    ("TASTE 1", "Notice one\ntaste"),
    ("RECENTER", "Widen to the room\n→ check-in → finish"),
]
sx, sy = 85, 785
box_w, box_h, gap = 172, 93, 20
colors = [CREAM, APRICOT, POWDER, "#bde4a5", MINT]
for i, (head, body) in enumerate(steps):
    row, col = divmod(i, 5)
    x = sx + col * (box_w + gap)
    y = sy + row * 205
    rounded(d, (x, y, x+box_w, y+box_h), 18, fill=colors[col], outline=BLACK, width=4)
    tw = d.textbbox((0,0), head, font=font(18, True))[2]
    d.text((x+(box_w-tw)/2, y+30), head, font=font(18, True), fill=BLACK)
    body_y = y + 112
    bbox = d.multiline_textbbox((0,0), body, font=font(16), align="center", spacing=3)
    tw = bbox[2]-bbox[0]
    d.multiline_text((x+(box_w-tw)/2, body_y), body, font=font(16), fill=BLACK, align="center", spacing=3)
    if col < 4:
        d.line((x+box_w, y+46, x+box_w+gap-5, y+46), fill=BLACK, width=5)
        d.polygon([(x+box_w+gap-5,y+38),(x+box_w+gap+5,y+46),(x+box_w+gap-5,y+54)], fill=BLACK)
    elif row == 0:
        d.line((x+box_w/2, y+box_h, x+box_w/2, y+185), fill=BLACK, width=5)
        d.line((x+box_w/2, y+185, sx+box_w/2, y+185), fill=BLACK, width=5)
        d.polygon([(sx+box_w/2-8,y+177),(sx+box_w/2,y+187),(sx+box_w/2+8,y+177)], fill=BLACK)

# Actual visual system
rounded(d, (1510, 175, 1970, 1190), 8, IVORY, BLACK, 5)
label(d, (1565, 195), "ACTUAL VISUAL SYSTEM", BLUE, 350)
d.text((1550, 270), "Persistent pearl figure + sensory overlays", font=font(17, True), fill=INK)
paste_contain(img, figure, (1545, 300, 1935, 700))

stage_specs = [
    ("SEE", "5 LIGHTS", SAGE),
    ("FEEL", "4 RIPPLES", LAVENDER),
    ("HEAR", "3 WAVES", POWDER),
    ("SMELL", "2 WISPS", APRICOT),
    ("TASTE", "1 DROP", GOLD),
]
for i, (sense, detail, color) in enumerate(stage_specs):
    y = 735 + i*76
    rounded(d, (1545, y, 1935, y+58), 18, fill=color, outline=INK, width=2)
    d.text((1570, y+10), sense, font=font(18, True), fill=INK)
    d.text((1760, y+11), detail, font=font(17, True), fill=INK)

board_path = OUT / "grounding-54321-intervention-design-board.png"
img.save(board_path, quality=95)

# ------------------------------------------------------------------
# Visual experience board
# ------------------------------------------------------------------
SW, SH = 1800, 1125
sheet = Image.new("RGB", (SW, SH), IVORY)
s = ImageDraw.Draw(sheet)
s.text((70, 48), "5–4–3–2–1 GROUNDING — PRODUCTION VISUAL SYSTEM", font=font(49, True), fill=BLACK)
s.text((72, 112), "ONE CONTINUOUS PEARL FIGURE • FIVE SENSORY TRANSFORMATIONS • GROUND", font=font(22, True), fill=BLUE)

# Reconstruct the core live composition without inventing a different asset.
rounded(s, (80, 175, 650, 1055), 30, fill="#F7F1E5", outline=INK, width=4)
s.text((115, 210), "•  ○  ○  ○  ○", font=font(21, True), fill=SAGE)
s.text((338, 260), "S E E", font=font(17), fill=INK)
s.multiline_text((120, 310), "Five things\nyou can see", font=font(40, serif=True), fill=INK, spacing=2)
s.text((345, 420), "12 S", font=font(17), fill="#64736c")
paste_contain(sheet, figure, (120, 450, 610, 830))
s.multiline_text((195, 835), "Notice five things\naround you.", font=font(23), fill=INK, align="center", spacing=8)
rounded(s, (135, 935, 595, 1005), 35, fill="#fbf8f2", outline="#ded8cd", width=2)
s.text((180, 958), "This isn’t helping", font=font(18), fill="#56655e")
s.line((390, 948, 390, 991), fill="#ded8cd", width=2)
s.text((455, 958), "Next", font=font(18), fill="#56655e")

stages = [
    ("5", "SEE", "Five ordinary things", "Five lights wake around the figure.", SAGE),
    ("4", "FEEL", "Four body sensations", "Soft ripples land at shoulders and hands.", LAVENDER),
    ("3", "HEAR", "Three surrounding sounds", "Powder-blue waves travel toward the centre.", POWDER),
    ("2", "SMELL", "Two scents", "Two apricot-lavender wisps rise and dissolve.", APRICOT),
    ("1", "TASTE", "One taste", "A champagne droplet travels into the figure.", GOLD),
]
for i, (num, sense, prompt, effect, color) in enumerate(stages):
    x = 735 + (i%2)*500
    y = 195 + (i//2)*260
    w = 450
    rounded(s, (x, y, x+w, y+220), 24, fill=WHITE, outline=INK, width=3)
    s.ellipse((x+24, y+26, x+104, y+106), fill=color, outline=INK, width=2)
    tw = s.textbbox((0,0), num, font=font(35, True))[2]
    s.text((x+64-tw/2, y+45), num, font=font(35, True), fill=INK)
    s.text((x+130, y+28), sense, font=font(27, True), fill=INK)
    s.text((x+130, y+67), prompt, font=font(19, True), fill=INK)
    fit_text(s, effect, (x+28, y+128, x+w-25, y+198), 18, False, INK, 3)

# Recenter card
x, y, w = 1235, 715, 450
rounded(s, (x, y, x+w, y+220), 24, fill=MINT, outline=INK, width=3)
s.text((x+28, y+28), "RECENTER", font=font(27, True), fill=INK)
s.text((x+28, y+72), "The whole figure is clear", font=font(19, True), fill=INK)
fit_text(s, "Widen focus to the room, feel feet and seat, then take one steady breath before the check-in.", (x+28, y+120, x+w-25, y+198), 18, False, INK, 3)

# System insight strip
rounded(s, (735, 980, 1685, 1060), 22, fill="#eef1e9", outline=INK, width=3)
s.text((765, 1001), "THE EXPERIENCE GETS CLEARER AS THE USER RECONNECTS WITH THE WORLD.", font=font(21, True), fill=INK)

sheet_path = OUT / "grounding-54321-production-visual-system.png"
sheet.save(sheet_path, quality=95)
print(board_path)
print(sheet_path)
