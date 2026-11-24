// No. 050 · Concept 1 · "First taste of a hot year" · full-bleed threshold, bright middle, Franklin caps blocks.
// Story: the summer was so hot the vineyard picked earliest in 50 years, and the first bottle is already open.
// Everyday thing: the corkscrew, the moment of the first taste. The brief's 3D winged corkscrew, zoomed into its
// gear teeth and wings until it's sculpture, thresholded as the bright middle between the two blocks.
window.POSTER = async () => {
  const C = __CW__;
  seed(5031);
  await fonts(['900 100px "Libre Franklin"', '500 16px "Libre Franklin"']);
  const cork = await media('media/2026-11-21/object-2.png');
  const F = 'Libre Franklin';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const { lines } = sameOptical8(['FIRST TASTE', 'OF A', 'HOT YEAR'], { font: F, weight: 900, size: 200, gap: 22, minGap: 10, word: 0.24 }, W - 2 * M);
  const head = canvas(); const R = pinBlocks(head, spreadWords(lines, W - 2 * M), ['L', 'R', 'L'], 1, 0.06);
  const y0 = R[0].y + R[0].h + 24, y1 = R[1].y - 24;

  // the corkscrew, zoomed to the gears, filling the middle band edge to edge
  const band = { x: 0, y: y0, w: W, h: y1 - y0 };
  const src = canvas(); clip(src.g, band, () => cover(src.g, cork, { x: -60, y: y0 - 40, w: W + 120, h: y1 - y0 + 80 }, { crop: [0.385, 0.34, 0.235, 0.2] }));
  const lv = levels(src, 0.08, 0.98);
  const sil = inter(lumMask(src, 0, { soft: 0.001, blur: 1.5 }), rectMask(band));
  const lite = inter(lumMask(lv, 0.55, { blur: 1.5 }), sil), hi = inter(lumMask(lv, 0.86, { blur: 1.5 }), sil);
  draw(g, press(sil, C.mid2, 'riso', { wear: 0.4, spread: 0.5, seed: 1 }));
  draw(g, press(lite, C.mid, 'riso', { wear: 0.4, spread: 0.5, seed: 2 }));
  draw(g, press(hi, C.light, 'riso', { wear: 0.4, spread: 0.5, seed: 3 }));


  // subline + furniture: one style, under the top block, flush to the margins, cap height on the row line below
  const t = { font: F, size: 16, weight: 500, lead: 0.9, color: C.type };
  const rowLine = M + Math.ceil((R[0].y + R[0].h + 8 - M) / ROW) * ROW;
  const sub = balance('A long, hot summer brought the earliest grape harvest at the Three Choirs vineyard in half a century.', { ...t, minW: 200, maxW: COL * 2.6 });
  const yy = R[1].y - 24 - (sub.lines.length - 1) * 16 * 0.9 - 12;
  block(g, sub.lines, M, R[1].y, t);
  block(g, ['(Daily Poster)', '(No. 050)', '(Friday 21 November)', '(The Guardian)'], W - M, R[0].y + R[0].h + 24, { ...t, align: 'right' });
  asterisk(g, M + 12, R[0].y + R[0].h + 36, 12, C.type);
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'letterpress' });
  draw(g, press(head, C.type, 'letterpress', { wear: 0.35, spread: 0.25, seed: 50 }));
  draw(g, IM.paper(0.45, 50), 'source-over', 0.6); grain(g, 0.07, 0.5);
  return out;
};
