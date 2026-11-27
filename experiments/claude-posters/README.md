# Daily Poster: the machine-made posters

Every morning Claude designs **three concepts, each in three colourways** from the day's Daily Poster brief.
Ben picks the ones to post; they go into the archive credited **Daily Poster** (from 26 Nov 2026; earlier ones were Nebzokai), with captions reading "Made by Daily Poster, curated by @benjamin_harwood"; Ben's own work is credited to him.

- `STYLE.md`: every rule from Ben's feedback. Read it all before designing. It overrides anything here.
- `posting.md`: the posting schedule (poster D+1, reel D+2) and what Ben has to post by hand, with dates.
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
**Style rotation (Ben, 27 Nov 2026, STYLE.md Round 36):** each morning's three concepts are all in one style, rotating
day by day: day = `(issue - 57) % 5 + 1`: 1 classic, 2 type with scanned paper and handwriting, 3 moving, 4 illustrated,
5 combined. Steps 3b and 3c below and the moving-poster section apply on their own days; on the other days skip them.
Picks go out on Instagram as one grid post a day (favourite as cover, other picks as slides).

1. `git pull`. Read `site/data/latest.json` (check its date is today in Europe/London), `STYLE.md`, `log.md`.
2. `cd lab && npm install` (fontsource text faces). If the brief's fonts aren't covered, add them: Google faces via
   `npm i @fontsource/<slug>` and an entry in the `FS` map in `index.html`; the libre faces are already linked.
   Load every face you use with `fonts([...])` before drawing.
3. Concept step for each of the three (write it at the top of each template): the story in one line, the everyday
   thing people recognise, the visual idea, the image and why, a mood check. Use different headlines from the brief
   and different layout systems and treatments across the three, and different from yesterday (see `log.md`).
   Mix the type too: across the three, include a serif headline in sentence case and a sans in all caps. On serif
   days, use the Vinho Verde moves in STYLE.md Round 19, and feel free to make one option type-only (type, ink and
   texture, one subtle change in the type carrying the story). That style can carry real handwriting over the top
   from the day's scans (`site/media/<date>/hand-*.jpg`, see STYLE.md Round 24).
   Give each concept a different print process (`printHead`) and paper stock (`stock`), different from yesterday.
3c. **The fourth, combined concept** (Ben, 26 Nov 2026): every morning, as well as the three, a fourth concept
   (`concepts/<issue>-c4.tpl.js`, three colourways like the others) that combines the styles: a spot illustration
   cropped from the day's scamp (`spotIn`) in a frame on a taped card, among thresholded / pixelated / masked image
   boxes, on the scanned paste-up sheet, with our type. Start from the last combined concept Ben liked (log.md) and
   change one or two things, guided by his last feedback on it. Worked example: `concepts/test-055-mix.tpl.js`.
3b. **The illustrated concept** (Ben, 26 Nov 2026): most days, one of the three concepts is an illustration. The
   Illustration machine workflow (05:53 UTC, `scripts/illo-gen.mjs`) draws four Nano Banana scamps of the day's brief,
   styled on Ben's references and the illustrations he has kept, into `experiments/claude-posters/scamps/<date>/`
   (`git pull` first; if they aren't there, skip the illustrated concept that day and say so). Look at all four, pick
   the strongest that has the highlight and a different move from the last illustrated concept (`log.md`), and run
   `python3 lab/illo_concept.py <issue> <cN> <scamp-number> <finish> <stock>`: it writes `concepts/<issue>-cN.tpl.js` and
   that concept's three colourways (A as drawn; B vivid and mid swapped; C vivid and pale swapped) and reports whether
   the highlight is in the scamp. Then `make.py` renders it with the other two. No posed, smiling close-up faces
   (STYLE.md Round 30). Log it as "illustrated (scamp NN, the move)".
4. Write the three templates and the colourways (only swap which palette colours play background / middle / type).
4a. Mark the build steps in each template for the making-of reel (no effect on the poster): `snap('bg', out)` after the
   background, then after each move `snap('place-<x>', out)` (image or object placed), `snap('step-<group>-<n>', out)`
   (a treatment applied in stages, e.g. pixelation; for the in-between stages draw onto a copy inside
   `if (CAPTURE) {...}`), `snap('shape-<x>', out)` (a shape drawn), `snap('text-<x>', out)` (small type only: little marks like pixel runs, asterisks and
   boxes get their own `place-` snap, so they're dragged in, never set in a text box); then
   `snapLines(<headline tinted>, R)`, `inkTrials(out, (g, k) => <print the sheet and headline with ink k×>)`,
   `snap('printed', out)` after the headline is printed and `snap('final', out)` at the end. See 053-c3 or 052-c2.
4b. In each template, draw everything except the headline, then `printAll(g, C, ...)`, then `printHead`, then `stock`.
5. `python3 make.py <issue>`, then **look at every poster** and fix what breaks the rules: headline on the margins
   (cap height top, descenders on the bottom margin, widest line edge to edge), no touching letters (set headlines with
   `inkSafe`), natural line breaks, subline
   block with no orphans, text on grid lines, nothing colliding.
6. Send Ben the overview and the nine posters, and a push notification. In the same message, tell him what he has
   to post by hand today, from `posting.md` (Ben, 25 Nov 2026: posters go out the day after their brief, the
   favourite's making-of reel the day after that; moving posters and reels are posted by hand). Flag anything
   overdue, and keep `posting.md` up to date (new rows when picks come in, Posted filled when he says). Schedule a
   nudge (`send_later` into this session) for each of today's by-hand posts at its planned time: when it fires, send
   the mp4 with SendUserFile, its caption in a code block, and a push notification. Add the day to `log.md` and commit the
   templates + log (not the renders).
6b. Instagram extras, once Ben has picked and the picks are in the archive: `python3 lab/extras.py <issue> <picks, his
   favourite first>` (e.g. `1B 3A`). Every pick gets close-ups (`site/media/ig/<name>-zoom-2..5.jpg`, the poster in
   quarters), so it goes out as a five-frame carousel; his favourite also gets the making-of reel (`site/media/ig/<name>-making-of.mp4`). Send Ben
   the reel: he posts it by hand from the Instagram app so he can add music (the API can't); the auto-poster skips it.
7. When Ben picks, copy the chosen PNGs to `site/showcase/<issue>-<slug>.jpg` (JPEG quality 90) and add entries to the
   top of `site/data/showcase.json` with `"designer": "Daily Poster"`, then commit and push to main.

## Moving posters (prototype, 24 Nov 2026)
A template can define `window.MOTION = async () => { ...setup...; return async (t) => canvas }` instead of
`window.POSTER`: setup once, then one frame for each t from 0 to 1 (a loop). Render the frames with
`FRAMES=48 K=1 node render.mjs posters/<name>.js` (K=1 keeps it to about 5 s a frame), then
`python3 motion.py <name>` for the poster video and a 9:16 Instagram version in `deliver/motion/`. Reset `seed()` at
the start of every frame so the paper and ink stay still and only what moves changes. Example:
`concepts/053-c3.motion.tpl.js`.

On moving days (day 3 of the style rotation) the favourite pick also moves: write
`concepts/<issue>-cN.motion.tpl.js` for each concept alongside the still one, and `extras.py` renders the favourite's,
puts it in the archive as a video poster and leaves the 9:16 Instagram version in `deliver/motion/` to send Ben.
On those days the motion frames are rendered first, so the making-of reel ends with the motion being made (a timeline,
keyframes clicked in, before/after, scrubbing) and the end card moving (STYLE.md, Round 18).
Vary the movement every time (see STYLE.md, Round 17). For a brief object that turns, use `spinFrames(obj)` (the
daily brief now renders a 24-frame turntable of each object).

