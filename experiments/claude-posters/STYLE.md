# Claude's posters: style notes from Ben

An experiment: Claude designs posters from the daily brief and improves from Ben's feedback.
Not posted or added to the archive unless Ben says so, and always credited separately.

## Feedback

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
