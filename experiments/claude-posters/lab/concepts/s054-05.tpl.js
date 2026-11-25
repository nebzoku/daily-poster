// Style test S05 · painted lettering · "THE FOREST / REMEMBERS / ITS GIANT" · Schibsted Grotesk ExtraBold caps,
// sign-painted, centred: THE FOREST on the top margin, REMEMBERS / ITS GIANT on the bottom. The day's stump, thresholded
// into the same ink, in a circle in the middle. Cream paper, dark ink, faded.
window.POSTER = async () => {
  const C = __CW__; const N = 5405; seed(N);
  const D = 'Schibsted Grotesk';
  await fonts([`800 100px "${D}"`, `500 16px "${D}"`]);
  const stump = trim(await media('media/2026-11-25/object-2.png'));
  const { out, g, ink } = stylePoster(C, N);
  pencilGrid(g, [0, 4, 8], [0, 8], N, 0.24);
  const HL = sameOptical8(['THE FOREST', 'REMEMBERS', 'ITS GIANT'], { font: D, weight: 800, size: 200, gap: 22, minGap: 10, word: 0.3 }, W - 2 * M);
  const head = canvas(); const R = pinBlocks(head, HL.lines, ['C', 'C', 'C'], 1, 0.12);
  draw(ink.g, brushLetters(head, N));
  const r = Math.round(COL * 1.7), cy = Math.round((R[0].y + R[0].h + R[1].y) / 2);
  draw(ink.g, housed(stump, 'circle', { x: W / 2 - r, y: cy - r, w: 2 * r, h: 2 * r }, { obj: true, thr: 0.6, zoom: 0.9 }));
  const t = { font: D, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const sub = balance('Once the backbone of Appalachian woodland, the chestnut vanished from the canopy; scientists and growers are now planting its successors.', { ...t, minW: 200, maxW: COL * 2 });
  block(ink.g, sub.lines, M, cy - r, t);
  block(ink.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, cy + r, { ...t, align: 'right', anchor: 'bottom' });
  styleFinish(g, ink, C, N, { from: [0.2, 0.0], to: [0.8, 1.0], min: 0.62 });
  return out;
};
