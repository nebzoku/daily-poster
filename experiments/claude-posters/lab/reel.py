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
def seg(d, fn, cam, cut=False): segs.append((d, fn, cam, cut))
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

# 1. an empty artboard; the grid comes on
hold(0.5, FIT, BLANK)
seg(0.01, lambda t: (show_guides.update(on=True), dict(poster=BLANK, cursor=tuple(cur), shape='arrow', over=[]))[1], FIT)
move((-8, -8), FIT, BLANK)
# 2. the background: a rectangle dragged out corner to corner
def rect_poster(t):
    img = BLANK.copy(); x1, y1 = path((-8, -8), (DW + 8, DH + 8), t, 0.04)
    img[:int(min(DH, max(0, y1)) * K), :int(min(DW, max(0, x1)) * K)] = bgc; return img
seg(0.9, lambda t: dict(poster=rect_poster(t), cursor=path((-8, -8), (DW + 8, DH + 8), t, 0.04), shape='cross',
                        over=[('box', -8, -8, *path((-8, -8), (DW + 8, DH + 8), t, 0.04), False)]), FIT)
cur[:] = [DW + 8, DH + 8]
hold(0.25, FIT, bg, lambda t: [('box', 0, 0, DW, DH, True)])
# 3. the image placed, then dragged into position (it snaps to centre)
photo = layer_of(bg, rgb('photo')); pb = bb_of(photo); off = (170, 120)
grab = ((pb[0] + pb[2]) / 2 + off[0], (pb[1] + pb[3]) / 2 + off[1])
move(grab, FIT, bg, extra=0.1)
hold(0.15, FIT, lambda t: over(bg, shift(photo, *off)), lambda t: [('box', pb[0] + off[0], pb[1] + off[1], pb[2] + off[0], pb[3] + off[1], True)], cut=True)
def drag_photo(t):
    u = path((0, 0), (1, 1), t, 0.1)[0]; return off[0] * (1 - u), off[1] * (1 - u)
seg(0.75, lambda t: (lambda o: dict(poster=over(bg, shift(photo, *o)), cursor=(grab[0] - off[0] + o[0], grab[1] - off[1] + o[1]), shape='arrow', press=True,
                                     over=[('box', pb[0] + o[0], pb[1] + o[1], pb[2] + o[0], pb[3] + o[1], True)] + ([('vline', DW / 2), ('hline', DH / 2)] if t > 0.82 else [])))(drag_photo(t)), FIT)
cur[:] = [grab[0] - off[0], grab[1] - off[1]]
hold(0.2, FIT, rgb('photo'), lambda t: [('box', *pb, True)])
# 4. pixelated, click by click, up close
pix = [n for n, _ in snaps if n.startswith('pixel-')]
pbx = diffbox(bg, rgb(pix[-1])); zc = ((pbx[0] + pbx[2]) / 2 - 40, (pbx[1] + pbx[3]) / 2 - 120)
ZOOM = (zc[0], zc[1], 1.55)
move((zc[0] + 90, zc[1] + 30), ZOOM, rgb('photo'), lambda t: [('box', *pb, True)])
for n in pix:
    hold(0.11, ZOOM, rgb(n), lambda t: [('box', *pb, True)], press=True)
    hold(0.2, ZOOM, rgb(n), lambda t: [('box', *pb, True)])
state = rgb(pix[-1])
# 5. the small type in text boxes, the squares repeated along
def textbox(name, state):
    b = diffbox(state, rgb(name)); x0, y0, x1, y1 = b[0] - 6, b[1] - 6, b[2] + 6, b[3] + 6
    cam = ((x0 + x1) / 2, (y0 + y1) / 2, max(0.9, min(1.9, SW * 0.6 / (x1 - x0))))
    move((x0, y0), cam, state, shape='ibeam')
    seg(0.35, lambda t: dict(poster=state, cursor=path((x0, y0), (x1, y1), t, 0.02), shape='cross', over=[('box', x0, y0, *path((x0, y0), (x1, y1), t, 0.02), False)]), cam)
    cur[:] = [x1, y1]
    L = layer_of(state, rgb(name))
    seg(0.45, lambda t: dict(poster=over(state, L, int(x0 * K + (x1 - x0) * K * ease(t))), cursor=(x1, y1), shape='ibeam', over=[('box', x0, y0, x1, y1, False)]), cam)
    hold(0.15, cam, rgb(name), lambda t: [('box', x0, y0, x1, y1, True)])
    return rgb(name)
last = pix[-1]
for n in ['furniture', 'squares', 'text']:
    if n in S:
        if n == 'squares':        # the squares: one drawn, then dragged out along the row
            b = diffbox(state, rgb(n)); cam = ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, 0.95)
            move((b[0], b[3]), cam, state, shape='cross')
            L = layer_of(state, rgb(n))
            seg(0.7, lambda t, b=b, L=L, state=state: dict(poster=over(state, L, int((b[0] + (b[2] - b[0]) * ease_out(t)) * K)), cursor=(b[0] + (b[2] - b[0]) * ease_out(t), b[3] + 6), shape='arrow', press=True,
                                                             over=[('box', b[0], b[1], b[0] + (b[2] - b[0]) * ease_out(t), b[3], True)]), cam)
            cur[:] = [b[2], b[3] + 6]; state = rgb(n)
        else: state = textbox(n, state)
        last = n
# 6. the headline: each line typed loose, then dragged onto its place (a magenta guide when it snaps)
lines = [n for n, _ in snaps if n.startswith('line-')]
for i, n in enumerate(lines):
    L = S[n]; lb = bb_of(L)
    # flat in the type's colour while it's being set; the crossings only flip once it lands on the image
    a = L[..., 3] > 200; cols, cnt = np.unique(L[..., :3][a].reshape(-1, 3), axis=0, return_counts=True); tc = cols[np.argmax(cnt)]
    flat = L.copy(); flat[..., :3] = tc
    o = (rng.uniform(-90, 90), rng.uniform(40, 90) * (1 if i < len(lines) / 2 else -1))
    fb = [lb[0] + o[0], lb[1] + o[1], lb[2] + o[0], lb[3] + o[1]]
    cam = ((lb[0] + lb[2]) / 2, (lb[1] + lb[3]) / 2 + o[1] / 2, max(0.78, min(1.25, SW * 0.86 / (lb[2] - lb[0] + abs(o[0]) + 80))))
    move((fb[0] - 10, (fb[1] + fb[3]) / 2), cam, state, shape='ibeam')
    hold(0.08, cam, state, shape='ibeam', press=True)
    cols_on = np.nonzero(flat[..., 3].max(0) > 80)[0]; ends = [];
    prev = cols_on[0]
    for x in cols_on[1:]:
        if x - prev > 3 * K: ends.append(prev + 1)
        prev = x
    ends.append(cols_on[-1] + 1); ends = [e + int(o[0] * K) for e in ends]
    shifted = shift(flat, *o); dur = 0.12 + 0.065 * len(ends)
    def typing(t, shifted=shifted, ends=ends, fb=fb, state=state, dur=dur, tc=tuple(int(v) for v in tc)):
        k = min(len(ends), int(t * (len(ends) + 0.6))); cut = ends[k - 1] if k else int(fb[0] * K)
        ov = [('caret', cut / K + 4, fb[1], fb[3], tc)] if int(t * dur * 3) % 2 == 0 or t < 0.9 else []
        return dict(poster=over(state, shifted, cut), cursor=(fb[0] - 10, (fb[1] + fb[3]) / 2 + 26), shape='ibeam', over=ov)
    seg(dur, typing, cam)
    grabp = ((fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2)
    hold(0.12, cam, over(state, shifted), lambda t, fb=fb: [('box', *fb, True)], shape='arrow')
    move(grabp, cam, over(state, shifted), lambda t, fb=fb: [('box', *fb, True)])
    def drag(t, o=o, lb=lb, flat=flat, state=state, grabp=grabp, i=i):
        u = path((0, 0), (1, 1), t, 0.12)[0]; dx, dy = o[0] * (1 - u), o[1] * (1 - u)
        g = [('vline', DW / 2)] if t > 0.8 else []
        if t > 0.8 and i in (0, len(lines) - 1): g.append(('hline', lb[1] if i == 0 else lb[3]))
        return dict(poster=over(state, shift(flat, dx, dy)), cursor=(grabp[0] - o[0] + dx, grabp[1] - o[1] + dy), shape='arrow', press=True,
                    over=[('box', lb[0] + dx, lb[1] + dy, lb[2] + dx, lb[3] + dy, True)] + g)
    seg(0.55, drag, cam)
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
hold(0.9, INK, rgb('printed'), cut=True)
hold(0.5, FIT, rgb('printed'), cut=True)
seg(0.6, lambda t: dict(poster=(rgb('printed') * (1 - ease(t)) + rgb('final') * ease(t)).astype(np.uint8), cursor=(DW + 300, DH + 200), shape='arrow', over=[]), FIT)
cur[:] = [DW + 300, DH + 200]
hold(0.8, (DW / 2, DH / 2, 0.74), rgb('final'))
# 8. the finished poster, on black
hold(1.8, 'end', rgb('final'), cut=True)

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
outp = f'deliver/reel/{issue}-{concept}-{pick}-making-of.mp4'
n = int(total * FPS)
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SW}x{SH}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', outp], stdin=subprocess.PIPE)
keep = set(int(n * q) for q in (0.05, 0.12, 0.2, 0.3, 0.42, 0.55, 0.62, 0.7, 0.8, 0.9, 0.99))
for fi in range(n):
    fr = frame(fi); ff.stdin.write(fr.tobytes())
    if fi in keep: fr.save(f'deliver/reel/still-{fi:04d}.jpg', quality=80)
ff.stdin.close(); ff.wait()
print(outp, f'{total:.1f}s', n, 'frames')
