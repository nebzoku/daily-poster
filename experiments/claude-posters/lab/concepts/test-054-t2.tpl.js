// Test (Round 19 guidance) · "A century after / the blight" · Gloock sentence case, top and bottom words with a small
// picture between (the Quinta / Dourada move), tone-on-tone.
// Story: a blight killed the American chestnut as a canopy tree; a century on, resistant trees are coming back.
// The one subtle change: "blight" is eaten: cankers spread through its letters (holes and darker spots), every other
//   word clean.
// Picture: Marville's 1850s chestnut tree, small and centred, duotone; flanked by APPALACHIA and CASTANEA DENTATA.
// Finish and paper: letterpress on uncoated, pale ground, grey ink: an old seed catalogue.
window.POSTER = async () => {
  const C = __CW__;
  seed(5492);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const photo = await media('media/2026-11-25/image-02-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const HS = inkSafe(['A century after', 'the blight'], { font: D, weight: 400, size: 160, gap: 20, minGap: 8, word: 0.2 }, W - 2 * M, { preset: 'letterpress', wear: 0.15, spread: 0.15 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C'], 1, 0.1);
  // the blight: canker spots spreading through the second line's last word only
  const bl = setOptical('blight', { ...HS.o, size: HS.size }).box.w;
  const wx = R[1].x + R[1].w - bl, wr = { x: wx, y: R[1].y, w: bl, h: R[1].h };
  const spots = canvas(); spots.g.fillStyle = '#fff';
  for (let i = 0; i < 46; i++) { const a = rand(), cx = wr.x + wr.w * (0.05 + 0.95 * Math.pow(rand(), 0.8)), cy = wr.y + wr.h * rand(), r = 1.5 + Math.pow(rand(), 3) * 9 * (0.4 + 0.6 * (cx - wr.x) / wr.w); spots.g.beginPath(); spots.g.ellipse(cx, cy, r * (1 + a), r, a * 3, 0, 7); spots.g.fill(); }
  const holes = inter(spots, head), rings = inter(cut(alphaThr(blurred(spots, 3), 0.08), spots), head);
  const headClean = cut(head, holes);
  // the small picture, centred, duotone
  const box = { x: Math.round(W / 2 - COL * 0.75), y: M + ROW * 3, w: Math.round(COL * 1.5), h: ROW * 2 };
  draw(g, tone(levels(boxed(photo, box, { crop: [0.3, 0.2, 0.6, 0.6] }), 0.02, 0.98), C.tones));
  // flanking words, small caps in the display face, tone-on-tone, centred on the picture's middle
  const cy = box.y + box.h / 2, fl = { font: D, size: 32, weight: 400, lead: 1, color: C.type, track: 0 };
  const cap40 = 32 * 0.7;
  block(g, ['APPALACHIA'], M, cy - cap40 / 2, fl);
  block(g, ['CASTANEA DENTATA'], W - M, cy - cap40 / 2, { ...fl, align: 'right' });
  // subline under the picture, furniture over it, on its edges
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const sub = balance('Once the backbone of Appalachian woodland, the chestnut vanished from the canopy; scientists and growers are now planting its successors.', { ...t, minW: 180, maxW: box.w });
  block(g, sub.lines, box.x, box.y + box.h + 16, t);
  block(g, ['(Daily Poster) (No. 054)', '(Wednesday 25 November)'], box.x + box.w, box.y - 12, { ...t, align: 'right', anchor: 'bottom' });
  printAll(g, C, { seed: 548, boxes: [box] });
  printHead(g, headClean, C.type, C.finish, { bg: C.bg, seed: 58, wear: HS.ink.wear, spread: HS.ink.spread });
  draw(g, tint(rings, C.canker));
  stock(g, C.stock, 548);
  return out;
};
