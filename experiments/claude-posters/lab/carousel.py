#!/usr/bin/env python3
"""Instagram close-up carousel: python3 carousel.py <poster.png> <out-stem>
Frames 2-5 of a poster's carousel (frame 1 is the usual poster picture, made by scripts/instagram/images.mjs): the
poster in quarters, top left, top right, bottom left, bottom right (Ben, 24 Nov 2026). Each pair spans exactly the
poster's full width with no overlap, so swiping from left to right the two frames join up seamlessly; each frame is
4:5, so a strip across the middle of the poster isn't shown, which is fine.
Writes <out-stem>-zoom-2..5.jpg.
"""
import sys
from PIL import Image
FW, FH = 1080, 1350
src, stem = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); W, H = im.size
w = W / 2; h = w * FH / FW                                        # half the poster wide, 4:5
boxes = [(0, 0), (w, 0), (0, H - h), (w, H - h)]
for i, (x, y) in enumerate(boxes):
    im.crop((round(x), round(y), round(x + w), round(y + h))).resize((FW, FH), Image.LANCZOS).save(f'{stem}-zoom-{i + 2}.jpg', quality=92)
print(f'{stem}: quarters {w:.0f} x {h:.0f} px of the render, two frames across the full width')
