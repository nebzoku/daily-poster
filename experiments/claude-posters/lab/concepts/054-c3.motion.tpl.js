// No. 054 · Concept 3, moving · "The forest remembers its giant" · the stump still being decided.
// The poster holds still except the stump in box (03): its pixel size steps between settings, coarse, fine,
// coarser, back, as if it were still being decided, settling on the poster's 24 px between tries, half a second at
// each. The way a memory sharpens and blurs. Frames are printed with the same paper and ink seed, so only the
// pixels change.
// equalise the object's own pixels (the transparent surround would otherwise count as black), so its tones spread
// across the palette instead of all snapping to one grey
function stretchOpaque(src) {
  const c = canvas(); draw(c.g, src); const id = c.g.getImageData(0, 0, c.width, c.height), d = id.data, hist = new Float64Array(256);
  let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { hist[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])]++; n++; }
  const cdf = new Float64Array(256); let acc = 0; for (let k = 0; k < 256; k++) { acc += hist[k]; cdf[k] = acc / Math.max(1, n); }
  for (let i = 0; i < d.length; i += 4) { const v = cdf[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])] * 255; d[i] = d[i + 1] = d[i + 2] = v; }
  c.g.putImageData(id, 0, 0); return c;
}
async function build054c3(C, PX) {
  seed(5431);
  const T = 'Schibsted Grotesk';
  await fonts([`700 100px "${T}"`, `500 16px "${T}"`]);
  const cez = await media('media/2026-11-25/image-06-2160.jpg'), sq = await media('media/2026-11-25/image-04-2160.jpg');
  const stump = trim(await media('media/2026-11-25/object-2.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  // the boxes
  const b1 = cell(2, 0, 6, 3), b2 = cell(0, 3, 4, 3), b3 = cell(4, 3, 4, 3);
  // (01) Cézanne, smooth, in tone: zoomed into the two trunks
  draw(g, tone(levels(boxed(cez, b1, { crop: [0.12, 0.0, 0.62, 0.7], fy: 0.3 }), 0.02, 0.98), C.tones));
  snap('place-cezanne', out);
  // (02) squirrels in a chestnut tree, thresholded in two inks
  const s2 = boxed(sq, b2, { crop: [0.25, 0.08, 0.6, 0.86], fx: 0.6 });
  const L2 = levels(s2, 0.02, 0.98), m2 = rectMask(b2);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, s2); snap('place-squirrels', p); }
  const hi = inter(lumMask(L2, pct(L2, 0.62), { blur: 1.2 }), m2), md = cut(inter(lumMask(L2, pct(L2, 0.36), { blur: 1.2 }), m2), hi);
  g.fillStyle = C.box2; g.fillRect(b2.x, b2.y, b2.w, b2.h);
  draw(g, tint(md, C.thr2)); draw(g, tint(hi, C.thr));
  snap('step-thr-1', out);
  // (03) the stump, pixelated big into the palette
  const sc = canvas(); fit(sc.g, stump, { x: b3.x + 8, y: b3.y + 24, w: b3.w - 16, h: b3.h - 24 });
  const st = stretchOpaque(sc);
  g.fillStyle = C.box3; g.fillRect(b3.x, b3.y, b3.w, b3.h);
  if (CAPTURE) {   // the render dropped in, then pixelated in steps, back and forth, before settling on 24
    const ph = canvas(); draw(ph.g, out); draw(ph.g, sc); snap('place-stump', ph);
    [8, 40, 16, 32].forEach((px, i) => { const p = canvas(); draw(p.g, out); draw(p.g, inter(pixelate(st, px, C.pix), rectMask(b3))); snap(`step-pix-${i}`, p); });
  }
  draw(g, inter(pixelate(st, PX, C.pix), rectMask(b3)));
  snap('step-pix-9', out);
  // hairline frames on the boxes
  g.save(); g.strokeStyle = C.line; g.lineWidth = 2; for (const b of [b1, b2, b3]) g.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); g.restore();
  snap('shape-frames', out);

  // labels: (01) in the empty column beside its box, last baseline on the box's bottom edge; (02) and (03) under theirs
  block(g, ['(01) Chestnut trees,', 'Jas de Bouffan,', 'Paul Cézanne, 1885'], M, b1.y + b1.h - 16, { ...t, anchor: 'bottom' });
  block(g, ['(02) Squirrels in a chestnut tree, Susan Waters, 1870s'], b2.x, b2.y + b2.h + 16, t);
  block(g, ['(03) What the blight left'], b3.x + 16, b3.y + b3.h + 16, t);
  snap('text-labels', out);
  block(g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], M, M, t);
  snap('text-furniture', out);
  const sub = balance('Once the backbone of Appalachian woodland, the chestnut vanished from the canopy; scientists and growers are now planting its successors.', { ...t, minW: 200, maxW: COL * 2 - 24 });
  block(g, sub.lines, M, M + ROW, t);
  snap('text-sub', out);
  pixels(g, M + COL * 4 - 32 - 8, b2.y + b2.h + 16, 8, ['##.#', '#.##'], C.thr);
  snap('place-pixels', out);

  // the three headlines, one size, each a column further in, ours first and strongest; the last line's ink
  // (descenders) on the bottom margin. The size is the largest multiple of 8 that keeps every line inside.
  const TX = ['The forest remembers its giant', 'Back from functional extinction', 'A century after the blight'];
  const o = { font: T, weight: 700, gap: 12, minGap: 6, word: 0.24 };
  let size = 120, Ls;
  for (; size >= 24; size -= 8) { Ls = TX.map((tx) => setOptical(tx, { ...o, size })); if (Ls.every((l, i) => l.box.w + i * COL <= W - 2 * M)) break; }
  const H1 = setOptical('H', { ...o, size }), capH = H1.base - H1.box.y, pitch = Math.round(size * 1.04);
  const base = (l) => l.base - l.box.y, last = Ls[2];
  let bl = H - M - (last.box.h - base(last)) - 2 * pitch;
  const ours = canvas(), ghosts = canvas(), R = [];
  Ls.forEach((l, i) => { R.push(place(i ? ghosts : ours, l, { left: M + i * COL, top: bl - base(l) })); bl += pitch; });
  // keep the headline clear: the labels above it end before its first cap height
  if (CAPTURE) { const Lr = canvas(); draw(Lr.g, tint(ours, C.type)); draw(Lr.g, tint(ghosts, C.ghost)); snapLines(Lr, R); }
  draw(g, tint(ghosts, C.ghost));
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 543, boxes: [b1] }); printHead(gg, ours, C.type, C.finish, { bg: C.bg, seed: 59, light: Math.min(0.95, 0.15 + (k - 0.35) * 0.55) }); });
  printAll(g, C, { seed: 543, boxes: [b1] });
  printHead(g, ours, C.type, C.finish, { bg: C.bg, seed: 59 });
  snap('printed', out);
  stock(g, C.stock, 543);
  snap('final', out);
  return out;
}
window.MOTION = async () => {
  const C = __CW__;
  const SIZES = [24, 16, 24, 40, 24, 12, 32, 24];   // eight steps of six frames at 48 frames
  return async (t) => build054c3(C, SIZES[Math.floor(t * SIZES.length) % SIZES.length]);
};
