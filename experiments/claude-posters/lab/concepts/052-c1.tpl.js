// No. 052 · Concept 1 · "Every wall / became a garden" · full-bleed threshold + one smooth box.
// Story: a Victorian decorator hung Morris's patterns for the rich by day, then covered his own terrace in his own.
// Everyday things: wallpaper, and the brush that put it up. The 1830 wallpaper, thresholded into the bright middle;
// one grid box holds the brief's 3D paintbrush zoomed to its bristles, left smooth, the tool against the pattern.
window.POSTER = async () => {
  const C = __CW__;
  seed(5231);
  await fonts(['800 100px "Manrope"', '500 16px "Manrope"']);
  const wallImg = await media('media/2026-11-23/image-03-2160.jpg'), brush = await media('media/2026-11-23/object-1.png');
  const T = 'Manrope';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const HS = inkSafe(['Every wall', 'became a garden'], { font: T, weight: 800, size: 200, gap: 14, minGap: 6, word: 0.24 }, W - 2 * M);
  const { lines } = HS;
  const head = canvas(); const R = pinInterlock(head, lines, ['L', 'L'], 1, 6);
  const bx = cell(5, 3, 3, 2), tb = cell(2, 3, 3, 2);
  const src = canvas(); cover(src.g, wallImg, { x: 0, y: 0, w: W, h: H }, { crop: [0.12, 0.1, 0.42, 0.8] });
  const halo = canvas(); halo.g.filter = 'blur(10px)'; draw(halo.g, head); draw(halo.g, head);
  const keep = union(lumMask(halo, 0.02, { soft: 0.01 }), rectMask(bx), rectMask(tb));
  const mid = canvas(), y0 = R[0].y + R[0].h, y1 = R[1].y, gr = mid.g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, '#fff'); gr.addColorStop(0.85, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  mid.g.fillStyle = gr; mid.g.fillRect(0, y0, W, y1 - y0);
  const midM = lumMask(mid, 0.5, { soft: 0.45 });
  const vm = inter(cut(lumMask(src, pct(src, 0.55), { blur: 2.5 }), keep), midM), gm = inter(cut(lumMask(src, 1 - pct(src, 0.14), { invert: true, blur: 2.5 }), keep), midM);
  draw(g, press(vm, C.mid, 'riso', { wear: 0.45, spread: 0.5, seed: 1 }));
  draw(g, press(gm, C.mid2, 'riso', { wear: 0.45, spread: 0.5, seed: 2 }));
  draw(g, tone(levels(boxed(brush, bx, { crop: [0.33, 0.42, 0.22, 0.16] }), 0.02, 0.98), C.tones));
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.type };
  const sub = balance('Victorian decorator David Parr papered mansions by day, then filled his own Cambridge terrace with patterns he designed.', { ...t, minW: 200, maxW: COL * 2.6 });
  block(g, sub.lines, bx.x, bx.y, { ...t, align: 'right' });
  block(g, ['(Daily Poster)', '(No. 052)', '(Monday 23 November)', '(The Guardian)'], bx.x, bx.y + bx.h, { ...t, align: 'right', anchor: 'bottom' });
  block(g, ['(01)'], bx.x + bx.w, bx.y - 10, { ...t, align: 'right', anchor: 'bottom' });
  asterisk(g, tb.x + 14, tb.y + tb.h - 14, 12, C.mid);
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'letterpress', boxes: [bx] });
  draw(g, press(head, C.type, HS.ink.preset, { ...HS.ink, seed: 52 }));
  scratches(g, 1, 521);   // wear from handling (round 16)
  draw(g, IM.paper(0.45, 52), 'source-over', 0.6); grain(g, 0.07, 0.5);
  return out;
};
