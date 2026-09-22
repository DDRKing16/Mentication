#!/usr/bin/env python3
"""Build the canonical evidence register, 17 design boards and final PDF."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "intervention-library/data/interventions.json"
BOARD_DIR = ROOT / "intervention-library/final/boards"
ASSET_DIR = ROOT / "intervention-library/final/assets"
EVIDENCE_DIR = ROOT / "intervention-library/evidence"
PDF_PATH = ROOT / "output/pdf/mentation-elite-intervention-library.pdf"
MANIFEST_PATH = ROOT / "intervention-library/final/manifest.json"

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

PALETTE = {
    "Calm": (126, 188, 158),
    "Lift": (212, 246, 77),
    "Ground": (218, 151, 104),
    "Focus": (111, 165, 222),
    "Sleep": (57, 45, 116),
}

HEROES = {
    "boxV2": ROOT / "design-boards/box-breathing-mentation-branded-concept.png",
    "progressive-muscle-relaxation-v2": ROOT / "public/media/images/pmr-body-neutral.png",
    "grounding54321V2": ROOT / "design-boards/grounding-54321-mentation-branded-visual-system.png",
    "factCheck": ROOT / "design-boards/thought-or-fact-mentation-branded-concept.png",
    "urgeSurf": ROOT / "design-boards/urge-surfing-mentation-branded-concept.png",
    "thenWhat": ROOT / "intervention-library/source-assets/Then_What/01_Optional_Hero_Concept.png",
    "activationMenu": ASSET_DIR / "ignition-point-hero.png",
    "changeScene": ROOT / "intervention-library/source-assets/Change_the_Scene/01_Stuck_State_and_Choose_Exit.png",
    "testPrediction": ROOT / "intervention-library/source-assets/Test_the_Prediction/01_Capture_and_Make_Testable.png",
    "openChannel": ASSET_DIR / "open-channel-hero.png",
    "countermove": ROOT / "intervention-library/source-assets/Countermove/01-opening-pull.png",
    "pulseShift": ASSET_DIR / "pulse-shift-hero.png",
    "nextAction": ROOT / "intervention-library/source-assets/Next_Easiest_Step/01_Focus_Target_and_Barrier.png",
    "signalLock": ASSET_DIR / "signal-lock-hero.png",
    "tomorrowParking": ROOT / "intervention-library/source-assets/Tomorrow_Parking_Lot/03_Parked_and_Darkness.png",
    "nightChannel": ASSET_DIR / "night-channel-hero.png",
    "happyBump": ASSET_DIR / "happy-bump-hero.png",
}


def font(size: int, bold: bool = False, black: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BLACK if black else FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(path, size)


def slug(name: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in name).strip("-").replace("--", "-")


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words = text.replace("\n", " \n ").split()
    lines: list[str] = []
    line = ""
    for word in words:
        if word == "\n":
            if line:
                lines.append(line)
                line = ""
            lines.append("")
            continue
        trial = word if not line else f"{line} {word}"
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_wrapped(draw, xy, text, fnt, fill, width, line_gap=7, max_lines=None):
    x, y = xy
    lines = wrap(draw, text, fnt, width)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .") + "..."
    line_h = fnt.getbbox("Ag")[3] - fnt.getbbox("Ag")[1]
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += line_h + line_gap
    return y


def rounded_panel(draw, box, fill=(255, 255, 255), outline=(18, 27, 34), radius=24, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def section_title(draw, x, y, number, title, color):
    draw.ellipse((x, y, x + 54, y + 54), fill=(17, 98, 225))
    draw.text((x + 17, y + 7), str(number), font=font(30, black=True), fill="white")
    draw.text((x + 70, y + 8), title.upper(), font=font(26, bold=True), fill=(15, 23, 30))
    draw.rounded_rectangle((x + 68, y + 44, x + 225, y + 50), radius=3, fill=color)


def fit_hero(path: Path, size=(370, 690)) -> Image.Image:
    if not path.exists():
        canvas = Image.new("RGB", size, (7, 27, 31))
        d = ImageDraw.Draw(canvas)
        d.ellipse((70, 230, 300, 460), outline=(159, 240, 205), width=5)
        return canvas
    im = Image.open(path).convert("RGB")
    return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def render_board(item: dict) -> Path:
    w, h = 1920, 1200
    paper = Image.new("RGB", (w, h), (248, 246, 237))
    d = ImageDraw.Draw(paper)
    goal_color = PALETTE[item["goal"]]

    # Header
    d.rounded_rectangle((35, 25, w - 35, 130), radius=28, fill=(255, 253, 244), outline=(12, 18, 23), width=3)
    d.text((70, 48), item["name"].upper(), font=font(44, black=True), fill=(5, 13, 18))
    tag = f'{item["goal"].upper()}  /  {item["designSystem"].upper()}'
    tag_w = d.textlength(tag, font=font(20, bold=True)) + 48
    d.rounded_rectangle((w - 70 - tag_w, 55, w - 70, 105), radius=25, fill=goal_color)
    d.text((w - 46 - tag_w, 69), tag, font=font(20, bold=True), fill="white" if item["goal"] == "Sleep" else (7, 17, 22))

    purpose_box = (35, 155, 565, 570)
    flow_box = (35, 595, 565, 1165)
    va_box = (590, 155, 1185, 570)
    upgrade_box = (590, 595, 1185, 1165)
    hero_box = (1210, 155, 1885, 895)
    evidence_box = (1210, 920, 1885, 1165)
    for box in (purpose_box, flow_box, va_box, upgrade_box, hero_box, evidence_box):
        rounded_panel(d, box)

    section_title(d, 55, 175, 1, "Purpose", goal_color)
    y = draw_wrapped(d, (65, 250), item["purpose"], font(20), (25, 34, 38), 470, 8)
    d.rounded_rectangle((65, y + 16, 535, y + 58), radius=8, fill=(17, 98, 225))
    d.text((80, y + 25), "PSYCHOEDUCATION", font=font(17, bold=True), fill="white")
    draw_wrapped(d, (65, y + 75), item["psychoeducation"], font(18), (25, 34, 38), 470, 7, 5)

    section_title(d, 55, 615, 2, "User flow", goal_color)
    fy = 690
    for idx, step in enumerate(item["flow"]):
        box_h = 47
        d.rounded_rectangle((75, fy, 525, fy + box_h), radius=14, fill=(250, 251, 249), outline=goal_color, width=3)
        d.text((94, fy + 12), str(idx + 1), font=font(17, bold=True), fill=(17, 98, 225))
        step_font = font(16, bold=True)
        lines = wrap(d, step, step_font, 385)[:2]
        line_y = fy + 8 if len(lines) == 2 else fy + 14
        for line in lines:
            d.text((125, line_y), line, font=step_font, fill=(19, 28, 34))
            line_y += 17
        if idx < len(item["flow"]) - 1:
            d.line((300, fy + box_h, 300, fy + box_h + 18), fill=(17, 98, 225), width=3)
            d.polygon([(294, fy + box_h + 13), (306, fy + box_h + 13), (300, fy + box_h + 20)], fill=(17, 98, 225))
        fy += 58

    section_title(d, 610, 175, 4, "Visual and audio direction", goal_color)
    draw_wrapped(d, (620, 255), item["visualAudio"], font(21), (24, 33, 38), 535, 9)

    section_title(d, 610, 615, 3, "Mentication upgrade", goal_color)
    uy = draw_wrapped(d, (620, 695), item["upgrade"], font(22), (24, 33, 38), 535, 10)
    d.rounded_rectangle((620, uy + 28, 1150, uy + 150), radius=20, fill=tuple(int(c * 0.22 + 255 * 0.78) for c in goal_color))
    d.text((645, uy + 46), "ELITE STANDARD", font=font(18, bold=True), fill=(12, 44, 37))
    draw_wrapped(d, (645, uy + 78), "One mechanism. One memorable interaction. Honest outcomes, accessible alternatives and a consented route onwards.", font(17), (12, 44, 37), 480, 5, 3)

    # Visual preview
    d.text((1240, 180), "SIGNATURE VISUAL", font=font(23, bold=True), fill=(17, 98, 225))
    hero = fit_hero(HEROES[item["id"]], (605, 640))
    hero = ImageOps.expand(hero, border=3, fill=(15, 23, 30))
    mask = Image.new("L", hero.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, hero.width, hero.height), radius=28, fill=255)
    paper.paste(hero, (1245, 225), mask)

    d.text((1240, 940), "EVIDENCE REGISTER", font=font(20, bold=True), fill=(17, 98, 225))
    grade_end = draw_wrapped(
        d, (1240, 976), item["evidenceGrade"], font(16, bold=True),
        (20, 29, 34), 610, 3, 2,
    )
    draw_wrapped(d, (1240, grade_end + 8), item["limits"], font(15), (55, 61, 64), 610, 5, 4)
    d.text((1240, 1131), "Reviewed 6 Sep 2026  |  Next review Sep 2027", font=font(14, bold=True), fill=(91, 96, 98))

    out = BOARD_DIR / f"{slug(item['name'])}-elite-board.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    paper.save(out, quality=95)
    return out


def write_register(items: list[dict]):
    lines = [
        "# Mentication Psychoeducation Evidence Register",
        "",
        "Version: 2026-09-06 | Scope: 17 flagship interventions | Next scheduled review: September 2027",
        "",
        "Grades describe the fit between the claim and the cited evidence, not product efficacy: A = direct evidence for the named general technique; B = evidence for the main mechanism or a broader intervention; C = mechanism-adjacent or exact branded sequence not directly tested.",
        "",
    ]
    for idx, item in enumerate(items, 1):
        lines.extend([
            f"## {idx}. {item['name']}",
            "",
            f"**User-facing psychoeducation:** {item['psychoeducation']}",
            "",
            f"**Evidence fit:** {item['evidenceGrade']}",
            "",
            f"**Limits and safety:** {item['limits']}",
            "",
            "**Sources:** " + ", ".join(f"[{url}]({url})" for url in item["sources"]),
            "",
            "**Review status:** Approved for provisional product use with the stated limitations. Reviewed 2026-09-06; next review due 2027-09-06 or sooner if the mechanism or copy changes.",
            "",
        ])
    (EVIDENCE_DIR / "psychoeducation-evidence-register.md").write_text("\n".join(lines), encoding="utf-8")


def write_sequence_register(items: list[dict]):
    lines = [
        "# Revised Sequence Approval Register",
        "",
        "Review date: 2026-09-06",
        "",
        "All 17 revised pathways were checked against the Elite Intervention Standard: fit before risk, one psychological job per step, core mechanism reached quickly, honest outcomes, accessible equivalent routes, consented handoffs and no hidden sensitive-memory use.",
        "",
        "| Intervention | Approved canonical sequence | Status |",
        "|---|---|---|",
    ]
    for item in items:
        flow = " -> ".join(item["flow"])
        lines.append(f"| {item['name']} | {flow} | Approved for implementation |")
    lines.extend([
        "",
        "## Cross-library conditions",
        "",
        "- Safety and suitability branches override the default sequence.",
        "- This Is Not Helping pauses the mechanism and preserves the return point.",
        "- Completed, partial, unchanged, could not begin, stopped deliberately and support-needed are valid outcomes.",
        "- Handoffs require a reason, a preview of carried fields and explicit consent.",
        "- Raw sensitive text remains session-only unless the user explicitly saves it.",
    ])
    (ROOT / "intervention-library/sequence-approval-register.md").write_text("\n".join(lines), encoding="utf-8")


def copy_curated_assets():
    curated = {
        "box-breathing-existing-hero.png": HEROES["boxV2"],
        "pmr-neutral-body.png": HEROES["progressive-muscle-relaxation-v2"],
        "grounding-existing-system.png": HEROES["grounding54321V2"],
        "thought-or-fact-existing-system.png": HEROES["factCheck"],
        "urge-surfing-existing-system.png": HEROES["urgeSurf"],
        "then-what-existing-hero.png": HEROES["thenWhat"],
        "change-scene-existing-screens.png": HEROES["changeScene"],
        "test-prediction-existing-screens.png": HEROES["testPrediction"],
        "countermove-existing-screen.png": HEROES["countermove"],
        "next-easiest-step-existing-screens.png": HEROES["nextAction"],
        "tomorrow-parking-lot-existing-screens.png": HEROES["tomorrowParking"],
    }
    for name, source in curated.items():
        target = ASSET_DIR / name
        if source.exists() and not target.exists():
            shutil.copy2(source, target)


def build_pdf(items: list[dict], board_paths: list[Path]):
    from reportlab.lib.colors import Color, HexColor, white
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader

    PDF_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("Arial", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("ArialBold", FONT_BOLD))
    pdfmetrics.registerFont(TTFont("ArialBlack", FONT_BLACK))
    page_w, page_h = landscape(A4)
    c = canvas.Canvas(str(PDF_PATH), pagesize=(page_w, page_h))
    c.setTitle("Mentication Elite Intervention Library")
    c.setAuthor("Mentication")

    # Cover
    c.setFillColor(HexColor("#F8F6ED")); c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    c.setFillColor(HexColor("#063D35")); c.roundRect(28, 28, page_w - 56, page_h - 56, 22, fill=1, stroke=0)
    c.setFillColor(HexColor("#D4F64D")); c.circle(page_w - 115, page_h - 115, 58, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("ArialBlack", 32); c.drawString(65, page_h - 135, "MENTICATION")
    c.setFont("ArialBold", 19); c.drawString(66, page_h - 174, "ELITE INTERVENTION LIBRARY")
    c.setFont("Arial", 12); c.setFillColor(HexColor("#D8E7E1"));
    c.drawString(66, page_h - 215, "17 approved flagship pathways - evidence, experience systems and production direction")
    c.drawString(66, 82, "Version 2026-09-06  |  Internal product and implementation document")
    c.showPage()

    # Contract summary
    c.setFillColor(HexColor("#F8F6ED")); c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    c.setFillColor(HexColor("#063D35")); c.setFont("ArialBlack", 24); c.drawString(42, page_h - 55, "PERSONALISATION, MEMORY AND PRIVACY CONTRACT")
    rules = [
        ("Remember only with a clear benefit", "Session text stays temporary unless the user deliberately saves it."),
        ("Four memory tiers", "Session state, user-saved artefacts, confirmed preferences and optional pattern summaries."),
        ("No hidden psychological inference", "No diagnoses, nervous-system claims, risk scores, emotion labels or personality conclusions from behaviour."),
        ("Visible and correctable", "Every suggestion can explain its source; saved items and patterns can be edited, rejected or deleted."),
        ("Consent at handoff", "The user sees what will carry over, why it helps and can remove fields before transfer."),
        ("Evidence thresholds", "One observation is a fact, three similar outcomes may form a tentative pattern, five may support a stronger descriptive pattern."),
    ]
    y = page_h - 100
    for i, (head, body) in enumerate(rules, 1):
        c.setFillColor(HexColor("#1162E1")); c.circle(58, y + 5, 14, fill=1, stroke=0)
        c.setFillColor(white); c.setFont("ArialBold", 10); c.drawCentredString(58, y + 1, str(i))
        c.setFillColor(HexColor("#102128")); c.setFont("ArialBold", 13); c.drawString(84, y + 4, head)
        c.setFont("Arial", 10.5); c.setFillColor(HexColor("#4E5B60")); c.drawString(84, y - 13, body)
        y -= 62
    c.setFillColor(HexColor("#687378")); c.setFont("Arial", 8.5)
    c.drawString(42, 35, "Canonical source: docs/personalisation-memory-privacy-contract.md. Product standard only; jurisdiction-specific legal review remains required.")
    c.showPage()

    # Boards
    for item, path in zip(items, board_paths):
        c.drawImage(ImageReader(str(path)), 0, 0, width=page_w, height=page_h, preserveAspectRatio=False, mask="auto")
        c.showPage()

    # Evidence appendix, two compact entries per page
    for index in range(0, len(items), 2):
        c.setFillColor(HexColor("#F8F6ED")); c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
        c.setFillColor(HexColor("#063D35")); c.setFont("ArialBlack", 21); c.drawString(38, page_h - 48, "EVIDENCE REGISTER")
        for slot, item in enumerate(items[index:index + 2]):
            top = page_h - 85 - slot * 245
            card = tuple((x * 0.38 + 255 * 0.62) / 255 for x in PALETTE[item["goal"]])
            c.setFillColor(Color(*card)); c.roundRect(38, top - 210, page_w - 76, 200, 18, fill=1, stroke=0)
            c.setFillColor(HexColor("#102128")); c.setFont("ArialBlack", 16); c.drawString(55, top - 35, item["name"].upper())
            c.setFont("ArialBold", 9); c.drawString(55, top - 55, item["evidenceGrade"])
            text = c.beginText(55, top - 82); text.setFont("Arial", 9.5); text.setLeading(13); text.setFillColor(HexColor("#203037"))
            for paragraph in (item["psychoeducation"], "LIMIT: " + item["limits"], "SOURCES: " + " | ".join(item["sources"])):
                words = paragraph.split(); line = ""
                for word in words:
                    trial = word if not line else line + " " + word
                    if pdfmetrics.stringWidth(trial, "Arial", 9.5) < page_w - 115:
                        line = trial
                    else:
                        text.textLine(line); line = word
                if line: text.textLine(line)
                text.textLine("")
            c.drawText(text)
        c.setFillColor(HexColor("#697478")); c.setFont("Arial", 8); c.drawString(38, 26, f"Reviewed 6 Sep 2026  |  Page {2 + len(items) + index // 2 + 1}")
        c.showPage()
    c.save()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--documents", action="store_true", help="Write Markdown registers only")
    parser.add_argument("--all", action="store_true", help="Build registers, PNG boards and PDF")
    args = parser.parse_args()
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    items = payload["interventions"]
    assert len(items) == 18, f"Expected 18 interventions, found {len(items)}"
    assert len({item['id'] for item in items}) == 18, "Duplicate intervention id"
    write_register(items)
    write_sequence_register(items)
    if args.all:
        copy_curated_assets()
        paths = [render_board(item) for item in items]
        build_pdf(items, paths)
        final_files = sorted([*paths, *ASSET_DIR.glob("*")])
        manifest = {
            "schemaVersion": 1,
            "interventionCount": len(items),
            "boardCount": len(paths),
            "assetCount": len(list(ASSET_DIR.glob("*"))),
            "pdf": str(PDF_PATH.relative_to(ROOT)),
            "files": [
                {
                    "path": str(path.relative_to(ROOT)),
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                }
                for path in final_files
            ],
        }
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"Built {len(paths)} boards and {PDF_PATH}")
    else:
        print("Built evidence and sequence registers")


if __name__ == "__main__":
    main()
