// No. 053 · Concept 2 · "The smallest planet / steps out" · Young Serif, sentence case, one tight interlocked block
// on the bottom margin.
// Story: Mercury is usually lost in the sun's glare; this week it has moved far enough out of it to be seen.
// Everyday thing: glare, the smear of light you get looking towards the sun, and the moment something comes clear.
// Visual idea: a map of the sky, mostly smeared sideways into glare (image stretch: every row repeats one column of
//   the map), with one grid box where the map comes clear, smooth and in focus: the planet stepping out of the glare.
//   Harsh (thresholded, stretched) next to smooth (toned) side by side. Left two columns stay unsmeared, the sky
//   as it was drawn, so you can see what the glare is made of.
// Image: Dürer's 1515 Celestial Map of the Northern Hemisphere (The Met): the sky everyone has looked up at, drawn.
// Finish and paper: inked-deboss (letterpress ink bitten into the sheet) on rough stock: the hand-printed feel of
//   the Dürer woodcut. Young Serif rather than a high-contrast display serif, so the ink keeps every stroke.
// Mood check: quiet, curious, warm; the glare is bright lime, not menacing.
window.POSTER = async () => {
  const C = __CW__;
  seed(5321);
  const D = 'Young Serif', T = 'Work Sans';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const map = await media('media/2026-11-24/image-02-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  // headline: one block, sentence case, lines interlocked, on the bottom margin
  const HS = inkSafe(['The smallest planet', 'steps out'], { font: D, weight: 400, size: 120, gap: 8, minGap: 3, word: 0.2 }, W - 2 * M, { preset: 'letterpress', wear: 0.2, spread: 0.2 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 0, 6);
  const mapB = Math.floor((R[0].y - 40 - M) / ROW) * ROW + M;   // the map ends on a grid line above the headline

  // the map, zoomed into its middle
  const mapR = { x: 0, y: 0, w: W, h: mapB };
  const src = canvas(); clip(src.g, mapR, () => cover(src.g, map, mapR, { crop: [0.1, 0.12, 0.8, 0.78] }));
  const L = levels(src, 0.03, 0.97);
  const split = M + COL * 2;
  const glare = stretch(L, { x: split, y: 0, w: W - split, h: mapB }, 'x');
  // harsh layers: the lines (dark in the woodcut) in the bright colour, a second, looser layer in the mid tone
  // left of the split: the woodcut's lines, bright on dark; in the glare the paper itself is bright and the lines are
  // the dark streaks
  const left = rectMask({ x: 0, y: 0, w: split, h: mapB }), right = rectMask({ x: split, y: 0, w: W - split, h: mapB });
  const linesA = union(inter(lumMask(glare, 0.5, { invert: true, blur: 0.8 }), left), inter(lumMask(glare, 0.62, { blur: 0.8 }), right));
  const linesB = union(inter(lumMask(glare, 0.75, { invert: true, blur: 0.8 }), left), inter(lumMask(glare, 0.4, { blur: 0.8 }), right));
  const box = cell(5, 2, 3, 2), furnBox = cell(0, 0, 2, 1);
  const keep = union(rectMask(box), rectMask(furnBox));
  draw(g, press(cut(cut(linesB, linesA), keep), C.mid2, 'riso', { wear: 0.3, spread: 0.45, seed: 4 }));
  draw(g, press(cut(linesA, keep), C.mid, 'riso', { wear: 0.3, spread: 0.45, seed: 5 }));
  // the clear view: same map, zoomed on one figure, smooth tone, no threshold
  draw(g, tone(levels(boxed(map, box, { crop: [0.36, 0.4, 0.22, 0.17] }), 0.02, 0.98), C.tones));

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(01) The sky as drawn'], M, mapB + 16, t);
  block(g, ['(02) The glare'], split + 16, mapB + 16, t);
  block(g, ['(03) Out of it'], box.x + box.w, box.y + box.h + 16, { ...t, align: 'right', color: C.label });
  block(g, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], M, M, t);
  // subline beside the short second line, its last baseline on that line's baseline
  const bl = R[1].y + (HS.lines[1].base - HS.lines[1].box.y);
  const sub = balance("Hugging the sun, the solar system's smallest world is usually lost in glare; this week it steps clear.", { ...t, minW: 200, maxW: Math.min(COL * 3, R[1].x - 32 - M) });
  block(g, sub.lines, M, bl, { ...t, anchor: 'bottom' });

  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 54 });
  stock(g, C.stock, 54);
  return out;
};
