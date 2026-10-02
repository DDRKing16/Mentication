"""Remove isolated specks from NewSignatureScript.ttf (source: scratchpad copy of the supplied font).
Keeps the main stroke, counters/holes inside it, and i/j dots; drops tiny/detached ticks."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
src, dst = sys.argv[1], sys.argv[2]
f = TTFont(src); gs = f.getGlyphSet()
def bb(c):
    bp = BoundsPen(None)
    for op, a in c: getattr(bp, op)(*a)
    return bp.bounds
for name in f.getGlyphOrder():
    rp = RecordingPen(); gs[name].draw(rp)
    cons, cur = [], []
    for op, a in rp.value:
        cur.append((op, a))
        if op in ("closePath", "endPath"): cons.append(cur); cur = []
    if len(cons) < 2: continue
    bbs = [bb(c) for c in cons]
    areas = [(b[2]-b[0])*(b[3]-b[1]) for b in bbs]; mi = areas.index(max(areas)); M = bbs[mi]
    keep = []
    for i, (c, b) in enumerate(zip(cons, bbs)):
        w, h = b[2]-b[0], b[3]-b[1]; cx, cy = (b[0]+b[2])/2, (b[1]+b[3])/2
        inside = M[0] <= cx <= M[2] and M[1] <= cy <= M[3]
        dot = name in ("uni0069", "uni006A") and 15 <= w <= 40 and 15 <= h <= 40 and cy > 150
        tiny = w <= 20 and h <= 20
        if i == mi or dot or (inside and not tiny): keep.append(c)
    if len(keep) != len(cons):
        pen = TTGlyphPen(gs)
        for c in keep:
            for op, a in c: getattr(pen, op)(*a)
        f["glyf"][name] = pen.glyph()
f.save(dst)
