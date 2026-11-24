#!/usr/bin/env python3
"""Instagram zoom carousel: python3 carousel.py <poster.png> <out-stem> [x y w]
Frames 2-4 of a poster's carousel (frame 1 is the usual poster picture, made by scripts/instagram/images.mjs): one
strip of the poster stretched across three 4:5 frames, so a swipe pans along one close-up. The strip is 2.4:1
(w wide, w / 2.4 tall, in design units of the 1080 × 1528 poster). Left out, x, y and w are chosen: the full width
less the margins (so it shows plenty of the poster), at the height where the most is going on, without cutting
through a line of small type. Writes <out-stem>-zoom-2..4.jpg.
"""
import sys
import numpy as np
from PIL import Image
FW, FH = 1080, 1350
src, stem = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); k = im.width / 1080
if len(sys.argv) > 5: x, y, w = map(float, sys.argv[3:6])
else:
    x, w = 8, 1064
    h = w * FH / (3 * FW)
    g = np.asarray(im.convert('L').resize((540, round(im.height / k / 2))), dtype=np.float32)
    edge = np.abs(np.diff(g, axis=1)).mean(1); edge = np.append(edge, edge[-1])          # detail per row (half units)
    fine = (np.abs(np.diff(g, axis=1)) > 40).mean(1); fine = np.append(fine, fine[-1])
    best, by = -1e9, 0
    for yy in range(8, int(1528 - h - 8), 4):
        a, b = yy // 2, int((yy + h) // 2)
        score = edge[a:b].mean() - 6 * (fine[a] + fine[min(b, len(fine) - 1)])           # don't cut through small type
        score -= 0.002 * abs((yy + h / 2) - 1528 * 0.4)                                    # a slight pull to the upper middle
        if score > best: best, by = score, yy
    y = by
h = w * FH / (3 * FW)
box = tuple(round(v * k) for v in (x, y, x + w, y + h))
strip = im.crop(box).resize((3 * FW, FH), Image.LANCZOS)
for i in range(3): strip.crop((i * FW, 0, (i + 1) * FW, FH)).save(f'{stem}-zoom-{i + 2}.jpg', quality=92)
print(f'strip x {x:.0f} y {y:.0f} w {w:.0f} ({3 * FW / (box[2] - box[0]):.2f}x of the render)')
