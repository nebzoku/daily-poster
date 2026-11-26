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
