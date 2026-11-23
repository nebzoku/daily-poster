// No. 050 · Concept 3 · "Fifty years since grapes ripened sooner" · data circles, pixelation, XOR overlaps.
// Data idea: a bunch of grapes made of years. 51 circles, one for each year 1976–2026, piled into a bunch shape,
// sizes varying like real grapes; each filled with Watkins's vineyard rows pixelated at its own size. Where grapes
// overlap the colour flips. 2026, the earliest harvest, is the one lit white at the bottom of the bunch.
window.POSTER = async () => {
  const C = __CW__;
  seed(5033);
  await fonts(['900 100px "Libre Franklin"', '500 16px "Libre Franklin"']);
  const rows = await media('media/2026-11-21/image-05-2160.jpg');
  const F = 'Libre Franklin';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const { lines } = sameOptical8(['FIFTY YEARS', 'SINCE GRAPES', 'RIPENED SOONER'], { font: F, weight: 900, size: 160, gap: 22, minGap: 10, word: 0.24 }, W - 2 * M);
  const head = canvas(); const R = pinBlocks(head, lines, ['L', 'L', 'L'], 3, 0.06);

  // the bunch: rows narrowing downwards, on the right two thirds, below the headline
  const top = R[2].y + R[2].h + 90, cx0 = W / 2, grapes = [];
  const counts = [9, 9, 8, 7, 6, 5, 4, 2, 1];                  // 51 grapes
  let yr = 1976, y = top;
  counts.forEach((n, ri) => {
    const r = 62 - ri * 2;
    for (let i = 0; i < n; i++) { const x = cx0 + (i - (n - 1) / 2) * r * 1.62 + (ri % 2 ? r * 0.4 : 0); grapes.push({ x, y, r: r * (0.85 + rand() * 0.3), year: yr++ }); }
    y += r * 1.42;
  });
  // drawn cell by cell (fast): each grape's pixels sampled from its own crop; coverage counted for the XOR flips
  const sum = new Uint8Array(W * H), hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const sc = document.createElement('canvas'), sg = sc.getContext('2d');
  grapes.forEach((gp, i) => {
    const px = [8, 16, 24][i % 3], n = Math.ceil((gp.r * 2) / px) + 1, x0 = Math.floor((gp.x - gp.r) / px) * px, y0 = Math.floor((gp.y - gp.r) / px) * px;
    sc.width = n; sc.height = n; sg.drawImage(rows, rows.width * (0.05 + (i % 7) * 0.12), rows.height * 0.45, rows.width * 0.14, rows.height * 0.2, 0, 0, n, n);
    const d = sg.getImageData(0, 0, n, n).data; let lo = 255, hi = 0;
    for (let p = 0; p < n * n; p++) { const l = d[p * 4]; lo = Math.min(lo, l); hi = Math.max(hi, l); }
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
      const X = x0 + xx * px, Y = y0 + yy * px; if (Math.hypot(X + px / 2 - gp.x, Y + px / 2 - gp.y) > gp.r) continue;
      const l = (d[(yy * n + xx) * 4] - lo) / Math.max(1, hi - lo);
      g.fillStyle = gp.year === 2026 ? C.hot : l < 0.5 ? C.dot : C.dot2; g.fillRect(X, Y, px, px);
      for (let v = Y; v < Y + px && v < H; v++) for (let u = X; u < X + px && u < W; u++) if (u >= 0 && v >= 0) sum[v * W + u]++;
    }
  });
  const xo = document.createElement('canvas'); xo.width = W; xo.height = H; const xg = xo.getContext('2d'), id = xg.createImageData(W, H), fc = hex(C.flip);
  for (let p = 0; p < sum.length; p++) if (sum[p] >= 2 && sum[p] % 2 === 0) { id.data[p * 4] = fc[0]; id.data[p * 4 + 1] = fc[1]; id.data[p * 4 + 2] = fc[2]; id.data[p * 4 + 3] = 255; }
  xg.putImageData(id, 0, 0); g.save(); g.imageSmoothingEnabled = false; g.drawImage(xo, 0, 0, W, H); g.restore();
  const last = grapes[grapes.length - 1];

  draw(g, press(head, C.type, 'letterpress', { wear: 0.35, spread: 0.25, seed: 50 }));

  const t = { font: F, size: 16, weight: 500, lead: 0.9, color: C.type };
  block(g, ['(2026)'], last.x + last.r + 16, last.y + 6, t);
  const sub = balance('A long, hot summer brought the earliest start to harvest at the Three Choirs vineyard in fifty years.', { ...t, minW: 180, maxW: COL * 2.4 });
  block(g, sub.lines, W - M, H - M, { ...t, align: 'right', anchor: 'bottom' });
  block(g, ['(Daily Poster)', '(No. 050)', '(Friday 21 November)', '(The Guardian)'], M, H - M, { ...t, anchor: 'bottom' });
  block(g, ['(1976)'], M, top + 6, t);
  pixels(g, M, top + 40, 8, ['#..#..#', '.#..#..', '#..#..#'], C.type);
  draw(g, IM.paper(0.45, 50), 'source-over', 0.6); grain(g, 0.07, 0.5);
  return out;
};
