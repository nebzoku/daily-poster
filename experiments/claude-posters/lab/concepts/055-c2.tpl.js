// No. 055 · Concept 2 · "ONE HAND / TWO WHEELS" · Anybody Black, all caps, a top block and a bottom block with the
// four words in the four corners (the comma in the brief's headline becomes the break).
// Story: a passenger riding pillion on a motorbike caught a six one-handed as it flew out of a cricket ground.
// Everyday thing: a motorbike going past on the road, and a red cricket ball.
// Visual idea: the sum of the catch: one hand, two wheels, one ball. The motorbike fills the middle of the sheet,
//   zoomed in until it is cropped by both edges, pixelated big into the palette (harsh, mechanical, a CCTV still of
//   a clip everyone has seen). The one smooth, real thing on the sheet is the ball, which takes the place of the O in
//   ONE: the ball is the thing in the hand.
// Image: object-2, the motorbike render (both wheels, engine and forks), and object-1, the cricket ball, toned smooth.
// Finish and paper: stamp (calm rubber-stamp ink) on photocopy stock: a handbill run off at the club, cheap and quick
//   like a viral clip.
// Mood check: punchy and cheerful, a scoreline; the pixelated bike reads as a still from the video, not a threat.
window.POSTER = async () => {
  const C = __CW__;
  seed(5521);
  const D = 'Anybody', T = 'Azeret Mono';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const bike = trim(await media('media/2026-11-26/object-2.png'));
  const ball = trim(await media('media/2026-11-26/object-1.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: one size, the widest line margin to margin, the shorter line's words pushed into the corners
  const HS = inkSafe(['ONE HAND', 'TWO WHEELS'], { font: D, weight: 900, size: 160, gap: 14, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'stamp', wear: 0.15, spread: 0.2 });
  const lines = spreadWords(HS.lines, W - 2 * M, { maxShort: 0.3 });
  const head0 = canvas(); const R = pinBlocks(head0, lines, ['L', 'L'], 1, 0.1);

  // the ball takes the place of the O in ONE: same height as the O, its left edge on the margin
  const Oo = setOptical('O', { ...HS.o, size: HS.size, gap: HS.gap });
  const oR = { x: R[0].x, y: R[0].y, w: Oo.box.w, h: Oo.box.h };
  const head = cut(head0, rectMask({ x: oR.x - 4, y: oR.y - 8, w: oR.w + 6, h: oR.h + 16 }));
  const d = oR.h, bcx = oR.x + d / 2, bcy = oR.y + d / 2;

  // the motorbike, both wheels in, cropped by the edges, between the furniture and the tally (row 7)
  const bot = M + ROW * 7, bw = 1200, bh = bw * bike.height / bike.width, top = bot - bh;
  const bc = canvas(); bc.g.drawImage(bike, W / 2 - bw / 2 + 16, top, bw, bh);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, bc); snap('place-bike', p); }
  // pixelate the grey render first, then posterise the blocks by coverage: the shadows drop out to the ground (so the
  // spokes, frame and wheel rims read as holes), mids in the mid colour, highlights in the vivid and the pale
  const posterBlocks = (s) => {
    const px = pixelate(levels(bc, 0.02, 0.98), s), solidM = alphaThr(px, 0.5), L = inter(px, solidM), c = canvas();
    const t1 = pct(L, 0.28), t2 = pct(L, 0.72), t3 = pct(L, 0.93);
    draw(c.g, tint(lumMask(L, t1, { soft: 0.001 }), C.pix[0]));
    draw(c.g, tint(lumMask(L, t2, { soft: 0.001 }), C.pix[1]));
    draw(c.g, tint(lumMask(L, t3, { soft: 0.001 }), C.pix[2]));
    return c;
  };
  if (CAPTURE) {   // the making-of: pixel sizes tried, back and forth, before settling
    for (const [n, s] of [[1, 4], [2, 32], [3, 8]]) { const p = canvas(); draw(p.g, out); draw(p.g, posterBlocks(s)); snap(`step-pix-${n}`, p); }
  }
  draw(g, posterBlocks(12));
  snap('step-pix-4', out);

  // the ball, smooth, in the O
  const balC = canvas(); fit(balC.g, ball, { x: bcx - d / 2, y: bcy - d / 2, w: d, h: d }, { rot: 0.5 });
  const ballM = lumMask(balC, 0, { soft: 0.001 });
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, balC); snap('place-ball', p); }
  draw(g, inter(tone(levels(balC, 0.04, 0.96), C.tones), ballM));
  snap('step-tone', out);

  // small type: furniture on the left and the subline on the right, cap heights on the row-1 grid line
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], M, M + ROW, t);
  snap('text-furniture', out);
  const sub = balance("Hit out of the ground in a local league match, the ball met a stranger's hand on the road.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, W - M, M + ROW, { ...t, align: 'right' });
  snap('text-sub', out);
  // a tally under the bike, on the row-7 line: one ball, two wheels
  const ty = bot + 24;
  block(g, ['(01) Ball'], M, ty, t);
  block(g, ['(02) Wheels'], W - M, ty, { ...t, align: 'right' });
  snap('text-labels', out);
  pixels(g, M + COL, ty, 8, ['#.'], C.mid);
  pixels(g, W - M - COL - 24, ty, 8, ['#.#'], C.mid);
  snap('place-pixels', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 552, shapes: [ballM], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 56, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) }); });
  printAll(g, C, { seed: 552, shapes: [ballM] });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 56, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 56);
  snap('final', out);
  return out;
};
