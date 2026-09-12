from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design-boards"
OUT.mkdir(exist_ok=True)
REF = ROOT / "public/media/images/box-v2-glass-square-reference.png"

W, H = 2000, 1250
BLACK = "#111111"
BLUE = "#3f7fe8"
MINT = "#a7ecc9"
LIME = "#b8ff52"
PINK = "#f0c9f5"
CREAM = "#fff4ca"
WHITE = "#ffffff"
GREY = "#eef2f4"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def rounded(draw, box, radius=20, fill=WHITE, outline=BLACK, width=4):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def fit_text(draw, text, box, size=25, bold=False, fill=BLACK, spacing=7):
    x1, y1, x2, y2 = box
    f = font(size, bold)
    words, lines, current = text.split(), [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textbbox((0, 0), trial, font=f)[2] <= x2-x1:
            current = trial
        else:
            if current: lines.append(current)
            current = word
    if current: lines.append(current)
    y = y1
    for line in lines:
        draw.text((x1, y), line, font=f, fill=fill)
        y += size + spacing
        if y > y2: break
    return y

def label(draw, xy, text, fill=BLUE, width=300):
    x, y = xy
    rounded(draw, (x, y, x+width, y+56), 16, fill, fill, 0)
    tw = draw.textbbox((0,0), text, font=font(25, True))[2]
    draw.text((x+(width-tw)/2, y+13), text, font=font(25, True), fill=WHITE)

img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)

# Title
d.text((65, 35), "INTERVENTION DESIGN BOARD", font=font(72, True), fill=BLACK)

# Center identity
d.ellipse((570, 185, 1010, 510), fill=WHITE, outline=BLACK, width=5)
label(d, (635, 260), "BOX BREATHING", BLUE, 320)
label(d, (710, 345), "CALM", BLUE, 170)

# Purpose
rounded(d, (40, 175, 500, 540), 8, WHITE, BLACK, 5)
d.text((80, 205), "1", font=font(58, True), fill=BLUE)
d.text((140, 218), "PURPOSE", font=font(33, True), fill=BLACK)
purpose = (
    "WHAT — A guided 4–4–4–4 breathing reset.\n\n"
    "WHO — For stress, anxiety and high physical arousal.\n\n"
    "WHY — An external rhythm reduces counting and gives attention one clear job.\n\n"
    "PSYCHOEDUCATION — Four equal phases create predictability. The user does not need to be perfect; if they lose count, they simply rejoin the light."
)
fit_text(d, purpose, (72, 280, 468, 520), 21, False, BLACK, 4)

# Audio direction
rounded(d, (1060, 175, 1455, 540), 8, WHITE, BLACK, 5)
d.text((1080, 194), "4", font=font(58, True), fill=BLUE)
d.rectangle((1150, 210, 1418, 295), fill=MINT)
d.text((1170, 223), "VIDEO & AUDIO", font=font(26, True), fill=BLACK)
d.text((1170, 257), "DIRECTION", font=font(26, True), fill=BLACK)
direction = (
    "Deep midnight field. One tactile emerald glass square expands and contracts with the breath.\n\n"
    "A small light traces the perimeter clockwise, giving the eyes one effortless job.\n\n"
    "Low ambient soundscape, word-synced narration and soft phase-change haptics."
)
fit_text(d, direction, (1090, 315, 1428, 520), 19, False, BLACK, 3)

# Upgrade
rounded(d, (1060, 585, 1455, 1190), 8, WHITE, BLACK, 5)
d.text((1080, 600), "3", font=font(58, True), fill=BLUE)
d.rectangle((1150, 615, 1418, 696), fill=LIME)
d.text((1170, 628), "MENTICATION", font=font(26, True), fill="#d81717")
d.text((1170, 660), "UPGRADE", font=font(26, True), fill="#d81717")
upgrade = (
    "A RESET THAT LEARNS WHAT WORKS\n\n"
    "• The square gives immediate visual feedback: it opens, suspends and settles with every phase.\n\n"
    "• Each completed circuit produces a restrained glow reward—progress the user can feel without gamifying distress.\n\n"
    "• Before/after intensity creates a personal regulation fingerprint: when, where and how strongly Box Breathing helps this user.\n\n"
    "• Future recommendations use that history and remember their preferred audio, caption and timer settings.\n\n"
    "• ‘This isn’t helping’ switches directly to a different mechanism, such as 5-4-3-2-1 grounding."
)
fit_text(d, upgrade, (1090, 725, 1425, 1160), 19, False, BLACK, 4)

# User flow
rounded(d, (40, 585, 1015, 1190), 8, WHITE, BLACK, 5)
d.text((62, 600), "2", font=font(58, True), fill=BLUE)
d.rounded_rectangle((130, 610, 905, 705), radius=45, fill=PINK)
d.text((160, 630), "USER FLOW", font=font(30, True), fill=BLACK)
d.text((160, 668), "From the home screen to the completed reset", font=font(19, True), fill=BLACK)

steps = [
    ("HOME", "Tap Calm"),
    ("CHECK-IN", "Set intensity"),
    ("RESET", "Box Breathing\nis recommended"),
    ("PREP", "See 4 · 4 · 4 · 4\nand simple instruction"),
    ("BEGIN", "Tap Begin"),
    ("BREATHE", "Inhale → Hold →\nExhale → Hold"),
    ("REPEAT", "4 circuits with the\nsingle breathing square"),
    ("REFLECT", "Quick felt-shift\ncheck"),
    ("FINISH", "Done or choose\nanother reset"),
]
sx, sy = 85, 785
box_w, box_h, gap = 172, 93, 20
for i, (head, body) in enumerate(steps):
    row, col = divmod(i, 5)
    x = sx + col * (box_w + gap)
    y = sy + row * 205
    color = [CREAM, "#ffb190", "#a9c4ef", "#bde4a5", MINT][col]
    rounded(d, (x, y, x+box_w, y+box_h), 18, fill=color, outline=BLACK, width=4)
    tw = d.textbbox((0,0), head, font=font(19, True))[2]
    d.text((x+(box_w-tw)/2, y+30), head, font=font(19, True), fill=BLACK)
    body_y = y + 112
    tw = d.multiline_textbbox((0,0), body, font=font(17), align="center", spacing=3)[2]
    d.multiline_text((x+(box_w-tw)/2, body_y), body, font=font(17), fill=BLACK, align="center", spacing=3)
    if col < 4:
        d.line((x+box_w, y+46, x+box_w+gap-5, y+46), fill=BLACK, width=5)
        d.polygon([(x+box_w+gap-5,y+38),(x+box_w+gap+5,y+46),(x+box_w+gap-5,y+54)], fill=BLACK)
    elif row == 0:
        d.line((x+box_w/2, y+box_h, x+box_w/2, y+185), fill=BLACK, width=5)
        d.line((x+box_w/2, y+185, sx+box_w/2, y+185), fill=BLACK, width=5)
        d.polygon([(sx+box_w/2-8,y+177),(sx+box_w/2,y+187),(sx+box_w/2+8,y+177)], fill=BLACK)

# Visuals: actual production image + exact crops
rounded(d, (1510, 175, 1970, 1190), 8, WHITE, BLACK, 5)
label(d, (1565, 195), "ACTUAL VISUALS", BLUE, 350)
d.text((1560, 268), "Implemented single-square visual", font=font(18, True), fill=BLACK)
ref = Image.open(REF).convert("RGB")
main = ref.copy()
main.thumbnail((330, 690), Image.Resampling.LANCZOS)
mx = 1575 + (330-main.width)//2
img.paste(main, (mx, 305))
d.rounded_rectangle((mx-4, 301, mx+main.width+4, 305+main.height+4), radius=18, outline=BLACK, width=4)

# Bottom crop callouts using the same exact source
crop = ref.crop((80, 250, ref.width-80, 1120))
crop.thumbnail((160, 150), Image.Resampling.LANCZOS)
img.paste(crop, (1540, 1015))
d.text((1540, 1168), "TRACER + SQUARE", font=font(15, True), fill=BLACK)
crop2 = ref.crop((70, 1070, ref.width-70, 1650))
crop2.thumbnail((205, 150), Image.Resampling.LANCZOS)
img.paste(crop2, (1740, 1015))
d.text((1740, 1168), "PROMPTS + CONTROLS", font=font(15, True), fill=BLACK)

board_path = OUT / "box-breathing-intervention-design-board-corrected.png"
img.save(board_path, quality=95)

# Clean visual sheet—only the exact production reference, with feature callouts.
SW, SH = 1800, 1125
sheet = Image.new("RGB", (SW, SH), "#f7f7f4")
s = ImageDraw.Draw(sheet)
s.text((70, 50), "BOX BREATHING — ACTUAL PRODUCTION VISUAL", font=font(54, True), fill=BLACK)
s.text((72, 120), "SINGLE GLASS SQUARE • 4 · 4 · 4 · 4 • CALM", font=font(24, True), fill=BLUE)
phone = ref.copy(); phone.thumbnail((535, 880), Image.Resampling.LANCZOS)
px, py = 130, 190
sheet.paste(phone, (px, py))
s.rounded_rectangle((px-5, py-5, px+phone.width+5, py+phone.height+5), radius=24, outline=BLACK, width=5)

callouts = [
    ("1  IMMEDIATE ORIENTATION", "The user sees BREATHE and the equal 4-second rhythm before doing anything.", 770, 230, MINT),
    ("2  ONE CLEAR VISUAL JOB", "Follow the illuminated point clockwise. Losing count is allowed—just rejoin.", 770, 410, CREAM),
    ("3  THE BREATH BECOMES VISIBLE", "The single glass square opens, suspends, contracts and rests with the four breathing phases.", 770, 590, PINK),
    ("4  SUPPORT WITHOUT TRAPPING", "The user can say ‘This isn’t helping’, move on, or adjust guidance and sound from the control dock.", 770, 790, "#a9c4ef"),
]
for head, body, x, y, fill in callouts:
    rounded(s, (x, y, 1700, y+145), 22, fill=fill, outline=BLACK, width=4)
    s.text((x+28, y+22), head, font=font(25, True), fill=BLACK)
    fit_text(s, body, (x+28, y+65, 1665, y+125), 20, False, BLACK, 3)
    s.line((px+phone.width+20, y+72, x-18, y+72), fill=BLACK, width=4)
    s.polygon([(x-18,y+64),(x-5,y+72),(x-18,y+80)], fill=BLACK)

sheet_path = OUT / "box-breathing-actual-production-visual-sheet.png"
sheet.save(sheet_path, quality=95)
print(board_path)
print(sheet_path)
