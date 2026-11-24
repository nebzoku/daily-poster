# Claude's posters (Nebzokai)

Every morning Claude designs **three concepts, each in three colourways** from the day's Daily Poster brief.
Ben picks the ones to post; they go into the archive credited **Nebzokai** (Ben's own work is Nebzoku).

- `STYLE.md`: every rule from Ben's feedback. Read it all before designing. It overrides anything here.
- `log.md`: one line per issue: the three concepts, their headline, layout system and image treatment, and what was
  picked. Use it to vary from the day before.
- `lab/`: the toolkit.
  - `lib.js`: type setting (`setOptical`, `sameOptical8`, `pinBlocks`, `pinInterlock`, `breaks`, `balance`, `block`),
    grid (`cell`, `COL`, `ROW`, `M`), masks and treatments (`lumMask`, `lineMask`, `levels`, `tone`, `pixelate`,
    `stretch`, `ascii`, `pixelCircle`, `xorShapes`, `circleMask`, `rectMask`), ink and paper (`press`, `IM.print`, `printAll` (the whole sheet printed like the headline), `spreadWords`,
    `IM.paper`, `grain`, `printHead` print styles incl. foils, varnish, emboss; `stock` paper stocks), and the little things (`asterisk`, `pixels`, `label`).
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
   Give each concept a different print process (`printHead`) and paper stock (`stock`), different from yesterday.
4. Write the three templates and the colourways (only swap which palette colours play background / middle / type).
4a. Mark the build steps in each template for the making-of reel (no effect on the poster): `snap('bg', out)` after the
   background, then after each move `snap('place-<x>', out)` (image or object placed), `snap('step-<group>-<n>', out)`
   (a treatment applied in stages, e.g. pixelation; for the in-between stages draw onto a copy inside
   `if (CAPTURE) {...}`), `snap('shape-<x>', out)` (a shape drawn), `snap('text-<x>', out)` (small type); then
   `snapLines(<headline tinted>, R)`, `inkTrials(out, (g, k) => <print the sheet and headline with ink k×>)`,
   `snap('printed', out)` after the headline is printed and `snap('final', out)` at the end. See 053-c3 or 052-c2.
4b. In each template, draw everything except the headline, then `printAll(g, C, ...)`, then `printHead`, then `stock`.
5. `python3 make.py <issue>`, then **look at every poster** and fix what breaks the rules: headline on the margins
   (cap height top, descenders on the bottom margin, widest line edge to edge), no touching letters (set headlines with
   `inkSafe`), natural line breaks, subline
   block with no orphans, text on grid lines, nothing colliding.
6. Send Ben the overview and the nine posters, and a push notification. Add the day to `log.md` and commit the
   templates + log (not the renders).
6b. Instagram extras, once Ben has picked and the picks are in the archive: `python3 lab/extras.py <issue> <picks, his
   favourite first>` (e.g. `1B 3A`). Every pick gets a zoom carousel (`site/media/ig/<name>-zoom-2..4.jpg`, a strip
   across the full width at the busiest height; `carousel.py` takes x y w to override it), so it goes out as a
   four-frame carousel; his favourite also gets the making-of reel (`site/media/ig/<name>-making-of.mp4`). Send Ben
   the reel: he posts it by hand from the Instagram app so he can add music (the API can't); the auto-poster skips it.
7. When Ben picks, copy the chosen PNGs to `site/showcase/<issue>-<slug>.jpg` (JPEG quality 90) and add entries to the
   top of `site/data/showcase.json` with `"designer": "Nebzokai"`, then commit and push to main.
