// Test (Round 22) · painted lettering · "BACK FROM / FUNCTIONAL / EXTINCTION" · Schibsted Grotesk ExtraBold caps,
// sign-painted (brush edges, bristle streaks, paint thinning in places). Two colours: cream paper, one ink.
// The day's image in the same ink: Marville's 1850s chestnut tree, thresholded to one colour by luminance and housed
// in a square in the middle, like the type (the burgundy reference matches image and type this way).
// Pencil lines on the grid. Scanned.
window.POSTER = async () => {
  const C = __CW__;
  seed(5497);
  const D = 'Schibsted Grotesk';
  await fonts([`800 100px "${D}"`, `500 16px "${D}"`]);
  const photo = await media('media/2026-11-25/image-02-2160.jpg');
  const out = canvas(), g = out.g;
  sheet(g, C.bg, 7);
  const gx = (c) => M + c * COL, gy = (r) => M + r * ROW;
  for (const c of [0, 2, 6, 8]) pencil(g, gx(c), gy(0) - 10, gx(c), gy(8) + 10, c + 1, { alpha: 0.28 });
  for (const r of [0, 3, 5, 8]) pencil(g, gx(0) - 10, gy(r), gx(8) + 10, gy(r), r + 20, { alpha: 0.24 });
  const HS = inkSafe(['BACK FROM', 'FUNCTIONAL', 'EXTINCTION'], { font: D, weight: 800, size: 200, gap: 22, minGap: 10, word: 0.3 }, W - 2 * M, { preset: 'letterpress', wear: 0.2, spread: 0.2 });
  const head = canvas(); pinBlocks(head, spreadWords(HS.lines, W - 2 * M, { maxShort: 0.2 }), ['L', 'L', 'L'], 1, 0.12);
  const painted = brushLetters(head, 7);
  // the image in a square on the grid, between rows 3 and 5, cols 2 to 6... squared up: 2 rows tall, centred
  const s = ROW * 2, sq = { x: Math.round(W / 2 - s / 2), y: gy(3), w: s, h: s };
  const src = boxed(photo, sq, { crop: [0.08, 0.36, 0.42, 0.33] }), L = levels(src, 0.02, 0.98);
  const img = inter(lumMask(L, 0.5, { invert: true, blur: 0.8 }), rectMask(sq));
  const frame = cut(rectMask({ x: sq.x - 3, y: sq.y - 3, w: sq.w + 6, h: sq.h + 6 }), rectMask(sq));
  const ink = union(painted, img, frame);
  const t = { font: D, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  const sub = balance('New techniques are producing chestnut trees that can survive the fungus which once felled billions of stems across eastern forests.', { ...t, minW: 200, maxW: COL * 1.8 });
  block(ink.g, sub.lines, gx(0), gy(3), t);
  block(ink.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], gx(8), gy(3), { ...t, align: 'right' });
  draw(g, fadedInk(ink, C.type, 7, { from: [0.15, 0.05], to: [0.85, 0.95], min: 0.62 }));
  stock(g, C.stock, 547);
  scan(g, 547, { amount: 1.2 });
  return out;
};
