#!/usr/bin/env python3
"""Instagram close-up carousel: python3 carousel.py <poster.png> <out-stem>
Frames 2-5 of a poster's carousel (frame 1 is the usual poster picture, made by scripts/instagram/images.mjs): the
poster in quarters, top left, top right, bottom left, bottom right (Ben, 24 Nov 2026: like obh_design's posts). Each
frame is 4:5 and half the poster tall, so the four cover all of it, overlapping a little left to right.
Writes <out-stem>-zoom-2..5.jpg.
"""
import sys
from PIL import Image
FW, FH = 1080, 1350
src, stem = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); W, H = im.size
h = H / 2; w = h * FW / FH                                        # half the poster tall, 4:5
boxes = [(0, 0), (W - w, 0), (0, H - h), (W - w, H - h)]
for i, (x, y) in enumerate(boxes):
    im.crop((round(x), round(y), round(x + w), round(y + h))).resize((FW, FH), Image.LANCZOS).save(f'{stem}-zoom-{i + 2}.jpg', quality=92)
print(f'{stem}: quarters {w:.0f} x {h:.0f} px of the render')
