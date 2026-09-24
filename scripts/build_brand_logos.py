#!/usr/bin/env python3
"""Build the coloured logo artwork used by the brand Threshold.

The logo itself is never redrawn. This script takes the supplied artwork
(public/media/brand/mentation-navy-coral-transparent.png) and splits it into
its three real parts, then recolours each part for every colourway in
src/lib/brandColourways.json:

  doorway  = the brushed arch + the flowing figure (top-right block)
  wordmark = the hand-lettered "MentiCation"
  swash    = the coral brush swash under the wordmark

Output: public/media/brand/logo/<colourway>/{doorway,wordmark,swash}.png, each
cropped to its own box, plus src/lib/brandLogoLayout.json (the boxes, in
artwork pixels, so the app can put the parts back exactly where they were).

Run from the repo root:  python3 scripts/build_brand_logos.py
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/media/brand/mentation-navy-coral-transparent.png"
OUT = ROOT / "public/media/brand/logo"
COLOURWAYS = json.loads((ROOT / "src/lib/brandColourways.json").read_text())["colourways"]

# The doorway block sits top-right of the artwork. Nothing else lives there.
DOOR_Y, DOOR_X = 345, 640


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def is_coral(r, g, b):
    # In the source, ink is either cream (high green) or coral (low green).
    return g < 176


def split(src):
    w, h = src.size
    px = src.load()
    layers = {"doorway": [], "wordmark": [], "swash": []}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 4:
                continue
            coral = is_coral(r, g, b)
            if y < DOOR_Y and x > DOOR_X:
                layers["doorway"].append((x, y, a, "arch" if coral else "figure"))
            elif coral:
                layers["swash"].append((x, y, a, "swash"))
            else:
                layers["wordmark"].append((x, y, a, "wordmark"))
    return layers


def main():
    src = Image.open(SOURCE).convert("RGBA")
    w, h = src.size
    layers = split(src)

    boxes = {}
    for name, pixels in layers.items():
        xs = [p[0] for p in pixels]
        ys = [p[1] for p in pixels]
        boxes[name] = [min(xs), min(ys), max(xs) + 1, max(ys) + 1]

    for cid, colours in COLOURWAYS.items():
        folder = OUT / cid
        folder.mkdir(parents=True, exist_ok=True)
        for name, pixels in layers.items():
            x0, y0, x1, y1 = boxes[name]
            img = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
            o = img.load()
            for x, y, a, role in pixels:
                o[x - x0, y - y0] = (*hex_rgb(colours[role]), a)
            img.save(folder / f"{name}.png", optimize=True)

    layout = {
        "width": w,
        "height": h,
        "layers": {n: {"x": b[0], "y": b[1], "w": b[2] - b[0], "h": b[3] - b[1]} for n, b in boxes.items()},
    }
    (ROOT / "src/lib/brandLogoLayout.json").write_text(json.dumps(layout, indent=2) + "\n")
    print(f"built {len(COLOURWAYS)} colourways x 3 parts; layout: {layout['layers']}")


if __name__ == "__main__":
    main()
