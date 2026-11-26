// ---------- illustration (Ben, 26 Nov 2026: a line-and-flat-colour illustration style for the roster) ----------
// Clean contemporary editorial illustration: worn black outlines of near-even weight, flat fills in the day's palette
// only, one cel-shadow tone, hatching and dashes for texture (falling water, grass, stone), big outlined cumulus, a
// small figure or object against a big space. Printed like everything else: printAll + stock (paper and scratches).
// Everything is drawn from the brief: its 3D objects become line drawings (objectArt), the scene comes from the story.
// Masks are white-on-transparent canvases (like lib.js); colour them with tint().

// The outline of a mask: a band `w` design px wide just outside its edge (inside with inner: true).
function dilate(m, r) {
  const c = canvas(), n = Math.max(12, Math.ceil(r * 6));
  for (const f of [1, 0.5]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; offset(c.g, m, Math.cos(a) * r * f, Math.sin(a) * r * f); }
  draw(c.g, m); return alphaThr(c, 0.5);
}
function outline(m, w = 3, { inner = false } = {}) {
  const solidM = alphaThr(m, 0.5);
  if (inner) return cut(solidM, cut(rectMask({ x: -10, y: -10, w: W + 20, h: H + 20 }), dilate(cut(rectMask({ x: -10, y: -10, w: W + 20, h: H + 20 }), solidM), w)));
  return cut(dilate(solidM, w), solidM);
}
// A cricket ball drawn as an illustration (from the brief's ball render): a disc, a cel-shadow crescent away from the
// light, a small highlight, and the seam as a great circle seen almost edge-on, two inked rows with stitches.
// Returns { body, shadow, light, stitches, lines } masks.
function ballArt(cx, cy, r, { tilt = -0.5, seamX = 0.18, lw = 4, sd = 1 } = {}) {
  seed(sd); const disc = circleMask(cx, cy, r);
  const lit = circleMask(cx - r * 0.2, cy - r * 0.24, r * 1.04);
  const shadow = cut(disc, lit);
  const light = canvas(); light.g.fillStyle = '#fff'; light.g.beginPath(); light.g.ellipse(cx - r * 0.42, cy - r * 0.42, r * 0.2, r * 0.11, -0.75, 0, Math.PI * 2); light.g.fill();
  const ca = Math.cos(tilt), sa = Math.sin(tilt), P = (u, v) => [cx + u * ca - v * sa, cy + u * sa + v * ca];
  const lines = canvas(), stitches = canvas();
  // the seam: two parallel arcs, the visible half of a great circle (an ellipse with a narrow x radius)
  const rx = r * 0.42, off = r * seamX;
  for (const d of [-r * 0.05, r * 0.05]) {
    const pts = []; for (let k = -40; k <= 40; k++) { const th = k / 40 * Math.PI / 2 * 0.985; pts.push(P(off + d + rx * Math.cos(th), r * Math.sin(th) * 0.995)); }
    inkLine(lines, pts, lw * 0.75, { sd: sd + (d > 0 ? 1 : 2), taper: 0.5 });
  }
  // stitches: short slanted strokes in rows either side of the seam
  for (const [d, sl] of [[-r * 0.1, 1], [-r * 0.15, 1], [r * 0.1, -1], [r * 0.15, -1]]) {
    for (let k = -17; k <= 17; k++) {
      const th = k / 18 * Math.PI / 2, x = off + d + rx * Math.cos(th), y = r * Math.sin(th);
      const L = r * 0.045 * Math.cos(th) + 2;
      inkLine(stitches, [P(x - L * 0.6, y - L * sl), P(x + L * 0.6, y + L * sl)], lw * 1.4, { sd: sd + k * 5 + d | 0, taper: 0.3 });
    }
  }
  const st = inter(stitches, disc);
  draw(lines.g, outline(st, lw * 0.45));
  draw(lines.g, outline(disc, lw));
  return { body: disc, shadow, light: inter(light, disc), stitches: st, lines: inter(union(lines, outline(disc, lw)), dilate(disc, lw + 1)) };
}
// A wobbling hand-inked line through points (design px): near-even weight that swells a touch mid-stroke and tapers at
// the ends, with tiny wobble. Draws white onto a mask canvas.
function inkLine(c, pts, w = 3, { wobble = 0.8, taper = 0.25, sd = 1 } = {}) {
  seed(sd); const g = c.g; g.save(); g.fillStyle = '#fff';
  // resample along the polyline
  const P = []; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.2)); for (let k = 0; k < n; k++) P.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); }
  P.push(pts[pts.length - 1]);
  let ox = 0, oy = 0;
  P.forEach(([x, y], i) => {
    const t = i / Math.max(1, P.length - 1);
    ox += (rand() - 0.5) * 0.15 * wobble; oy += (rand() - 0.5) * 0.15 * wobble; ox *= 0.96; oy *= 0.96;
    const r = (w / 2) * (1 - taper + taper * Math.sin(Math.PI * t)) * (0.92 + 0.16 * rand());
    g.beginPath(); g.arc(x + ox, y + oy, Math.max(0.35, r), 0, Math.PI * 2); g.fill();
  });
  g.restore(); return c;
}
// A smooth curve (Catmull-Rom) through control points, as a point list for inkLine.
function curve(cp, step = 6) {
  const out = []; const p = (i) => cp[Math.max(0, Math.min(cp.length - 1, i))];
  for (let i = 0; i < cp.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(cp[cp.length - 1]); return out;
}
// Fill a polygon (design px) into a mask.
function poly(pts, c = canvas()) { c.g.fillStyle = '#fff'; c.g.beginPath(); pts.forEach(([x, y], i) => (i ? c.g.lineTo(x, y) : c.g.moveTo(x, y))); c.g.closePath(); c.g.fill(); return c; }
// A cumulus: a flat-ish base and a bumpy top made of overlapping lobes, biggest in the middle. Returns
// { fill, lines }: the cloud's mask and its ink (outline plus a few inner curls where lobes overlap).
function cumulus(x, y, w, h, sd = 1, { lobes = 9, curls = 5, lw = 2.5, flat = true } = {}) {
  seed(sd); const fill = canvas(), lines = canvas(), L = [];
  for (let i = 0; i < lobes; i++) {
    const t = (i + 0.5) / lobes, env = Math.sin(Math.PI * t) ** 0.7, r = (h * 0.32) * (0.5 + 0.7 * env) * (0.8 + 0.4 * rand());
    L.push([x + w * t + (rand() - 0.5) * w / lobes * 0.6, y + h - r * 0.9 - env * h * 0.45 * (0.7 + 0.5 * rand()), r]);
  }
  // a few smaller lobes along the edges for the cauliflower look
  for (let i = 0; i < lobes * 4; i++) { const b = L[Math.floor(rand() * Math.min(L.length, lobes))], a = -Math.PI * (0.05 + 0.9 * rand()); L.push([b[0] + Math.cos(a) * b[2] * 0.9, b[1] + Math.sin(a) * b[2] * 0.9, b[2] * (0.14 + 0.22 * rand())]); }
  fill.g.fillStyle = '#fff';
  for (const [cx, cy, r] of L) { fill.g.beginPath(); fill.g.arc(cx, cy, r, 0, Math.PI * 2); fill.g.fill(); }
  if (flat) { fill.g.globalCompositeOperation = 'destination-out'; fill.g.fillRect(x - w, y + h, w * 3, h * 2); fill.g.globalCompositeOperation = 'source-over'; }
  draw(lines.g, outline(fill, lw));
  if (flat) { const cut2 = canvas(); cut2.g.fillStyle = '#fff'; cut2.g.fillRect(x - w, y + h - 1, w * 3, h * 2); const l2 = cut(lines, cut2); lines.g.clearRect(0, 0, W, H); draw(lines.g, l2); }
  // inner curls: short arcs inside the cloud, following lobes that sit in front
  for (let i = 0; i < curls; i++) {
    const [cx, cy, r] = L[Math.floor(rand() * lobes)], a0 = Math.PI * (1.05 + 0.3 * rand()), a1 = a0 + Math.PI * (0.35 + 0.3 * rand());
    const pts = []; for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * k / 16; pts.push([cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82 + r * 0.25]); }
    inkLine(lines, pts, lw * 0.9, { sd: sd * 7 + i, taper: 0.6 });
  }
  return { fill, lines: inter(lines, alphaThr(blurred(fill, lw * 2), 0.05)) };
}
// Hatching inside a mask: parallel strokes at an angle, broken into dashes of random length (the waterfall and grass
// marks in the references).
function hatch(m, { angle = Math.PI / 2, gap = 10, dash = [12, 60], skip = 0.35, lw = 1.6, sd = 1 } = {}) {
  seed(sd); const c = canvas(), ca = Math.cos(angle), sa = Math.sin(angle), R = Math.hypot(W, H);
  for (let o = -R; o < R; o += gap * (0.8 + 0.4 * rand())) {
    let s = -R;
    while (s < R) {
      const len = dash[0] + rand() * (dash[1] - dash[0]);
      if (rand() > skip) { const x0 = W / 2 + ca * s - sa * o, y0 = H / 2 + sa * s + ca * o; inkLine(c, [[x0, y0], [x0 + ca * len, y0 + sa * len]], lw, { taper: 0.7, sd: (o * 13 + s) | 0 }); }
      s += len + 6 + rand() * 30;
    }
  }
  return inter(c, m);
}
// A brief object (3D render) as an illustration: flat cel fills in up to three tones (shadow, body, light) with
// soft-edged, simplified shapes, a black outline round the silhouette and inner lines where the render has creases
// and seams. r: where it goes (contain), o.rot/o.flip like fit(). Returns { fill: [shadow, body, light] masks, lines,
// silhouette }.
function objectArt(im, r, o = {}) {
  const { rot = 0, flip = false, lw = 3, inner = 0.07, innerR = 5, shade = [0.3, 0.8], simplify = 2.2 } = o;
  const c = canvas(); fit(c.g, im, r, { rot, flip });
  const sil = alphaThr(c, 0.5);
  const L = levels(c, 0.02, 0.98);
  const smoothL = blurred(L, simplify);
  const shadow = inter(cut(sil, lumMask(smoothL, pct(L, shade[0]), { soft: 0.002 })), sil);
  const light = inter(lumMask(smoothL, pct(L, shade[1]), { soft: 0.002 }), sil);
  const body = cut(cut(sil, shadow), light);
  const creases = inter(alphaThr(blurred(alphaThr(blurred(lineMask(blurred(L, simplify * 0.4), inner, { radius: innerR }), 1.2), 0.55), 0.6), 0.4), sil);
  const lines = union(outline(sil, lw), creases);
  return { fill: [shadow, body, light], lines, silhouette: sil };
}
// Wear the black line work like an old print: tiny breaks and a rougher edge, nothing that loses the drawing.
function wornLines(lines, sd = 1, amount = 1, { gaps = 1 } = {}) {
  // edges roughened by a fine noise threshold, the ink a touch mottled, and (Ben, 26 Nov: "there are often gaps in
  // the lines which makes it feel more organic") real breaks: short gaps where the pen lifted, scattered along every
  // line, more often on long lines than short marks
  seed(sd); const b = blurred(lines, 0.8), d0 = b.g.getImageData(0, 0, b.width, b.height), d = d0.data;
  const n1 = noise(0.6), n2 = noise(6), n3 = noise(2.5), n4 = noise(7), n5 = noise(16);
  for (let p = 0; p < n1.length; p++) {
    const a = d[p * 4 + 3] / 255; if (!a) continue;
    const lift = n4[p] > 0.79 - 0.05 * gaps && n5[p] > 0.35 ? 1 : 0;
    const thr = 0.38 + (n1[p] - 0.5) * 0.45 * amount + (n3[p] > 0.86 ? 0.4 * amount : 0) + lift * gaps;
    let v = smooth(thr - 0.06, thr + 0.06, a) * (1 - 0.18 * amount * smooth(0.5, 0.9, n2[p]));
    d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = 255; d[p * 4 + 3] = clamp(v) * 255;
  }
  b.g.putImageData(d0, 0, 0); return b;
}
// A drawing in layers: fills go straight onto the sheet (and hide any line work behind them), line work collects on
// its own layer so it can be printed last as worn black ink, over the printed fills:
//   const I = illo(g); I.fill(mask, colour); I.ink(lineMask); ... printAll(g, C); I.print(g, C.line, seed)
function illo(g) {
  let L = canvas();
  return {
    fill(m, col) { draw(g, tint(m, col)); L = cut(L, m); },
    ink(m) { draw(L.g, m); },
    lines() { return L; },
    calm(m) { L = cut(L, m); },   // no line work in m (the headline's zone)
    print(gg, col, sd = 1, amount = 1, o = {}) { draw(gg, tint(wornLines(L, sd, amount, o), col)); },
  };
}

// Shrink a mask by r design px.
function erode(m, r) { const full = rectMask({ x: -20, y: -20, w: W + 40, h: H + 40 }); return cut(full, dilate(cut(full, m), r)); }
// Thin-line shading (Ben, 26 Nov: "thin line shading the same way they do the ripples in the water or the blades in
// the grass"): short, thin, slightly curved strokes in loose clusters, never an even fill.
//   ripples(m): short horizontal strokes stacked in little groups (water, tarmac sheen, distance)
//   blades(m):  tufts of 3-6 thin blades fanning up from a base (grass), denser and longer towards `near` (a y value)
//   strata(m):  contour lines following the shape's edge inward, broken (cliffs, walls, folds of cloth)
function ripples(m, { density = 0.0016, len = [10, 46], lw = 1.3, sd = 1, tilt = 0 } = {}) {
  seed(sd); const c = canvas(), n = Math.round(W * H * density);
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H, k = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < k; j++) { const L = len[0] + rand() * (len[1] - len[0]), yy = y + j * 5, xx = x + (rand() - 0.5) * 10;
      inkLine(c, curve([[xx, yy], [xx + L / 2, yy - 1.2 + tilt * L / 2], [xx + L, yy + tilt * L]], 3), lw, { taper: 0.9, sd: i * 7 + j }); }
  }
  return inter(c, erode(m, 2));
}
function blades(m, { density = 0.0011, h = [8, 26], near = H, lw = 1.2, sd = 1, lean = 0.25 } = {}) {
  seed(sd); const c = canvas(), n = Math.round(W * H * density);
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H, f = 0.5 + 0.8 * Math.max(0, 1 - Math.abs(near - y) / H), k = 3 + Math.floor(rand() * 4);
    for (let j = 0; j < k; j++) { const a = -Math.PI / 2 + lean + (j - k / 2) * 0.22 + (rand() - 0.5) * 0.2, L = (h[0] + rand() * (h[1] - h[0])) * f, bx = x + (j - k / 2) * 2.2;
      inkLine(c, curve([[bx, y], [bx + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5], [bx + Math.cos(a + 0.25) * L, y + Math.sin(a + 0.25) * L]], 2), lw, { taper: 0.85, sd: i * 11 + j }); }
  }
  return inter(c, m);
}
function strata(m, { step = 14, n = 5, lw = 1.3, sd = 1, keep = 0.55 } = {}) {
  seed(sd); const c = canvas();
  for (let i = 1; i <= n; i++) { const e = erode(m, step * i); if (!e) break; draw(c.g, outline(e, lw, { inner: true })); }
  // broken: keep only some stretches of each contour
  const brk = canvas(), nz = noise(18); const id = brk.g.createImageData(brk.width, brk.height);
  for (let p = 0; p < nz.length; p++) if (nz[p] < keep) id.data[p * 4 + 3] = 255;
  brk.g.putImageData(id, 0, 0);
  return inter(c, brk);
}

// ---------- round 28: drawing from photographic references (Ben, 26 Nov 2026) ----------
// traceArt(photo, rect, o): a reference photo (or a crop of one) turned into the illustration style, the way an
// illustrator draws over a photo: shapes flattened (a Kuwahara filter: flat areas, edges kept), posterised into a few
// cel tones, small bits merged away, and inked along the main contours only. Returns { levels: [masks dark → light],
// lines, silhouette }. Colour the levels with a ramp of palette colours and their tints and shades.
//   crop: [x, y, w, h] fractions of the photo; k: number of tones (3–4); kr: flattening radius (px at half size);
//   edge: contour threshold (higher = fewer lines); minArea: smallest shape kept (design px²);
//   subject: 'all' | 'auto' (cut the subject out from a plain or blurred background by its colour against the
//   photo's border) | a mask canvas; flip: mirror; lw: line weight.
function kuwahara(lum, w, h, r) {
  const S = new Float64Array((w + 1) * (h + 1)), Q = new Float64Array((w + 1) * (h + 1)), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let rs = 0, rq = 0; for (let x = 0; x < w; x++) { const v = lum[y * w + x]; rs += v; rq += v * v; S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + rs; Q[(y + 1) * (w + 1) + x + 1] = Q[y * (w + 1) + x + 1] + rq; } }
  const box = (A, x0, y0, x1, y1) => A[(y1 + 1) * (w + 1) + x1 + 1] - A[y0 * (w + 1) + x1 + 1] - A[(y1 + 1) * (w + 1) + x0] + A[y0 * (w + 1) + x0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = 1e18, mean = lum[y * w + x];
    for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x0 = Math.max(0, Math.min(x, x + ax * r)), x1 = Math.min(w - 1, Math.max(x, x + ax * r)), y0 = Math.max(0, Math.min(y, y + ay * r)), y1 = Math.min(h - 1, Math.max(y, y + ay * r));
      const n = (x1 - x0 + 1) * (y1 - y0 + 1), s = box(S, x0, y0, x1, y1), q = box(Q, x0, y0, x1, y1), m = s / n, v = q / n - m * m;
      if (v < best) { best = v; mean = m; }
    }
    out[y * w + x] = mean;
  }
  return out;
}
function traceArt(photo, r, o = {}) {
  let { subject = 'all' } = o;
  const { crop = [0, 0, 1, 1], k = 3, kr = 5, passes = 2, edge = 0.09, minArea = 260, lw = 3, flip = false, cuts = null, subjT = 0.16, gamma = 1 } = o;
  // the photo into the rect (cover), then worked at half size
  const big = canvas(); clip(big.g, r, () => { if (flip) { big.g.save(); big.g.translate(r.x * 2 + r.w, 0); big.g.scale(-1, 1); } cover(big.g, photo, r, { crop }); if (flip) big.g.restore(); });
  const w = Math.round(W / 2), h = Math.round(H / 2), sm = document.createElement('canvas'); sm.width = w; sm.height = h;
  const sg = sm.getContext('2d'); sg.drawImage(big, 0, 0, w, h); const id = sg.getImageData(0, 0, w, h), d = id.data;
  const lum = new Float32Array(w * h), inR = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) { lum[p] = Math.pow((0.2126 * d[p * 4] + 0.7152 * d[p * 4 + 1] + 0.0722 * d[p * 4 + 2]) / 255, gamma); inR[p] = d[p * 4 + 3] > 128 ? 1 : 0; }
  // the subject: distance in colour from the photo's border colour
  let subj = new Uint8Array(w * h).fill(1);
  if (Array.isArray(subject)) { const pts = curve(subject.map(([fx, fy]) => [r.x + fx * r.w, r.y + fy * r.h]), 4); subject = poly(pts); }
  if (subject === 'auto') {
    const xs = [], x0 = Math.floor(r.x / 2) + 2, x1 = Math.ceil((r.x + r.w) / 2) - 3, y0 = Math.floor(r.y / 2) + 2, y1 = Math.ceil((r.y + r.h) / 2) - 3;
    for (let x = x0; x <= x1; x += 3) for (const y of [y0, y1]) xs.push(y * w + x);
    for (let y = y0; y <= y1; y += 3) for (const x of [x0, x1]) xs.push(y * w + x);
    const med = [0, 1, 2].map((c) => xs.map((p) => d[p * 4 + c]).sort((a, b) => a - b)[xs.length >> 1]);
    const dm = canvas(); const did = dm.g.createImageData(dm.width, dm.height);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = y * w + x, dist = Math.hypot(d[p * 4] - med[0], d[p * 4 + 1] - med[1], d[p * 4 + 2] - med[2]) / 441;
      const a = inR[p] && dist > subjT ? 255 : 0, f = dm.width / w; for (let yy = 0; yy < f; yy++) for (let xx = 0; xx < f; xx++) { const q = ((y * f + yy) * dm.width + x * f + xx) * 4; did.data[q + 3] = a; did.data[q] = did.data[q + 1] = did.data[q + 2] = 255; } }
    dm.g.putImageData(did, 0, 0);
    const solidS = keepLargest(alphaThr(blurred(alphaThr(blurred(dm, 6), 0.5), 3), 0.5));
    subject = solidS;
  }
  let flat = lum; for (let i = 0; i < passes; i++) flat = kuwahara(flat, w, h, kr);
  // back to full size as a canvas, for thresholding and edges
  const fc = canvas(); { const t = document.createElement('canvas'); t.width = w; t.height = h; const tg = t.getContext('2d'), tid = tg.createImageData(w, h);
    for (let p = 0; p < w * h; p++) { const v = Math.round(flat[p] * 255); tid.data[p * 4] = tid.data[p * 4 + 1] = tid.data[p * 4 + 2] = v; tid.data[p * 4 + 3] = inR[p] ? 255 : 0; }
    tg.putImageData(tid, 0, 0); fc.g.imageSmoothingQuality = 'high'; fc.g.drawImage(t, 0, 0, W, H); }
  const sil = subject === 'all' ? alphaThr(fc, 0.5) : inter(alphaThr(fc, 0.5), subject);
  const F2 = inter(blurred(fc, o.soften ?? 3), sil);
  const qs = cuts || (k === 4 ? [0.18, 0.45, 0.78] : k === 2 ? [0.4] : [0.25, 0.7]);
  const ts = qs.map((q) => pct(F2, q));
  const clean = (m) => removeSmall(alphaThr(blurred(m, 2.2), 0.5), minArea);
  const ups = ts.map((t) => clean(inter(lumMask(F2, t, { soft: 0.004 }), sil)));   // pixels above each cut
  const levels = []; levels.push(cut(sil, ups[0]));
  for (let i = 0; i < ups.length; i++) levels.push(i + 1 < ups.length ? cut(ups[i], ups[i + 1]) : ups[i]);
  // contours: strong edges of the flattened picture, plus the silhouette when the subject is cut out
  const e = sobelMask(F2, edge);
  let lines = removeSmall(alphaThr(blurred(e, 0.8), 0.45), minArea * 0.25);
  if (subject !== 'all') lines = union(lines, outline(sil, lw));
  else lines = inter(lines, erode(sil, 1));
  return { levels, lines, silhouette: sil };
}
// Sobel edges of a canvas's luminance, as a mask of the pixels whose gradient is above t (0..1). Thinned to the
// ridge so lines stay at an even weight.
function sobelMask(c, t = 0.1) {
  const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data, L = new Float32Array(w * h), G = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) L[p] = d[p * 4 + 3] > 10 ? (0.2126 * d[p * 4] + 0.7152 * d[p * 4 + 1] + 0.0722 * d[p * 4 + 2]) / 255 : 1;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const p = y * w + x;
    const gx = -L[p - w - 1] - 2 * L[p - 1] - L[p + w - 1] + L[p - w + 1] + 2 * L[p + 1] + L[p + w + 1];
    const gy = -L[p - w - 1] - 2 * L[p - w] - L[p - w + 1] + L[p + w - 1] + 2 * L[p + w] + L[p + w + 1]; G[p] = Math.hypot(gx, gy) / 4; }
  const o = canvas(), oid = o.g.createImageData(w, h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const p = y * w + x, g = G[p]; if (g < t) continue;
    // non-maximum: keep only the ridge across the gradient
    if ((g >= G[p - 1] && g >= G[p + 1]) || (g >= G[p - w] && g >= G[p + w])) { oid.data[p * 4 + 3] = 255; oid.data[p * 4] = oid.data[p * 4 + 1] = oid.data[p * 4 + 2] = 255; } }
  o.g.putImageData(oid, 0, 0); return dilate(o, 0.9);
}
// Drop connected pieces smaller than minArea (design px²) from a mask; keepLargest keeps only the biggest piece.
function components(m) {
  const w = m.width, h = m.height, d = m.getContext('2d').getImageData(0, 0, w, h).data, lab = new Int32Array(w * h).fill(-1), sizes = [];
  for (let i = 0; i < w * h; i++) { if (lab[i] >= 0 || d[i * 4 + 3] < 128) continue; const id = sizes.length; let n = 0; const st = [i]; lab[i] = id;
    while (st.length) { const p = st.pop(); n++; const x = p % w; for (const q of [p - 1, p + 1, p - w, p + w]) { if (q < 0 || q >= w * h || lab[q] >= 0 || d[q * 4 + 3] < 128) continue; if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue; lab[q] = id; st.push(q); } }
    sizes.push(n); }
  return { lab, sizes, w, h };
}
function fromLabels({ lab, w, h }, keep) {
  const o = canvas(), id = o.g.createImageData(w, h);
  for (let p = 0; p < w * h; p++) if (lab[p] >= 0 && keep(lab[p])) { id.data[p * 4 + 3] = 255; id.data[p * 4] = id.data[p * 4 + 1] = id.data[p * 4 + 2] = 255; }
  o.g.putImageData(id, 0, 0); return o;
}
function removeSmall(m, minArea) { const c = components(m), lim = minArea * K * K; return fromLabels(c, (i) => c.sizes[i] >= lim); }
function keepLargest(m) { const c = components(m); let b = 0; c.sizes.forEach((s, i) => { if (s > c.sizes[b]) b = i; }); return fromLabels(c, (i) => i === b); }

// Drawing from a reference by hand (Ben, 26 Nov: "get photographic references ... and then illustrate from"): the
// contours are traced as clean curves from the photo (points read off a gridded view of the reference), and the photo
// only supplies the cel shadows inside them, so the drawing is clean and the light is real.
//   const P = refMap(scale, [px, py], [x, y]): maps reference points (px on a 800-wide view of the photo) to the
//     poster, with the reference point [px, py] landing on poster point [x, y].
//   closed(pts): a smooth closed shape through points; open curves: curve(pts).
//   photoShade(photo, view, P, mask, q): the darkest q of the photo inside mask, smoothed into cel shapes.
function refMap(s, [px, py], [x, y]) { return (pts) => pts.map(([a, b]) => [x + (a - px) * s, y + (b - py) * s]); }
function closed(pts, step = 5) { const n = pts.length; const ext = [pts[n - 1], ...pts, pts[0], pts[1]]; const c = curve(ext, step); const cut0 = Math.round(c.length / (n + 2)); return poly(c.slice(cut0, c.length - cut0)); }
function photoShade(photo, viewW, P, mask, q = 0.35, { blur = 5, minArea = 300 } = {}) {
  // the photo laid under the poster exactly where the reference points map
  const c = canvas(), s = viewW / photo.width, [o] = P([[0, 0]]), [o2] = P([[viewW, 0]]), k = (o2[0] - o[0]) / viewW;
  c.g.drawImage(photo, o[0], o[1], photo.width * s * k, photo.height * s * k);
  const L = inter(blurred(c, blur), mask);
  return removeSmall(alphaThr(blurred(inter(cut(mask, lumMask(L, pct(L, q), { soft: 0.01 })), mask), 2), 0.5), minArea);
}

// One traced shape from a reference: fill, cel shadow from the photo's light (photo optional), outline.
function refFill(I, P, pts, col, shadeCol = null, photo = null, q = 0.4, lw = 3, viewW = 800) {
  const m = closed(P(pts)); I.fill(m, col);
  if (photo && shadeCol) I.fill(photoShade(photo, viewW, P, m, q, { blur: 4, minArea: 120 }), shadeCol);
  I.ink(outline(m, lw)); return m;
}
// The usual furniture and subline, set over the illustration with a knock-out pad in `padCol` so they always read.
function illoSmall(g, I, C, font, furniture, subline, { padCol, x = M, y = M + ROW } = {}) {
  const t = { font, size: 16, weight: 500, lead: 0.9, color: C.text }, s = canvas();
  block(s.g, furniture, x, y, t);
  if (subline) { const sub = balance(subline, { ...t, minW: 220, maxW: COL * 2.6 }); block(s.g, sub.lines, W - M, y, { ...t, align: 'right' }); }
  if (padCol) I.fill(dilate(alphaThr(s, 0.3), 10), padCol);
  draw(g, tint(s, C.text));
}
// Print an illustrated sheet: fills gently, line work as worn black ink, then the headline and the paper.
function illoPrint(g, I, C, head, HS, bg, sd) {
  printAll(g, C, { seed: sd, wear: 0.12, spread: 0.5, bg });
  I.print(g, C.line || '#000000', sd);
  printHead(g, head, C.type, C.finish, { bg, seed: sd + 1, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', g.canvas);
  stock(g, C.stock, sd + 2);
}
// A sky or glow as stepped bands of tints (the references' gradients, kept flat so they print as plates):
// cols from top to bottom, bands bowing with `bow` (positive = sagging in the middle, like a horizon glow).
function bands(cols, y0, y1, { bow = 0, x0 = -40, x1 = W + 40 } = {}) {
  const n = cols.length, out = [];
  for (let i = 0; i < n; i++) { const a = y0 + (y1 - y0) * i / n, b = y0 + (y1 - y0) * (i + 1) / n;
    const edge = (y) => curve([[x0, y], [(x0 + x1) / 2, y + bow], [x1, y]], 10);
    out.push([poly([...edge(a), ...edge(b).reverse()]), cols[i]]); }
  return out;
}

// Illustrate with the headline in mind (Ben, 26 Nov 2026): where the headline sits, the drawing goes calm: one flat
// colour, no line work, no texture. headZone(R, pad) is the band the headline's lines occupy (plus pad), as a mask;
// calmZone(I, zone, masks, col) flattens the given shapes to one colour inside the zone and lifts the ink there.
function headZone(R, pad = 24, { edge = 'bumpy', sd = 3 } = {}) {
  // one full-width band from the headline's first ink to its last, its inner edge bumpy like a front mass of leaves or
  // cloud (edge 'straight' for architecture)
  const y0 = Math.min(...R.map((r) => r.y)) - pad, y1 = Math.max(...R.map((r) => r.y + r.h)) + pad, top = y0 < H / 2;
  const c = canvas(); c.g.fillStyle = '#fff';
  if (top) c.g.fillRect(-20, -20, W + 40, y1 + 20); else c.g.fillRect(-20, y0, W + 40, H - y0 + 20);
  if (edge === 'bumpy') { seed(sd); const yy = top ? y1 : y0; for (let x = -40; x < W + 60; x += 70 + rand() * 50) { const r = 40 + rand() * 46; c.g.beginPath(); c.g.arc(x, yy + (top ? -r * 0.35 : r * 0.35), r, 0, Math.PI * 2); c.g.fill(); } }
  return c;
}
function calmZone(I, zone, masks, col, lw = 2.6) {
  const all = masks && masks.length ? union(...masks) : null;
  if (all) I.fill(inter(all, zone), col);
  I.calm(zone);
  if (all) I.ink(inter(outline(zone, lw), all));   // the calm mass's own edge, where it sits in front of the detail
}
// A scamp (from the illustration machine, a 3D render or a sketch) redrawn in the day's palette: its dark lines become
// our worn ink, its colours are posterised by lightness into the ramp (dark → light). r: where it goes (cover).
function scampArt(im, r, ramp, { lineT = 0.2, cuts = null, crop = [0, 0, 1, 1], minArea = 120 } = {}) {
  const c = canvas(); clip(c.g, r, () => cover(c.g, im, r, { crop }));
  const area = rectMask(r);
  const lines = removeSmall(inter(lumMask(c, lineT, { invert: true, soft: 0.02 }), area), 20);
  const body = cut(area, lines);
  const L = inter(blurred(c, 1.5), body), qs = cuts || ramp.slice(1).map((_, i) => (i + 1) / ramp.length);
  const ts = qs.map((q) => pct(L, q)), fills = [];
  let prev = body;
  for (let i = 0; i < ramp.length; i++) { const up = i < ts.length ? removeSmall(alphaThr(blurred(inter(lumMask(L, ts[i], { soft: 0.004 }), body), 1.5), 0.5), minArea) : null; fills.push([up ? cut(prev, up) : prev, ramp[i]]); if (up) prev = up; }
  return { fills: fills.map(([m, col]) => [union(m, inter(dilate(m, 2), lines)), col]), lines };
}
// A 3D scamp (lab/3d/scene.py: <name>-lines.png, -ids.png, -light.png, -ids.json) drawn in the illustration style:
// every part filled with its palette colour, a cel shadow where the light pass is dark, Blender's lines as our ink.
//   const S = await sceneArt('/experiments/claude-posters/lab/3d/out/shaft', { wallN: [col, shadeCol], ... });
//   S.fills: [[mask, colour]...], S.lines: mask, S.part(name): that part's mask
async function sceneArt(prefix, cols, { shadowT = 0.35, lineT = 0.5 } = {}) {
  const [li, id, lt, ids] = await Promise.all([img(prefix + '-lines.png'), img(prefix + '-ids.png'), img(prefix + '-light.png'), fetch(prefix + '-ids.json').then((r) => r.json())]);
  const full = (im) => { const c = canvas(); c.g.drawImage(im, 0, 0, W, H); return c; };
  const L = full(li), I2 = full(id), G = full(lt);
  const d = I2.g.getImageData(0, 0, I2.width, I2.height).data, n = d.length / 4;
  const part = (name) => { const [r, g, b] = ids[name], c = canvas(), o = c.g.createImageData(c.width, c.height);
    for (let p = 0; p < n; p++) if (Math.abs(d[p * 4] - r) + Math.abs(d[p * 4 + 1] - g) + Math.abs(d[p * 4 + 2] - b) < 24) { o.data[p * 4 + 3] = 255; o.data[p * 4] = o.data[p * 4 + 1] = o.data[p * 4 + 2] = 255; }
    c.g.putImageData(o, 0, 0); return removeSmall(alphaThr(blurred(c, 0.6), 0.5), 60); };
  const shadow = removeSmall(alphaThr(blurred(lumMask(G, shadowT, { invert: true, soft: 0.01 }), 1.2), 0.5), 400);
  const fills = [];
  for (const [name, [col, shade]] of Object.entries(cols)) { if (!ids[name]) continue; const m = part(name); fills.push([m, col]); if (shade) fills.push([inter(m, shadow), shade]); }
  return { fills, lines: lumMask(L, lineT, { invert: true, soft: 0.05 }), part, shadow };
}
// A spot illustration: a crop of a scamp (or any picture) snapped to the day's colours and framed in a rect, a circle
// or any mask: for the fourth, combined concept (Ben, 26 Nov: "spot illustrations included within frames amongst
// other threshold images, masked images or pixelated images"). Returns a canvas (draw it, then card/tape over it).
function spotIn(im, r, cols, { crop = [0, 0, 1, 1], shape = 'rect' } = {}) {
  const c = canvas(); clip(c.g, { ...r, round: shape === 'circle' }, () => cover(c.g, im, r, { crop }));
  const id = c.g.getImageData(0, 0, c.width, c.height), d = id.data, hx = cols.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  for (let p = 0; p < d.length; p += 4) { if (!d[p + 3]) continue; let bi = 0, bd = 1e9; for (let i = 0; i < hx.length; i++) { const q = hx[i], v = (d[p] - q[0]) ** 2 + (d[p + 1] - q[1]) ** 2 + (d[p + 2] - q[2]) ** 2; if (v < bd) { bd = v; bi = i; } } [d[p], d[p + 1], d[p + 2]] = hx[bi]; }
  c.g.putImageData(id, 0, 0); return c;
}
