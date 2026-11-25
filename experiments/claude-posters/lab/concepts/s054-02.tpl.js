// Style test S02 · ledger · "Back from / functional / extinction" · Gloock sentence case, three lines on ledger rules.
// Story: the chestnut, functionally extinct for a century, is coming back. The day's stump render, thresholded into
// the ink and housed in a diamond, sits in the gap after the short first line. Cream paper, grey ink.
window.POSTER = async () => {
  const C = __CW__; const N = 5402; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const stump = trim(await media('media/2026-11-25/object-2.png'));
  const { out, g, ink } = stylePoster(C, N);
  pencilGrid(g, [0, 4, 8], [0, 8], N);
  const HL = sameOptical8(['Back from', 'functional', 'extinction'], { font: D, weight: 400, size: 200, gap: 20, minGap: 6, word: 0.22 }, W - 2 * M);
  const [L0, L1, L2] = HL.lines, base = (l) => l.base - l.box.y, cap = (() => { const h = setOptical('H', { ...L0.o, size: HL.size }); return h.base - h.box.y; })();
  const b0 = M + cap, b2 = H - M - (L2.box.h - base(L2)), b1 = Math.round((b0 + b2) / 2);
  const R0 = place(ink, L0, { left: M, top: b0 - base(L0) });
  place(ink, L1, { right: W - M, top: b1 - base(L1) });
  place(ink, L2, { left: M, top: b2 - base(L2) });
  const n = 6, p = (b2 - b0) / n, ys = [];
  for (let k = 0; k <= n; k++) { const y = Math.round(b0 + k * p + HL.size * 0.05); ys.push(y); ink.g.fillStyle = '#fff'; ink.g.fillRect(M, y, W - 2 * M, 1.5); }
  const d = Math.round((ys[2] - ys[1]) * 0.8);   // in the empty ledger line under the first line, on the right
  draw(ink.g, housed(stump, 'diamond', { x: W - M - d, y: Math.round((ys[1] + ys[2]) / 2 - d / 2), w: d, h: d }, { obj: true, thr: 0.58, zoom: 0.92 }));
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const sub = balance('New techniques are producing chestnut trees that can survive the fungus which once felled billions of stems across eastern forests.', { ...t, minW: 220, maxW: COL * 2.6 });
  block(ink.g, sub.lines, M, ys[1] - 12, { ...t, anchor: 'bottom' });
  block(ink.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, ys[5] - 12, { ...t, align: 'right', anchor: 'bottom' });
  styleFinish(g, ink, C, N, { from: [0.1, 0.1], to: [0.9, 0.9], min: 0.6 });
  return out;
};
