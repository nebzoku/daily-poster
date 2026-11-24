// No. 051 · Concept 1 · "Neon in the middle of nowhere" · pixel circles of different sizes, XOR overlaps.
// Story: the services you aim for at night. Everyday thing: the lit OPEN sign. The brief's 3D neon sign, zoomed into
// single curves of the tube and pixelated so hard it becomes pattern, inside four circles of different sizes whose
// edges step in their own pixels; where circles cross the colour flips.
window.POSTER = async () => {
  const C = __CW__;
  seed(5131);
  await fonts(['900 100px "Mattone"', '500 16px "Albert Sans"']);
  const sign = await media('media/2026-11-22/object-2.png');
  const T = 'Albert Sans';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const { lines } = sameOptical8(['Neon', 'in the middle', 'of nowhere'], { font: 'Mattone', weight: 900, size: 200, gap: 12, minGap: 5, word: 0.26 }, W - 2 * M);
  const head = canvas(); const R = pinInterlock(head, lines, ['L', 'L', 'L'], 1, 6);

  // circles: [centre col, centre row, radius in cols, pixel size, crop of the sign]
  const spec = [[2.4, 4.0, 1.9, 56, [0.28, 0.33, 0.2, 0.18]], [4.8, 3.6, 1.3, 40, [0.45, 0.34, 0.16, 0.14]], [4.4, 5.3, 1.6, 72, [0.55, 0.36, 0.2, 0.18]], [6.4, 4.8, 0.9, 24, [0.38, 0.4, 0.12, 0.1]]];
  const sum = new Uint8Array(W * H), sc = document.createElement('canvas'), sg = sc.getContext('2d');
  spec.forEach(([c, r, rc, px, crop]) => {
    const cx = M + COL * c, cy = M + ROW * r, rad = COL * rc, n = Math.ceil(2 * rad / px) + 1, x0 = Math.floor((cx - rad) / px) * px, y0 = Math.floor((cy - rad) / px) * px;
    sc.width = n; sc.height = n; sg.fillStyle = '#000'; sg.fillRect(0, 0, n, n);
    sg.drawImage(sign, sign.width * crop[0], sign.height * crop[1], sign.width * crop[2], sign.height * crop[3], 0, 0, n, n);
    const d = sg.getImageData(0, 0, n, n).data; let lo = 255, hi = 0; for (let p = 0; p < n * n; p++) { lo = Math.min(lo, d[p * 4 + 1]); hi = Math.max(hi, d[p * 4 + 1]); }
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
      const X = x0 + xx * px, Y = y0 + yy * px; if (Math.hypot(X + px / 2 - cx, Y + px / 2 - cy) > rad) continue;
      const l = (d[(yy * n + xx) * 4 + 1] - lo) / Math.max(1, hi - lo);
      g.fillStyle = l < 0.25 ? C.p0 : l < 0.55 ? C.p1 : l < 0.8 ? C.p2 : C.p3; g.fillRect(X, Y, px, px);
      for (let v = Math.max(0, Y); v < Math.min(H, Y + px); v++) for (let u = Math.max(0, X); u < Math.min(W, X + px); u++) sum[v * W + u]++;
    }
  });
  const xo = document.createElement('canvas'); xo.width = W; xo.height = H; const xg = xo.getContext('2d'), id = xg.createImageData(W, H), fc = [1, 3, 5].map((i) => parseInt(C.flip.slice(i, i + 2), 16));
  for (let p = 0; p < sum.length; p++) if (sum[p] >= 2 && sum[p] % 2 === 0) { id.data[p * 4] = fc[0]; id.data[p * 4 + 1] = fc[1]; id.data[p * 4 + 2] = fc[2]; id.data[p * 4 + 3] = 255; }
  xg.putImageData(id, 0, 0); g.save(); g.imageSmoothingEnabled = false; g.drawImage(xo, 0, 0, W, H); g.restore();

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.type };
  const sub = balance('Motorway service stations, long a quick stop for fuel and a sandwich, are being reimagined as places people choose to visit.', { ...t, minW: 200, maxW: COL * 2.6 });
  block(g, sub.lines, W - M, M + ROW * 6.5, { ...t, align: 'right' });
  block(g, ['(Daily Poster)', '(No. 051)', '(Saturday 22 November)', '(BBC News)'], W - M, R[0].y, { ...t, align: 'right' });
  asterisk(g, M + 14, M + ROW * 6.5 + 14, 12, C.type);
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'riso' });
  draw(g, press(head, C.type, 'riso', { wear: 0.25, spread: 0.28, seed: 51 }));
  scratches(g, 1, 511);   // wear from handling (round 16)
  draw(g, IM.paper(0.4, 51), 'source-over', 0.5); grain(g, 0.08, 0.5);
  return out;
};
