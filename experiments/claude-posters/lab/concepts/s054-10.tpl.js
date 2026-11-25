// Style test S10 · giant swash "T" · "The forest remembers its giant" · Gloock T filling the sheet, whiplash vines
// from the ends of its bar snaking down either side, the day's Cézanne chestnut trees in a circle at its foot; the
// rest of the headline centred under the bar's ends... set small in the first row. Cream paper, grey ink.
window.POSTER = async () => {
  const C = __CW__; const N = 5410; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const cez = await media('media/2026-11-25/image-06-2160.jpg');
  const hand = await media('media/2026-11-25/hand-01.jpg');   // Fox Strangways to Bertoloni
  const { out, g, ink } = stylePoster(C, N);
  const gx = (c) => M + c * COL, gy = (r) => M + r * ROW;
  pencilGrid(g, [0, 4, 8], [0, 1, 8], N, 0.26);
  const T0 = setOptical('T', { font: D, weight: 400, size: 1000 });
  const size = Math.floor(1000 * Math.min((W - 2 * M) / T0.box.w, (gy(8) - gy(1) - 24) / T0.box.h) / 8) * 8;
  const TT = setOptical('T', { font: D, weight: 400, size });
  const RT = place(ink, TT, { cx: W / 2, bottom: gy(8) });
  const cx = W / 2, top = RT.y, hh = RT.h, half = W / 2 - M, X = (u) => cx - half * u, Y = (v) => top + hh * v;
  const vines = canvas();
  const side = (gg) => { const P = (a) => a.map(([u, v]) => [X(u), Y(v)]);
    vine(gg, P([[0.9, 0.16], [0.86, 0.28], [0.66, 0.34], [0.58, 0.29], [0.66, 0.25], [0.74, 0.32], [0.78, 0.5], [0.6, 0.6], [0.52, 0.55], [0.58, 0.5], [0.66, 0.58], [0.7, 0.74], [0.82, 0.8]]), 18, { curl: 1 });
    vine(gg, P([[0.3, 0.18], [0.36, 0.3], [0.3, 0.4], [0.24, 0.36], [0.28, 0.32], [0.4, 0.44], [0.44, 0.62]]), 12, { curl: -1 }); };
  side(vines.g); const rv = canvas(); rv.g.save(); rv.g.translate(W, 0); rv.g.scale(-1, 1); side(rv.g); rv.g.restore(); draw(vines.g, rv);
  const tm = canvas(); place(tm, TT, { cx: W / 2, bottom: gy(8) });
  draw(ink.g, cut(vines, alphaThr(blurred(tm, 6), 0.02)));
  const r = COL * 0.9; draw(ink.g, housed(cez, 'circle', { x: X(0.62) - r, y: Y(0.86) - r, w: 2 * r, h: 2 * r }, { crop: [0.12, 0.0, 0.62, 0.7], thr: 0.45, invert: true }));
  const HL = sameOptical8(['The forest', 'remembers its giant'], { font: D, weight: 400, size: 56, gap: 26, minGap: 6, word: 0.24 }, COL * 3.4);
  const base = (l) => l.base - l.box.y, capH = (() => { const h1 = setOptical('H', { font: D, weight: 400, size: HL.size }); return h1.base - h1.box.y; })();
  const b2 = gy(1) - 40, b1 = b2 - Math.round(HL.size * 1.0);
  place(ink, HL.lines[0], { cx: W / 2, top: b1 - base(HL.lines[0]) }); place(ink, HL.lines[1], { cx: W / 2, top: b2 - base(HL.lines[1]) });
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  block(ink.g, ['(Daily Poster)', '(No. 054)'], gx(0), b1 - capH, t);
  block(ink.g, ['(Wednesday 25 November)', '(The Guardian)'], gx(8), b2, { ...t, align: 'right', anchor: 'bottom' });
  styleFinish(g, ink, C, N, { from: [0.1, 0.0], to: [0.9, 1.0], min: 0.6 }, (gg) => { vtape(gg, W / 2, 'bottom', C.tape, 11, 110); handwriting(gg, hand, { x: X(0.02) + 50, y: Y(0.4), w: COL * 2.6, h: ROW * 1.1 }, { rot: 0.04, thr: 0.13 }); });
  return out;
};
