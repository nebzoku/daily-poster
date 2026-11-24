#!/usr/bin/env python3
"""Instagram extras for the day's picks: python3 extras.py <issue> <pick> [<pick> ...]   e.g. python3 extras.py 053 1C 2B 3A
Picks as Ben gives them (concept number + colourway letter), his favourite first. Run after the picks are in the archive.
  - every pick: a zoom carousel (site/media/ig/<poster>-zoom-2..4.jpg; the poster's own picture is frame 1), so it
    goes out as a four-frame carousel instead of a single picture
  - the first pick: the making-of reel (site/media/ig/<poster>-making-of.mp4), posted later that day as a Reel
The poster's name comes from concepts/<issue>-names.json, matching site/showcase/<issue>-<name>.jpg.
"""
import json, os, re, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
issue, picks = sys.argv[1], sys.argv[2:]
IG = '../../../site/media/ig'
names, ways = json.load(open(f'concepts/{issue}-names.json')), json.load(open(f'concepts/{issue}-colourways.json'))
for n, pk in enumerate(picks):
    m = re.fullmatch(r'(\d)([A-Za-z])', pk.strip()); c, x = f'c{m[1]}', m[2].lower()
    stem = f'{IG}/{issue}-{names[c]}'
    poster = f'posters/{issue}-{c}-{x}.js'
    open(poster, 'w').write(open(f'concepts/{issue}-{c}.tpl.js').read().replace('__CW__', json.dumps(ways[c][x])))
    if n == 0:   # the favourite: render with the build steps captured, then the reel
        subprocess.run(['node', 'render.mjs', poster], env={**os.environ, 'CAP': '1'}, check=True)
        subprocess.run(['python3', 'reel.py', issue, c, x], check=True)
        os.replace(f'deliver/reel/{issue}-{c}-{x}-making-of.mp4', f'{stem}-making-of.mp4')
    elif not os.path.exists(f'out/{issue}-{c}-{x}.png'): subprocess.run(['node', 'render.mjs', poster], check=True)
    subprocess.run(['python3', 'carousel.py', f'out/{issue}-{c}-{x}.png', stem], check=True)
    print(f'{pk}: {stem}-zoom-2..4.jpg' + (', making-of reel' if n == 0 else ''))
