#!/usr/bin/env python3
"""Making-of reel: python3 reel.py <issue> <concept> <picked colourway>
  e.g. python3 reel.py 053 c3 a
Needs the snapshots of the picked poster: CAP=1 node render.mjs posters/<issue>-<concept>-<x>.js → out/..-snaps/.
The poster is rebuilt in the order it was really made, on an open dotted canvas, the way you'd watch someone work
on a design canvas: the camera drifts in, zooms to whatever is being worked on (the image as it pixelates, the
small type, each headline line as it's typed, following the caret), pulls out, pans across, and settles on the
finished poster. No labels, no interface, no cursor. The camera is a soft spring chasing each target, with a little
hand drift, so it never moves on rails. 1080 × 1920, 30 fps.
"""
import glob, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
os.chdir(os.path.dirname(os.path.abspath(__file__)))
issue, concept, pick = sys.argv[1:4]
FPS, SW, SH = 30, 1080, 1920
CANVAS, DOT = (236, 236, 231), (210, 210, 204)

snapdir = f'out/{issue}-{concept}-{pick}-snaps'
snaps = [(re.sub(r'^\d+-', '', os.path.basename(p)[:-4]), p) for p in sorted(glob.glob(f'{snapdir}/*.png'))]
S = {n: np.asarray(Image.open(p).convert('RGBA')) for n, p in snaps}
PH, PW = S['bg'].shape[:2]; K = PW / 1080                       # snaps are full size; camera works in design units
rgb = lambda n: S[n][..., :3]
def over(base, layer, cut=None):
    a = layer[..., 3:4].astype(np.float32) / 255
    if cut is not None: a = a.copy(); a[:, cut:] = 0
    return (base * (1 - a) + layer[..., :3] * a).astype(np.uint8)
def bbox(a, b):                                                    # where two states differ, in design units
    d = np.abs(a.astype(np.int16) - b.astype(np.int16)).sum(2) > 24
    ys, xs = np.nonzero(d)
    if not len(xs): return None
    lo = lambda v: np.percentile(v, 1); hi = lambda v: np.percentile(v, 99)
    return [lo(xs) / K, lo(ys) / K, hi(xs) / K, hi(ys) / K]
def ease(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)

# ---------- the build, as steps: (duration, frame(t) -> poster RGB uint8, camera target) ----------
# a camera target is (cx, cy, scale) in design units / screen px per design unit, or a function of t for followers
FIT = 0.80
whole = (540, 764, FIT)
def frame_on(b, fill=0.72, smin=FIT, smax=2.6, aspect=SW / SH):
    x0, y0, x1, y1 = b; w, h = max(40, x1 - x0), max(40, y1 - y0)
    s = min(SW * fill / w, SH * fill / h); return ((x0 + x1) / 2, (y0 + y1) / 2, max(smin, min(smax, s)))

blank = np.full((PH, PW, 3), 244, np.uint8)
M, COL, ROW = 16, 131, 187
lines = [('v', M + i * COL) for i in range(9)] + [('h', M + i * ROW) for i in range(9)]
def grid(img, amount, colour, alpha):
    if amount <= 0: return img
    img = img.copy(); n = len(lines); t = max(1, int(K))
    for j, (k, p) in enumerate(lines):
        f = min(1, max(0, amount * n * 0.5 - j * 0.5))
        if f <= 0: continue
        p = int(p * K)
        if k == 'v': L = int((PH - 2 * M * K) * f); y0 = int(M * K); img[y0:y0 + L, p:p + t] = (img[y0:y0 + L, p:p + t] * (1 - alpha) + np.array(colour) * alpha).astype(np.uint8)
        else: L = int((PW - 2 * M * K) * f); x0 = int(M * K); img[p:p + t, x0:x0 + L] = (img[p:p + t, x0:x0 + L] * (1 - alpha) + np.array(colour) * alpha).astype(np.uint8)
    return img
def wipe(a, b, t, axis=1):
    k = int((a.shape[axis]) * ease(t)); out = a.copy()
    if axis == 1: out[:, :k] = b[:, :k]
    else: out[:k] = b[:k]
    return out
def fade(a, b, t): t = ease(t); return (a * (1 - t) + b * t).astype(np.uint8)
def letter_ends(layer):
    cols = layer[..., 3].max(0) > 80; xs = np.nonzero(cols)[0]; ends, prev = [], xs[0]
    for x in xs[1:]:
        if x - prev > 3 * K: ends.append(prev + 1)
        prev = x
    return xs[0], ends + [xs[-1] + 1]

steps = []
def add(d, f, cam, grid_a=0.35): steps.append((d, f, cam, grid_a))
add(0.7, lambda t: blank, (540, 764, 0.55), 0)
add(1.1, lambda t: grid(blank, ease(t), (150, 150, 150), 0.7), whole, 0)
add(0.6, lambda t: wipe(blank, rgb('bg'), t, 0), whole)
b_img = bbox(rgb('bg'), rgb('photo'))
add(1.0, lambda t: fade(rgb('bg'), rgb('photo'), t), frame_on(b_img, 0.95))
pix = [n for n, _ in snaps if n.startswith('pixel-')]
# watch the pixels coarsen up close, on the busiest part of the object
b_pix = bbox(rgb('bg'), rgb(pix[-1])); cx, cy = (b_pix[0] + b_pix[2]) / 2, (b_pix[1] + b_pix[3]) / 2
add(0.6, lambda t: rgb('photo'), (cx - 60, cy - 160, 1.7))
for i, n in enumerate(pix): add(0.34, (lambda n: lambda t: rgb(n))(n), (cx - 60 + i * 30, cy - 160 + i * 50, 1.7 - i * 0.12))
last = pix[-1]
add(0.5, lambda t: rgb(last), frame_on(b_pix, 0.9))
for n in ['furniture', 'squares', 'text']:
    if n in S:
        b = bbox(rgb(last), rgb(n)); add(0.9, (lambda a, c: lambda t: wipe(rgb(a), rgb(c), t))(last, n), frame_on(b, 0.8, smax=2.4)); last = n
state = rgb(last)
# the headline: each line typed letter by letter, the camera following the caret
for n in [n for n, _ in snaps if n.startswith('line-')]:
    layer = S[n]; x0, ends = letter_ends(layer); ys = np.nonzero(layer[..., 3].max(1) > 80)[0]; y0, y1 = ys[0], ys[-1]
    lw = (ends[-1] - x0) / K; s_line = max(FIT, min(2.0, SW * 0.82 / lw))
    base = state; dur = 0.3 + 0.1 * len(ends)
    def f(t, base=base, layer=layer, ends=ends, x0=x0, y0=y0, y1=y1, dur=dur):
        k = min(len(ends), int(t * (len(ends) + 1.2)))
        cut = ends[k - 1] if k else x0
        img = over(base, layer, cut)
        if t < 0.97 and int(t * dur * 3.2) % 2 == 0:              # a blinking caret, in the type's colour
            mid = (y0 + y1) // 2; xs = np.nonzero(layer[mid, :, 3] > 200)[0]
            col = layer[mid, xs[0], :3] if len(xs) else np.array([255, 255, 255])
            cx = min(PW - 6, int(cut + 5 * K)); img[y0:y1, cx:cx + int(2 * K)] = col
        return img
    def cam(t, x0=x0, ends=ends, y0=y0, y1=y1, s_line=s_line):
        k = min(len(ends), int(t * (len(ends) + 1.2))); cut = ends[k - 1] if k else x0
        half = SW / s_line / 2 * 0.7                               # keep the caret in the right-hand part of the screen
        cx = min(max((cut / K) - half * 0.4, x0 / K + half * 0.6), ends[-1] / K - half * 0.6)
        return (cx, (y0 + y1) / 2 / K, s_line)
    add(dur, f, cam)
    state = over(base, layer)
add(0.5, lambda t: state, frame_on(bbox(rgb(last), state), 0.95))
# the ink: up close on a crossing of type and image while it spreads, then out
rng = np.random.default_rng(53)
dis = np.asarray(Image.fromarray((rng.random((PH // 48 + 1, PW // 48 + 1)) * 255).astype(np.uint8)).resize((PW, PH), Image.BICUBIC)).astype(np.float32) / 255
diff = np.abs(rgb('printed').astype(np.int16) - state.astype(np.int16)).sum(2)
yy, xx = np.unravel_index(np.argmax(np.asarray(Image.fromarray((diff > 30).astype(np.uint8) * 255).resize((PW // 64, PH // 64), Image.BOX))), (PH // 64, PW // 64))
ink_at = ((xx + 0.5) * 64 / K, (yy + 0.5) * 64 / K)
add(1.6, lambda t: np.where((dis < ease(t) * 1.08)[..., None], rgb('printed'), state), (ink_at[0], ink_at[1], 2.3), -1)
add(1.0, lambda t: fade(rgb('printed'), rgb('final'), t), (ink_at[0] + 40, ink_at[1] + 30, 2.0), 0)
add(1.2, lambda t: rgb('final'), whole, 0)
add(1.8, lambda t: rgb('final'), (540, 764, FIT * 1.06), 0)

# ---------- the camera: a critically damped spring chasing the targets, plus a little hand drift ----------
starts = np.cumsum([0] + [d for d, *_ in steps]); total = starts[-1]
LEAD = 0.35                                                       # the camera starts moving just before the work does
def target(T):
    i = int(np.searchsorted(starts, min(T + LEAD, total - 1e-3), 'right') - 1); d, f, cam, ga = steps[i]
    t = (T + LEAD - starts[i]) / d
    c = cam(min(1, max(0, t))) if callable(cam) else cam
    return np.array([c[0], c[1], np.log(c[2])])
n_frames = int(total * FPS)
pos = target(0).copy(); vel = np.zeros(3); cams = []
for i in range(n_frames):
    T = i / FPS; tg = target(T)
    w = np.array([5.4, 5.4, 4.4])                                 # stiffness: pans a touch quicker than zooms
    for _ in range(4):                                            # substeps for a stable spring
        dt = 1 / FPS / 4; a = w * w * (tg - pos) - 2 * w * vel; vel += a * dt; pos += vel * dt
    drift = np.array([np.sin(T * 0.7) * 3 + np.sin(T * 1.9 + 1) * 1.2, np.sin(T * 0.53 + 2) * 3 + np.sin(T * 1.6) * 1.1, np.sin(T * 0.41) * 0.008])
    cams.append((pos[0] + drift[0], pos[1] + drift[1], float(np.exp(pos[2] + drift[2]))))

def frame(i):
    T = i / FPS; cx, cy, s = cams[i]
    img = Image.new('RGB', (SW, SH), CANVAS); d = ImageDraw.Draw(img)
    step = 40 * s
    while step < 14: step *= 2                                    # dots stay a comfortable size as you zoom out
    ox, oy = (SW / 2 - cx * s) % step, (SH / 2 - cy * s) % step
    for yy in np.arange(oy, SH, step):
        for xx in np.arange(ox, SW, step): d.rectangle([xx, yy, xx + 1.4, yy + 1.4], fill=DOT)
    j = int(np.searchsorted(starts, T, 'right') - 1); j = min(j, len(steps) - 1); dur, f, cam, ga = steps[j]
    t = min(1, max(0, (T - starts[j]) / dur)); poster = f(t)
    g = 0.35 * (1 - ease(t)) if ga == -1 else ga
    if g > 0 and poster is not blank: poster = grid(poster, 1, (220, 220, 220), g)
    # only the part of the poster on screen, resized once
    vx0, vy0 = cx - SW / 2 / s, cy - SH / 2 / s; vx1, vy1 = vx0 + SW / s, vy0 + SH / s
    px0, py0, px1, py1 = max(0, vx0), max(0, vy0), min(1080, vx1), min(PH / K, vy1)
    if px1 > px0 and py1 > py0:
        crop = Image.fromarray(poster[int(py0 * K):int(np.ceil(py1 * K)), int(px0 * K):int(np.ceil(px1 * K))])
        size = (max(1, round((px1 - px0) * s)), max(1, round((py1 - py0) * s)))
        img.paste(crop.resize(size, Image.LANCZOS if s < K else Image.BICUBIC), (round((px0 - vx0) * s), round((py0 - vy0) * s)))
    return img

os.makedirs('deliver/reel', exist_ok=True)
outp = f'deliver/reel/{issue}-{concept}-{pick}-making-of.mp4'
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SW}x{SH}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', outp], stdin=subprocess.PIPE)
keep = set(int(n_frames * q) for q in (0.08, 0.2, 0.3, 0.45, 0.6, 0.75, 0.88, 0.99))
for i in range(n_frames):
    fr = frame(i); ff.stdin.write(fr.tobytes())
    if i in keep: fr.save(f'deliver/reel/still-{i:04d}.jpg', quality=80)
ff.stdin.close(); ff.wait()
print(outp, f'{total:.1f}s', n_frames, 'frames')
