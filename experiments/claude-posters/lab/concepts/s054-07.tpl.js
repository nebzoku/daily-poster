// Style test S07 · archive page collage · "A century after the blight" · Marville's chestnut photograph as the
// ground, thresholded into the ink at half strength like a scanned page, and a giant "100" (a century) overprinted
// in the same ink, darker where they cross. Headline small, bottom left. Yellow paper, grey ink.
window.POSTER = async () => {
  const C = __CW__; const N = 5407; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const photo = await media('media/2026-11-25/image-02-2160.jpg');
  const { out, g, ink } = stylePoster(C, N);
  const pg = { x: M + COL, y: M + ROW * 0.5, w: COL * 6, h: ROW * 6 };
  const page = housed(photo, 'square', pg, { crop: [0.05, 0.05, 0.9, 0.7], thr: 0.42, invert: true, outline: 0 });
  draw(ink.g, page, 'source-over', 0.5);
  const big = setOptical('100', { font: D, weight: 400, size: 640, gap: 10, minGap: 4 });
  const sz = Math.floor(640 * (W - 2 * M) / big.box.w / 8) * 8, B = setOptical('100', { font: D, weight: 400, size: sz, gap: 10, minGap: 4 });
  const bc = canvas(); place(bc, B, { cx: W / 2, cy: M + ROW * 3.4 });
  draw(ink.g, bc, 'source-over', 0.72);
  const HL = sameOptical8(['A century after', 'the blight'], { font: D, weight: 400, size: 64, gap: 24, minGap: 6, word: 0.24 }, COL * 4);
  const R = pinInterlock(ink, HL.lines, ['L', 'L'], 0, 6);
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const bl = H - M - (HL.lines[1].box.h - (HL.lines[1].base - HL.lines[1].box.y));
  block(ink.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, bl, { ...t, align: 'right', anchor: 'bottom' });
  styleFinish(g, ink, C, N, { from: [0.0, 0.0], to: [1.0, 1.0], min: 0.62 }, (gg) => { vtape(gg, M + COL, 'top', C.tape, 7, 120); vtape(gg, M + 7 * COL, 'top', C.tape, 8, 120); });
  return out;
};
