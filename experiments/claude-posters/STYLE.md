# Claude's posters: rules from Ben

Round 1 (Nos. 049–052, 23 Nov 2026) feedback, turned into rules. These override anything looser in earlier notes.

## Type
0. **Case:** a condensed face is always all caps. A geometric sans can be all caps or sentence case.
1. **One headline size.** Every word or line of the headline is set at the same point size. Staggered, cascading
   or spread across the grid, the size never changes. (Subline and furniture are separate, smaller sizes.)
2. **Never distort type.** No horizontal or vertical scaling, no squash, no stretch. "Stretch" means spread the
   words or letters across the grid (spacing and position), never scale the glyphs.
3. **Prefer sans serifs for the headline.** A serif only works big in all caps, and even then sparingly. If the
   pairing's display face is a serif, swap the pair round and set the headline in the text face.
4. Tight tracking on headlines and hand-kerned pairs; letters close together. All caps or sentence case.
5. Type touches an edge; set to optical (ink) edges, not font metrics. Keep the headline reading as one piece.
6. Page furniture (Daily Poster, No., date, source) and a subline where they help.

### How Ben sets type (from his Instagram grid)
- The headline is set as **tight blocks**, not spread down the page: lines almost touching (leading ~10% of the
  line height or less), often split into a top block on the top margin and a bottom block on the bottom margin,
  with the image owning the middle (Four Worlds Before Sunrise, Mapping the Dark Between).
- Or one block cascading down the whole sheet with lines touching and alternating sides (A Panel on Every Roof).
- Or centred, one word per line, large and evenly stacked (The Secret Rhythm of Talk).
- Condensed and grotesque caps; light weights for condensed (The Fastest Ship Goes Down), heavy for wide.
- Furniture small, in the corners or tucked into the block; the issue number sometimes set big as a graphic (041).
- Imagery is relevant to the headline: the satellite for Mapping, solar panels for A Panel, the sinking liner.

### Daily workflow (from 24 Nov 2026)
- Every day: **three concepts**, each in **three colourways** (nine posters). Concepts can use different headlines
  from the brief and different layout systems and treatments. Colourways only swap which palette colours play
  background, middle (image marks) and type. Ben picks the one(s) to post the next day.

### Round 30 (26 Nov 2026): Nano Banana scamps work
- The first run of the illustration machine (Nano Banana 2.1, Ben's references, 4 scenes × 5 briefs) is a step change:
  right perspective, real figures and hands, depth, and it leaves the headline band plain as asked. 15 of 20 usable.
- Scamp → poster (`concepts/test-scamp.tpl.js`): snap every pixel to the palette + tints/shades + black/white + the
  highlight and print it as plates (`printAll`), make the headline band perfectly flat in its own commonest colour,
  set the headline there in the colour that reads best (`pinInterlock`, so lines never touch), the furniture and
  subline on an extension of the band, then `stock()`.
- **Ben kept 7 of the 8** (fish-eye road, giant trunk, telescope glow, rooftop high angle, food hall, canopy, lone
  bottle): "these are awesome". Dropped: the close-up pillion pair, "too cheesy and AI generated ... might be their
  faces". So: no close-up posed, smiling faces; people at a distance, from behind or in profile, simply drawn. The
  kept ones are now in `lab/illo-guide/` and go to Nano Banana alongside his references.
- Condensed faces in a single band go on one line (Six Caps two lines edge to edge filled 60% of the sheet).

### Round 29 feedback (26 Nov 2026): scamps first, calm headline zones, boxed illustrations
- **Work from a scamp, not from nothing:** perspective, figures and objects need a rough to draw over. Three routes:
  - **3D scamp** (`lab/3d/scene.py`, Blender via the bpy package): build the scene, shoot it from a super low/high
    angle, render ink lines + a part-ID map + light; `sceneArt()` fills each part with a palette colour, cel shadow from
    the light, Blender's lines as our worn ink. 049 redrawn this way is far stronger than the hand-built version.
  - **AI scamp** (`scripts/illo-gen.mjs`, the repo's version of Ben's Weavy "Illustration Machine" flow): Ben's
    reference illustrations (Ben, 26 Nov: they're closest to where he wants the style; they stay the source until we
    have enough of our own that he's happy with, then ours replace them) + `illo-style.md` + Claude-written scene
    prompts → Nano Banana 2.1 (`gemini-nano-banana-2.1`, GEMINI_API_KEY). The references are other artists' work and the
    repo is public, so they are only ever stored encrypted (`illo-refs/refs.tar.enc`, unlocked in CI by the
    ILLO_REFS_KEY secret) and never written out as images;
    `scampArt()` redraws the result in the day's palette with our ink and paper. Needs an image key as a secret.
  - **Photo reference** (refs pull): trace contours by hand (`refFill`), only for simple poses.
- **Hands, fingers and faces:** never improvise them from a few traced points (the 055 hand's thumb was too short and
  the knuckle folds read as missing fingers). Take them from an AI scamp or a posed 3D hand, or crop them out.
- **No ghost figures:** a figure is fully drawn (outline, flat fills, one shadow tone, features), never a pale traced
  blob.
- **Illustrate with the headline in mind:** where the headline sits the drawing goes calm (one flat colour, no line
  work, no texture): `calmZone(I, headZone(R), masks, colour)`, its edge drawn as the front of the mass (bumpy for
  foliage and cloud, straight for architecture). Better still, compose the scene so that area is sky or a plain wall.
- **Illustrations can sit in grid boxes,** combined with the other techniques (055 test 5: illustration box +
  pixelated bike box + thresholded road box, labelled (01)(02)(03)). Smooth illustration beside harsh pixels works.
- **Highlight:** the "pop" is called the **highlight** (Ben, 26 Nov): `brief.highlight` on the site and in the brief.

### Round 28 (26 Nov 2026): drawing from references, and the illustration moves library
- **Draw from photos, by hand:** the subject's contours are traced as clean curves from a gridded view of a reference
  photo (`refMap`, `closed`, `refFill`), and the photo supplies only the cel shadows inside them (`photoShade`).
  Fully automatic tracing (`traceArt`) gives a posterised-photo look, not illustration: use it only for texture, never
  for the subject. Scenery is drawn in code; ready-made objects (`ballArt`, `objectArt`) for simple things.
- **From Ben's larger reference set (26 Nov; other artists' work, not kept in the repo, borrow the moves only):**
  - line work is often a dark shade of the scene's own hue, not black (navy on a blue scene, bottle green on green);
  - whole scenes in one hue family with one highlight, like a red factory, a blue kitchen, a green street;
  - skies, glows and pools of light as stepped bands of tints (`bands`);
  - single objects on a flat colour field (a lipstick, a frog, a bulb), cleanly outlined and cel-shaded;
  - architectural perspective: interiors and streets in one- or two-point perspective, full of small detail;
  - fine thin-line texture everywhere (grass, bark, water, brick), never a flat empty fill for long.
- **The moves library** (rotate; never the same move two days running; log which was used):
  1. Lone object in a big sky (055 "The ball never landed": ball over a cloud bank). Works.
  2. Hero close-up from a reference, low angle against the sky (055 "One hand": the hand taking the ball). Works.
  3. Low angle under an overhead structure (051: the forecourt canopy at night, lamps rushing overhead). Works.
  4. Tiny figure, huge sky, stepped glow (053: a figure on a ridge, Mercury one dot). Works.
  5. Worm's-eye up something tall (054: a giant trunk with a person at its foot). Works once the subject is drawn
     with its own character (roots, knots, limbs); a plain tapering shape reads as a road.
  6. Figure at work, traced, low angle (052: the decorator on his scaffold). OK; keep traced shadows simple.
  7. Straight down from above (050: vineyard rows). OK as texture; people from above need to be bigger to read.
  8. Looking up a shaft (049). Reads as a corridor; needs light falling down it and things seen from below.
  9. To try: fish-eye street from a low angle; a cutaway; an interior in one-point perspective; isometric.

### Round 27 feedback (26 Nov 2026): illustration, angles, line, a pop colour, tints and shades
- **Test 1 (the ball over the clouds) is great; the flat road scene was not.** What makes the references work:
- **Dramatic angles for wide scenes:** a very high angle looking down, a very low angle looking up, or a fish-eye
  wide view where the bands bow with the lens. Never a flat, straight-on, one-point view of a road.
- **Gaps in the line:** the black line work breaks where the pen lifted, scattered along every line, so it feels
  organic (`wornLines` gaps, on by default in `illo().print`).
- **Thin-line shading** like the ripples in water and blades in grass: short, thin, slightly curved strokes in loose
  clusters, never an even fill (`ripples`, `blades`, `strata` in illo.js). Not ruled hatching across a whole area.
- **Draw from photographic references:** people, poses, hands and objects comped together from real photos and
  illustrated from them, rather than built from geometry. A separate pull of reference photos for illustrating, not
  shown on the site: `scripts/illo-refs.mjs` (the Illustration references workflow, after the brief) saves
  `experiments/claude-posters/refs/<date>/ref-*.jpg` with credits in `refs.json`. Search terms can be set by hand in
  `requests/illo-refs.txt`.
- **A highlight colour (first called the pop), used very sparingly** (applies to every style, not just illustration): one bright colour from across
  the colour wheel from the day's lead (orange with neon green, jade, teal or cobalt blue), on one small element only
  (the rope, a kite, a hat, a sign): a focal point. It's in the public brief too as the highlight (`brief.highlight`, from
  `scripts/lib/palette.mjs`, with the same guidance for everyone); `popFor(brief)` reads it. This loosens Round 12's "nothing
  outside the day's palette": the palette plus black and white, plus one pop, plus tints and shades.
- **Tints and shades of the palette colours** are allowed everywhere, for shading and to make illustrations feel
  complete (`shadesOf(hex)`: two shades, the colour, two tints; the brief lists them as `brief.shades`). Still no gold, rose, copper, holo or silver.

### Round 26 (26 Nov 2026): an illustration style for the roster (on trial)
- **Ben wants an illustrated option in the mix,** from references he sent on 26 Nov (contemporary editorial
  illustration, other artists' work, not kept in the repo; borrow the moves, never the pictures): clean black outlines
  of near-even weight that look a little worn, flat fills, one cel-shadow tone, hatching and dashes for texture
  (grass, falling water, stone), big outlined cumulus, one bold object or a small figure against a big space,
  one-point perspective scenes.
- **Colour:** only the day's palette plus black and white; black for the line work.
- **Relevant to the story:** the scene or object comes from the day's theme, images and story (the ball over the
  clouds that never landed; the road outside the ground with the motorbike coming up it). The brief's 3D objects
  become line drawings (`objectArt`), simple ones are drawn cleanly in code (`ballArt`); scenery (clouds, walls,
  roads, floodlights) is drawn in code for this style. This is the one exception to Round 22's "only the day's
  imagery": drawn scenery belongs to the illustration style only.
- **Printed like the rest:** fills go through `printAll` gently (wear about 0.12), the line work is printed last on its
  own layer as worn black ink (`illo().print`, `wornLines`), then the headline and `stock()` (paper and scratches).
- Toolkit: `lab/illo.js` (`illo`, `outline`, `dilate`, `inkLine`, `curve`, `poly`, `cumulus`, `hatch`, `objectArt`,
  `ballArt`, `wornLines`). Tests: `concepts/test-055-i1` (ball over clouds), `test-055-i2` (road scene).
- **Next, if it works:** an illustration inspiration library (moves and compositions, not pictures) so the scenes vary
  day to day.

### Round 25 feedback (26 Nov 2026): moving posters match the static ones in the grid
- **The 9:16 moving poster sits in the profile grid at the same size and crop as the static posters.** Instagram's
  grid shows every post as a 3:4 tile: a static post (the poster 1262 px tall on a 1080 × 1350 black frame) is cropped at
  the sides, and a reel is cropped to its centre 1080 × 1440. So the reel's poster is 1346 px tall and 952 px wide,
  centred on black (93.5% of the tile's height, like the static posts), not 1284 px as before, which looked smaller
  (`motion.py`). `motion.py` also writes `<name>-reel-cover.jpg`, a still in the same layout, to set as the reel's
  cover when posting.

### Round 24 feedback (25 Nov 2026): the scanned two-colour style is one style in the mix
- **Not a pivot.** The scanned, two-colour, one-sheet style (Rounds 19–23) is an extra style to bring in for variety,
  mostly when the day's face is a serif. Most days, most concepts stay in the established styles; at most one of
  the morning's three is in this style.
- **One piece of tape per poster, no more** (Ben, 25 Nov): a single straight strip over the top or bottom edge, sat
  on any grid line (it needn't be the centre).
- **Tape is its own material,** not the paper's texture: a fine crepe of ridges across the strip, a little fibre,
  slightly darker long edges, ends torn in ragged teeth with loose fibres (never a clean cut), and a palette colour
  that differs from the paper (`tape()`).
- **Handwriting over the top:** real handwriting from public-domain scans (letters, manuscripts, copybooks,
  calligraphy; the more calligraphic the better, best if it relates to the story), lifted out by luminance and laid
  over the faded paper in black like pen or biro (`handwriting()`, which finds the densest writing with `inkiest()`,
  clear of page edges and bindings). Never handwriting drawn or faked by code. The scans come each morning from
  `scripts/handwriting.mjs` (the Handwriting scans workflow, after the brief): `site/media/<date>/hand-*.jpg`, with
  titles and credits in `hand.json`. Search terms can be set by hand in `requests/handwriting.txt`.

### Round 23 feedback (25 Nov 2026): tape at A4 scale, headlines that line up
- **Tape is at A4 scale:** masking tape is about 24 mm wide on a 210 mm sheet, so about 120 px on the poster
  (`TAPE_W`, `vtape()`). It lies flat: almost no shadow, just a faint darkening along its long edges.
- **Tape never covers type** in a way that hides letters; keep strips short where a headline sits under them.
- **A small headline over a giant glyph** is centred over two or three lines, and the furniture lines up with it:
  the left block's first cap height on the headline's first cap line, the right block's last baseline on its last
  baseline.
- The faded paper colour and the pencil lines on the grid work: keep them.
- Toolkit for this style: `stylePoster()`, `housed()` (a day's image thresholded into the ink in a circle, square,
  triangle or diamond), `pencilGrid()`, `vtape()`, `styleFinish()`. Worked examples: `concepts/s054-01..10`.

### Round 22 feedback (25 Nov 2026): strip it back; one sheet, one ink; only the day's imagery
- **Fewer elements.** The paste-up tests had too much on them. Less is more.
- **Two colours** in this style: one paper colour and one ink (tone-on-tone), not two yellows, two darks and white.
  The ink is a mid tone, not the darkest dark (the dark looked too heavy for the style).
- **One sheet of paper, scanned:** the ground fades unevenly across the sheet with grain (`sheet()` instead of a
  flat fill), then `stock()` and `scan()`. Everything reads as one piece of paper.
- **The ink runs:** its density fades across the sheet in a broad gradient with a fine speckle, through the letters
  as in the swash A reference (`fadedInk()`), and the type and any image share the same ink.
- **Images match the type:** an image is thresholded by luminance into the same single ink as the type (the
  burgundy reference), and can be housed in a simple shape: a circle, a square, a triangle or a diamond.
- **Only the day's imagery.** Pictures come from the brief's photos, museum images and 3D objects, never drawn up
  (no invented leaves, burrs, ornaments or buds). Typographic flourishes and vines are fine; depictions of things
  are not.
- **Tape:** only straight strips, vertical, on the centre line or a grid line, top and/or bottom edge. Angled bits
  look fake. Tape is opaque: nothing shows through it (`tape()` is opaque by default).
- **Pencil lines look real; put them exactly on the grid lines** (margins, column and row lines).
- **No white fringe on torn paper; no shadows under paint** (both looked fake), and paint moves in smooth curves,
  never angular bends.
- **Vines like a snake or a whiplash** (`vine()`): long S-curves with small teardrop loops and a hooked tip,
  swelling and tapering; never perfect circles or spirals.
- **Painted lettering for headlines is worth exploring** (`brushLetters()`: a wobbling brush edge, paint pooling at
  the edges, faint vertical bristle streaks).

### Round 21 feedback (25 Nov 2026): no shadows on type; a hand-made paste-up, scanned
- **No drop shadows on type**, and nothing that reads like one (the faint offset after-image on "remembers" did).
  Shadows belong only to the physical layers.
- **Push the scanned paste-up** (Ben's references: Matt Willey's Stay Home, the Paler Fire paste-up with pencil
  rules and pink tape, a collage with white paint over a face and torn cigarette packets, brush-lettered type over a
  photo): layers of real material, each with the light and shade a scanner picks up:
  - torn paper pieces with a white fibre fringe and a contact shadow (`torn()`), card with a tight contact shadow
    and one corner lifting (`card()`), masking tape (`tape()`), including long strips down grid lines;
  - dry-brush paint swipes, white or a palette colour, solid in the body and streaky at the tail (`paint()`), e.g.
    painting out part of an image or ornament;
  - pencil construction lines on the grid with tick marks, a compass circle (`pencil()`);
  - the whole sheet scanned last (`scan()`).
  Shadows are contact shadows: tight along the edges, wider only where a corner lifts. Never a soft offset glow.
- **Big letters with drawn ornament** (the illuminated A) are worth pushing in this direction: more hand-rendered,
  layered on paper, tape and paint.

### Round 20 feedback (25 Nov 2026): on the serif tests
- **Condensed serifs fill the layouts.** The Vinho Verde moves work because the face is narrow (like Instrument
  Serif): words go bigger and fill the lines. With a wide serif (Gloock), use fewer, shorter lines, or the giant-glyph
  and top-and-bottom moves rather than the ledger.
- **Even subtler.** "giant" running off the edge and "blight" eaten by spots were too obvious. Aim for something you
  only catch on a second look: a faint after-image of one word, one letter a hair out of register or a touch lighter,
  one leaf in a mirrored ornament that isn't mirrored.
- **The scanned look.** The references feel real and human because the sheet looks scanned: light falling off
  unevenly, a darker lifted edge, faint scanner banding, dust. Use `scan(g, seed)` after `stock()` in this style
  (luminance only, so the palette holds).
- **Layers on the sheet, scanned with it:** masking tape (`tape()`), a piece of card laid on top with its shadow
  (`card()`), and long strips of tape running down grid lines to divide the sheet into columns. They give depth.
  Keep tape off small type.
- **Clean space is fine.** Empty paper between the type is part of the look.
- **Giant letters with illustration round them,** like the swash A in the reference: vines curling into spirals,
  leaves and seeds from the story, in an insular, Gaelic manuscript spirit, drawn in the type's colour and printed
  with it.

### Round 19 feedback (25 Nov 2026): serif layouts, and type-only posters
- **When the day's face is a serif** (Gloock, Instrument Serif, Young Serif and the like), work from Digital_Archive's
  Vinho Verde series (screenshots Ben sent on 25 Nov; not kept in the repo, as it's other designers' work). Borrow
  the moves, never the posters:
  - **Ledger lines:** big words stacked one per line, each sitting on a hairline rule that runs margin to margin,
    lines alternating their indent; small engraved ornaments (a diamond, a triangle, a shield) tucked into the gap at
    the end of a short line; a tiny note in mono in a leftover corner.
  - **Top and bottom words with a small picture between** (Quinta / Dourada): one word edge to edge on the top
    margin, one on the bottom, a small image centred in the middle, and two small caps words flanking it at mid height.
  - **Alphabet field:** the alphabet set huge in caps, rows cropped by the sheet's edges, tone-on-tone; a dark
    rectangle in the middle holding an image, with the letters running over it.
  - **One giant glyph or ligature** (an A with swashes, a "ga") filling the sheet, small columns of mono text tucked
    into its counters, a found label or stamp overlapping it.
  - **Archive page collage:** a scanned page (engraving, text) as the ground with a big glyph overprinted translucent
    in a palette colour; or specimen boxes, single letters cropped inside thin frames.
  - Throughout: tone-on-tone colour (the type a darker shade of the ground), fine grain and faded print, the serif's
    swash alternates where it has them, and a found label or stamp as the only colour accent.
- **Type-only options are welcome:** type, ink and a background texture, no image at all. They work best when one
  subtle change in the type carries the story, e.g. Ben's "She summoned them to Rome", where the S of She was
  blurred for a story about whether a king was a queen. One small change, still readable, that you notice on the
  second look.

### Round 18 feedback (25 Nov 2026): show how the motion was made
- **On moving days the making-of reel doesn't stop at the print.** After the poster is printed it goes into motion,
  and the reel shows the motion being made: a bare timeline slides up under the artboard (ruler, one track, keyframe
  diamonds, playhead; no labels), the playhead is dragged to each keyframe and the keyframe clicked in, a quick
  before/after flick between two keys, then the playhead scrubbed back and forth as if getting the timing right. The
  end card plays the finished loop instead of the still, started just before the movement so its rest falls at the
  end, then **lingers on the finished poster** (about 2.5 s of stillness in all) before the reel restarts. Still under 30 seconds (the build runs a little quicker on
  moving days to make room). In the toolkit: `reel.py` adds the chapter whenever the favourite's motion frames exist
  (`out/<issue>-<concept>-<pick>-motion-frames/`), and `extras.py` renders those frames before the reel; keyframes
  are found where the movement starts and stops.
- **The grid stays on while the poster is built** (every reel, not only moving days), so people see what lines up
  where: the guides come on with the empty artboard and stay through the layout and the type, switched off and back
  on a few times like a designer checking alignment (one a quick double toggle), then off for the print and the
  motion. (On 054 it had silently dropped out: the switch was a 0.01 s segment that no frame landed on; it's now timed.)

### Round 17 feedback (24 Nov 2026): moving posters
- **A moving poster every few days, not every day** (every issue divisible by 3), so it stays a treat.
- **Never the same movement twice in a row.** Pick a different move each time, from the poster's own elements and
  Ben's references: tracking breathing between tight and justified (Never the first choice); a shape sliding across
  another so the flipped overlap grows and shrinks (an eclipse); a slit-scan band sweeping across an image; a numeral
  sliding through a shape (00 3); a pixel size stepping between settings as if still being decided; a glow or bars
  climbing; foil catching and losing the light; letters assembling from scattered positions; a 3D object turning on
  its turntable; a single element running along a row of data (the 88 days); a whole-poster 3D flip.
- **Only move what moves properly.** A line that would only shift a few pixels stays still (THE SUN on 053): a tiny
  move looks like a mistake. Keep pairs symmetrical: if the top line holds, the bottom line holds.
- **Moving things never make type unreadable.** Where a moving shape or number passes under small type, the type
  flips colour over it (like the XOR crossings), so it can always be read (Ben on the 050 slide).
- Loops of about 4 seconds at 12 fps, printed frame by frame with the paper and ink seed held still.

### Round 16 feedback (24 Nov 2026): wear, and showing the work
- **Scratches and scuffs.** Every poster picks up a little handling wear (`scratches`, run by `stock()`, so it's on
  by default): hairline scratches that catch the light where they cross dark ink and barely show on pale paper,
  a few tiny nicks in loose clusters, and the odd faint rubbed patch. Mostly lone lines, sometimes two or three
  from one drag, never neatly parallel; lengths, angles, curves, breaks and placement all random, seeded per poster.
  Subtle: you find them in the zoom, you don't see them from across the room.
- **Instagram carousel** (`lab/carousel.py`): frame 1 the poster as usual, then the poster in quarters (top left,
  top right, bottom left, bottom right). Each pair spans exactly the full width with no overlap, so swiping across
  them joins up seamlessly (Ben, 24 Nov: no visible join); a strip across the middle is left out, which is fine.
- **Making-of reel** (`lab/reel.py`), one a day, of Ben's favourite pick. Shapes arrive as clean shapes and are
  then tried at different pixel sizes, back and forth, before settling (never dropped in already pixelated). a sped-up screen recording, like Ben's reference (an Illustrator build reel):
  the artboard on a dark pasteboard, a cursor doing the work, blue selection boxes with handles, magenta smart guides
  when something snaps, quick eased zooms and jump cuts, the finished poster on black at the end. No app chrome,
  menus, labels or colourways. In the real build order: background rectangle dragged out, image placed and dragged
  to centre, pixelated click by click up close, small type set in drawn text boxes (one box per
  separate block, set one after another; little marks like pixel runs and asterisks are dragged in, never typed), the first headline line typed loose, its tracking tightened in nudges
  and dragged onto its line, the other lines alt-dragged copies of it with the words retyped (style found once,
  then duplicated), select all, then ink trials up close in
  different spots (for a foil, the light moving across it) (lighter, much heavier, back down to the one kept), and the paper. Under 30 seconds. The cursor moves on curved, Fitts-timed paths (quick out,
  slow landing). Templates mark the steps with `snap(name, canvas)`; render with `CAP=1`.

### Round 15 feedback (24 Nov 2026): centred blocks as an hourglass
- **Centred headline in a top block and a bottom block: set it as an hourglass.** Break the lines so the widest ones
  sit on the outer edges (the first line on the top margin, the last on the bottom margin) and they narrow towards
  the middle, so the bottom block mirrors the top. And no short word stranded on the last line: "CHASING / LIGHT /
  NEAR / THE SUN", not "CHASING / LIGHT / NEAR THE / SUN". Within reason: the breaks still have to read naturally
  (Round 9).

### Round 14 feedback (24 Nov 2026): print the whole sheet, and words in the corners
- **If the headline is printed, everything is printed, to the same degree.** Shapes, pixel blocks, bars, box edges,
  rules and dots go through the same process as the headline: bleeding ink bleeds everywhere, a crisp print is crisp
  everywhere, a photocopy is a photocopy all over. A foiled or varnished headline sits on a crisp, clean print (the
  rest isn't foiled). A purely graphic headline can leave everything graphic. Within reason: tiny text (subline,
  furniture, labels) and hairlines only get a very light version that keeps them legible, and smooth images keep
  their tone but get printed edges. In the toolkit: draw everything except the headline, then
  `printAll(g, C, { keep, boxes })`, then `printHead`, then `stock`. It splits the sheet into its flat colour plates
  and prints each with the process that matches the headline's finish (`sheetProcess`).
- Nothing stays digital-crisp on an inked sheet (Ben on 052 Morris, 24 Nov): a toned or pixelated shape keeps its
  tones but its outline is printed too (`printAll`'s `boxes` and `shapes`, not `keep`).
- **Words in the corners.** When a headline sits in blocks pinned to both margins and a line of two or more words
  falls a little short of the measure (BEFORE SUNRISE under CATCH MERCURY), fake it: open the word spaces, never the
  letters, so the line runs margin to margin and the outer words sit exactly in the corners (`spreadWords`). Four
  words in four corners look sharp; one a few pixels off the corner looks like a mistake.

### Round 13 feedback (24 Nov 2026): track the small text
- **Subline and page furniture are tracked -2%** (-20/1000 em), every poster, from No. 053 on. It's the default in
  `lib.js` (`TEXT.track`, used by `block`, `balance` and `small`), so don't pass `track: 0`; only the headline is
  spaced by its own rules.

### Round 12 feedback (24 Nov 2026): vary the print and the paper
- **Never print everything the same way**; one ink style on every poster is a giveaway. Each of the three concepts
  gets a different print process for its headline (`printHead`), and change them day to day.
- **The finishes are Ben's own, from benharwood.design** (`lab/pf.js`, wrapping his site's `ink-worker.js`, kept
  unchanged as `lab/portfolio-ink-worker.js`; settings in `portfolio-ink-styles.md`):
  - Inks, calm (about Wear 0.07, Ink spread 0.15), with the paper's grain showing through the letters:
    `letterpress`, `riso`, `screen`, `stamp`, `inked-deboss`.
  - Monochrome foils, black on light paper and white on dark: `foil` (domed gloss), `foil-flat` (hot-foil),
    `foil-mirror`, `foil-satin` (graphite), `foil-emboss` (raised), `foil-debossed`.
  - `foil-colour`: a bright foil in a palette colour (the site's brighter colour stops, not the Machine's dark ones).
  - Spot varnishes, neutral, made from the colour underneath: `varnish`, `varnish-raised` (thick UV),
    `varnish-satin`, `varnish-ink` (gloss over solid ink). Use them where the letters can still be read.
  - From the Ink Machine, for rougher days: `bleed` (soaked), `copy` (photocopy), `crisp`, and the Machine's wilder
    presets `machine-letterpress`, `machine-riso`, `machine-screen`, `machine-stamp`.
- **Vary the paper stock too** (`stock`): smooth, uncoated, rough, newsprint, photocopy. Log the print and stock used
  each day in `log.md`.
- **Nothing outside the day's palette, plus black and white.** No gold, rose gold, copper or holographic foil. A
  coloured foil uses a palette colour. Left out as Ben asked: blind emboss and deboss (not realistic), silver foil
  (reads as mottled grey), hand-drawn marks.

### Round 11 feedback (24 Nov 2026): variety across the morning's options
- **Mix the type treatments across the three concepts.** Not every geometric sans in sentence case, and serifs
  not avoided: in the morning's options, try **a serif headline in sentence case** (tight leading and tracking) and
  **a sans in all caps**, alongside whatever else, so Ben can compare and refine. (A condensed face is still always
  caps.) This loosens rule 3 below: serifs are fair game when they're one of the options, not a default to avoid.
- **Don't default to overlapping pixelated circles.** Combine everything Ben has taught in different ways each day
  (thresholded full bleeds, grid boxes, shapes and circles, pixelation, image stretch, ASCII, data-driven type, small
  repeated headlines, objects in type, overprint, smooth vs harsh imagery). Some combinations won't work; that's
  fine, Ben refines them each morning. Check `log.md` and avoid repeating yesterday's mixes.

### Round 10 feedback (24 Nov 2026)
- Print the headline with the ink `inkSafe` returns (pass `HS.ink`'s wear and spread to `printHead`), never the
  finish's default: on 053 the default ink closed the gap between the E and A of NEAR. inkSafe now tests with a little
  extra ink on two seeds, so a gap that survives the test survives the print.
- **Ink must not run letters together, and the fix must not make the type gappy.** Set headlines with `inkSafe()`
  and print them with the ink it returns. It prints each line, counts the letters, and if any have merged it first
  **thins the ink** (the bleed is a fixed number of pixels, so it matters more as type gets smaller), and only then
  raises the minimum gap a touch. It never opens the overall tracking. Smaller headlines stay as tight as big ones.
- When the size snaps to a multiple of 8, the tracking may tighten freely to keep the widest line on the margins, but
  may only loosen slightly (more for big type than small). Small type would rather fall a few pixels short than look
  gappy.

### Round 9 feedback (24 Nov 2026)
- **Break headlines where you'd pause saying them aloud**, and never leave one word stranded from a block that
  holds everything else (unless that word *is* the natural pause). "Gravity learns / to speak", not "Gravity /
  learns to / speak"; "The message / nothing blocks", not "The message nothing / blocks".
  How to find the breaks (`breaks()` in lib.js ranks them): break between the subject and the verb phrase, and
  before prepositions, "to", conjunctions and relative words; prefer groups of similar word counts; when the
  headline is split into a top and bottom block, the split goes on the strongest pause.
- **Let the type mirror the shape of the image.** When the image is a centred or symmetrical shape (the bunch of
  grapes on 050 concept 3), centre the headline in the same position so the two echo each other.
- Credit in the archive: posters Claude designs are credited **Nebzokai**; Ben's own are **Nebzoku**. Never "Claude".

### Round 8 feedback (23 Nov 2026)
- **Bottom margin: the last line's ink sits on it, descenders included** (revised 24 Nov: baselines on the margin
  with descenders cut off by the edge looked wrong). The first line's **cap height** sits on the top margin, so an
  apostrophe or accent can't push it down. Lines in a block are spaced by baseline and cap height.
- **Overlapping circles:** use a difference look where they cross (`xorShapes` keeps it in the palette), vary
  the sizes (circles and pixel sizes) so it isn't uniform, and roughen the edges (pixel steps, noise or ink),
  never a perfect vector circle.

### Round 7 feedback: the type system and collage rules (23 Nov 2026)
**Type sizes**
- Every type size is a multiple of 8: 8, 16, 24 for text; 160, 240 for headlines (`snap8`, `sameOptical8`).
  Snapping changes the width, so `sameOptical8` re-solves the tracking (never the glyphs) so the widest line still
  runs margin to margin. Always check the widest line touches both margins.

**Subline and furniture: one text style**
- Subline and furniture share one size, one leading, one tracking and usually one case (default 16px, leading 90%,
  tracking -2%).
- The subline is a **block**: lines of similar length, 3–4 short lines rather than 2 long ones, never an orphan
  or widow, never a last line much shorter than the rest (`balance`). The block must fit what's around it.
- Text **aligns to the grid**: the cap height of the first line on a grid line, or the last baseline on one.
- Where there are image boxes, text lines up with the box edges. **No indents**: the ink edge of the text sits
  exactly on the box or grid edge, never padded in (`block`).
- Furniture and labels go in brackets: (Daily Poster) (No. 049) (01). Add asterisks, little pixel runs and small
  boxes for colour and interest.

**Headlines**
- When all three headlines are set together, they share the same leading, and can step across the grid one
  column at a time.

**Numbers and shapes**
- Never centre a number inside a circle. Overlap a big number with the circle and use the number as a mask:
  change the circle's colour where they cross, or use a blend mode there.
- Duplicate circles and relate them across the page (same size, on the grid, overlapping); try blend modes
  (multiply, screen, difference) where they cross.

**Images**
- Repeating one image in several boxes with different treatments is good.
- Zoom right into objects (the lamp, the 3D renders) to find sculptural angles, not the whole product.
- In a collage, keep one image smooth (luminance/tone only, no threshold) so it contrasts with the harsh
  thresholded ones. Use the 3D objects sometimes, as with the solar panels on No. 047.
- Pixelation should go big and intense, until it reads as abstract pattern rather than a pixelated picture.
- Full-bleed thresholded texture posters are still in the rotation.

### Vary it day to day (round 7 feedback, 23 Nov 2026)
Never make two days in a row with the same system. Rotate between, and combine:
- **Composition systems:** full-bleed texture with big type; **grid boxes** (images in boxes on the 8×8 grid,
  layered, labelled (01)(02)(03), one column left empty for furniture, like No. 044); **graphic shapes** (rectangles,
  bars and circles that sit on the grid, overprinting images); **small type** (the headline repeated three times, or
  all three brief headlines set small, ours strongest and the others ghosted).
- **Image treatments:** threshold; **pixelation** (snapped to the palette); **image stretch** (slit-scan a band of
  the image into stripes, rows or columns); **ASCII** (characters chosen by brightness, or characters that carry
  the story, like the bits of "gravity"); duotone/tritone into the palette.
- Before designing, check the last poster's system and treatment and pick something different.

### Concept first (round 6 feedback, 23 Nov 2026)
Before any layout, write a short concept note in the poster file:
1. **The story in one line**: what changed, for whom (e.g. service stations: the stop is becoming the reason for
   the trip).
2. **The everyday thing people recognise** from it (the coffee, the lit sign, the forecourt at night), not
   an oblique or historical stand-in. If someone can't connect the image to the headline in a second, it's wrong.
3. **The visual idea** that joins headline and image (the OPEN sign is the bright middle; the dark is the nowhere).
4. **The image**, from the brief's photos, objects or museum images, with the reason it was chosen.
5. **Watch the mood**: thresholding dark subjects can turn them sinister (the 1790 inn read as haunted). Check the
   finished tone matches the story.

### Round 5 feedback (23 Nov 2026)
- **Sentence case: much tighter leading and tracking.** Set with `pinInterlock`: each line drops as close under the
  last as it can go without touching, so descenders and ascenders interlock; tracking close to touching, but never touching.
- **No commas part way through a headline.** The line break does the punctuating ("Pit stop / promoted to /
  destination", not "Pit stop, …").

### Round 4 feedback (23 Nov 2026)
- **Imagery must be relevant to the headline.** The 049 watch had no link to the story. Use the brief's own
  objects and images that carry the idea (the brick wall for "A whisper through brick", the coaching inn for
  "Pit stop", the wallpaper for "Every wall became a garden"). Say why the image was chosen.

### Round 3 feedback (23 Nov 2026)
- **Headline pinned to the margins, always**: every line's ink on the left or right margin, the first line on the
  top margin, the last on the bottom margin.
- **Kern properly**: tight, but letters never touch (THROUGH in 049 r3 had the O and U touching). Use optical
  kerning by the letter shapes (`setOptical`), then adjust by eye.
- **Avoid obvious tropes** (motion blur for speed, etc.). Find the less literal idea.

## Colour
7. **Default colour structure (corrected by Ben, 23 Nov 2026):** a **dark background** (the palette's dark), a
   **bright middle** made by the image marks (the thresholded image printed in the vivid colour, mid tone as a
   second layer), and **light type over the top** (the pale, or white for one accent). A full vivid wash is an
   option, not the default.

## Imagery
8. **Zoom right in.** Images become an abstract, textural ground, not a picture of the whole thing.
9. **Ben's texture method:** take an image, threshold it, and lay it as a luminance layer in a mid colour from the
   palette, so it makes a tonal layer between background and type. Its solid areas are the pockets where the
   subline and furniture sit. Layer a second threshold in another palette colour if it helps.

## Texture
10. **Use the Ink Machine's own print** (riso, screenprint, letterpress, stamp, photocopy) on type and image layers,
    plus its paper. Grain on top. (`inkm.js` is the machine's code, unchanged.)

## Ideas
11. **Data-driven, type-generated layers** in the spirit of the Opera Type Machine and Archive Machine, when they
    play into the story: fields of small type that bend, bunch or encode something from the brief.
12. Research references (Cosmos: "<subject> typographic poster") before designing; borrow layout and image ideas,
    never copy.
13. An object from the brief can stand in for part of a letter.
14. Aim: sharp, progressive, graphic-design-led. Fewer, bolder moves.

## References

Look at these before every poster. Borrow the move, never the poster.

### Ben's own posters (`site/showcase/`, Nos. 031–048; his Instagram grid is on @dailyposter.design)
The house style. What recurs:
- Headline as the image: condensed or grotesque caps, big, edge to edge, often bleeding off the top or bottom.
- Lines staggered left and right, or one word per grid row; the subline and furniture tucked into the gaps.
- One vivid colour as a full wash, the palette's dark for type, black and white for punch.
- Image used as texture: thresholded, posterised, duotoned, glitched or sliced into the grid (039, 041, 042, 044).
- An object from the brief interacting with the type: the crown in 034, the stone in 032, the solar panels in 047.
- Machine-made type fields for the moving posters (036, 040), and Ink Machine print or foil on the type (047, 048).
- Furniture always present and small: Daily Poster, No., date, source, in the corners.

### Cosmos, "typography poster" (screenshots Ben sent on 23 Nov 2026; not kept in the repo, as they're other designers' work)
Moves worth stealing:
- **Ink blocks behind type** (Design Museum "Where there is no order"): condensed caps staggered over rolled-ink bars;
  the print texture is the whole poster. Info set in four small columns along the bottom.
- **Crop the letters** (August, Vchop, Boom Room, Nitsa): giant type cut by the edges or by each other so it turns into
  shape; only just legible.
- **Object in the type** (FAST, Y, Joker): the type sits behind or around a single cut-out object or photo, and a
  stripe or colour runs through both.
- **Tiny notes in the gaps** (Extra Bold Upper-case, Somewhere In Be–tween, There Is Always A Bigger Picture):
  staggered condensed caps with small captions living in the negative space.
- **Edge furniture** (100 Graphic Design, Focus Absolute): information on all four edges, the side ones rotated.
- **Repetition and motion** (Pretty Fast, plane plane plane, Learning): the word repeated, blurred or overprinted
  to show movement or time.
- **Overprint** (yo la tengo, Paraíso): two flat inks multiplied where they cross.
- **Data as graphic** (How and Why to Resist Tyranny): a line graph and timestamps doing the work of an image.
- **Modular, filled letters** (Are You Lost, Love & Hope): letters drawn to fill the whole sheet in one colour on a
  wash, with grain.

## Earliest notes (No. 033, 4 Nov 2026)


### No. 033 v1, "Medicine Grown in Weightlessness" (4 Nov 2026), not posted
- Set type to its optical edges, not its font metrics. The baseline of "ness" was measured from
  the font's ascent and line height, so it sat well off the bottom margin. Measure the actual
  letter shapes (ink) and align those.
- Type always touches an edge. Cascade the parts left and right, each pushed hard against the
  left or right edge (and the big word onto the bottom margin), not floating in the middle.
- Keep the headline together. "Medicine grown in" read on its own, with the subline straight
  under it; the headline was split from its main word. The whole headline should read as one
  piece; the subline is separate and secondary.
- Colour: the obvious pairing (bright pink on the dark shade, pale tint for accents) felt
  crass and not harmonious. Be more considered: fewer colours at full strength, use the mid
  tone, think about weight and balance rather than the most contrasting pair.

### No. 033 v2 (4 Nov 2026)
- Better. Use fewer type sizes: aim for three across the headline.
- Wrong font: the big type had fallen back to a default serif. Canvas drawing only uses a web
  font once it's loaded, so load every face explicitly (document.fonts.load) before drawing.
- Idea from Ben: let an object from the brief stand in for part of a letter (the satellite as
  the dot of the i in "Weight").
