// No. 049 · Concept 2 · "Gravity learns to speak" · full-bleed threshold, bright middle, tight condensed blocks.
// The wall the signal passed through becomes the middle of the poster: the brief's 3D brick wall zoomed until the
// courses fill the sheet. The 56 bits of "gravity" run across the middle as pixel blocks, the signal itself.
window.POSTER = async () => {
  const C = __CW__;
  seed(4932);
  await fonts(['400 100px "Terminal Grotesque"', '500 16px "Martian Mono"']);
  const BITS = '01100111011100100110000101110110011010010111010001111001';
  const wall = await media('media/2026-11-20/object-1.png');
  const T = 'Martian Mono';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const { lines } = sameOptical8(['GRAVITY', 'LEARNS TO', 'SPEAK'], { font: 'Terminal Grotesque', size: 200, gap: 45, minGap: 22 }, W - 2 * M);
  const head = canvas(); const R = pinBlocks(head, lines, ['L', 'R', 'L'], 2, 0.06);

  // middle band between the blocks
  const y0 = R[1].y + R[1].h, y1 = R[2].y;
  const mid = canvas(), gr = mid.g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.12, '#fff'); gr.addColorStop(0.88, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  mid.g.fillStyle = gr; mid.g.fillRect(0, y0, W, y1 - y0);
  const midM = lumMask(mid, 0.5, { soft: 0.45 });

  // cleared text box on the grid, cols 0–3, the two rows above the bottom block
  const tb = cell(0, 5, 3, 1); tb.y = y1 - ROW - 24; tb.h = ROW;
  const halo = canvas(); halo.g.filter = 'blur(10px)'; draw(halo.g, head); draw(halo.g, head);
  const keep = union(lumMask(halo, 0.02, { soft: 0.01 }), rectMask(tb));

  const src = canvas(); clip(src.g, { x: 0, y: 0, w: W, h: H }, () => { src.g.save(); src.g.translate(W / 2, H / 2); src.g.rotate(-0.36); const iw = W * 3.1, ih = wall.height * iw / wall.width; src.g.drawImage(wall, -iw / 2 - 60, -ih / 2 + 40, iw, ih); src.g.restore(); });
  const lv = levels(src, 0.05, 0.98);
  const m1 = inter(cut(lumMask(lv, 0.45, { blur: 2 }), keep), midM), m2 = inter(cut(lumMask(lv, 0.8, { blur: 2 }), keep), midM);
  draw(g, press(m1, C.mid, 'riso', { wear: 0.45, spread: 0.5, seed: 1 }));
  draw(g, press(m2, C.mid2, 'riso', { wear: 0.45, spread: 0.5, seed: 2 }));

  // the signal across the middle
  const bw = (W - 2 * M) / 56, sy = (y0 + y1) / 2 - bw;
  for (let i = 0; i < 56; i++) { g.fillStyle = C.type; g.fillRect(M + i * bw, sy + (BITS[i] === '1' ? 0 : bw * 1.5), bw, bw); }

  draw(g, press(head, C.type, 'riso', { wear: 0.3, spread: 0.45, seed: 49 }));

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.type };
  const sub = balance("Australian physicists sent the word 'gravity' in binary through a brick wall, using a slow 1950s elevator.", { ...t, minW: 220, maxW: COL * 3 - 8 });
  block(g, sub.lines, tb.x, tb.y, t);
  block(g, ['(Daily Poster) (No. 049)', '(Thu 20 Nov) (The Guardian)'], W - M, tb.y, { ...t, align: 'right' });
  asterisk(g, W - M - 14, sy - 40, 12, C.type);
  draw(g, IM.paper(0.45, 49), 'source-over', 0.6); grain(g, 0.07, 0.5);
  return out;
};
