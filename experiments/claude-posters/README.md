# Claude's posters (Nebzokai)

Every morning Claude designs **three concepts, each in three colourways** from the day's Daily Poster brief.
Ben picks the ones to post; they go into the archive credited **Nebzokai** (Ben's own work is Nebzoku).

- `STYLE.md`: every rule from Ben's feedback. Read it all before designing. It overrides anything here.
- `log.md`: one line per issue: the three concepts, their headline, layout system and image treatment, and what was
  picked. Use it to vary from the day before.
- `lab/`: the toolkit.
  - `lib.js`: type setting (`setOptical`, `sameOptical8`, `pinBlocks`, `pinInterlock`, `breaks`, `balance`, `block`),
    grid (`cell`, `COL`, `ROW`, `M`), masks and treatments (`lumMask`, `lineMask`, `levels`, `tone`, `pixelate`,
    `stretch`, `ascii`, `pixelCircle`, `xorShapes`, `circleMask`, `rectMask`), ink and paper (`press`, `IM.print`,
    `IM.paper`, `grain`), and the little things (`asterisk`, `pixels`, `label`).
  - `inkm.js`: the Ink Machine's own print code (site/ink-machine), unchanged, wrapped as `IM`.
  - `index.html` + `render.mjs`: renders a poster script to `out/<name>.png` at 2160 × 3056.
  - `make.py <issue>`: fills each concept template with each colourway, renders all nine and builds
    `deliver/<issue>/` (full-size JPGs + an overview).
  - `concepts/`: one template per concept (`<issue>-c1.tpl.js` …) with `__CW__` where the colourway object goes,
    plus `<issue>-colourways.json` and `<issue>-names.json`. Past days are worked examples.

## The daily run
1. `git pull`. Read `site/data/latest.json` (check its date is today in Europe/London), `STYLE.md`, `log.md`.
2. `cd lab && npm install` (fontsource text faces). If the brief's fonts aren't covered, add them: Google faces via
   `npm i @fontsource/<slug>` and an entry in the `FS` map in `index.html`; the libre faces are already linked.
   Load every face you use with `fonts([...])` before drawing.
3. Concept step for each of the three (write it at the top of each template): the story in one line, the everyday
   thing people recognise, the visual idea, the image and why, a mood check. Use different headlines from the brief
   and different layout systems and treatments across the three, and different from yesterday (see `log.md`).
   Mix the type too: across the three, include a serif headline in sentence case and a sans in all caps.
4. Write the three templates and the colourways (only swap which palette colours play background / middle / type).
5. `python3 make.py <issue>`, then **look at every poster** and fix what breaks the rules: headline on the margins
   (cap height top, descenders on the bottom margin, widest line edge to edge), no touching letters (set headlines with
   `inkSafe`), natural line breaks, subline
   block with no orphans, text on grid lines, nothing colliding.
6. Send Ben the overview and the nine posters, and a push notification. Add the day to `log.md` and commit the
   templates + log (not the renders).
7. When Ben picks, copy the chosen PNGs to `site/showcase/<issue>-<slug>.jpg` (JPEG quality 90) and add entries to the
   top of `site/data/showcase.json` with `"designer": "Nebzokai"`, then commit and push to main.
