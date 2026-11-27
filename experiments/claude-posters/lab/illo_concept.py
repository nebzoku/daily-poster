#!/usr/bin/env python3
"""The illustrated concept for the morning run: python3 illo_concept.py <issue> <cN> <scamp-number> [finish] [stock]
   e.g. python3 illo_concept.py 056 c3 02 screen newsprint
Reads today's brief (site/data/latest.json) and the machine's scamps (experiments/claude-posters/scamps/<date>/),
writes concepts/<issue>-<cN>.tpl.js (from concepts/illo-scamp.tpl.js, with the concept note on top) and adds the
three colourways to concepts/<issue>-colourways.json: A as drawn, B with the vivid and the mid swapped, C with the
vivid and the pale swapped (each colour's tints and shades follow it). Then make.py renders it with the others.
"""
import json, os, re, subprocess, sys, datetime
os.chdir(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.abspath('../../..')
issue, cn, num = sys.argv[1], sys.argv[2], sys.argv[3].zfill(2)
finish = sys.argv[4] if len(sys.argv) > 4 else 'riso'; stock = sys.argv[5] if len(sys.argv) > 5 else 'uncoated'
b = json.load(open(f'{ROOT}/site/data/latest.json')); d = b['date']
sc = json.load(open(f'{ROOT}/experiments/claude-posters/scamps/{d}/scamps.json'))
s = next(x for x in sc['scenes'] if x.get('file') == f'scamp-{num}.png')
pal = b['palette']['colours']
shades = b.get('shades') or json.loads(subprocess.run(['node', '-e', f"import('{ROOT}/scripts/lib/palette.mjs').then(m=>console.log(JSON.stringify(m.shadesFor({json.dumps(pal)}))))"], capture_output=True, text=True).stdout)
hl = (b.get('highlight') or b.get('pop') or {}).get('hex')
fam = {c: [c] + next(r['steps'] for r in shades if r['colour'] == c) for c in pal}
cols = [c for c in pal for c in fam[c]] + ['#000000', '#FFFFFF'] + ([hl] if hl else [])

# the headline: the brief's own words, broken at the most natural pause (before a preposition/conjunction, near the middle)
PAUSE = {'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'through', 'since', 'from', 'into', 'over', 'under', 'and', 'but', 'or', 'as', 'than', 'that', 'near', 'before', 'after', 'between'}
words = s['headline'].replace(',', '').split()
def score(i):
    nxt, prv = words[i].lower(), words[i - 1].lower()
    return (3 if nxt in PAUSE else 0) - (4 if prv in ('the', 'a', 'an', 'of', 'to', 'in') else 0) - abs(i - len(words) / 2) * 0.4
lines = [s['headline']] if len(words) < 3 else (lambda i: [' '.join(words[:i]), ' '.join(words[i:])])(max(range(1, len(words)), key=score))
t = b['type']; display, text = t['display'], t['text']
FONTS = {'Six Caps': (400, True), 'Mattone': (900, True), 'Anybody': (900, True), 'Terminal Grotesque': (400, True), 'Schibsted Grotesk': (900, True), 'Work Sans': (800, True)}
weight, caps = FONTS.get(display, (400, False))
if caps or display in ('Six Caps',): lines = [l.upper() for l in lines]
else:   # sentence case, but proper nouns keep their capital (words the story itself capitalises mid-sentence: Alaskan)
    story = ' '.join([b['story'].get('summary', ''), b['story'].get('title', '')] + b.get('sublines', []))
    proper = {w for w in re.findall(r"(?<=[a-z,;:] )([A-Z][a-z']+)", story)}
    low = lambda l: ' '.join(w if w in proper else w.lower() for w in l.split())
    lines = [lines[0][0].upper() + low(lines[0])[1:]] + [low(l) for l in lines[1:]]
if display == 'Six Caps': lines = [' '.join(lines)]                      # condensed faces in one band go on one line
z = s.get('headlineZone', 'top-and-bottom')
split = {'top': len(lines), 'bottom': 0}.get(z, 1 if len(lines) > 1 else len(lines))
dt = datetime.date.fromisoformat(d)
base = {'scamp': f'/experiments/claude-posters/scamps/{d}/scamp-{num}.png', 'font': display, 'weight': weight, 'text_font': text, 'caps': caps,
        'lines': lines, 'sides': ['C'] * len(lines), 'split': split, 'cols': cols, 'palette': pal,
        'furniture': ['(Daily Poster)', f'(No. {issue})', f"({dt.strftime('%A')} {dt.day} {dt.strftime('%B')})", f"({b['story']['source']})"],
        'subline': b['sublines'][0], 'finish': finish, 'stock': stock}
swap = lambda a, c: {**{x: y for x, y in zip(fam[pal[a]], fam[pal[c]])}, **{y: x for x, y in zip(fam[pal[a]], fam[pal[c]])}}
ways_path = f'concepts/{issue}-colourways.json'
ways = json.load(open(ways_path)) if os.path.exists(ways_path) else {}
ways[cn] = {'a': {**base, 'remap': {}}, 'b': {**base, 'remap': swap(0, 2)}, 'c': {**base, 'remap': swap(0, 1)}}
json.dump(ways, open(ways_path, 'w'), indent=1)
note = f"""// No. {issue} · Concept {cn[1:]} · "{' / '.join(lines)}" · {display}, {'caps' if caps else 'sentence case'}, in the plain band the scamp left
// ({z}). Illustrated: scamp-{num} from the illustration machine (Nano Banana, Ben's references + our kept set).
// Scene: {s['angle']}.
// Finish and paper: {finish} on {stock}. Colourways: A as drawn, B vivid and mid swapped, C vivid and pale swapped.
"""
open(f'concepts/{issue}-{cn}.tpl.js', 'w').write(note + open('concepts/illo-scamp.tpl.js').read())
if hl:
    from PIL import Image
    im = Image.open(f'{ROOT}/experiments/claude-posters/scamps/{d}/scamp-{num}.png').convert('RGB').resize((424, 632))
    H = [int(hl[i:i + 2], 16) for i in (1, 3, 5)]
    near = lambda p, c: sum((a - b) ** 2 for a, b in zip(p, c))
    others = [[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in cols if c != hl]
    n = sum(1 for p in im.get_flattened_data() if near(p, H) < min(near(p, c) for c in others))
    print(f'highlight {hl}: {n} px of {424 * 632} in the scamp' + ('' if n >= 6 else ' — MISSING: pick another scamp, or ask the machine for a re-draw'))
print(f'concepts/{issue}-{cn}.tpl.js: "{" / ".join(lines)}" ({z}), colourways added to {ways_path}')
