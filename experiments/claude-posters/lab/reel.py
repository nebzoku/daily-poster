#!/usr/bin/env python3
"""Making-of reel: python3 reel.py <issue> <concept> <picked colourway>
  e.g. python3 reel.py 053 c3 a
Needs the snapshots of the picked poster: CAP=1 node render.mjs posters/<issue>-<concept>-<x>.js → out/..-snaps/.

A sped-up screen recording of the poster being made, the way designers post them (Ben's reference, 24 Nov 2026):
an artboard on a dark pasteboard, a cursor doing the work, selection boxes with handles, magenta smart guides when
something snaps, quick zooms and jump cuts. No app chrome, no menus, no labels. In the order it was really made:
the background rectangle dragged out, the image placed and dragged into position, pixelated click by click, the
small type set in text boxes, the squares repeated along, the headline typed line by line (set loose, then dragged
onto its centre line), the whole sheet selected and printed, the paper, then the finished poster on black.
1080 × 1920, 30 fps.
"""
import glob, math, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
issue, concept, pick = sys.argv[1:4]
FPS, SW, SH = 30, 1080, 1920
PASTE, BLUE, MAGENTA, GUIDE = (52, 52, 52), (13, 153, 255), (255, 46, 191), (40, 150, 190)
rng = np.random.default_rng(int(issue) * 7 + 3)

snapdir = f'out/{issue}-{concept}-{pick}-snaps'
snaps = [(re.sub(r'^\d+-', '', os.path.basename(p)[:-4]), p) for p in sorted(glob.glob(f'{snapdir}/*.png'))]
S = {n: np.asarray(Image.open(p).convert('RGBA')) for n, p in snaps}
PH, PW = S['bg'].shape[:2]; K = PW / 1080; DW, DH = 1080, PH / K          # design units
rgb = lambda n: S[n][..., :3]
BLANK = np.full((PH, PW, 3), 246, np.uint8)
def font(w, size):
    path = f'out/work-sans-{w}.ttf'
    if not os.path.exists(path):
        from fontTools.ttLib import TTFont
        f = TTFont(f'node_modules/@fontsource/work-sans/files/work-sans-latin-{w}-normal.woff2'); f.flavor = None; f.save(path)
    return ImageFont.truetype(path, size)
TIP = font(500, 19)

def ease(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def ease_out(t): t = min(1, max(0, t)); return 1 - (1 - t) ** 3
def diffbox(a, b, thr=24):
    d = np.abs(a.astype(np.int16) - b.astype(np.int16)).sum(2) > thr; ys, xs = np.nonzero(d)
    if not len(xs): return None
    return [xs.min() / K, ys.min() / K, (xs.max() + 1) / K, (ys.max() + 1) / K]
def layer_of(a, b, thr=12):      # what b adds over a, as an RGBA layer
    d = np.abs(a.astype(np.int16) - b.astype(np.int16)).sum(2) > thr
    L = np.zeros((PH, PW, 4), np.uint8); L[..., :3] = b; L[..., 3] = d * 255; return L
def shift(L, dx, dy):            # move a layer by design units
    dx, dy = int(round(dx * K)), int(round(dy * K)); out = np.zeros_like(L)
    ys, yd = (slice(max(0, -dy), PH - max(0, dy)), slice(max(0, dy), PH - max(0, -dy)))
    xs, xd = (slice(max(0, -dx), PW - max(0, dx)), slice(max(0, dx), PW - max(0, -dx)))
    out[yd, xd] = L[ys, xs]; return out
def over(base, L, cut=None):
    a = L[..., 3:4].astype(np.float32) / 255
    if cut is not None: a = a.copy(); a[:, cut:] = 0
    return (base * (1 - a) + L[..., :3] * a).astype(np.uint8)
def bb_of(L):
    ys, xs = np.nonzero(L[..., 3] > 60); return [xs.min() / K, ys.min() / K, (xs.max() + 1) / K, (ys.max() + 1) / K]

# ---------- cursor paths: curved, quick out of the gate, settling with a small overshoot ----------
def path(p0, p1, t, bow=None):
    t = min(1, max(0, t)); (x0, y0), (x1, y1) = p0, p1; dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) + 1e-6
    bow = (0.12 if bow is None else bow) * L
    u = 1 - (1 - t) ** 3.2                                         # fast start, slow landing
    u += math.sin(min(1, t * 1.15) * math.pi) * 0.025 * (t > 0.6)  # a hair past, then back
    px, py = -dy / L, dx / L; b = math.sin(u * math.pi) * bow
    return (x0 + dx * u + px * b, y0 + dy * u + py * b)
def tdur(p0, p1): return 0.18 + 0.12 * math.log2(1 + math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 40)   # Fitts-ish

# ---------- the timeline: segments that each say, for t in 0..1, what's on the artboard and screen ----------
segs = []   # (duration, fn(t) -> dict(poster, cursor, shape, over, cam, cut))
cur = [DW + 260, DH * 0.75]           # cursor starts off the artboard, bottom right
SPEED = 0.8                            # everything a touch quicker than real time
def seg(d, fn, cam, cut=False): segs.append((d * SPEED, fn, cam, cut))
FIT = (DW / 2, DH / 2, 0.78)
def move(to, cam, poster, ov=lambda t: [], shape='arrow', extra=0.0, bow=None):
    p0 = tuple(cur); d = tdur(p0, to) + extra
    seg(d, lambda t, p0=p0: dict(poster=poster(t) if callable(poster) else poster, cursor=path(p0, to, t, bow), shape=shape, over=ov(t)), cam)
    cur[:] = to
def hold(d, cam, poster, ov=lambda t: [], shape='arrow', cut=False, press=False):
    p = tuple(cur); seg(d, lambda t: dict(poster=poster(t) if callable(poster) else poster, cursor=p, shape=shape, over=ov(t), press=press), cam, cut)

guides = [('v', 16 + i * 131) for i in range(9)] + [('h', 16 + i * 187) for i in range(9)]
show_guides = {'on': False}
bg = rgb('bg'); bgc = tuple(int(v) for v in bg[PH // 2, PW // 2])

# 0. REVEAL=1: open on the finished poster for a beat, then cut to the empty artboard (testing whether showing the
#    result first changes how many people watch to the end)
if os.environ.get('REVEAL'): hold(0.75, 'end', rgb('final'))
# 1. an empty artboard; the grid comes on
hold(0.5, FIT, BLANK, cut=True)
seg(0.01, lambda t: (show_guides.update(on=True), dict(poster=BLANK, cursor=tuple(cur), shape='arrow', over=[]))[1], FIT)
move((-8, -8), FIT, BLANK)
# 2. the background: a rectangle dragged out corner to corner
def rect_poster(t):
    img = BLANK.copy(); x1, y1 = path((-8, -8), (DW + 8, DH + 8), t, 0.04)
    yk, xk = int(min(DH, max(0, y1)) * K), int(min(DW, max(0, x1)) * K); img[:yk, :xk] = bg[:yk, :xk]; return img
seg(0.9, lambda t: dict(poster=rect_poster(t), cursor=path((-8, -8), (DW + 8, DH + 8), t, 0.04), shape='cross',
                        over=[('box', -8, -8, *path((-8, -8), (DW + 8, DH + 8), t, 0.04), False)]), FIT)
cur[:] = [DW + 8, DH + 8]
hold(0.25, FIT, bg, lambda t: [('box', 0, 0, DW, DH, True)])
# 3-5. the build, step by step, from the template's snaps (named by what kind of move made them):
#   place-*  an image or object placed, then dragged into position (snaps to centre)
#   step-<group>-*  a treatment applied click by click (pixelate, threshold...), watched up close
#   shape-*  a shape drawn: dragged out from its corner
#   text-*   small type set in text boxes (one per separate block)
def place_step(n, state):
    L = layer_of(state, rgb(n)); pb = bb_of(L); off = (rng.uniform(120, 200) * rng.choice([-1, 1]), rng.uniform(80, 140))
    grab = ((pb[0] + pb[2]) / 2 + off[0], (pb[1] + pb[3]) / 2 + off[1])
    cam = ((pb[0] + pb[2]) / 2 + off[0] / 2, (pb[1] + pb[3]) / 2 + off[1] / 2, max(0.7, min(1.3, SH * 0.7 / (pb[3] - pb[1] + 200), SW * 0.85 / (pb[2] - pb[0] + 200))))
    move(grab, cam, state, extra=0.05)
    hold(0.12, cam, over(state, shift(L, *off)), lambda t: [('box', pb[0] + off[0], pb[1] + off[1], pb[2] + off[0], pb[3] + off[1], True)], cut=True)
    def drag(t, state=state, L=L, pb=pb, off=off, grab=grab):
        u = path((0, 0), (1, 1), t, 0.1)[0]; o = (off[0] * (1 - u), off[1] * (1 - u))
        return dict(poster=over(state, shift(L, *o)), cursor=(grab[0] - off[0] + o[0], grab[1] - off[1] + o[1]), shape='arrow', press=True,
                    over=[('box', pb[0] + o[0], pb[1] + o[1], pb[2] + o[0], pb[3] + o[1], True)] + ([('vline', (pb[0] + pb[2]) / 2)] if t > 0.82 else []))
    seg(0.6, drag, cam)
    cur[:] = [grab[0] - off[0], grab[1] - off[1]]
    hold(0.15, cam, rgb(n), lambda t: [('box', *pb, True)])
    return rgb(n)
def step_group(names, state):
    pbx = diffbox(state, rgb(names[-1])); bw, bh = pbx[2] - pbx[0], pbx[3] - pbx[1]
    z = max(1.0, min(1.7, SW * 0.9 / bw, SH * 0.7 / bh))
    zc = ((pbx[0] + pbx[2]) / 2 + rng.uniform(-0.15, 0.15) * bw, (pbx[1] + pbx[3]) / 2 + rng.uniform(-0.15, 0.15) * bh)
    ZOOM = (zc[0], zc[1], z)
    move((zc[0] + 90, zc[1] + 30), ZOOM, state)
    for n in names:
        hold(0.1, ZOOM, rgb(n), press=True)
        hold(0.18, ZOOM, rgb(n))
    return rgb(names[-1])
def shape_step(n, state):
    b = diffbox(state, rgb(n)); cam = ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, max(0.75, min(1.4, SW * 0.7 / (b[2] - b[0] + 60), SH * 0.6 / (b[3] - b[1] + 60))))
    move((b[0], b[1]), cam, state, shape='cross')
    L = layer_of(state, rgb(n))
    def grow(t, b=b, L=L, state=state):
        x, y = path((b[0], b[1]), (b[2], b[3]), t, 0.03); m = L.copy(); m[int(y * K):, :, 3] = 0; m[:, int(x * K):, 3] = 0
        return dict(poster=over(state, m), cursor=(x, y), shape='cross', press=True, over=[('box', b[0], b[1], x, y, False)])
    seg(0.55, grow, cam)
    cur[:] = [b[2], b[3]]
    hold(0.12, cam, rgb(n), lambda t: [('box', *b, True)])
    return rgb(n)
# 5. the small type in text boxes, the squares repeated along
def textbox(name, state):
    # one text box per separate block (a subline and a label side by side are two boxes, set one after the other)
    d = np.abs(state.astype(np.int16) - rgb(name).astype(np.int16)).sum(2) > 24
    cols = np.nonzero(d.any(0))[0]; groups = [[cols[0], cols[0]]]
    for x in cols[1:]:
        if x - groups[-1][1] > 60 * K: groups.append([x, x])
        else: groups[-1][1] = x
    for gx0, gx1 in groups:
        part = np.zeros_like(d); part[:, gx0:gx1 + 1] = d[:, gx0:gx1 + 1]; ys = np.nonzero(part.any(1))[0]
        x0, y0, x1, y1 = gx0 / K - 6, ys[0] / K - 6, (gx1 + 1) / K + 6, (ys[-1] + 1) / K + 6
        cam = ((x0 + x1) / 2, (y0 + y1) / 2, max(0.9, min(1.9, SW * 0.6 / (x1 - x0))))
        move((x0, y0), cam, state, shape='ibeam')
        seg(0.3, lambda t, state=state, x0=x0, y0=y0, x1=x1, y1=y1: dict(poster=state, cursor=path((x0, y0), (x1, y1), t, 0.02), shape='cross', over=[('box', x0, y0, *path((x0, y0), (x1, y1), t, 0.02), False)]), cam)
        cur[:] = [x1, y1]
        L = layer_of(state, rgb(name)); L[..., 3] *= part.astype(np.uint8)
        seg(0.38, lambda t, state=state, L=L, x0=x0, y0=y0, x1=x1, y1=y1: dict(poster=over(state, L, int(x0 * K + (x1 - x0) * K * ease(t))), cursor=(x1, y1), shape='ibeam', over=[('box', x0, y0, x1, y1, False)]), cam)
        state = over(state, L)
        hold(0.12, cam, state, lambda t, x0=x0, y0=y0, x1=x1, y1=y1: [('box', x0, y0, x1, y1, True)])
    return rgb(name)
state = bg
build = [n for n, _ in snaps if n.split('-')[0] in ('place', 'step', 'shape', 'text')]
k = 0
while k < len(build):
    n = build[k]; kind = n.split('-')[0]
    if kind == 'step':
        grp = n.split('-')[1]; names = []
        while k < len(build) and build[k].startswith(f'step-{grp}-'): names.append(build[k]); k += 1
        state = step_group(names, state); continue
    state = {'place': place_step, 'shape': shape_step, 'text': textbox}[kind](n, state); k += 1
# 6. the headline: the first line typed loose, its tracking tightened, dragged onto its place (a magenta guide when it
#    snaps); the other lines are duplicates of it, dragged into place and retyped
lines = [n for n, _ in snaps if n.startswith('line-')]
for i, n in enumerate(lines):
    L = S[n]; lb = bb_of(L)
    # flat in the type's colour while it's being set; the crossings only flip once it lands on the image
    a = L[..., 3] > 200; cols, cnt = np.unique(L[..., :3][a].reshape(-1, 3), axis=0, return_counts=True); tc = cols[np.argmax(cnt)]
    flat = L.copy(); flat[..., :3] = tc
    if i > 0:
        # once the first line's style is found, the rest are duplicates of it: alt-drag a copy into place, then
        # retype the words (already tracked, so no tightening again)
        dy = (lb[1] + lb[3]) / 2 - (lb0[1] + lb0[3]) / 2; dx = (lb[0] + lb[2] - lb0[0] - lb0[2]) / 2; grab0 = ((lb0[0] + lb0[2]) / 2, (lb0[1] + lb0[3]) / 2)
        span = abs(dy) + (lb0[3] - lb0[1]) + 120
        camd = (DW / 2, grab0[1] + dy / 2, max(0.62, min(1.15, SH * 0.62 / span, SW * 0.92 / (lb0[2] - lb0[0] + 60))))
        move(grab0, camd, state)
        def dup(t, state=state, dy=dy, dx=dx, grab0=grab0, lb=lb, i=i):
            u = path((0, 0), (1, 1), t, 0.06)[0]; yy = dy * u; xx = dx * u
            g = [('vline', DW / 2)] if t > 0.8 else []
            if t > 0.8 and i == len(lines) - 1: g.append(('hline', lb[3]))
            return dict(poster=over(state, shift(F0, xx, yy)), cursor=(grab0[0] + xx, grab0[1] + yy), shape='arrow', press=True,
                        over=[('box', lb0[0] + xx, lb0[1] + yy, lb0[2] + xx, lb0[3] + yy, True)] + g)
        seg(0.5, dup, camd)
        cur[:] = [grab0[0] + dx, grab0[1] + dy]
        camt = ((lb[0] + lb[2]) / 2, (lb[1] + lb[3]) / 2, max(0.7, min(1.25, SW * 0.86 / (lb[2] - lb[0] + 80))))
        copy_ = shift(F0, dx, dy)
        move((lb[0] - 10, (lb[1] + lb[3]) / 2), camt, over(state, copy_), lambda t, lb=lb, dy=dy: [('box', lb0[0] + dx, lb0[1] + dy, lb0[2] + dx, lb0[3] + dy, True)], shape='ibeam')
        cols_on = np.nonzero(flat[..., 3].max(0) > 80)[0]; ends = []; prev = cols_on[0]
        for x in cols_on[1:]:
            if x - prev > 3 * K: ends.append(prev + 1)
            prev = x
        ends.append(cols_on[-1] + 1); dur = 0.1 + 0.05 * len(ends)
        def retype(t, state=state, flat=flat, ends=ends, lb=lb, dur=dur, tc=tuple(int(v) for v in tc)):
            k = min(len(ends), int(t * (len(ends) + 0.6))); cut = ends[k - 1] if k else int(lb[0] * K)
            ov = [('caret', cut / K + 4, lb[1], lb[3], tc)] if int(t * dur * 3) % 2 == 0 or t < 0.9 else []
            return dict(poster=over(state, flat, cut), cursor=(lb[0] - 10, (lb[1] + lb[3]) / 2 + 26), shape='ibeam', over=ov)
        seg(dur, retype, camt)
        state = over(state, L)
        hold(0.14, camt, state, lambda t, lb=lb: [('box', *lb, True)], shape='arrow')
        continue
    F0, lb0 = flat, lb
    o = (rng.uniform(-90, 90), rng.uniform(40, 90) * (1 if i < len(lines) / 2 else -1))
    fb = [lb[0] + o[0], lb[1] + o[1], lb[2] + o[0], lb[3] + o[1]]
    cam = ((lb[0] + lb[2]) / 2, (lb[1] + lb[3]) / 2 + o[1] / 2, max(0.78, min(1.25, SW * 0.86 / (lb[2] - lb[0] + abs(o[0]) + 80))))
    move((fb[0] - 10, (fb[1] + fb[3]) / 2), cam, state, shape='ibeam')
    hold(0.08, cam, state, shape='ibeam', press=True)
    cols_on = np.nonzero(flat[..., 3].max(0) > 80)[0]; ends = []
    prev = cols_on[0]
    for x in cols_on[1:]:
        if x - prev > 3 * K: ends.append(prev + 1)
        prev = x
    ends.append(cols_on[-1] + 1)
    starts_ = [cols_on[0]] + ends[:-1]; nL = len(ends)
    ys_ = np.nonzero(flat[..., 3].max(1) > 0)[0]; ry0, ry1 = ys_[0], ys_[-1] + 1
    LOOSE = 26                                                      # extra space per letter while it's set loose
    PADD = 260; PADp = int(PADD * K)                                # the loose line can run off the artboard
    def spaced(extra, flat=flat, starts_=starts_, ends=ends, nL=nL, ry0=ry0, ry1=ry1):
        # the line with `extra` design units between letters, spread about its centre (never scales the glyphs),
        # as a strip that floats over the canvas, so it can hang off the artboard onto the pasteboard
        out = np.zeros((ry1 - ry0, PW + 2 * PADp, 4), np.uint8); band = flat[ry0:ry1]
        for j, (s0, e0) in enumerate(zip(starts_, ends)):
            off = int(round((j - (nL - 1) / 2) * extra * K)) + PADp
            out[:, s0 + off:e0 + off] = np.maximum(out[:, s0 + off:e0 + off], band[:, s0:e0])
        return out
    org = (-PADD + o[0], ry0 / K + o[1])                            # the strip's top-left, design units
    loose = spaced(LOOSE)
    lends = [int(e + round((j - (nL - 1) / 2) * LOOSE * K) + PADp) for j, e in enumerate(ends)]
    dur = 0.12 + 0.06 * nL
    fb = [lb[0] + o[0] - (nL - 1) / 2 * LOOSE, lb[1] + o[1], lb[2] + o[0] + (nL - 1) / 2 * LOOSE, lb[3] + o[1]]
    cam = ((fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2, max(0.62, min(1.2, SW * 0.9 / (fb[2] - fb[0] + 60))))
    def typing(t, loose=loose, ends=lends, fb=fb, state=state, dur=dur, org=org, tc=tuple(int(v) for v in tc)):
        k = min(len(ends), int(t * (len(ends) + 0.6))); cut = ends[k - 1] if k else 0
        ov = [('caret', org[0] + cut / K + 4, fb[1], fb[3], tc)] if int(t * dur * 3) % 2 == 0 or t < 0.9 else []
        return dict(poster=state, float=(loose, org, cut), cursor=(fb[0] - 10, (fb[1] + fb[3]) / 2 + 26), shape='ibeam', over=ov)
    seg(dur, typing, cam)
    # select it, then tighten the tracking: the letters close up in a few nudges, the box shrinking with them
    def tighten(t, state=state, o=o, lb=lb, nL=nL, LOOSE=LOOSE, spaced=spaced, org=org):
        u = ease(min(1, t * 1.15)); u = min(1, (math.floor(u * 4) / 4) * 0.35 + u * 0.65)   # a little stepped, like nudges
        ex = LOOSE * (1 - u); half = (nL - 1) / 2 * ex
        box = [lb[0] + o[0] - half, lb[1] + o[1], lb[2] + o[0] + half, lb[3] + o[1]]
        return dict(poster=state, float=(spaced(ex), org, None), cursor=(box[2] + 30, box[3] + 34), shape='arrow', over=[('box', *box, True)])
    seg(0.75 if i < 2 else 0.6, tighten, cam)
    shifted = shift(flat, *o); fb = [lb[0] + o[0], lb[1] + o[1], lb[2] + o[0], lb[3] + o[1]]
    cur[:] = [fb[2] + 34, fb[3] + 30]
    grabp = ((fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2)
    hold(0.12, cam, over(state, shifted), lambda t, fb=fb: [('box', *fb, True)], shape='arrow')
    move(grabp, cam, over(state, shifted), lambda t, fb=fb: [('box', *fb, True)])
    def drag(t, o=o, lb=lb, flat=flat, state=state, grabp=grabp, i=i):
        u = path((0, 0), (1, 1), t, 0.12)[0]; dx, dy = o[0] * (1 - u), o[1] * (1 - u)
        g = [('vline', DW / 2)] if t > 0.8 else []
        if t > 0.8 and i in (0, len(lines) - 1): g.append(('hline', lb[1] if i == 0 else lb[3]))
        return dict(poster=over(state, shift(flat, dx, dy)), cursor=(grabp[0] - o[0] + dx, grabp[1] - o[1] + dy), shape='arrow', press=True,
                    over=[('box', lb[0] + dx, lb[1] + dy, lb[2] + dx, lb[3] + dy, True)] + g)
    seg(0.45, drag, cam)
    cur[:] = [grabp[0] - o[0], grabp[1] - o[1]]
    state = over(state, L)
    hold(0.18, cam, state, lambda t, lb=lb: [('box', *lb, True)])
# 7. select all, print
move((DW + 40, DH + 40), FIT, state)
seg(0.45, lambda t: dict(poster=state, cursor=path((DW + 40, DH + 40), (-40, -40), t, 0.03), shape='arrow', press=True,
                         over=[('marquee', *path((DW + 40, DH + 40), (-40, -40), t, 0.03), DW + 40, DH + 40)]), FIT)
cur[:] = [-40, -40]
hold(0.3, FIT, state, lambda t: [('box', 0, 0, DW, DH, True)])
show_off = len(segs)
dif = np.abs(rgb('printed').astype(np.int16) - state.astype(np.int16)).sum(2) > 30
yy, xx = np.unravel_index(np.argmax(np.asarray(Image.fromarray(dif.astype(np.uint8) * 255).resize((PW // 64, PH // 64), Image.BOX))), (PH // 64, PW // 64))
INK = ((xx + 0.5) * 64 / K, (yy + 0.5) * 64 / K, 2.2)
# trying inks: up close in different places, each setting a scrub of the hand, heavier then lighter, settling
def spots(img_a, img_b, n=3):
    d = np.abs(img_a.astype(np.int16) - img_b.astype(np.int16)).sum(2) > 30
    g = np.asarray(Image.fromarray(d.astype(np.uint8) * 255).resize((PW // 96, PH // 96), Image.BOX)).astype(float)
    out = []
    for _ in range(n):
        yy, xx = np.unravel_index(np.argmax(g), g.shape); out.append(((xx + 0.5) * 96 / K, (yy + 0.5) * 96 / K))
        g[max(0, yy - 9):yy + 10, max(0, xx - 9):xx + 10] = 0
    return out
P = spots(state, rgb('ink-heavy' if 'ink-heavy' in S else 'printed'))
trials = [] if 'ink-heavy' not in S else [(P[0], 2.3, 'ink-light'), (P[0], 2.3, 'ink-heavy'), (P[1], 2.0, 'ink-heavy'), (P[1], 2.0, 'ink-mid'), (P[2], 2.1, 'ink-mid'), (P[2], 2.1, 'printed')]
prev_img = state
for k, (pt, z, nm) in enumerate(trials):
    cam = (pt[0], pt[1], z); cut_ = k % 2 == 0
    if cut_:
        cur[:] = [pt[0] + 120 / z, pt[1] + 140 / z]
        hold(0.25, cam, prev_img, cut=True)
    p0 = tuple(cur)
    seg(0.32, lambda t, p0=p0, pv=prev_img, nm=nm: dict(poster=pv if t < 0.55 else rgb(nm), cursor=(p0[0] + math.sin(t * math.pi) * 34, p0[1]), shape='arrow', press=0.1 < t < 0.9, over=[]), cam)
    hold(0.45, cam, rgb(nm))
    prev_img = rgb(nm)
hold(0.35, FIT, rgb('printed'), cut=True)
seg(0.6, lambda t: dict(poster=(rgb('printed') * (1 - ease(t)) + rgb('final') * ease(t)).astype(np.uint8), cursor=(DW + 300, DH + 200), shape='arrow', over=[]), FIT)
cur[:] = [DW + 300, DH + 200]
hold(0.6, (DW / 2, DH / 2, 0.74), rgb('final'))
# 8. the finished poster, on black
hold(1.9, 'end', rgb('final'), cut=True)

# ---------- camera: quick eased zooms and pans between segment targets (like keyboard zoom), jump cuts where set ----------
starts = np.cumsum([0] + [d for d, *_ in segs]); total = starts[-1]
def cam_at(i, T):
    d, fn, cam, cut = segs[i]
    if cam == 'end': return cam
    if cut or i == 0: return cam
    prev = cam_at(i - 1, starts[i]) if segs[i - 1][2] != cam else segs[i - 1][2]
    if prev == 'end': return cam
    u = ease((T - starts[i]) / 0.32)
    return tuple(p + (c - p) * u for p, c in zip(prev, cam)) if prev != cam else cam

def draw_cursor(d, x, y, shape, press):
    if shape == 'arrow':
        pts = [(0, 0), (0, 25), (6, 19.5), (10, 29), (14, 27), (10, 18), (18, 18)]
        sc = 0.92 if press else 1
        P = [(x + px * sc, y + py * sc) for px, py in pts]
        d.polygon(P, fill=(0, 0, 0), outline=(255, 255, 255), width=2)
    elif shape == 'ibeam':
        for dx in (-1, 0, 1): d.line([(x + dx, y - 12), (x + dx, y + 12)], fill=(255, 255, 255) if dx else (0, 0, 0), width=1)
        d.line([(x - 5, y - 12), (x + 5, y - 12)], fill=(0, 0, 0), width=2); d.line([(x - 5, y + 12), (x + 5, y + 12)], fill=(0, 0, 0), width=2)
    else:
        d.line([(x - 11, y), (x + 11, y)], fill=(0, 0, 0), width=2); d.line([(x, y - 11), (x, y + 11)], fill=(0, 0, 0), width=2)
        d.line([(x - 10, y), (x + 10, y)], fill=(255, 255, 255), width=1); d.line([(x, y - 10), (x, y + 10)], fill=(255, 255, 255), width=1)

def frame(fi):
    T = fi / FPS; i = min(len(segs) - 1, int(np.searchsorted(starts, T, 'right') - 1))
    d, fn, cam, cut = segs[i]; t = min(1, max(0, (T - starts[i]) / d)); st = fn(t)
    poster = st['poster']; c = cam_at(i, T)
    if c == 'end':                                                  # the finished poster on black
        img = Image.new('RGB', (SW, SH), (0, 0, 0)); s = SW * 0.84 / DW
        pim = Image.fromarray(poster).resize((round(DW * s), round(DH * s)), Image.LANCZOS); img.paste(pim, ((SW - pim.width) // 2, (SH - pim.height) // 2)); return img
    cx, cy, s = c
    jit = (math.sin(T * 0.9) * 1.5, math.sin(T * 0.7 + 1) * 1.5)
    cx += jit[0] / s; cy += jit[1] / s
    img = Image.new('RGB', (SW, SH), PASTE); dr = ImageDraw.Draw(img)
    vx0, vy0 = cx - SW / 2 / s, cy - SH / 2 / s
    X = lambda x: (x - vx0) * s; Y = lambda y: (y - vy0) * s
    px0, py0, px1, py1 = max(0, vx0), max(0, vy0), min(DW, vx0 + SW / s), min(DH, vy0 + SH / s)
    if px1 > px0 and py1 > py0:
        crop = Image.fromarray(poster[int(py0 * K):int(math.ceil(py1 * K)), int(px0 * K):int(math.ceil(px1 * K))])
        img.paste(crop.resize((max(1, round((px1 - px0) * s)), max(1, round((py1 - py0) * s))), Image.LANCZOS if s < K else Image.BICUBIC), (round(X(px0)), round(Y(py0))))
    if st.get('float') is not None:
        F, (ox_, oy_), cutp = st['float']; F = F if cutp is None else np.where((np.arange(F.shape[1]) < cutp)[None, :, None], F, 0).astype(np.uint8)
        fim = Image.fromarray(F, 'RGBA'); fw, fh = round(F.shape[1] / K * s), round(F.shape[0] / K * s)
        if fw > 0 and fh > 0: img.paste(fim.resize((fw, fh), Image.LANCZOS if s < K else Image.BICUBIC), (round(X(ox_)), round(Y(oy_))), fim.resize((fw, fh), Image.LANCZOS if s < K else Image.BICUBIC))
    if show_guides['on'] and i < show_off and fi > 0:
        for k, p in guides:
            if k == 'v': dr.line([(X(p), Y(0)), (X(p), Y(DH))], fill=GUIDE, width=1)
            else: dr.line([(X(0), Y(p)), (X(DW), Y(p))], fill=GUIDE, width=1)
    for o in st.get('over', []):
        if o[0] == 'box':
            x0, y0, x1, y1, handles = o[1:]; x0, x1 = sorted((X(x0), X(x1))); y0, y1 = sorted((Y(y0), Y(y1)))
            dr.rectangle([x0, y0, x1, y1], outline=BLUE, width=2)
            if handles:
                for hx in (x0, (x0 + x1) / 2, x1):
                    for hy in (y0, (y0 + y1) / 2, y1):
                        if hx == (x0 + x1) / 2 and hy == (y0 + y1) / 2: continue
                        dr.rectangle([hx - 5, hy - 5, hx + 5, hy + 5], fill=(255, 255, 255), outline=BLUE, width=2)
        elif o[0] == 'marquee':
            x0, y0, x1, y1 = o[1:]; x0, x1 = sorted((X(x0), X(x1))); y0, y1 = sorted((Y(y0), Y(y1)))
            for a, b in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]:
                n = int(math.hypot(b[0] - a[0], b[1] - a[1]) / 8)
                for j in range(0, n, 2): dr.line([(a[0] + (b[0] - a[0]) * j / max(1, n), a[1] + (b[1] - a[1]) * j / max(1, n)), (a[0] + (b[0] - a[0]) * (j + 1) / max(1, n), a[1] + (b[1] - a[1]) * (j + 1) / max(1, n))], fill=(200, 200, 200), width=1)
        elif o[0] == 'vline': dr.line([(X(o[1]), Y(-40)), (X(o[1]), Y(DH + 40))], fill=MAGENTA, width=2)
        elif o[0] == 'hline': dr.line([(X(-40), Y(o[1])), (X(DW + 40), Y(o[1]))], fill=MAGENTA, width=2)
        elif o[0] == 'caret': dr.line([(X(o[1]), Y(o[2])), (X(o[1]), Y(o[3]))], fill=o[4], width=max(2, round(1.2 * s)))
    cx_, cy_ = st['cursor']; draw_cursor(dr, X(cx_) + 0.0, Y(cy_), st.get('shape', 'arrow'), st.get('press', False))
    return img

os.makedirs('deliver/reel', exist_ok=True)
outp = f'deliver/reel/{issue}-{concept}-{pick}-making-of{"-reveal" if os.environ.get("REVEAL") else ""}.mp4'
n = int(total * FPS)
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SW}x{SH}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', outp], stdin=subprocess.PIPE)
keep = set(int(n * q) for q in (0.05, 0.12, 0.2, 0.3, 0.42, 0.55, 0.62, 0.7, 0.8, 0.9, 0.99))
for fi in range(n):
    fr = frame(fi); ff.stdin.write(fr.tobytes())
    if fi in keep: fr.save(f'deliver/reel/still-{fi:04d}.jpg', quality=80)
ff.stdin.close(); ff.wait()
print(outp, f'{total:.1f}s', n, 'frames')
