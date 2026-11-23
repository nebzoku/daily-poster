#!/usr/bin/env python3
"""Make a day's concepts: python3 make.py 053
Reads concepts/<issue>-c1..c3.tpl.js and concepts/<issue>-colourways.json ({"c1": {"a": {...}, "b": ..., "c": ...}, ...}),
writes posters/<issue>-cN-x.js, renders them (out/*.png), and builds deliver/<issue>/ with full-size JPGs and an overview.
Re-render one poster after an edit with: node render.mjs posters/<issue>-c2-b.js
"""
import json, os, subprocess, sys
from PIL import Image
os.chdir(os.path.dirname(os.path.abspath(__file__)))
issue = sys.argv[1]
ways = json.load(open(f"concepts/{issue}-colourways.json"))
os.makedirs("posters", exist_ok=True)
files = []
for c, cw in ways.items():
    tpl = open(f"concepts/{issue}-{c}.tpl.js").read()
    for k, v in cw.items():
        f = f"posters/{issue}-{c}-{k}.js"; open(f, "w").write(tpl.replace("__CW__", json.dumps(v))); files.append(f)
for i in range(0, len(files), 3):   # three at a time keeps each render well inside the time limits
    subprocess.run(["node", "render.mjs", *files[i:i + 3]], check=False)
names = json.load(open(f"concepts/{issue}-names.json")) if os.path.exists(f"concepts/{issue}-names.json") else {}
os.makedirs(f"deliver/{issue}", exist_ok=True)
cs = sorted(ways); w, h = 360, 509
sheet = Image.new("RGB", (w * 3 + 40, h * len(cs) + 10 * (len(cs) + 1)), "#ddd")
for r, c in enumerate(cs):
    for j, k in enumerate(sorted(ways[c])):
        p = f"out/{issue}-{c}-{k}.png"
        if not os.path.exists(p): print("missing", p); continue
        im = Image.open(p).convert("RGB")
        im.save(f"deliver/{issue}/{issue}-concept-{c[1:]}-{names.get(c, c)}-colourway-{k.upper()}.jpg", quality=90)
        sheet.paste(im.resize((w, h), Image.LANCZOS), (10 + j * (w + 10), 10 + r * (h + 10)))
sheet.save(f"deliver/{issue}/{issue}-all-concepts.jpg", quality=88)
print("done:", f"deliver/{issue}")
