// Style test S04 · type field · "Back from functional extinction" · the species' name, CASTANEA DENTATA, set huge in
// Gloock caps in rows cropped by the sheet's edges; a solid block of ink in the middle with the day's chestnut burr
// knocked out of it in the paper colour, and the headline and furniture knocked out too. Yellow paper, dark ink, faded.
window.POSTER = async () => {
  const C = __CW__; const N = 5404; seed(N);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const burr = trim(await media('media/2026-11-25/object-1.png'));
  const { out, g, ink } = stylePoster(C, N);
  const size = 264, row = setOptical('CASTANEA DENTATA', { font: D, weight: 400, size, gap: 18, minGap: 6, word: 0.3 });
  const capH = (() => { const h = setOptical('H', { font: D, weight: 400, size }); return h.base - h.box.y; })(), pitch = Math.round(capH * 1.32);
  const field = canvas();
  for (let k = 0, y = M + capH; y < H + capH; k++, y += pitch) place(field, row, { left: -((k * 377) % Math.round(row.box.w * 0.6)), top: y - (row.base - row.box.y) });
  const blk = { x: M + COL * 2, y: M + ROW * 2.5, w: COL * 4, h: ROW * 3 };
  draw(ink.g, cut(field, rectMask({ x: blk.x - 24, y: blk.y - 24, w: blk.w + 48, h: blk.h + 48 })));
  // the block, with the burr knocked out (its lit parts in the paper colour)
  const bc = canvas(); { const cw = burr.width * 0.37, ch = burr.height * 0.33, cr = document.createElement('canvas'); cr.width = cw; cr.height = ch; cr.getContext('2d').drawImage(burr, 0, 0); cr.getContext('2d').clearRect(burr.width * 0.25, burr.height * 0.3, cw, ch); bc.g.fillStyle = '#000'; bc.g.fillRect(0, 0, W, H); fit(bc.g, cr, { x: blk.x + blk.w * 0.18, y: blk.y + blk.h * 0.12, w: blk.w * 0.64, h: blk.h * 0.76 }); }
  const lit = lumMask(levels(bc, 0.02, 0.99), 0.45, { blur: 0.7 });
  const knock = canvas();
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const hl = sameOptical8(['Back from functional extinction'], { font: D, weight: 400, size: 40, gap: 26, minGap: 6, word: 0.24 }, blk.w - 48).lines[0];
  place(knock, hl, { left: blk.x + 24, top: blk.y + 24 });
  block(knock.g, ['(Daily Poster) (No. 054)'], blk.x + 24, blk.y + blk.h - 24, { ...t, anchor: 'bottom' });
  block(knock.g, ['(Wednesday 25 November)'], blk.x + blk.w - 24, blk.y + blk.h - 24, { ...t, align: 'right', anchor: 'bottom' });
  draw(ink.g, cut(cut(rectMask(blk), inter(lit, rectMask(blk))), knock));
  styleFinish(g, ink, C, N, { from: [0.9, 0.0], to: [0.1, 1.0], min: 0.6 }, (gg) => vtape(gg, M + 6 * COL, 'top', C.tape, 5, 150));
  return out;
};
