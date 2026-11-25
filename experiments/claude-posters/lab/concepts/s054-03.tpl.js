// Style test S03 · top and bottom words with a small picture between · "A century after / the blight" · Gloock.
// Grey paper, pale ink (tone-on-tone). Marville's chestnut tree, thresholded, in a square in the middle, flanked by
// APPALACHIA and CASTANEA DENTATA.
window.POSTER = async () => {
  const C = __CW__; const N = 5403; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const photo = await media('media/2026-11-25/image-02-2160.jpg');
  const { out, g, ink } = stylePoster(C, N);
  pencilGrid(g, [0, 8], [0, 4, 8], N, 0.22);
  const HL = sameOptical8(['A century after', 'the blight'], { font: D, weight: 400, size: 160, gap: 20, minGap: 6, word: 0.22 }, W - 2 * M);
  pinBlocks(ink, HL.lines, ['C', 'C'], 1, 0.1);
  const bw = Math.round(COL * 1.6), bh = Math.round(ROW * 2), box = { x: Math.round(W / 2 - bw / 2), y: Math.round(H / 2 - bh / 2), w: bw, h: bh };
  draw(ink.g, housed(photo, 'square', box, { crop: [0.08, 0.36, 0.42, 0.45], thr: 0.5, invert: true }));
  const fl = { font: D, size: 32, weight: 400, lead: 1, color: '#fff', track: 0 };
  block(ink.g, ['APPALACHIA'], M, H / 2 + 11, { ...fl, anchor: 'bottom' });
  block(ink.g, ['CASTANEA DENTATA'], W - M, H / 2 + 11, { ...fl, align: 'right', anchor: 'bottom' });
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const sub = balance('Once the backbone of Appalachian woodland, the chestnut vanished from the canopy; scientists and growers are now planting its successors.', { ...t, minW: 180, maxW: bw });
  block(ink.g, sub.lines, box.x, box.y + box.h + 20, t);
  block(ink.g, ['(Daily Poster) (No. 054)', '(Wednesday 25 November)'], box.x + box.w, box.y - 16, { ...t, align: 'right', anchor: 'bottom' });
  styleFinish(g, ink, C, N, { from: [0.5, 0.0], to: [0.5, 1.0], min: 0.65 });
  return out;
};
