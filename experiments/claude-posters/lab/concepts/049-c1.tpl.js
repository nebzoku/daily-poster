// No. 049 · Concept 1 · "A whisper through brick" · grid boxes, ASCII, three headlines small.
// The message is binary and it goes through a wall: the brief's 3D brick wall in ASCII made only of the bits of
// "gravity"; below, the same wall zoomed into its corner three times (smooth / threshold / big pixels).
window.POSTER = async () => {
  const C = __CW__;
  seed(4931);
  await fonts(['400 100px "Terminal Grotesque"', '500 16px "Martian Mono"', '700 16px "Martian Mono"']);
  const BITS = '01100111011100100110000101110110011010010111010001111001';
  const wall = await media('media/2026-11-20/object-1.png');
  const T = 'Martian Mono';
  const out = canvas(), g = out.g;
  paper(g, C.paper, { drift: 0.02, fibre: 0.05 });

  const top = cell(0, 0, 8, 3);
  g.fillStyle = C.box; g.fillRect(top.x, top.y, top.w, top.h);
  const src = canvas(); clip(src.g, top, () => { src.g.save(); src.g.translate(top.x + top.w / 2, top.y + top.h / 2); src.g.rotate(-0.36); const iw = top.w * 2.3, ih = wall.height * iw / wall.width; src.g.drawImage(wall, -iw / 2 - 40, -ih / 2, iw, ih); src.g.restore(); });
  const lv = levels(src, 0.2, 0.98);
  const sz = 16, cw = sz * 0.62, chh = sz * 0.9, cols = Math.floor(top.w / cw), rows = Math.floor(top.h / chh);
  const s = document.createElement('canvas'); s.width = cols; s.height = rows; s.getContext('2d').drawImage(lv, top.x * K, top.y * K, top.w * K, top.h * K, 0, 0, cols, rows);
  const d = s.getContext('2d').getImageData(0, 0, cols, rows).data; let k = 0;
  g.save(); g.font = `700 ${sz}px "${T}"`; g.textBaseline = 'top';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const i = (y * cols + x) * 4, l = d[i] / 255; if (l < 0.35) continue; g.fillStyle = l > 0.7 ? C.light : C.mark; g.fillText(BITS[k++ % 56], top.x + x * cw, top.y + y * chh); }
  g.restore();

  const H3 = [['GRAVITY', 'LEARNS TO SPEAK'], ['A WHISPER', 'THROUGH BRICK'], ['THE MESSAGE', 'NOTHING BLOCKS']];
  const { lines } = sameOptical8(H3.flat(), { font: 'Terminal Grotesque', size: 64, gap: 40, minGap: 18 }, COL * 5);
  const lh = Math.max(...lines.map((t) => t.box.h)), pitch = lh * 1.08;
  const ours = canvas(), rest = canvas(); let y = top.y + top.h + 24;
  lines.forEach((t, i) => { const h = Math.floor(i / 2); place(h === 1 ? ours : rest, t, { left: M + COL * h, top: y }); y += pitch; });
  draw(g, tint(rest, C.ghost));
  draw(g, press(ours, C.ink, 'riso', { wear: 0.3, spread: 0.45, seed: 49 }));

  const bw = (W - 2 * M) / 56, sy = M + ROW * 6 - bw * 2.5 - 8;
  for (let i = 0; i < 56; i++) { g.fillStyle = C.mark; g.fillRect(M + i * bw, sy + (BITS[i] === '1' ? 0 : bw * 1.5), bw, bw); }

  const b1 = cell(0, 6, 2, 2), b2 = cell(2, 6, 2, 2), b3 = cell(6, 6, 2, 2);
  const corner = (r, cr = [0.6, 0.43, 0.14, 0.2]) => boxed(wall, r, { crop: cr });
  draw(g, tone(levels(corner(b1), 0.03, 0.98), [C.box, C.mid, C.light]));
  g.fillStyle = C.mark; g.fillRect(b2.x, b2.y, b2.w, b2.h);
  const c2 = corner(b2); draw(g, press(inter(lumMask(c2, 1 - pct(c2, 0.5), { invert: true, blur: 1 }), rectMask(b2)), C.box, 'riso', { wear: 0.35, spread: 0.45, seed: 22 }));
  draw(g, inter(pixelate(tone(levels(corner(b3, [0.5, 0.38, 0.2, 0.28]), 0.05, 0.95), [C.box, C.mark, C.light]), 44), rectMask(b3)));
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.ink };
  [b1, b2, b3].forEach((b, i) => block(g, [`(0${i + 1})`], b.x + b.w, b.y - 10, { ...t, align: 'right', anchor: 'bottom' }));
  const sub = balance("Australian physicists sent the word 'gravity' in binary through a brick wall, using a slow 1950s elevator.", { ...t, minW: 200, maxW: COL * 2 - 4 });
  block(g, sub.lines, b2.x + b2.w, b2.y, t);
  block(g, ['(Daily Poster)', '(No. 049)', '(Thu 20 Nov)', '(The Guardian)'], b2.x + b2.w, b2.y + b2.h, { ...t, anchor: 'bottom' });
  asterisk(g, W - M - 14, top.y + top.h + 24 + 14, 12, C.mark);
  draw(g, IM.paper(0.5, 49), 'source-over', 0.6); grain(g, 0.06, 0.5);
  return out;
};
