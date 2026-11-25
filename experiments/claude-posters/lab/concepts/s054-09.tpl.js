// Style test S09 · interlocked block and tape columns · "Back from / functional / extinction" · Gloock sentence case,
// one tight interlocked block on the bottom margin; above it the day's hand-axe render, thresholded, in a big circle
// (the axe that felled them); two strips of tape down the grid lines either side. Yellow paper, dark ink, faded.
window.POSTER = async () => {
  const C = __CW__; const N = 5409; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const axe = trim(await media('media/2026-11-25/object-3.png'));
  const { out, g, ink } = stylePoster(C, N);
  pencilGrid(g, [0, 2, 6, 8], [0, 8], N, 0.26);
  const HL = sameOptical8(['Back from', 'functional', 'extinction'], { font: D, weight: 400, size: 200, gap: 20, minGap: 6, word: 0.22 }, W - 2 * M);
  const R = pinInterlock(ink, HL.lines, ['L', 'R', 'L'], 0, 6);
  const r = COL * 2, cy = Math.round((M + R[0].y) / 2) + 20;
  draw(ink.g, housed(axe, 'circle', { x: W / 2 - r, y: cy - r, w: 2 * r, h: 2 * r }, { obj: true, thr: 0.5, zoom: 1.0 }));
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const sub = balance('New techniques are producing chestnut trees that can survive the fungus which once felled billions of stems across eastern forests.', { ...t, minW: 200, maxW: COL * 1.8 });
  block(ink.g, sub.lines, M, M, t);
  block(ink.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, M, { ...t, align: 'right' });
  styleFinish(g, ink, C, N, { from: [0.5, 0.0], to: [0.5, 1.0], min: 0.62 }, (gg) => vtape(gg, M + 2 * COL, 'top', C.tape, 9, 170));
  return out;
};
