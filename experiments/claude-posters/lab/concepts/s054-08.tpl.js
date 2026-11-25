// Style test S08 · specimen boxes · "The forest remembers its giant" · the letters of "giant" in Gloock lowercase,
// one to a thin box on the grid, cropped by their frames, and one box holding Cézanne's chestnut trees thresholded.
// Headline and subline in the last rows. Cream paper, grey ink.
window.POSTER = async () => {
  const C = __CW__; const N = 5408; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const cez = await media('media/2026-11-25/image-06-2160.jpg');
  const { out, g, ink } = stylePoster(C, N);
  pencilGrid(g, [0, 8], [0, 6, 8], N, 0.24);
  const boxes = { g: cell(0, 0, 3, 3), i: cell(3, 0, 2, 3), a: cell(5, 0, 3, 3), n: cell(0, 3, 3, 3), t: cell(6, 3, 2, 3) };
  const frame = (r) => { const c = canvas(); c.g.strokeStyle = '#fff'; c.g.lineWidth = 2; c.g.strokeRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16); return c; };
  for (const [ch, r] of Object.entries(boxes)) {
    const inner = { x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16 };
    const L = setOptical(ch, { font: D, weight: 400, size: Math.round(inner.h * 1.15) });
    const c = canvas(); place(c, L, { cx: inner.x + inner.w / 2, bottom: inner.y + inner.h + (ch === 'g' ? inner.h * 0.18 : -inner.h * 0.06) });
    draw(ink.g, inter(c, rectMask(inner))); draw(ink.g, frame(r));
  }
  draw(ink.g, housed(cez, 'square', { x: M + COL * 3 + 8, y: M + ROW * 3 + 8, w: COL * 3 - 16, h: ROW * 3 - 16 }, { crop: [0.12, 0.0, 0.62, 0.7], thr: 0.45, invert: true, outline: 1.5 }));
  const HL = sameOptical8(['The forest remembers', 'its giant'], { font: D, weight: 400, size: 80, gap: 24, minGap: 6, word: 0.24 }, COL * 5.5);
  const R = pinInterlock(ink, HL.lines, ['L', 'L'], 0, 6);
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  block(ink.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, M + ROW * 6 + 24, { ...t, align: 'right' });
  styleFinish(g, ink, C, N, { from: [0.8, 0.0], to: [0.2, 1.0], min: 0.6 });
  return out;
};
