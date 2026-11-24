#!/usr/bin/env python3
"""Instagram zoom carousel for a poster: python3 carousel.py <issue-slug> <poster.png> <x> <y> <w>
Frame 1 is the whole poster on black, laid out exactly like the account's usual poster posts. Frames 2-4 are one
strip cut from the poster (x, y, w in design units, 1080 x 1528 poster) and stretched across three 4:5 frames,
so swiping pans across one continuous close-up. The strip is 2.4:1, so its height is w / 2.4.
Writes deliver/carousel/<issue-slug>/<issue-slug>-1..4.jpg plus a preview of the strip.
"""
import os, sys
from PIL import Image
os.chdir(os.path.dirname(os.path.abspath(__file__)))
slug, src, x, y, w = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:6])
FW, FH = 1080, 1350
im = Image.open(src).convert('RGB'); k = im.width / 1080           # pixels per design unit in the render
out = f'deliver/carousel/{slug}'; os.makedirs(out, exist_ok=True)
# 1: the poster, as the account posts it (892 x 1262 at 94, 44 on black)
f1 = Image.new('RGB', (FW, FH), 'black'); f1.paste(im.resize((892, 1262), Image.LANCZOS), (94, 44))
f1.save(f'{out}/{slug}-1.jpg', quality=92)
# 2-4: the strip
h = w * FH / (3 * FW)
box = tuple(round(v * k) for v in (x, y, x + w, y + h))
assert box[2] <= im.width and box[3] <= im.height, f'strip runs off the poster: {box}'
strip = im.crop(box).resize((3 * FW, FH), Image.LANCZOS)
for i in range(3): strip.crop((i * FW, 0, (i + 1) * FW, FH)).save(f'{out}/{slug}-{i + 2}.jpg', quality=92)
print(f'zoom {3 * FW / (box[2] - box[0]):.2f}x of the render, strip {box}')
prev = Image.new('RGB', (3 * FW // 3 + 20, FH // 3 * 2 + 30), '#ddd')
p1 = f1.resize((FW // 3, FH // 3)); prev.paste(p1, (10, 10))
sp = strip.resize((FW, FH // 3)); prev = Image.new('RGB', (FW // 3 + FW + 30, FH // 3 + 20), '#ddd')
prev.paste(p1, (10, 10)); prev.paste(sp, (FW // 3 + 20, 10)); prev.save(f'{out}/{slug}-preview.jpg', quality=88)
