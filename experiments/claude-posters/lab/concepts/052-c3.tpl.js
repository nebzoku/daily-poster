// No. 052 · Concept 3 · "A workman's house / of wonder" · grid boxes, ASCII, all three headlines small.
// The things on and in his house: (01) the brief's 3D blue plaque, zoomed to its glaze, smooth; (02) the iron door key,
// thresholded; (03) an ornament design redrawn in ASCII made only of the letters of his name, D A V I D P A R R,
// a pattern made by hand, letter by letter.
window.POSTER = async () => {
  const C = __CW__;
  seed(5233);
  await fonts(['800 100px "Manrope"', '500 16px "Manrope"', '700 16px "Manrope"']);
  const plaque = await media('media/2026-11-23/object-2.png'), key = await media('media/2026-11-23/object-3.png'), orn = await media('media/2026-11-23/image-07-2160.jpg');
  const T = 'Manrope', NAME = 'DAVIDPARR';
  const out = canvas(), g = out.g;
  paper(g, C.paper, { drift: 0.02, fibre: 0.05 });

  const b1 = cell(0, 0, 5, 3), b2 = cell(5, 0, 3, 3), b3 = cell(0, 6, 3, 2);
  draw(g, tone(levels(boxed(plaque, b1, { crop: [0.3, 0.36, 0.34, 0.3] }), 0.03, 0.98), C.tones));
  g.fillStyle = C.box2; g.fillRect(b2.x, b2.y, b2.w, b2.h);
  const k2 = boxed(key, b2, { crop: [0.27, 0.42, 0.2, 0.25] });
  draw(g, press(inter(lumMask(k2, 0, { soft: 0.001, blur: 1 }), rectMask(b2)), C.ink2, 'riso', { wear: 0.35, spread: 0.45, seed: 2 }));
  draw(g, press(inter(lumMask(levels(k2, 0.05, 0.95), 0.6, { blur: 1 }), rectMask(b2)), C.box2, 'riso', { wear: 0.35, spread: 0.45, seed: 3 }));
  // ASCII of the ornament, letters of his name
  g.fillStyle = C.box3; g.fillRect(b3.x, b3.y, b3.w, b3.h);
  const sz = 16, cw = sz * 0.66, chh = sz * 0.9, cols = Math.floor(b3.w / cw), rows = Math.floor(b3.h / chh);
  const s = document.createElement('canvas'); s.width = cols; s.height = rows; s.getContext('2d').drawImage(orn, orn.width * 0.2, orn.height * 0.15, orn.width * 0.6, orn.height * 0.7, 0, 0, cols, rows);
  const d = s.getContext('2d').getImageData(0, 0, cols, rows).data; let k = 0, lo = 255, hi = 0;
  for (let p = 0; p < cols * rows; p++) { lo = Math.min(lo, d[p * 4]); hi = Math.max(hi, d[p * 4]); }
  g.save(); g.font = `700 ${sz}px "${T}"`; g.textBaseline = 'top';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const l = (d[(y * cols + x) * 4] - lo) / (hi - lo); if (l > 0.62) continue; g.fillStyle = l < 0.3 ? C.char1 : C.char2; g.fillText(NAME[k++ % NAME.length], b3.x + x * cw, b3.y + y * chh); }
  g.restore();

  // three headlines, one size and leading, stepping a column at a time; ours strongest
  const L = ["A workman's house", 'of wonder', 'Every wall', 'became a garden', 'Morris by day', 'himself by night'];
  const { lines } = inkSafe(L, { font: T, weight: 800, size: 48, gap: 14, minGap: 6, word: 0.24 }, COL * 4);
  const pitch = Math.max(...lines.map((t) => t.base - t.box.y)) * 1.12;
  const ours = canvas(), rest = canvas(); let y = M + ROW * 3 + 40;
  lines.forEach((t, i) => { const h = Math.floor(i / 2); place(h === 0 ? ours : rest, t, { left: M + COL * h, top: y }); y += pitch; });
  draw(g, tint(rest, C.ghost));
  draw(g, press(ours, C.ink, 'letterpress', { wear: 0.3, spread: 0.25, seed: 52 }));

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.ink };
  [b1, b2, b3].forEach((b, i) => block(g, [`(0${i + 1})`], b.x + b.w, b.y + b.h + 8, { ...t, align: 'right' }));
  const sub = balance('His modest house, covered in his own designs, has earned a blue plaque for its remarkable interiors.', { ...t, minW: 200, maxW: COL * 2.6 });
  block(g, sub.lines, b3.x + b3.w, b3.y + 24, t);
  block(g, ['(Daily Poster)', '(No. 052)', '(Monday 23 November)', '(The Guardian)'], b3.x + b3.w, b3.y + b3.h, { ...t, anchor: 'bottom' });
  asterisk(g, W - M - 14, H - M - 14, 12, C.ink);
  pixels(g, W - M - 48, M + ROW * 5 + 24, 8, ['#.##.#', '.#..#.', '#.##.#'], C.ink);
  draw(g, IM.paper(0.5, 52), 'source-over', 0.6); grain(g, 0.06, 0.5);
  return out;
};
