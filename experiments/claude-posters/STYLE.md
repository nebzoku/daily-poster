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

### Round 16 feedback (24 Nov 2026): wear, and showing the work
- **Scratches and scuffs.** Every poster picks up a little handling wear (`scratches`, run by `stock()`, so it's on
  by default): hairline scratches that catch the light where they cross dark ink and barely show on pale paper,
  a few tiny nicks in loose clusters, and the odd faint rubbed patch. Mostly lone lines, sometimes two or three
  from one drag, never neatly parallel; lengths, angles, curves, breaks and placement all random, seeded per poster.
  Subtle: you find them in the zoom, you don't see them from across the room.
- **Instagram zoom carousel** (`lab/carousel.py`): frame 1 the poster as usual, frames 2-4 one 2.4:1 strip of it
  stretched across three frames so a swipe pans along one close-up. Pick the strip where treatments meet (ink type
  over pixels, harsh next to smooth, stepped edges) and don't let it cut through small text.
- **Making-of reel** (`lab/reel.py`): a sped-up screen recording, like Ben's reference (an Illustrator build reel):
  the artboard on a dark pasteboard, a cursor doing the work, blue selection boxes with handles, magenta smart guides
  when something snaps, quick eased zooms and jump cuts, the finished poster on black at the end. No app chrome,
  menus, labels or colourways. In the real build order: background rectangle dragged out, image placed and dragged
  to centre, pixelated click by click up close, small type set in drawn text boxes, the headline typed loose then
  dragged onto its line, select all, the ink and paper. The cursor moves on curved, Fitts-timed paths (quick out,
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
