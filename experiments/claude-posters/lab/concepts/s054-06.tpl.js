// Style test S06 · one giant glyph · the "g" of "giant" · Gloock lowercase g filling the sheet, the headline small
// above it; the day's hand-axe render, thresholded, in a triangle overlapping the g's lower bowl like a found label.
// Dark paper, yellow ink.
window.POSTER = async () => {
  const C = __CW__; const N = 5406; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const axe = trim(await media('media/2026-11-25/object-3.png'));
  const { out, g, ink } = stylePoster(C, N);
  pencilGrid(g, [0, 8], [0, 1, 8], N, 0.35);
  const g0 = setOptical('g', { font: D, weight: 400, size: 1000 });
  const size = Math.floor(1000 * Math.min((W - 2 * M) / g0.box.w, (H - M - (M + ROW)) / g0.box.h) / 8) * 8;
  const G = setOptical('g', { font: D, weight: 400, size });
  const RG = place(ink, G, { cx: W / 2, bottom: H - M });
  const HL = sameOptical8(['The forest remembers its giant'], { font: D, weight: 400, size: 48, gap: 26, minGap: 6, word: 0.24 }, COL * 5);
  place(ink, HL.lines[0], { left: M, bottom: M + ROW - 24 });
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  block(ink.g, ['(Daily Poster) (No. 054)', '(Wednesday 25 November)'], W - M, M + ROW - 24, { ...t, align: 'right', anchor: 'bottom' });
  // the axe in a triangle, overlapping the lower right; where it overlaps the g, the g is knocked out first
  const tri = { x: W - M - COL * 2.6, y: RG.y + RG.h * 0.62, w: COL * 2.6, h: COL * 2.3 };
  const triM = housed(axe, 'triangle', tri, { obj: true, thr: 0.5, zoom: 0.95, outline: 3 });
  const triShape = (() => { const c = canvas(); c.g.fillStyle = '#fff'; c.g.beginPath(); c.g.moveTo(tri.x - 10, tri.y + tri.h * 0.06 - 10); c.g.lineTo(tri.x + tri.w + 10, tri.y + tri.h * 0.06 - 10); c.g.lineTo(tri.x + tri.w / 2, tri.y + tri.h + 14); c.g.closePath(); c.g.fill(); return c; })();
  const ink2 = canvas(); draw(ink2.g, cut(ink, triShape)); draw(ink2.g, triM);
  styleFinish(g, ink2, C, N, { from: [0.2, 0.2], to: [0.9, 0.9], min: 0.6 }, (gg) => vtape(gg, W / 2, 'bottom', C.tape, 6, 110));
  return out;
};
