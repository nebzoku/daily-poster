// No. 049 · Concept 3 · "The message nothing blocks" · circles of different sizes, pixelated, XOR overlaps.
// The lift going up and down a shaft: five circles of different sizes stacked down one column like a mass moving,
// each filled with the brick wall pixelated at a different size, edges stepped in their own pixels; where they
// overlap the colours flip (a difference look kept in the palette).
window.POSTER = async () => {
  const C = __CW__;
  seed(4933);
  await fonts(['400 100px "Terminal Grotesque"', '500 16px "Martian Mono"']);
  const wall = await media('media/2026-11-20/object-1.png');
  const T = 'Martian Mono';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const { lines } = sameOptical8(['THE MESSAGE', 'NOTHING', 'BLOCKS'], { font: 'Terminal Grotesque', size: 200, gap: 45, minGap: 22 }, COL * 5);
  const head = canvas(); pinBlocks(head, lines, ['L', 'L', 'L'], 2, 0.06);

  // circles down the right side: centre x on grid lines, radius in columns, pixel size per circle
  const spec = [[6, 2.1, 1.1, 16], [5.1, 3.3, 1.6, 24], [6.3, 4.5, 1.5, 48], [5.3, 5.8, 1.25, 32], [6.5, 6.8, 0.95, 16]];
  const masks = [], fills = [];
  spec.forEach(([cx, cyR, rc, px], i) => {
    const x = M + COL * cx, y = M + ROW * cyR, r = COL * rc;
    masks.push(pixelCircle(x, y, r, px));
    const sq = { x: x - r, y: y - r, w: 2 * r, h: 2 * r };
    const im = canvas(); cover(im.g, wall, sq, { crop: [0.35 + i * 0.05, 0.38, 0.18, 0.2] });
    fills.push(inter(pixelate(tone(levels(im, 0.2, 0.85), [C.dot, C.dot2, C.light]), px), masks[i]));
  });
  // each circle's own pixel image, then the XOR overlaps on top
  fills.forEach((f) => draw(g, f));
  const xo = xorShapes(masks, '#FF00FF', C.flip);                  // odd coverage drawn transparent below, even = flip
  const evenOnly = canvas(); draw(evenOnly.g, xo); const ed = evenOnly.g.getImageData(0, 0, evenOnly.width, evenOnly.height); for (let p = 0; p < ed.data.length; p += 4) if (ed.data[p] === 255 && ed.data[p + 1] === 0 && ed.data[p + 2] === 255) ed.data[p + 3] = 0; evenOnly.g.putImageData(ed, 0, 0);
  draw(g, evenOnly);

  draw(g, press(head, C.type, 'riso', { wear: 0.3, spread: 0.45, seed: 49 }));

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.type };
  const sub = balance('A proof-of-concept experiment shows gravitational pull can carry a signal that walls and shielding cannot stop.', { ...t, minW: 220, maxW: COL * 3 - 8 });
  block(g, sub.lines, M, M + ROW * 4, t);
  block(g, ['(Daily Poster)', '(No. 049)', '(Thursday 20 November)', '(The Guardian)'], M, M + ROW * 5, t);
  pixels(g, M, M + ROW * 5.8, 8, ['#.##.#', '##..##', '.#..#.'], C.type);
  draw(g, IM.paper(0.45, 49), 'source-over', 0.6); grain(g, 0.07, 0.5);
  return out;
};
