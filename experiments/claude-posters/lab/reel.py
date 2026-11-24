#!/usr/bin/env python3
"""Making-of reel: python3 reel.py <issue> <concept> <picked colourway> "<title>"
  e.g. python3 reel.py 053 c3 a "Chasing light near the sun"
Needs the snapshots of the picked poster (CAP=1 node render.mjs posters/<issue>-<concept>-<x>.js → out/..-snaps/) and
the finished renders of every colourway of that concept (out/<issue>-<concept>-*.png).
The poster is rebuilt in the order it was really made, on an open canvas in the Daily Poster style: the grid, the
background, the image dropped in and pixelated, the small type, the headline typed in, the ink, the paper, then a
pull back to the three colourways and the pick. No interface, no cursor: just the work. 1080 × 1920, 30 fps.
"""
import glob, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
issue, concept, pick, title = sys.argv[1:5]
FPS, SW, SH = 30, 1080, 1920
PW, PH = 1080, 1528                          # poster, design units
CANVAS, DOT, INK = (236, 236, 231), (204, 204, 198), (24, 24, 24)

# fonts: the toolkit's Work Sans, converted for PIL
def font(w, size):
    path = f'out/work-sans-{w}.ttf'
    if not os.path.exists(path):
        from fontTools.ttLib import TTFont
        f = TTFont(f'node_modules/@fontsource/work-sans/files/work-sans-latin-{w}-normal.woff2'); f.flavor = None; f.save(path)
    return ImageFont.truetype(path, size)
F16, F22 = font(500, 22), font(500, 26)

snapdir = f'out/{issue}-{concept}-{pick}-snaps'
snaps = [(re.sub(r'^\d+-', '', os.path.basename(p)[:-4]), p) for p in sorted(glob.glob(f'{snapdir}/*.png'))]
load = lambda p: np.asarray(Image.open(p).convert('RGBA').resize((PW, PH), Image.LANCZOS)).astype(np.float32) / 255
S = {n: load(p) for n, p in snaps}
ways = sorted(glob.glob(f'out/{issue}-{concept}-[a-z].png'))
WAYS = [np.asarray(Image.open(p).convert('RGB').resize((PW, PH), Image.LANCZOS)) for p in ways]
pick_i = [os.path.basename(p)[-5] for p in ways].index(pick)
rgb = lambda a: a[..., :3]
over = lambda base, layer: rgb(base) * (1 - layer[..., 3:]) + rgb(layer) * layer[..., 3:]

# ---------- the timeline: a list of (duration, frame(t 0..1) -> poster RGB float) ----------
def ease(t): return t * t * (3 - 2 * t)
blank = np.ones((PH, PW, 3), np.float32) * np.array([244, 244, 240]) / 255
grid_lines = []   # the brief's 8×8 grid with 16px margins
M, COL, ROW = 16, 131, 187
for i in range(9): grid_lines += [('v', M + i * COL), ('h', M + i * ROW)]
def grid(img, amount, colour=(0.55, 0.55, 0.55), alpha=0.6):
    if amount <= 0: return img
    img = img.copy(); n = len(grid_lines)
    for j, (k, p) in enumerate(grid_lines):
        f = np.clip(amount * n * 0.5 - j * 0.5, 0, 1)
        if f <= 0: continue
        if k == 'v': L = int((PH - 2 * M) * f); img[M:M + L, p:p + 1] = img[M:M + L, p:p + 1] * (1 - alpha) + np.array(colour) * alpha
        else: L = int((PW - 2 * M) * f); img[p:p + 1, M:M + L] = img[p:p + 1, M:M + L] * (1 - alpha) + np.array(colour) * alpha
    return img
def wipe(a, b, t, axis=1):          # b revealed left to right (axis 1) or top to bottom (axis 0)
    t = ease(t); out = a.copy(); n = a.shape[axis]; k = int(n * t)
    if axis == 1: out[:, :k] = b[:, :k]
    else: out[:k] = b[:k]
    return out
def letters(layer):                  # x positions where each letter of a line ends (gaps in the ink)
    cols = layer[..., 3].max(0) > 0.3; xs = np.nonzero(cols)[0]
    if not len(xs): return [PW]
    ends, prev = [], xs[0]
    for x in xs[1:]:
        if x - prev > 3: ends.append(prev + 1)
        prev = x
    return ends + [xs[-1] + 1], xs[0]
rng = np.random.default_rng(53)
dissolve = np.asarray(Image.fromarray((rng.random((PH // 24 + 1, PW // 24 + 1)) * 255).astype(np.uint8)).resize((PW, PH), Image.BICUBIC)).astype(np.float32) / 255

st = {}
def state(n): return rgb(S[n])
seq = []
def add(d, f, cam=None, grid_a=0.6): seq.append((d, f, grid_a))
add(0.6, lambda t: blank, grid_a=0)
add(1.0, lambda t: grid(blank, ease(t)), grid_a=0)
add(0.6, lambda t: wipe(blank, state('bg'), t, 0))
add(0.9, lambda t: state('bg') * (1 - ease(t)) + state('photo') * ease(t))
add(0.5, lambda t: state('photo'))
for n, _ in snaps:
    if n.startswith('pixel-'): add(0.28, (lambda n: lambda t: state(n))(n))
add(0.4, lambda t: state('pixel-24'))
last = 'pixel-24'
for n in ['furniture', 'squares', 'text']:
    if n in S: add(0.6, (lambda a, b: lambda t: wipe(state(a), state(b), t))(last, n)); last = n
# the headline, typed in line by line, letter by letter, with a caret
lines = [n for n, _ in snaps if n.startswith('line-')]
typed = [state(last)]
for n in lines:
    ends, x0 = letters(S[n]); base = typed[-1].copy(); layer = S[n]
    ys = np.nonzero(layer[..., 3].max(1) > 0.3)[0]; y0, y1 = ys[0], ys[-1]
    def f(t, base=base, layer=layer, ends=ends, y0=y0, y1=y1):
        k = min(len(ends), int(t * (len(ends) + 1.5))); x = ends[k - 1] if k else ends[0] - (ends[0] - 0)
        lay = layer.copy(); lay[:, x if k else 0:, 3] = 0
        img = over(base, lay)
        if t < 0.97 and int(t * 12) % 2 == 0:                     # the caret, in the type colour, blinking
            cx = min(PW - 4, (x if k else letters(layer)[1]) + 6); img[y0:y1, cx:cx + 3] = rgb(layer)[(y0 + y1) // 2, np.argmax(layer[(y0 + y1) // 2, :, 3] > 0.5)]
        return img
    add(0.25 + 0.09 * len(ends), f)
    typed.append(over(base, layer))
add(0.5, lambda t: typed[-1])
# the ink: the flat sheet turns into the printed one, spreading in patches; the grid lifts off
add(1.4, lambda t: np.where((dissolve < ease(t) * 1.1)[..., None], state('printed'), typed[-1]), grid_a=-1)
add(0.9, lambda t: state('printed') * (1 - ease(t)) + state('final') * ease(t), grid_a=0)
add(0.8, lambda t: state('final'), grid_a=0)
build_end = sum(d for d, _, _ in seq)
# the pull back to the colourways, then back in to the pick
PULL, HOLD, IN, END = 2.2, 1.6, 1.6, 1.4
total = build_end + PULL + HOLD + IN + END

GAP = 120
def pos(i): return (i - pick_i) * (PW + GAP)        # world x of each colourway, the pick at 0
def camera(T):
    s0, s1 = 0.74, 0.74 + 0.04 * min(1, T / build_end)  # a slow push in while it's built
    if T < build_end: return 540, 764, s1
    span = (len(WAYS) - 1) * (PW + GAP) + PW; cx_all = (pos(0) + pos(len(WAYS) - 1) + PW) / 2; s_all = 1000 / span
    u = T - build_end
    if u < PULL: k = ease(u / PULL); return 540 + (cx_all - 540) * k, 764, s1 + (s_all - s1) * k
    if u < PULL + HOLD: return cx_all, 764, s_all
    k = ease(min(1, (u - PULL - HOLD) / IN)); return cx_all + (540 - cx_all) * k, 764, s_all + (0.78 - s_all) * k

def frame(T):
    cx, cy, s = camera(T)
    img = Image.new('RGB', (SW, SH), CANVAS); d = ImageDraw.Draw(img)
    step = 48 * s                                              # the canvas dots move with the camera
    ox, oy = (SW / 2 - cx * s) % step, (SH / 2 - cy * s) % step
    for yy in np.arange(oy, SH, step):
        for xx in np.arange(ox, SW, step): d.rectangle([xx, yy, xx + 1.5, yy + 1.5], fill=DOT)
    # which poster image at this moment
    if T < build_end:
        acc = 0
        for dur, f, ga in seq:
            if T < acc + dur or (dur, f, ga) is seq[-1]:
                t = min(1, max(0, (T - acc) / dur)); poster = f(t); g = ga; break
            acc += dur
        if g == -1: g = 0.6 * (1 - ease(t))
        if g > 0 and not np.allclose(poster, blank): poster = grid(poster, 1, (0.85, 0.85, 0.85), 0.35 * g / 0.6)
        posters = [(0, (np.clip(poster, 0, 1) * 255).astype(np.uint8), 1)]
    else:
        u = T - build_end
        posters = []
        for i, w in enumerate(WAYS):
            a = 1 if i == pick_i else min(1, max(0, (u - 0.3 - 0.25 * abs(i - pick_i)) / 0.6))
            if u > PULL + HOLD * 0.4 and i != pick_i: a *= max(0.35, 1 - (u - PULL - HOLD * 0.4) / 0.8 * 0.65)
            posters.append((pos(i), w, a))
    for wx, arr, a in posters:
        if a <= 0: continue
        x, y, w, h = SW / 2 + (wx - cx) * s, SH / 2 + (0 - cy) * s, PW * s, PH * s
        if x > SW or x + w < 0: continue
        pim = Image.fromarray(arr).resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)
        if a < 1: pim = Image.blend(Image.new('RGB', pim.size, CANVAS), pim, a)
        img.paste(pim, (round(x), round(y)))
        if wx == 0 or T >= build_end:                      # the frame's name, small, above it, like a label on a sheet
            name = f'(No. {issue}) {title}' if wx == 0 else f'(No. {issue}) Colourway {"ABC"[[pos(i) for i in range(len(WAYS))].index(wx)]}'
            if T >= build_end and wx == 0: name = f'(No. {issue}) Colourway {pick.upper()}  (Picked)' if T > build_end + PULL else name
            d.text((round(x), round(y) - 34 * max(0.6, s / 0.8)), name, font=F16 if s > 0.5 else font(500, 18), fill=INK if a > 0.5 else (150, 150, 150))
    # furniture, inside Instagram's safe area
    d.text((60, 240), '(Daily Poster)', font=F22, fill=INK); d.text((SW - 60, 240), f'(No. {issue})', font=F22, fill=INK, anchor='ra')
    d.text((60, SH - 320), '(Making of)', font=F22, fill=INK); d.text((SW - 60, SH - 320), '(Nebzokai)', font=F22, fill=INK, anchor='ra')
    return img

os.makedirs(f'deliver/reel', exist_ok=True)
outp = f'deliver/reel/{issue}-{concept}-{pick}-making-of.mp4'
n = int(total * FPS)
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SW}x{SH}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', outp], stdin=subprocess.PIPE)
for i in range(n):
    fr = frame(i / FPS); ff.stdin.write(fr.tobytes())
    if i in (int(n * 0.1), int(n * 0.35), int(n * 0.55), int(n * 0.75), n - 1): fr.save(f'deliver/reel/{issue}-{concept}-{pick}-still-{i:04d}.jpg', quality=85)
ff.stdin.close(); ff.wait()
print(outp, f'{total:.1f}s', n, 'frames')
