#!/usr/bin/env python3
"""Instagram extras for the day's picks: python3 extras.py <issue> <pick> [<pick> ...]   e.g. python3 extras.py 053 1C 2B 3A
Picks as Ben gives them (concept number + colourway letter), his favourite first. Run after the picks are in the archive.
  - every pick: close-ups (site/media/ig/<poster>-zoom-2..5.jpg, the poster in quarters; the poster's own picture is
    frame 1), so it goes out as a five-frame carousel instead of a single picture
  - the first pick: the making-of reel (site/media/ig/<poster>-making-of.mp4), posted later that day as a Reel; on
    moving days it ends with the motion being made (timeline, keyframes, scrubbing) and the end card moving
  - on moving days (day 3 of the style rotation, STYLE.md Round 36), when concepts/<issue>-cN.motion.tpl.js exists for the favourite:
    the moving version, rendered frame by frame, saved as site/showcase/<issue>-<name>.mp4 and set as that poster's
    "video" in showcase.json with "postManually": true (Ben posts it by hand, with music); the 9:16 version for
    Instagram is left in deliver/motion/ to send him. The daily workflow makes the archive preview.
The poster's name comes from concepts/<issue>-names.json, matching site/showcase/<issue>-<name>.jpg.
"""
import json, os, re, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
issue, picks = sys.argv[1], sys.argv[2:]
IG = '../../../site/media/ig'
names, ways = json.load(open(f'concepts/{issue}-names.json')), json.load(open(f'concepts/{issue}-colourways.json'))
# on moving days the favourite moves: render its frames first, so the making-of reel can end with the motion
m = re.fullmatch(r'(\d)([A-Za-z])', picks[0].strip()); fc, fx = f'c{m[1]}', m[2].lower()
mtpl = f'concepts/{issue}-{fc}.motion.tpl.js'; moving = os.path.exists(mtpl)   # moving days (STYLE.md Round 36: day 3 of the rotation) have motion templates
if moving:
    mname = f'{issue}-{fc}-{fx}-motion'
    open(f'posters/{mname}.js', 'w').write(open(mtpl).read().replace('__CW__', json.dumps(ways[fc][fx])))
    subprocess.run(['node', 'render.mjs', f'posters/{mname}.js'], env={**os.environ, 'FRAMES': '48', 'K': '1'}, check=True)
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
    print(f'{pk}: {stem}-zoom-2..5.jpg' + (', making-of reel' if n == 0 else ''))

# moving days: the favourite moves
c, x = fc, fx
if moving:
    name = mname
    subprocess.run(['python3', 'motion.py', name], check=True)
    vid = f'showcase/{issue}-{names[c]}.mp4'
    os.replace(f'deliver/motion/{name}.mp4', f'../../../site/{vid}')
    sj = '../../../site/data/showcase.json'; show = json.load(open(sj))
    for e in show:
        if e['image'] == f'showcase/{issue}-{names[c]}.jpg': e['video'] = vid; e['postManually'] = True; e['previewAt'] = 0; e['previewLength'] = 4   # archive snippet = one whole 4 s loop, so it loops with no jump
    json.dump(show, open(sj, 'w'), indent=2, ensure_ascii=False); open(sj, 'a').write('\n')
    print(f'{picks[0]} moves: site/{vid}; Instagram version deliver/motion/{name}-reel.mp4')

