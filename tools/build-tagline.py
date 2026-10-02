"""Hand-drawn pen-signature lettering for the Home tagline -> public/media/brand/tagline-script.svg
Strokes are sampled and rendered as tapered, pressure-varying filled shapes (thicker on downstrokes).
Glyph units: baseline y=0, y up is negative; entry/exit joins at (0,-4)/(w,-4)."""
import math, random, re
G = {
 "T": (62, "M-12,-98 C20,-108 60,-108 104,-98 M56,-104 C47,-70 42,-30 46,-8 C48,-1 54,0 62,-5"),
 "a": (38, "M0,-4 C6,-10 14,-26 26,-30 C14,-34 4,-26 4,-14 C4,-2 16,0 24,-10 C28,-16 30,-24 31,-32 C30,-14 30,-6 33,-3 C35,-2 36,-4 38,-5"),
 "k": (52, "M0,-4 C8,-30 22,-80 34,-100 C42,-112 50,-104 42,-86 C32,-60 20,-26 20,-8 M20,-14 C28,-20 36,-28 38,-34 C36,-24 28,-16 24,-14 C32,-14 38,-10 34,-4 C40,-3 46,-3 52,-5"),
 "e": (32, "M0,-4 C8,-10 24,-16 24,-24 C24,-32 10,-32 7,-20 C4,-8 10,0 18,0 C25,0 29,-3 32,-4"),
 "y": (46, "M0,-4 C3,-16 5,-26 6,-30 C8,-12 14,-2 24,-8 C30,-14 32,-24 33,-32 C34,-10 28,18 16,38 C6,52 -12,44 -2,32 C10,22 34,10 46,-4"),
 "o": (34, "M0,-4 C5,-12 10,-26 18,-30 C8,-32 3,-20 4,-10 C5,0 16,0 22,-10 C25,-16 24,-26 18,-30 C26,-28 30,-14 34,-4"),
 "u": (44, "M0,-4 C3,-16 5,-26 6,-30 C5,-12 10,-2 20,-6 C26,-9 30,-20 32,-30 C32,-16 31,-8 34,-4 C37,-2 41,-3 44,-4"),
 "r": (30, "M0,-4 C3,-16 5,-26 6,-30 C6,-18 6,-10 8,-6 C10,-20 18,-34 28,-30 C32,-28 33,-24 33,-24"),
 "m": (64, "M0,-4 C3,-16 5,-26 6,-31 C6,-18 6,-8 8,-4 C10,-22 16,-34 24,-30 C28,-26 26,-12 26,-4 C28,-22 36,-34 44,-30 C48,-26 46,-12 46,-4 C50,-2 56,-3 64,-4"),
 "i": (22, "M0,-4 C3,-16 5,-26 6,-30 C6,-18 6,-8 10,-3 C13,-1 18,-3 22,-4 M9,-44 L9.8,-43"),
 "n": (46, "M0,-4 C3,-16 5,-26 6,-31 C6,-18 6,-8 8,-4 C10,-22 18,-34 26,-30 C30,-26 28,-12 28,-4 C32,-2 38,-3 46,-4"),
 "d": (50, "M0,-4 C6,-10 14,-26 26,-30 C14,-34 4,-26 4,-14 C4,-2 16,0 24,-10 C30,-20 36,-60 44,-92 C48,-106 56,-108 52,-94 C46,-70 38,-30 38,-12 C38,-4 44,-2 52,-4"),
 "l": (38, "M0,-4 C8,-30 22,-80 34,-100 C42,-112 50,-104 42,-86 C32,-60 22,-24 24,-10 C25,-2 32,-2 38,-5"),
 "h": (58, "M0,-4 C8,-30 22,-80 34,-100 C42,-112 50,-104 42,-86 C32,-60 20,-26 20,-8 C22,-22 30,-34 38,-28 C44,-24 40,-10 40,-6 C44,-2 50,-2 58,-5"),
}
SPACE = 30
BASE = 8.2
rnd = random.Random(7)

def bez(p0, p1, p2, p3, n=22):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0],
                    u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    return out

def subpaths(d):
    subs = []
    for part in re.findall(r"M[^M]+", d):
        nums = [float(x) for x in re.findall(r"-?\d+\.?\d*", part)]
        pts = [(nums[i], nums[i+1]) for i in range(0, len(nums), 2)]
        pl, cur, i = [pts[0]], pts[0], 1
        if "C" in part:
            while i + 2 < len(pts) + 0 and i + 2 <= len(pts) - 1 + 0:
                seg = bez(cur, pts[i], pts[i+1], pts[i+2]); pl += seg[1:]; cur = pts[i+2]; i += 3
        else:  # M x,y L x,y or lone dot
            if len(pts) > 1: pl = [pts[0], pts[1]]
        subs.append(pl)
    return subs

def tapered(pl, sc=1.0):
    """Filled outline of a pen stroke; thicker on downstrokes, pointed at ends."""
    n = len(pl)
    if n < 2: return ""
    L, R, acc, total = [], [], [0.0], 0.0
    for i in range(1, n):
        total += math.dist(pl[i], pl[i-1]); acc.append(total)
    for i, p in enumerate(pl):
        a, b = pl[max(i-1, 0)], pl[min(i+1, n-1)]
        dx, dy = b[0]-a[0], b[1]-a[1]; ln = math.hypot(dx, dy) or 1
        nx, ny = -dy/ln, dx/ln
        t = acc[i] / total if total else 0
        ends = (math.sin(math.pi * t)) ** 0.45 if total > 6 else 1
        press = 0.62 + 0.58 * max(0.0, dy/ln)  # downstroke = pressure
        w = BASE * sc * max(0.18, ends) * press / 2 + 0.12
        L.append((p[0]+nx*w, p[1]+ny*w)); R.append((p[0]-nx*w, p[1]-ny*w))
    pts = L + R[::-1]
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z"

def line(text, y0=0.0):
    x, out = 0.0, []
    for ch in text:
        if ch == " ": x += SPACE; continue
        w, d = G[ch]
        s = rnd.uniform(0.95, 1.06) if ch != "T" else 1.08
        dy = rnd.uniform(-2.2, 2.2)
        for pl in subpaths(d):
            pts = [(x + px * s, y0 + dy + py * s) for px, py in pl]
            out.append(tapered(pts))
        x += w * s
    return x, "".join(f'<path d="{p}"/>' for p in out)

w1, l1 = line("Take your mind", 0)
w2, l2 = line("on a holiday", 108)
def sw(x0, y, x1, y1, bend):
    pl = bez((x0, y), (x0 + (x1-x0)*.3, y + bend), (x0 + (x1-x0)*.7, y - bend*.4), (x1, y1), 40)
    return f'<path d="{tapered(pl, 1.1)}"/>'
swash = sw(10, 70+108, w2+30, 56+108, 12)
W = max(w1, w2) + 90
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -122 {W:.0f} 300" fill="#D4FBF4">
<g transform="skewX(-20)">{l1}<g transform="translate(26,0)">{l2}{swash}</g></g></svg>'''
open("public/media/brand/tagline-script.svg", "w").write(svg)
print(W)
