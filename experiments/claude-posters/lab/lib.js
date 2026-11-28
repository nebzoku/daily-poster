// Daily Poster toolkit. Design in 1080×1528 units; every canvas is K× for print-quality output.
// K: pixels per design unit. 2 for posters (2160 × 3056); ?k=4 renders the same poster at twice the detail (the ink
// and paper scale with it, so the print looks the same, just sharper) for close-up crops.
const W = 1080, H = 1528, K = +(new URLSearchParams(location.search).get('k') || 2), M = 16;
const COL = 131, ROW = 187; // the brief's 8×8 grid
let _seed = 1;
const rand = () => { _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0; let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const seed = (s) => { _seed = s; };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

function canvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * K)); c.height = Math.max(1, Math.round(h * K));
  const g = c.getContext('2d'); g.setTransform(K, 0, 0, K, 0, 0); c.g = g; return c;
}
async function fonts(list) {
  for (const f of list) { await document.fonts.load(f); if (!document.fonts.check(f)) throw new Error('font failed: ' + f); }
}
const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src; });
const media = (p) => img('/site/' + p);   // paths inside the repo's site/ folder

// ---------- type ----------
// Set a line letter by letter. track and kern are in thousandths of an em (kern[i] moves letter i and everything after it).
function setLine(text, o) {
  const { font, size, weight = 400, style = 'normal', track = 0, kern = {}, sx = 1, sy = 1, skew = 0 } = o;
  const f = `${style} ${weight} ${size}px "${font}"`;
  const m = canvas(10, 10).g; m.font = f; m.fontKerning = 'normal';
  const pos = []; let acc = 0;
  for (let i = 0; i <= text.length; i++) {
    acc += (kern[i] || 0) * size / 1000;
    pos.push(m.measureText(text.slice(0, i)).width + i * track * size / 1000 + acc);
  }
  const adv = pos[text.length];
  const pad = size * 0.6;
  const cw = Math.abs(adv * sx) + pad * 2 + Math.abs(skew) * size * sy, ch = size * 1.6 * sy + pad * 2;
  const c = canvas(cw, ch), g = c.g;
  const base = pad + size * 1.15 * sy;
  g.font = f; g.fillStyle = '#fff'; g.fontKerning = 'normal';
  g.save(); g.translate(pad, base); g.transform(sx, 0, -skew * sx, sy, 0, 0);
  for (let i = 0; i < text.length; i++) g.fillText(text[i], pos[i], 0);
  g.restore();
  const box = inkBox(c);
  return { c, box, base, text, o };
}
// Ink bounds of a canvas in design units (the actual letter shapes, not font metrics).
function inkBox(c, thr = 60) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > thr) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0 / K, y: y0 / K, w: (x1 - x0 + 1) / K, h: (y1 - y0 + 1) / K };
}
// Size a line so its ink is exactly w wide (keeps proportions).
function fitW(text, o, w) {
  let t = setLine(text, o);
  for (let k = 0; k < 2; k++) { o = { ...o, size: o.size * w / t.box.w }; t = setLine(text, o); }
  return t;
}
// Stretch a line so its ink fills exactly w × h (vector stretch, not a raster stretch).
function fitWH(text, o, w, h) {
  let t = setLine(text, { ...o, sx: 1, sy: 1 });
  let size = o.size * h / t.box.h; let sx = 1, sy = 1;
  for (let k = 0; k < 3; k++) {
    t = setLine(text, { ...o, size, sx, sy });
    sx *= w / t.box.w; sy *= h / t.box.h;
  }
  return setLine(text, { ...o, size, sx, sy });
}
// Draw a set line (white) onto a mask so its ink box lands on an anchor: any of left/right/top/bottom/cx/cy.
function place(dst, t, a) {
  const b = t.box; let x, y;
  if (a.left != null) x = a.left - b.x; else if (a.right != null) x = a.right - b.x - b.w; else x = (a.cx ?? W / 2) - b.x - b.w / 2;
  if (a.top != null) y = a.top - b.y; else if (a.bottom != null) y = a.bottom - b.y - b.h; else y = (a.cy ?? H / 2) - b.y - b.h / 2;
  const g = dst.g; g.save();
  if (a.rot) { const px = x + b.x + b.w / 2, py = y + b.y + b.h / 2; g.translate(px, py); g.rotate(a.rot); g.translate(-px, -py); }
  g.globalCompositeOperation = a.op || 'source-over';
  g.drawImage(t.c, x, y, t.c.width / K, t.c.height / K); g.restore();
  return { x: x + b.x, y: y + b.y, w: b.w, h: b.h };
}
// Paragraph in the text face; returns height. align: left/right/center/justify.
function para(g, text, x, y, w, o) {
  const { font, size, weight = 400, lead = 1.25, color = '#000', align = 'left', track = 0 } = o;
  g.save(); g.font = `${weight} ${size}px "${font}"`; g.fillStyle = color; g.textBaseline = 'alphabetic';
  g.letterSpacing = `${track * size / 1000}px`;
  const words = text.split(/\s+/); const lines = []; let line = [];
  for (const wd of words) { const tryL = [...line, wd].join(' '); if (g.measureText(tryL).width > w && line.length) { lines.push(line); line = [wd]; } else line.push(wd); }
  if (line.length) lines.push(line);
  lines.forEach((ln, i) => {
    const yy = y + size + i * size * lead; const s = ln.join(' '); const lw = g.measureText(s).width;
    if (align === 'justify' && i < lines.length - 1 && ln.length > 1) {
      const ws = ln.map((q) => g.measureText(q).width); const gap = (w - ws.reduce((a, b) => a + b, 0)) / (ln.length - 1);
      let xx = x; ln.forEach((q, j) => { g.fillText(q, xx, yy); xx += ws[j] + gap; });
    } else g.fillText(s, align === 'right' ? x + w - lw : align === 'center' ? x + (w - lw) / 2 : x, yy);
  });
  g.restore();
  return size + (lines.length - 1) * size * lead;
}
// Small type for page furniture, anchored by its cap height to the margin.
function small(g, text, x, y, o) {
  const { font, size = 12, weight = 500, color = '#000', align = 'left', track = -20, caps = false } = o;   // furniture: -2% (see TEXT)
  g.save(); g.font = `${weight} ${size}px "${font}"`; g.fillStyle = color; g.letterSpacing = `${track * size / 1000}px`;
  const s = caps ? text.toUpperCase() : text; const mt = g.measureText(s);
  const asc = mt.actualBoundingBoxAscent, desc = mt.actualBoundingBoxDescent;
  const lx = align === 'right' ? x - mt.width + mt.actualBoundingBoxLeft * 0 : align === 'center' ? x - mt.width / 2 : x;
  const by = o.bottom ? y - desc : y + asc; g.fillText(s, lx, by); g.restore();
}
// Corner furniture in four corners (tl, tr, bl, br strings).
function furniture(g, f, o) {
  const s = o.size || 12;
  if (f.tl) small(g, f.tl, M, M, o); if (f.tr) small(g, f.tr, W - M, M, { ...o, align: 'right' });
  if (f.bl) small(g, f.bl, M, H - M, { ...o, bottom: true }); if (f.br) small(g, f.br, W - M, H - M, { ...o, align: 'right', bottom: true });
}

// ---------- masks, colour and images ----------
function tint(mask, colour) {
  const c = canvas(mask.width / K, mask.height / K), g = c.g;
  g.drawImage(mask, 0, 0, mask.width / K, mask.height / K); g.globalCompositeOperation = 'source-in';
  if (typeof colour === 'string') { g.fillStyle = colour; g.fillRect(0, 0, W * 4, H * 4); }
  else g.drawImage(colour, 0, 0, colour.width / K, colour.height / K);
  return c;
}
const draw = (g, c, op = 'source-over', alpha = 1) => { g.save(); g.globalCompositeOperation = op; g.globalAlpha = alpha; g.drawImage(c, 0, 0, c.width / K, c.height / K); g.restore(); };
function cut(mask, by) { const c = canvas(); draw(c.g, mask); draw(c.g, by, 'destination-out'); return c; }
function inter(mask, by) { const c = canvas(); draw(c.g, mask); draw(c.g, by, 'destination-in'); return c; }
function union(...ms) { const c = canvas(); ms.forEach((m) => draw(c.g, m)); return c; }

// Draw an image to cover a rect; fx, fy = focal point 0..1, zoom ≥ 1.
function cover(g, im, r = { x: 0, y: 0, w: W, h: H }, o = {}) {
  const { fx = 0.5, fy = 0.5, zoom = 1, crop } = o;
  let sx = 0, sy = 0, sw = im.naturalWidth || im.width, sh = im.naturalHeight || im.height;
  if (crop) { sx = crop[0] * sw; sy = crop[1] * sh; sw = crop[2] * sw; sh = crop[3] * sh; }
  const s = Math.max(r.w / sw, r.h / sh) * zoom, dw = sw * s, dh = sh * s;
  g.drawImage(im, sx, sy, sw, sh, r.x + (r.w - dw) * fx, r.y + (r.h - dh) * fy, dw, dh);
}
// Draw an image (or object PNG) into a rect by contain, with rotation.
function fit(g, im, r, o = {}) {
  const s = Math.min(r.w / im.width, r.h / im.height) * (o.zoom || 1), dw = im.width * s, dh = im.height * s;
  g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1);
  g.drawImage(im, -dw / 2, -dh / 2, dw, dh); g.restore();
}
// Crop a transparent PNG to its alpha bounds.
function trim(im) {
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 10) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, -x0, -y0); return o;
}
// Luminance → mask. Pixels brighter than t become ink (invert flips it). soft widens the edge; contrast first.
// Fully transparent source pixels never become ink.
function lumMask(src, t = 0.5, o = {}) {
  const { invert = false, soft = 0.02, blur = 0, gamma = 1 } = o;
  const c = canvas(src.width / K, src.height / K), g = c.g;
  if (blur) g.filter = `blur(${blur * K / 2}px)`; g.drawImage(src, 0, 0, src.width / K, src.height / K); g.filter = 'none';
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let l = Math.pow((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255, gamma); if (invert) l = 1 - l;
    const a = smooth(t - soft, t + soft, l) * (d[i + 3] / 255);
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255;
  }
  g.putImageData(id, 0, 0); return c;
}
// Posterise an image into stacked threshold layers: [[t, colour], ...] lightest last.
function posterise(dst, src, steps, o = {}) { for (const [t, col] of steps) draw(dst.g, tint(lumMask(src, t, o), col)); }

// ---------- noise, ink and grain ----------
function noise(scale = 4, w = W, h = H) { // smooth value noise, 0..1, as Float32Array at full res
  const sw = Math.max(2, Math.ceil(w * K / (scale * K))), shh = Math.max(2, Math.ceil(h * K / (scale * K)));
  const s = document.createElement('canvas'); s.width = sw; s.height = shh; const sg = s.getContext('2d');
  const id = sg.createImageData(sw, shh); for (let i = 0; i < id.data.length; i += 4) { const v = rand() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } sg.putImageData(id, 0, 0);
  const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data; const out = new Float32Array(c.width * c.height);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4] / 255; return out;
}
// Hand-printed ink on a mask: roughened edges, mottled coverage, pinholes and vertical squeegee streaks.
function ink(mask, o = {}) {
  const { edge = 2, rough = 0.6, mottle = 0.2, holes = 0.02, streak = 0.12, spread = 0.5, mscale = 5 } = o;
  const c = canvas(mask.width / K, mask.height / K), g = c.g; const w = c.width, h = c.height;
  g.filter = `blur(${edge}px)`; g.drawImage(mask, 0, 0, w / K, h / K); g.filter = 'none';
  const id = g.getImageData(0, 0, w, h), d = id.data;
  const n1 = noise(3, w / K, h / K), n2 = noise(mscale, w / K, h / K), n3 = noise(0.7, w / K, h / K);
  const col = new Float32Array(w); let v = rand(); for (let x = 0; x < w; x++) { v += (rand() - 0.5) * 0.18; v = clamp(v, 0, 1); col[x] = v; }
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const x = p % w; const a0 = d[i + 3] / 255; if (a0 === 0) { d[i + 3] = 0; continue; }
    let a = a0 + (n3[p] - 0.5) * rough * 0.9 + (n1[p] - 0.5) * rough * 0.7;
    a = smooth(spread - 0.05, spread + 0.05, a);
    a *= 1 - mottle * smooth(0.5, 0.85, n2[p]) - 0.12 * mottle * rand();
    a *= 1 - streak * col[x] * (0.6 + 0.4 * n1[p]);
    if (n3[p] < holes * 0.6) a *= 0.1;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = clamp(a) * 255;
  }
  g.putImageData(id, 0, 0); return c;
}
// Film/print grain over the whole poster.
function grain(g, amount = 0.12, scale = 0.6, op = 'overlay') {
  const n = noise(scale); const c = canvas(), id = c.g.createImageData(c.width, c.height), d = id.data;
  for (let p = 0; p < n.length; p++) { const v = clamp(n[p] * 0.6 + rand() * 0.4) * 255; d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = v; d[p * 4 + 3] = 255; }
  c.g.putImageData(id, 0, 0); draw(g, c, op, amount);
}
// Paper: a flat colour plus faint fibres and tonal drift.
function paper(g, colour, o = {}) {
  const { drift = 0.03, fibre = 0.04 } = o;
  g.fillStyle = colour; g.fillRect(0, 0, W, H);
  const n = noise(60), f = noise(1.2); const c = canvas(), id = c.g.createImageData(c.width, c.height), d = id.data;
  for (let p = 0; p < n.length; p++) { const v = (0.5 + (n[p] - 0.5) * drift * 6 + (f[p] - 0.5) * fibre * 6) * 255; d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = clamp(v / 255) * 255; d[p * 4 + 3] = 255; }
  c.g.putImageData(id, 0, 0); draw(g, c, 'soft-light', 0.9);
}
// Misregistration: draw a tinted layer offset by dx, dy.
const offset = (g, c, dx, dy, op = 'source-over', alpha = 1) => { g.save(); g.globalCompositeOperation = op; g.globalAlpha = alpha; g.drawImage(c, dx, dy, c.width / K, c.height / K); g.restore(); };
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
// Fill the holes in a mask: anything not reachable from the border through empty pixels becomes ink.
function solid(mask, thr = 128) {
  const c = canvas(mask.width / K, mask.height / K); draw(c.g, mask);
  const w = c.width, h = c.height, id = c.g.getImageData(0, 0, w, h), d = id.data;
  const seen = new Uint8Array(w * h), st = [];
  const push = (p) => { if (!seen[p] && d[p * 4 + 3] < thr) { seen[p] = 1; st.push(p); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (st.length) { const p = st.pop(), x = p % w; if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (p >= w) push(p - w); if (p < w * (h - 1)) push(p + w); }
  for (let p = 0; p < w * h; p++) if (!seen[p]) { d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = 255; d[p * 4 + 3] = 255; }
  c.g.putImageData(id, 0, 0); return c;
}
// Local-contrast threshold: ink where a pixel is darker (or lighter, invert) than its surroundings by delta.
// Pulls faint pencil and engraving lines off uneven paper, where a global threshold fails.
function lineMask(src, delta = 0.06, o = {}) {
  const { radius = 12, invert = false, soft = 0.02 } = o;
  const w = src.width, h = src.height;
  const a = document.createElement('canvas'); a.width = w; a.height = h; const ag = a.getContext('2d'); ag.drawImage(src, 0, 0);
  const b = document.createElement('canvas'); b.width = w; b.height = h; const bg = b.getContext('2d'); bg.filter = `blur(${radius * K}px)`; bg.drawImage(src, 0, 0);
  const A = ag.getImageData(0, 0, w, h), B = bg.getImageData(0, 0, w, h).data, d = A.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255, m = (0.2126 * B[i] + 0.7152 * B[i + 1] + 0.0722 * B[i + 2]) / 255;
    const v = invert ? l - m : m - l; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = smooth(delta - soft, delta + soft, v) * 255 * (d[i + 3] / 255);
  }
  const c = canvas(w / K, h / K); c.g.putImageData(A, 0, 0); return c;
}
// One headline size: find the size at which the widest piece's ink is maxW, then set every piece at it.
// pieces: [{ text, kern }]. Never scales glyphs.
function sameSize(pieces, o, maxW) {
  let size = o.size || 200;
  for (let k = 0; k < 3; k++) {
    const ws = pieces.map((p) => setLine(p.text, { ...o, size, kern: p.kern || {} }).box.w);
    size *= maxW / Math.max(...ws);
  }
  return { size, lines: pieces.map((p) => setLine(p.text, { ...o, size, kern: p.kern || {} })) };
}
// Print a mask through the Ink Machine and tint it.
const press = (mask, colour, preset = 'riso', o = {}) => tint(IM.print(mask, preset, o), colour);
// Luminance at a percentile (0..1) of a canvas, ignoring transparent pixels: use it to threshold at a chosen coverage.
function pct(src, p) {
  const d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data, h = new Uint32Array(256); let n = 0;
  for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 128) { h[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])]++; n++; }
  let acc = 0; for (let v = 0; v < 256; v++) { acc += h[v]; if (acc >= p * n) return v / 255; } return 1;
}
// Motion blur: smear a mask sideways by drawing it repeatedly with falling alpha.
function smear(mask, dist = 60, steps = 24, dir = -1) {
  const c = canvas(); for (let i = steps; i >= 0; i--) { c.g.globalAlpha = Math.pow(1 - i / steps, 1.6) * 0.5; c.g.drawImage(mask, dir * dist * i / steps, 0, W, H); }
  c.g.globalAlpha = 1; return c;
}
// Edge furniture: four edges, the side ones rotated to read up/down.
function edges(g, f, o) {
  const s = o.size || 10;
  if (f.top) small(g, f.top, W / 2, M, { ...o, align: 'center' });
  if (f.bottom) small(g, f.bottom, W / 2, H - M, { ...o, align: 'center', bottom: true });
  if (f.left) { g.save(); g.translate(M, H / 2); g.rotate(-Math.PI / 2); small(g, f.left, 0, 0, { ...o, align: 'center' }); g.restore(); }
  if (f.right) { g.save(); g.translate(W - M, H / 2); g.rotate(Math.PI / 2); small(g, f.right, 0, 0, { ...o, align: 'center' }); g.restore(); }
}

// ---------- optical setting (round 4) ----------
// Kern every pair by the actual letter shapes: the gap between neighbours is measured row by row and set so the
// closest part of the pair sits at `gap` (thousandths of an em), never closer than `minGap`. Rounds and diagonals
// are judged on their nearest rows, so pairs like OU, RO and AV close up without touching.
const _glyphCache = {};
function glyphProfile(ch, f, size) {
  const key = f + '|' + ch; if (_glyphCache[key]) return _glyphCache[key];
  const pad = Math.ceil(size * 0.6), w = Math.ceil(size * 2.2), h = Math.ceil(size * 1.9);
  const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const g = c.getContext('2d'); g.scale(K, K);
  g.font = f; g.fillStyle = '#fff'; g.fillText(ch, pad, pad + size * 1.1);
  const d = g.getImageData(0, 0, c.width, c.height).data, rows = c.height, L = new Float32Array(rows).fill(NaN), R = new Float32Array(rows).fill(NaN);
  let x0 = 1e9, x1 = -1e9;
  for (let y = 0; y < rows; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 100) {
    const X = x / K - pad; if (isNaN(L[y])) L[y] = X; R[y] = X; if (X < x0) x0 = X; if (X > x1) x1 = X;
  }
  return (_glyphCache[key] = { L, R, x0, x1, adv: g.measureText(ch).width, rows });
}
function setOptical(text, o) {
  const { font, size, weight = 400, style = 'normal', gap = 40, minGap = 18, word = 0.32, kern = {} } = o;
  const f = `${style} ${weight} ${size}px "${font}"`;
  const win = Math.max(1, Math.round(size * 0.08 * K));               // rows either side a shape can reach across
  const xs = []; let prev = null, px = 0, pendingSpace = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ') { pendingSpace += size * word; continue; }
    const p = glyphProfile(ch, f, size);
    if (!prev) { xs.push(-p.x0); prev = { p, x: -p.x0 }; continue; }
    // c(y): distance from prev's right edge to this glyph's left edge if this glyph sat at origin 0
    const cs = [];
    for (let y = 0; y < p.rows; y++) {
      if (isNaN(p.L[y])) continue;
      let r = -1e9; for (let k = Math.max(0, y - win); k <= Math.min(p.rows - 1, y + win); k++) if (!isNaN(prev.p.R[k])) r = Math.max(r, prev.p.R[k]);
      if (r > -1e9) cs.push(p.L[y] - (prev.x + r));
    }
    let x;
    if (!cs.length) x = prev.x + prev.p.x1 - p.x0 + size * gap / 1000;
    else {
      cs.sort((a, b) => a - b);
      const near = cs.slice(0, Math.max(1, Math.ceil(cs.length * 0.2)));
      const metric = near.reduce((a, b) => a + b, 0) / near.length;
      x = size * gap / 1000 - metric;
      x = Math.max(x, size * minGap / 1000 - cs[0]);                     // never touch
    }
    x += pendingSpace + (kern[i] || 0) * size / 1000; pendingSpace = 0;
    xs.push(x); prev = { p, x };
  }
  const chars = text.replace(/ /g, '');
  const last = glyphProfile(chars[chars.length - 1], f, size);
  const inkW = xs[xs.length - 1] + last.x1;
  const pad = size * 0.6, c = canvas(inkW + pad * 2, size * 1.6 + pad * 2), g = c.g;
  const base = pad + size * 1.15; g.font = f; g.fillStyle = '#fff';
  [...chars].forEach((ch, i) => g.fillText(ch, pad + xs[i], base));
  return { c, box: inkBox(c), base, text, o };
}
// One size for every line, set optically; size found so the widest line is maxW.
function sameOptical(texts, o, maxW) {
  let size = o.size || 200;
  for (let k = 0; k < 3; k++) { const ws = texts.map((t) => setOptical(t, { ...o, size }).box.w); size *= maxW / Math.max(...ws); }
  return { size, lines: texts.map((t) => setOptical(t, { ...o, size })) };
}
// Pin lines to the margins: each line to its side ('L' or 'R'), first line's ink on the top margin, last line's
// ink on the bottom margin, the rest spread evenly between (or at a fixed leading if `lead` is given).
function pin(dst, lines, sides, o = {}) {
  const top = o.top ?? M, bottom = o.bottom ?? H - M;
  const hs = lines.map((t) => t.box.h), total = hs.reduce((a, b) => a + b, 0);
  const gap = o.lead != null ? o.lead : (bottom - top - total) / Math.max(1, lines.length - 1);
  let y = o.lead != null && o.anchor === 'bottom' ? bottom - total - gap * (lines.length - 1) : top;
  return lines.map((t, i) => { const r = place(dst, t, { [sides[i] === 'R' ? 'right' : 'left']: sides[i] === 'R' ? W - M : M, top: y }); y += hs[i] + gap; return r; });
}
// Find the emptiest (or fullest) w×h pocket in a mask, avoiding `avoid`; returns {x, y}.
function pocket(mask, w, h, o = {}) {
  const { want = 'full', avoid = null, step = 16, region = { x: M, y: M, w: W - 2 * M, h: H - 2 * M } } = o;
  const sw = Math.ceil(W / 4), sh = Math.ceil(H / 4);
  const sample = (c) => { const s = document.createElement('canvas'); s.width = sw; s.height = sh; s.getContext('2d').drawImage(c, 0, 0, sw, sh); const d = s.getContext('2d').getImageData(0, 0, sw, sh).data; const a = new Float32Array(sw * sh); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255; return a; };
  const m = sample(mask), av = avoid ? sample(avoid) : null;
  let best = null, bs = -1e9;
  for (let y = region.y; y + h <= region.y + region.h; y += step) for (let x = region.x; x + w <= region.x + region.w; x += step) {
    let s = 0, bad = 0, n = 0;
    for (let yy = Math.floor(y / 4); yy < Math.floor((y + h) / 4); yy++) for (let xx = Math.floor(x / 4); xx < Math.floor((x + w) / 4); xx++) { const i = yy * sw + xx; s += m[i]; if (av) bad += av[i]; n++; }
    const cov = s / n, score = (want === 'full' ? cov : 1 - cov) - (av ? bad / n * 4 : 0);
    if (score > bs) { bs = score; best = { x, y, score }; }
  }
  return best;
}

// ---------- round 4 poster builder ----------
// Vivid wash → thresholded image as tonal texture in mid tones → headline pinned to the margins, optically kerned
// → subline and furniture set into solid pockets of the texture.
async function build(cfg) {
  const { P, seedN = 1, img, crop, zoomRect, layers, text, sides, type, typeColour, accents = {}, sub, furn, textFont, notes = [] } = cfg;
  seed(seedN);
  await fonts([`${sub?.weight || 500} 13px "${textFont}"`, `700 10px "${textFont}"`]);
  const out = canvas(), g = out.g;
  g.fillStyle = cfg.bg || P.vivid; g.fillRect(0, 0, W, H);

  // headline
  const { lines } = sameOptical(text, type, W - 2 * M);
  const { size: hsize } = sameOptical(text, type, W - 2 * M);
  const head = canvas(), R = cfg.interlock != null ? pinInterlock(head, lines, sides, cfg.split, cfg.interlock) : cfg.pitch ? pinBaseline(head, lines, sides, cfg.split, hsize * cfg.pitch) : cfg.split != null ? pinBlocks(head, lines, sides, cfg.split, cfg.lead ?? 0.12) : pin(head, lines, sides, cfg.pin || {});
  // the middle: the band between the top and bottom blocks, feathered, where the image marks are brightest
  let middle = null;
  if (cfg.split != null && cfg.split > 0) {
    const y0 = R[cfg.split - 1].y + R[cfg.split - 1].h, y1 = R[cfg.split].y;
    middle = canvas(); const gr = middle.g.createLinearGradient(0, y0 - 220, 0, y1 + 220);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, '#fff'); gr.addColorStop(0.7, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    middle.g.fillStyle = gr; middle.g.fillRect(0, 0, W, H);
  }
  const halo = canvas(); halo.g.filter = 'blur(10px)'; draw(halo.g, head); draw(halo.g, head);
  const room = lumMask(halo, 0.02, { soft: 0.01 });

  // texture masks
  const src = canvas(); cover(src.g, await media(img), zoomRect || { x: 0, y: 0, w: W, h: H }, { crop });
  const masks = layers.map((L) => {
    let m;
    if (L.alpha) m = lumMask(src, 0, { soft: 0.001, blur: L.blur ?? 1 });   // the object's whole silhouette
    else { const t = L.dark ? 1 - pct(src, L.cov) : pct(src, 1 - L.cov); m = lumMask(src, t, { invert: !!L.dark, blur: L.blur ?? 1 }); }
    if (L.middle && middle) m = inter(m, lumMask(middle, 0.5, { soft: 0.45 }));
    return L.under ? cut(m, room) : m;
  });

  // pockets: find where the first layer is already solid, then make it fully solid there so the text sits on tone
  const used = canvas(); draw(used.g, room);
  const blocks = canvas(), jobs = [];
  const anyInk = union(...masks);
  const find = (w, h, want = 'full') => {
    const p = want === 'empty' ? pocket(anyInk, w, h, { want: 'empty', avoid: used }) : pocket(masks[0], w, h, { avoid: used });
    used.g.fillStyle = '#fff'; used.g.fillRect(p.x - 14, p.y - 14, w + 28, h + 28);
    if (want !== 'empty') { blocks.g.fillStyle = '#fff'; blocks.g.fillRect(p.x, p.y, w, h); }
    return p;
  };
  if (sub) { const p = find(sub.w, sub.h, sub.want); jobs.push(() => para(g, sub.text, p.x + 10, p.y + 8, sub.w - 20, { font: textFont, size: sub.size || 13, weight: sub.weight || 500, lead: 1.3, color: sub.colour })); }
  for (const f of furn || []) { const p = find(f.w || 150, 28, f.want); jobs.push(() => small(g, f.text, p.x + 10, p.y + 10, { font: textFont, size: 10, weight: 700, color: f.colour, caps: true, track: 40 })); }
  masks[0] = union(masks[0], blocks);
  for (let i = 1; i < masks.length; i++) masks[i] = cut(masks[i], blocks);
  masks.forEach((m, i) => {
    const L = layers[i];
    if (L.glow) for (const [r, a] of [[60, 0.45], [20, 0.6]]) { const c = canvas(); c.g.filter = `blur(${r}px)`; draw(c.g, m); draw(g, tint(c, L.col), 'screen', a * L.glow); }
    draw(g, tint(IM.print(m, L.ink || 'riso', { wear: L.wear ?? 0.45, spread: 0.5, seed: seedN + i }), L.col));
  });

  // headline ink, with optional per-line colours
  const inked = IM.print(head, type.ink || 'letterpress', { wear: type.wear ?? 0.4, spread: 0.5, seed: seedN + 50 });
  draw(g, tint(inked, typeColour));
  for (const [i, col] of Object.entries(accents)) {
    const one = canvas(); one.g.fillStyle = '#fff'; one.g.fillRect(R[i].x - 4, R[i].y - 4, R[i].w + 8, R[i].h + 8);
    draw(g, tint(inter(inked, one), col));
  }
  jobs.forEach((j) => j());
  for (const nt of notes) nt(g, R);

  draw(g, IM.paper(0.5, seedN), 'source-over', 0.85);
  grain(g, 0.07, 0.5);
  return out;
}

// ---------- round 5: Ben's setting ----------
// Headline set as one or two tight blocks: the first `split` lines pinned to the top margin, the rest to the
// bottom margin; tight leading (gap = lead × line height). sides: 'L', 'R' or 'C' (C centres; with one size the
// widest line still touches both margins).
function pinBlocks(dst, lines, sides, split, lead = 0.12) {
  // Set by baselines and cap height, not ink boxes: a Q's tail or a descender must not push a line off the margin.
  // Top block: the first line's cap height on the top margin. Bottom block: the last line's BASELINE on the bottom
  // margin (tails and descenders hang below). Pitch = cap height × (1 + lead).
  const o = lines[0].o, H1 = setOptical('H', { ...o }), capH = H1.base - H1.box.y, pitch = capH * (1 + lead);
  const R = [], base = (t) => t.base - t.box.y;
  const put = (t, i, b) => { const s = sides[i], a = s === 'R' ? { right: W - M } : s === 'C' ? { cx: W / 2 } : { left: M }; return place(dst, t, { ...a, top: b - base(t) }); };
  let b = M + capH;
  for (let i = 0; i < split; i++) { R[i] = put(lines[i], i, b); b += pitch; }
  const last = lines[lines.length - 1];
  b = H - M - (last.box.h - base(last)) - (lines.length - split - 1) * pitch;   // the last line's ink, descenders included, on the bottom margin
  for (let i = split; i < lines.length; i++) { R[i] = put(lines[i], i, b); b += pitch; }
  return R;
}
// Sentence case: set blocks by baseline at a fixed pitch (a fraction of the type size), so descenders and
// ascenders interlock and the leading can go much tighter than ink-box stacking allows.
function pinBaseline(dst, lines, sides, split, pitch) {
  const R = [], base = (t) => t.base - t.box.y;          // baseline offset from the top of the ink
  const put = (t, i, baselineY) => { const s = sides[i], a = s === 'R' ? { right: W - M } : s === 'C' ? { cx: W / 2 } : { left: M }; return place(dst, t, { ...a, top: baselineY - base(t) }); };
  let b = M + base(lines[0]);                             // first line's ink top on the top margin
  for (let i = 0; i < split; i++) { R[i] = put(lines[i], i, b); b += pitch; }
  const last = lines[lines.length - 1], n = lines.length - split;
  b = H - M - (last.box.h - base(last)) - (n - 1) * pitch; // last line's ink bottom on the bottom margin
  for (let i = split; i < lines.length; i++) { R[i] = put(lines[i], i, b); b += pitch; }
  return R;
}
// The tightest baseline pitch at which line b can sit under line a without touching (column by column, so
// descenders drop between the next line's ascenders), plus `gap` design px of air.
function interlockPitch(a, sideA, b, sideB, gap = 6) {
  const prof = (t, side) => {
    const c = canvas(); const by = H / 2; const s = side === 'R' ? { right: W - M } : side === 'C' ? { cx: W / 2 } : { left: M };
    place(c, t, { ...s, top: by - (t.base - t.box.y) });
    const d = c.g.getImageData(0, 0, c.width, c.height).data, w = c.width, h = c.height;
    const top = new Float32Array(w).fill(NaN), bot = new Float32Array(w).fill(NaN);
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (d[(y * w + x) * 4 + 3] > 60) { if (isNaN(top[x])) top[x] = y / K - by; bot[x] = y / K - by; }
    return { top, bot };
  };
  const A = prof(a, sideA), B = prof(b, sideB); let need = 0;
  const r = Math.round(gap * K);
  for (let x = 0; x < A.bot.length; x++) {
    if (isNaN(A.bot[x])) continue;
    for (let k = Math.max(0, x - r); k <= Math.min(B.top.length - 1, x + r); k++) if (!isNaN(B.top[k])) need = Math.max(need, A.bot[x] - B.top[k] + gap);
  }
  return need;
}
// Baseline setting with interlocked pitch (tightest without touching) per pair.
function pinInterlock(dst, lines, sides, split, gap = 6) {
  const R = [], base = (t) => t.base - t.box.y;
  const put = (t, i, b) => { const s = sides[i], a = s === 'R' ? { right: W - M } : s === 'C' ? { cx: W / 2 } : { left: M }; return place(dst, t, { ...a, top: b - base(t) }); };
  const pitches = lines.map((t, i) => (i ? interlockPitch(lines[i - 1], sides[i - 1], t, sides[i], gap) : 0));
  let b = M + base(lines[0]);
  for (let i = 0; i < split; i++) { if (i) b += pitches[i]; R[i] = put(lines[i], i, b); }
  const last = lines[lines.length - 1];
  b = H - M - (last.box.h - base(last));               // the last line's ink, descenders included, on the bottom margin
  for (let i = lines.length - 1; i >= split; i--) { R[i] = put(lines[i], i, b); b -= pitches[i]; }
  return R;
}

// ---------- round 7: grid boxes and image treatments ----------
// A rect on the brief's 8×8 grid: column, row, columns wide, rows tall.
const cell = (c, r, cw = 1, rh = 1) => ({ x: M + c * COL, y: M + r * ROW, w: cw * COL, h: rh * ROW });
// Run fn with g clipped to a rect (or circle when r.round).
function clip(g, r, fn) {
  g.save(); g.beginPath();
  if (r.round) g.arc(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) / 2, 0, Math.PI * 2); else g.rect(r.x, r.y, r.w, r.h);
  g.clip(); fn(); g.restore();
}
// Draw an image into a rect (cover) on its own canvas, so treatments can work on it.
function boxed(im, r, o = {}) { const c = canvas(); clip(c.g, r, () => cover(c.g, im, r, o)); return c; }
// Map luminance to a gradient through the given colours (dark → light): duotone, tritone.
function tone(src, cols) {
  const c = canvas(src.width / K, src.height / K); draw(c.g, src);
  const id = c.g.getImageData(0, 0, c.width, c.height), d = id.data;
  const rgb = cols.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255, f = l * (rgb.length - 1), k = Math.min(rgb.length - 2, Math.floor(f)), t = f - k;
    for (let j = 0; j < 3; j++) d[i + j] = rgb[k][j] + (rgb[k + 1][j] - rgb[k][j]) * t;
  }
  c.g.putImageData(id, 0, 0); return c;
}
// Image stretch (slit scan): inside band, every row repeats the pixel at the band's left edge (dir 'x'),
// or every column repeats the pixel at the band's top edge (dir 'y').
function stretch(src, band, dir = 'x') {
  const c = canvas(src.width / K, src.height / K); draw(c.g, src);
  const x0 = Math.round(band.x * K), y0 = Math.round(band.y * K), w = Math.round(band.w * K), h = Math.round(band.h * K);
  const id = c.g.getImageData(x0, y0, w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = dir === 'x' ? (y * w) * 4 : x * 4, o = (y * w + x) * 4;
    d[o] = d[s]; d[o + 1] = d[s + 1]; d[o + 2] = d[s + 2]; d[o + 3] = d[s + 3];
  }
  c.g.putImageData(id, x0, y0); return c;
}
// Pixelate: average into square cells (design px), optionally snapping each cell to the nearest palette colour.
function pixelate(src, size, palette = null) {
  const sw = Math.ceil(W / size), sh = Math.ceil(H / size);
  const s = document.createElement('canvas'); s.width = sw; s.height = sh; const sg = s.getContext('2d'); sg.imageSmoothingQuality = 'high';
  sg.drawImage(src, 0, 0, sw, sh);
  if (palette) {
    const id = sg.getImageData(0, 0, sw, sh), d = id.data, P2 = palette.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b, pl = P2.map((p) => lum(...p));
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) { d[i + 3] = 0; continue; } const l = lum(d[i], d[i + 1], d[i + 2]); let bi = 0; pl.forEach((v, k) => { if (Math.abs(v - l) < Math.abs(pl[bi] - l)) bi = k; }); [d[i], d[i + 1], d[i + 2]] = P2[bi]; d[i + 3] = 255; }
    sg.putImageData(id, 0, 0);
  }
  const c = canvas(); c.g.imageSmoothingEnabled = false; c.g.drawImage(s, 0, 0, sw * size, sh * size); return c;
}
// ASCII: sample the image in cells and set a character per cell, chosen from `chars` by brightness (dark → light).
function ascii(src, r, o = {}) {
  const { size = 10, chars = ' .:-=+*#%@', font = 'Martian Mono', weight = 600, colour = '#fff', invert = false, lh = 1.0 } = o;
  const cw = size * 0.62, chh = size * lh, cols = Math.floor(r.w / cw), rows = Math.floor(r.h / chh);
  const s = document.createElement('canvas'); s.width = cols; s.height = rows; const sg = s.getContext('2d');
  sg.drawImage(src, r.x * K, r.y * K, r.w * K, r.h * K, 0, 0, cols, rows);
  const d = sg.getImageData(0, 0, cols, rows).data, c = canvas(), g = c.g;
  g.font = `${weight} ${size}px "${font}"`; g.fillStyle = colour; g.textBaseline = 'top';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = (y * cols + x) * 4; if (d[i + 3] < 100) continue;
    let l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; if (invert) l = 1 - l;
    const ch = chars[Math.min(chars.length - 1, Math.floor(l * chars.length))]; if (ch !== ' ') g.fillText(ch, r.x + x * cw, r.y + y * chh);
  }
  return c;
}
// Small type label in parentheses, like (01) or (DAILY POSTER).
const label = (g, t, x, y, o) => small(g, `(${t})`, x, y, o);

// ---------- round 8: type system ----------
// Ben uses multiples of 8 for every type size (8, 16, 24 … 160, 240).
const snap8 = (s) => Math.max(8, Math.floor(s / 8) * 8);
// sameOptical, with the size snapped down to a multiple of 8.
// sameOptical with the size on a multiple of 8, and the widest line still exactly maxW: snapping changes the width,
// so the tracking (gap between letters, never the glyphs) is solved to bring the widest line back to the margins.
// Tries the multiple of 8 above first (tighter tracking), then the one below (looser).
function sameOptical8(texts, o, maxW, { loosen = null } = {}) {
  // Size on a multiple of 8. Snapping changes the width, so the tracking is re-solved to bring the widest line back to
  // maxW, but only within limits: it may TIGHTEN freely (down to minGap) and LOOSEN by at most `loosen` thousandths of
  // an em. Small type gets gappy fast, so it would rather fall a few px short of maxW than open up.
  const { size } = sameOptical(texts, o, maxW), g0 = o.gap ?? 40;
  const widest = (s, gap) => Math.max(...texts.map((t) => setOptical(t, { ...o, size: s, gap }).box.w));
  for (const s of [Math.ceil(size / 8) * 8, snap8(size)]) {
    let lo = (o.minGap ?? 18) - 0.001, hi = g0 + (loosen ?? (s >= 120 ? 30 : 6));   // big type can take a little more
    if (widest(s, lo) > maxW + 0.5) continue;                     // too wide even at the tightest: try the smaller size
    if (widest(s, hi) < maxW - 0.5) { const lines = texts.map((t) => setOptical(t, { ...o, size: s, gap: hi })); return { size: s, gap: hi, lines }; }
    for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (widest(s, mid) > maxW) hi = mid; else lo = mid; }
    return { size: s, gap: lo, lines: texts.map((t) => setOptical(t, { ...o, size: s, gap: lo })) };
  }
  const s = snap8(size); return { size: s, gap: g0, lines: texts.map((t) => setOptical(t, { ...o, size: s })) };
}
// One text style for subline AND furniture: same size, same leading (90%), same case.
const TEXT = { size: 16, lead: 0.9, track: -20 };   // Ben, 24 Nov 2026: subline and furniture tracked -2% (-20/1000 em)
// Break text into lines for a width.
function breakLines(g, text, w) {
  const words = text.split(/\s+/), lines = []; let line = [];
  for (const wd of words) { const t = [...line, wd].join(' '); if (g.measureText(t).width > w && line.length) { lines.push(line.join(' ')); line = [wd]; } else line.push(wd); }
  if (line.length) lines.push(line.join(' ')); return lines;
}
// A subline as a block: try widths between minW and maxW, keep the one whose lines are most even, with 3–4 lines
// preferred, never a one-word last line (no orphans) and never a last line much shorter than the rest.
function balance(text, o) {
  const { font, size = TEXT.size, weight = 500, minW = 160, maxW = 420, lines: want = [3, 4], track = TEXT.track } = o;
  const g = canvas(10, 10).g; g.font = `${weight} ${size}px "${font}"`; g.letterSpacing = `${track * size / 1000}px`;
  let best = null;
  for (let w = minW; w <= maxW; w += 2) {
    const L = breakLines(g, text, w), ws = L.map((l) => g.measureText(l).width), mx = Math.max(...ws);
    const lastWords = L[L.length - 1].split(' ').length;
    let score = Math.min(...ws) / mx;                                    // evenness
    if (lastWords < 2) score -= 1;                                       // orphan
    if (ws[ws.length - 1] < mx * 0.6) score -= 0.5;                      // short last line
    if (!(L.length >= want[0] && L.length <= want[1])) score -= o.strict ? 5 : 0.3;   // strict: the line count must match (e.g. the furniture beside it)
    if (!best || score > best.score) best = { score, w: Math.ceil(mx), lines: L };
  }
  return best;
}
// Set a block of lines with its ink edge exactly on x (left, or right with align 'right') and its first cap
// height on y (anchor 'top') or its last baseline on y (anchor 'bottom'). Returns the block's rect.
function block(g, lines, x, y, o) {
  const { font, size = TEXT.size, weight = 500, lead = TEXT.lead, color = '#000', align = 'left', anchor = 'top', track = TEXT.track } = o;
  g.save(); g.font = `${weight} ${size}px "${font}"`; g.fillStyle = color; g.letterSpacing = `${track * size / 1000}px`;
  const pitch = size * lead, cap = g.measureText('H').actualBoundingBoxAscent;
  let b0 = anchor === 'top' ? y + cap : y - (lines.length - 1) * pitch;
  let wmax = 0;
  lines.forEach((l, i) => {
    const m = g.measureText(l), lx = align === 'right' ? x - m.actualBoundingBoxRight : align === 'center' ? x - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 : x + m.actualBoundingBoxLeft;
    g.fillText(l, lx, b0 + i * pitch); wmax = Math.max(wmax, m.actualBoundingBoxRight + m.actualBoundingBoxLeft);
  });
  g.restore();
  return { x: align === 'right' ? x - wmax : x, y: b0 - cap, w: wmax, h: (lines.length - 1) * pitch + cap };
}
// Decorations Ben uses: an asterisk and a little run of pixels.
function asterisk(g, cx, cy, r, color) { g.save(); g.strokeStyle = color; g.lineWidth = r * 0.28; g.lineCap = 'butt'; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); } g.restore(); }
function pixels(g, x, y, s, pattern, color) { g.fillStyle = color; pattern.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') g.fillRect(x + i * s, y + j * s, s, s); })); }
// Circle mask on the grid.
function circleMask(cx, cy, r) { const c = canvas(); c.g.fillStyle = '#fff'; c.g.beginPath(); c.g.arc(cx, cy, r, 0, Math.PI * 2); c.g.fill(); return c; }
const rectMask = (r) => { const c = canvas(); c.g.fillStyle = '#fff'; c.g.fillRect(r.x, r.y, r.w, r.h); return c; };
// Auto levels: stretch luminance so the given percentiles become black and white.
function levels(src, lo = 0.05, hi = 0.95) {
  const a = pct(src, lo), b = Math.max(a + 0.01, pct(src, hi));
  const c = canvas(src.width / K, src.height / K); draw(c.g, src);
  const id = c.g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) d[i + j] = clamp((d[i + j] / 255 - a) / (b - a)) * 255;
  c.g.putImageData(id, 0, 0); return c;
}

// Overlaps as XOR: shapes in one colour, every place two of them overlap knocked to another (the look of a
// difference blend, but kept inside the palette).
function xorShapes(masks, colA, colB) {
  const w = masks[0].width, h = masks[0].height, sum = new Uint8Array(w * h);
  for (const m of masks) { const d = m.getContext('2d').getImageData(0, 0, w, h).data; for (let p = 0; p < sum.length; p++) if (d[p * 4 + 3] > 127) sum[p]++; }
  const out = canvas(w / K, h / K), id = out.g.createImageData(w, h), d = id.data;
  const A = [1, 3, 5].map((i) => parseInt(colA.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(colB.slice(i, i + 2), 16));
  for (let p = 0; p < sum.length; p++) { if (!sum[p]) continue; const c = sum[p] % 2 ? A : B; d[p * 4] = c[0]; d[p * 4 + 1] = c[1]; d[p * 4 + 2] = c[2]; d[p * 4 + 3] = 255; }
  out.g.putImageData(id, 0, 0); return out;
}
// A circle whose edge is stepped at the pixel size, so it reads as pixels, not a perfect vector.
function pixelCircle(cx, cy, r, size) {
  const c = canvas();
  for (let y = Math.floor((cy - r) / size) * size; y < cy + r; y += size) for (let x = Math.floor((cx - r) / size) * size; x < cx + r; x += size)
    if (Math.hypot(x + size / 2 - cx, y + size / 2 - cy) <= r) { c.g.fillStyle = '#fff'; c.g.fillRect(x, y, size, size); }
  return c;
}

// Where to break a headline: rank the gaps between words by how natural a spoken pause is there.
// Strong: before a preposition / "to" / conjunction / relative word; also between a subject and its verb
// (a word ending in s/ed/es after a noun phrase is a likely verb). Penalise leaving one word alone.
const PAUSE_BEFORE = new Set(['to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'through', 'since', 'from', 'into', 'over', 'under', 'and', 'but', 'or', 'as', 'than', 'that', 'who', 'where', 'when', 'while', 'nothing', 'every']);
function breaks(text) {
  const w = text.replace(/,/g, '').split(/\s+/), out = [];
  for (let i = 1; i < w.length; i++) {
    const next = w[i].toLowerCase(), prev = w[i - 1].toLowerCase();
    let s = 0;
    if (PAUSE_BEFORE.has(next)) s += 3;
    if (/(s|ed|es)$/.test(next) && !['the', 'a', 'an'].includes(prev) && i >= 2) s += 2;   // likely the verb after a subject
    if (['the', 'a', 'an', 'in', 'of', 'to'].includes(prev)) s -= 4;                       // never break after an article or preposition
    if (i === 1 || i === w.length - 1) s -= 2;                                               // one word on its own
    s -= Math.abs(i - w.length / 2) * 0.3;                                                   // balance
    out.push({ at: i, score: +s.toFixed(2), lines: [w.slice(0, i).join(' '), w.slice(i).join(' ')] });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------- ink-safe spacing ----------
// Count the letter-sized blobs in a mask (ignores specks under minArea px at full res).
function blobs(c, minArea = 400) {
  const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data, seen = new Uint8Array(w * h); let n = 0;
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || d[i * 4 + 3] < 128) continue;
    let area = 0; const st = [i]; seen[i] = 1;
    while (st.length) { const p = st.pop(); area++; const x = p % w; for (const q of [p - 1, p + 1, p - w, p + w]) { if (q < 0 || q >= w * h || seen[q] || d[q * 4 + 3] < 128) continue; if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue; seen[q] = 1; st.push(q); } }
    if (area >= minArea) n++;
  }
  return n;
}
// Print each line through the given ink and check no letters have run together; if they have, open the tracking a
// little (gap and minGap +6) and try again. Returns lines that survive the ink.
function inkSafe(texts, o, maxW, ink = { preset: 'letterpress', wear: 0.35, spread: 0.25 }) {
  // Keep the tight tracking and make the INK behave: print each line and count its letters; if any have merged, first
  // thin the ink (lower spread: the ink bleeds a fixed number of pixels, which matters more the smaller the type), and
  // only if that isn't enough, raise the minimum gap a little. Returns the lines AND the ink to print them with.
  const r = sameOptical8(texts, o, maxW);
  // tested with a little more ink than will be used and on two seeds, so a different seed on the poster can't close a
  // gap the test left open (053: the E and A of NEAR touched)
  const merged = (lines, k) => lines.some((t) => [7, 55].some((sd) => blobs(t.c) > blobs(IM.print(t.c, k.preset, { wear: k.wear, spread: Math.min(0.9, k.spread * 1.25), seed: sd }))));
  let k = { ...ink };
  for (const sp of [ink.spread, 0.18, 0.12, 0.07, 0.03]) { k = { ...ink, spread: Math.min(ink.spread, sp) }; if (!merged(r.lines, k)) return { ...r, o, ink: k }; }
  let oo = { ...o };
  for (let i = 0; i < 6; i++) { oo = { ...oo, minGap: (oo.minGap ?? 18) + 3 }; const r2 = sameOptical8(texts, oo, maxW); if (!merged(r2.lines, k)) return { ...r2, o: oo, ink: k }; }
  return { ...sameOptical8(texts, oo, maxW), o: oo, ink: k };
}

// ---------- print styles and paper stocks (vary them: one look across every poster is a giveaway) ----------
// printHead(g, mask, colour, style, o): put a mask on the poster with a print process. Colour must be from the day's
// palette (or black/white). o.bg = the colour underneath (decides black vs white foil, and is the varnish colour).
// From Ben's portfolio (PF, his exact settings):
//   ink:     'letterpress' | 'riso' | 'screen' | 'stamp' | 'inked-deboss'
//   foil:    'foil' (domed gloss) | 'foil-flat' (hot-foil) | 'foil-mirror' | 'foil-satin' (graphite) | 'foil-emboss'
//            (raised) | 'foil-debossed' | 'foil-colour' (bright foil in a palette colour)
//   varnish: 'varnish' (spot gloss) | 'varnish-raised' (thick UV) | 'varnish-satin' | 'varnish-ink' (gloss over solid ink)
//   Gloss black/white foils follow the background: white on dark, black on light.
// From the Ink Machine, for rougher days: 'bleed' (soaked), 'copy' (photocopy), 'crisp', 'machine-letterpress',
//   'machine-riso', 'machine-screen', 'machine-stamp' (the Machine's own, wilder presets).
// Left out on Ben's instruction: blind emboss/deboss, silver foil, gold/rose/copper/holo (off-palette), hand-drawn marks.
const PF_STYLES = ['letterpress', 'riso', 'screen', 'stamp', 'inked-deboss', 'foil', 'foil-flat', 'foil-mirror', 'foil-satin', 'foil-emboss', 'foil-debossed', 'foil-colour', 'varnish', 'varnish-raised', 'varnish-satin', 'varnish-ink'];
const PRINT_STYLES = [...PF_STYLES, 'bleed', 'copy', 'crisp', 'machine-letterpress', 'machine-riso', 'machine-screen', 'machine-stamp'];
const lum = (hex) => { const [r, gg, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * gg + 0.0722 * b; };
function printHead(g, mask, colour, style = 'letterpress', o = {}) {
  if (!PRINT_STYLES.includes(style)) throw new Error(`unknown or off-palette print style: ${style}`);
  const seed = o.seed ?? 11;
  if (PF_STYLES.includes(style)) {
    const w = mask.width, h = mask.height, d = mask.getContext('2d').getImageData(0, 0, w, h).data, a = new Float32Array(w * h);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;
    const bg = o.bg || '#000000', dark = lum(bg) < 0.45;
    const px = PF.render({ mask: a, W: w, H: h, s: K / 2, seed, style, inkHex: colour, paperHex: bg, spotHex: colour, dark, light: o.light ?? 0.5 });
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(new ImageData(px, w, h), 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore();
    if (FOIL_OVERRIDE[style] && g.canvas.width === mask.width) {   // remembered for stock(): the paper's grain doesn't print through it
      const f = (_foil.get(g.canvas) || { mask: canvas(), k: 0 }); draw(f.mask.g, mask); f.k = Math.max(f.k, FOIL_OVERRIDE[style]); _foil.set(g.canvas, f);
    }
    return;
  }
  const M2 = { bleed: ['riso', 0.6, 0.85], copy: ['copy', 0.45, 0.4], crisp: ['clean', 0.1, 0.15] };
  const [preset, wear, spread] = M2[style] || [style.replace('machine-', ''), 0.45, 0.4];
  draw(g, tint(IM.print(mask, preset, { wear: o.wear ?? wear, spread: o.spread ?? spread, seed }), colour));
}
// stock(g, kind): the paper the poster is printed on, drawn last over everything.
//   'smooth' | 'uncoated' | 'rough' | 'newsprint' (grey fibres and specks) | 'photocopy' (toner grain and streaks) | 'none'
// Scratches and scuffs (Ben, 24 Nov 2026): the wear a real print picks up in handling. Hairline scratches that catch
// the light where they cross dark ink (and barely show on pale paper), a few faint rubbed patches. Nothing uniform:
// they come in small loose families (a few near-parallel hairlines from one drag), lengths from a few px to a
// third of the sheet, slightly curved, broken in places, thick in the middle and fading at the ends, and they
// gather where the noise says so rather than being sprinkled evenly. Different on every poster (seeded).
function scratches(g, amount = 1, seedN = 1) {
  if (amount <= 0) return;
  seed(seedN * 7919 + 13);
  const m = canvas(), c = m.g; c.lineCap = 'round';
  const fams = Math.round((6 + rand() * 8) * amount);
  for (let f = 0; f < fams; f++) {
    // mostly lone hairlines; now and then two or three from one drag, never neatly parallel
    const fx = rand() * W, fy = rand() * H, ang = rand() * Math.PI, len0 = 30 + Math.pow(rand(), 1.8) * 560;
    const n = rand() < 0.7 ? 1 : 2 + Math.floor(rand() * 2);
    for (let k = 0; k < n; k++) {
      const a = ang + (rand() - 0.5) * 0.35, len = len0 * (0.3 + rand() * 0.9), bend = (rand() - 0.5) * len * 0.12;
      const ox = fx + (rand() - 0.5) * 90, oy = fy + (rand() - 0.5) * 90, dx = Math.cos(a), dy = Math.sin(a);
      const wmax = 0.25 + Math.pow(rand(), 2) * 0.8, alpha = 0.12 + rand() * 0.4, steps = Math.max(8, Math.round(len / 2));
      const wob = [rand() * 6, rand() * 6], wf = [2 + rand() * 4, 9 + rand() * 14], wa = [0.6 + rand() * 1.6, 0.2 + rand() * 0.5];
      const start = rand() * 0.25, stop = 1 - rand() * 0.25;   // it starts and stops faintly, at odd points
      let gapLeft = 0;
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps, t1 = (i + 1) / steps;
        if (gapLeft > 0) { gapLeft--; continue; } if (rand() < 0.05) { gapLeft = 1 + Math.floor(rand() * 8); continue; }
        const P = (t) => { const b = Math.sin(t * Math.PI) * bend + Math.sin(t * wf[0] + wob[0]) * wa[0] + Math.sin(t * wf[1] + wob[1]) * wa[1]; return [ox + dx * (t - 0.5) * len - dy * b, oy + dy * (t - 0.5) * len + dx * b]; };
        const [x0, y0] = P(t0), [x1, y1] = P(t1), tm = (t0 + t1) / 2, taper = smooth(0, start + 0.08, tm) * (1 - smooth(stop - 0.08, 1, tm));
        if (taper <= 0.02) continue;
        c.strokeStyle = `rgba(255,255,255,${alpha * taper * (0.55 + rand() * 0.45)})`; c.lineWidth = wmax * (0.4 + 0.6 * taper) * (0.7 + rand() * 0.3);
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      }
    }
  }
  // nicks: tiny flecks where something caught the surface, in loose little clusters
  for (let q = 0; q < Math.round((3 + rand() * 5) * amount); q++) {
    const cx = rand() * W, cy = rand() * H, cnt = 2 + Math.floor(rand() * 6);
    for (let i = 0; i < cnt; i++) {
      const x = cx + (rand() - 0.5) * 40, y = cy + (rand() - 0.5) * 40, a = rand() * Math.PI, l = 1.5 + rand() * 7;
      c.strokeStyle = `rgba(255,255,255,${0.2 + rand() * 0.45})`; c.lineWidth = 0.4 + rand() * 0.8;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
    }
  }
  // a few scuffs: soft rubbed patches, streaked along one direction
  const sc = canvas(); for (let i = 0; i < Math.round((1 + rand() * 3) * amount); i++) {
    const x = rand() * W, y = rand() * H, r = 30 + rand() * 120; sc.g.save(); sc.g.translate(x, y); sc.g.rotate(rand() * Math.PI); sc.g.scale(1, 0.25 + rand() * 0.3);
    const gr = sc.g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(255,255,255,0.09)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); sc.g.fillStyle = gr; sc.g.fillRect(-r, -r, 2 * r, 2 * r); sc.g.restore();
  }
  const fine = noise(0.6); { const id = sc.g.getImageData(0, 0, sc.width, sc.height), d = id.data; for (let p = 0; p < fine.length; p++) d[p * 4 + 3] *= fine[p] > 0.5 ? 1 : 0.2; sc.g.putImageData(id, 0, 0); }
  // light shows where the ink is scratched (lighten: invisible on pale paper), a faint dent on the pale paper
  draw(g, tint(union(m, sc), '#dcdcd6'), 'lighten', 0.7);
  draw(g, tint(m, '#000000'), 'multiply', 0.12);
}
// Ben, 28 Nov 2026: a foil pressed or raised hard enough overrides the paper: the stock's grain and fibres don't show
// through it; it gets its own smooth, fine sheen instead (scratches still catch on it). How far each finish overrides
// the paper (1 = fully), a little less on rough stock where the fibres still push through a flat foil.
const FOIL_OVERRIDE = { 'foil-emboss': 1, 'foil-debossed': 1, foil: 0.9, 'varnish-raised': 0.85, 'foil-mirror': 0.75, 'foil-flat': 0.65, 'foil-colour': 0.65, 'foil-satin': 0.6 };
const _foil = new WeakMap();
function foilSheen(g, seedN) {   // the foil's own texture: a soft, broad sheen and a very fine, even grain, no fibres
  seed(seedN * 31 + 5); const a = noise(40), b = noise(0.5), c = canvas(), id = c.g.createImageData(c.width, c.height), d = id.data;
  for (let p = 0; p < a.length; p++) { const v = clamp(0.5 + (a[p] - 0.5) * 0.5 + (b[p] - 0.5) * 0.12) * 255; d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = v; d[p * 4 + 3] = 255; }
  c.g.putImageData(id, 0, 0); draw(g, c, 'soft-light', 0.35);
}
function stock(g, kind = 'uncoated', seedN = 1, o = {}) {
  if (kind === 'none') return;
  const f = _foil.get(g.canvas);
  if (f) {
    _foil.delete(g.canvas);
    const before = canvas(); draw(before.g, g.canvas);
    _stock(g, kind, seedN, o);
    // over the foil: the sheet as it was before the paper, with the foil's own sheen and the same scratches
    const sm = canvas(); draw(sm.g, before); foilSheen(sm.g, seedN); scratches(sm.g, o.wear ?? 1, seedN);
    const k = f.k * (kind === 'rough' ? 0.85 : kind === 'newsprint' ? 0.9 : 1);
    draw(g, inter(sm, alphaThr(f.mask, 0.5)), 'source-over', k);
    return;
  }
  _stock(g, kind, seedN, o);
}
function _stock(g, kind = 'uncoated', seedN = 1, { wear = null } = {}) {
  scratches(g, wear ?? { smooth: 0.6, uncoated: 1, rough: 1.2, newsprint: 1.3, photocopy: 0.8 }[kind] ?? 1, seedN);
  const rough = { smooth: 0.15, uncoated: 0.45, rough: 0.9, newsprint: 0.7, photocopy: 0.3 }[kind] ?? 0.45;
  draw(g, IM.paper(rough, seedN), 'source-over', kind === 'smooth' ? 0.5 : 0.8);
  if (kind === 'newsprint') grain(g, 0.16, 0.9, 'multiply');
  if (kind === 'photocopy') { grain(g, 0.12, 0.35, 'overlay'); const s = canvas(); s.g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 9; i++) s.g.fillRect(0, rand() * H, W, 1 + rand() * 3); draw(g, s, 'multiply'); }
  else grain(g, kind === 'smooth' ? 0.04 : 0.07, 0.5);
}

// ---------- round 14: print the whole sheet the way the headline is printed ----------
// Ben, 24 Nov 2026: if the headline is inked, everything is inked (shapes, pixel blocks, box edges, rules, text), to
// the same degree; if it's crisp, everything is crisp; a foil or varnish headline gets a crisp, clean print around it.
// Tiny text (subline, furniture, labels) gets only a very light version so it stays legible.
// printAll(g, C, o): call after everything except the headline is drawn, then printHead the headline, then stock().
//   It splits the sheet into flat plates (every pixel snapped to the nearest colour in the colourway C), prints each
//   plate through the Ink Machine with the process that matches the headline's finish, and lays them back down on
//   the paper (the background colour) largest first. o.keep: masks left exactly as drawn (avoid: their edges stay
//   digital-crisp); o.boxes (rects) and o.shapes (masks, e.g. a pixelated circle): toned contents kept, but their
//   edges printed like everything else and the ink lightly mottled. Prefer boxes/shapes over keep.
const SHEET_PROCESS = {
  letterpress: ['letterpress', 0.3, 0.5], 'inked-deboss': ['letterpress', 0.3, 0.5], riso: ['riso', 0.3, 0.5],
  screen: ['screen', 0.3, 0.5], stamp: ['stamp', 0.3, 0.5], bleed: ['riso', 0.55, 0.75], copy: ['copy', 0.4, 0.5],
  crisp: ['crisp'], 'machine-letterpress': ['letterpress', 0.4, 0.5], 'machine-riso': ['riso', 0.4, 0.5],
  'machine-screen': ['screen', 0.4, 0.5], 'machine-stamp': ['stamp', 0.4, 0.5],
};
function sheetProcess(style) {
  if (SHEET_PROCESS[style]) return SHEET_PROCESS[style];
  if (/^(foil|varnish)/.test(style)) return ['crisp'];   // foiled or varnished headline: crisp, clean print around it
  return null;                                           // purely graphic: leave it flat
}
// The light print for tiny text and crisp sheets: the shapes stay exactly as drawn, the ink just mottles a touch.
function lightInk(m, amount = 0.14, seedN = 1) {
  seed(seedN); const n = noise(0.8), o = canvas(m.width / K, m.height / K); draw(o.g, m);
  const id = o.g.getImageData(0, 0, o.width, o.height), d = id.data;
  for (let p = 0; p < n.length; p++) if (d[p * 4 + 3]) d[p * 4 + 3] *= 1 - amount * n[p];
  o.g.putImageData(id, 0, 0); return o;
}
function alphaThr(c, t) {
  const o = canvas(c.width / K, c.height / K); draw(o.g, c);
  const id = o.g.getImageData(0, 0, o.width, o.height), d = id.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= t * 255 ? 255 : 0;
  o.g.putImageData(id, 0, 0); return o;
}
const blurred = (c, r) => { const o = canvas(c.width / K, c.height / K); o.g.filter = `blur(${r * K / 2}px)`; draw(o.g, c); o.g.filter = 'none'; return o; };
function printAll(g, C, o = {}) {
  const proc = sheetProcess(o.style ?? C.finish); if (!proc) return;
  const [preset, w0, s0] = proc, wear = o.wear ?? w0, spread = o.spread ?? s0, seedN = o.seed ?? 21;
  const hexes = [...new Set(JSON.stringify(C).match(/#[0-9A-Fa-f]{6}/g).map((h) => h.toUpperCase()))];
  const bg = (o.bg ?? C.bg ?? C.paper).toUpperCase(), cols = hexes.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const src = g.canvas, w = src.width, h = src.height, sd = src.getContext('2d').getImageData(0, 0, w, h).data;
  const framed = [...(o.boxes || []).map(rectMask), ...(o.shapes || [])];   // kept inside, edges printed
  const keep = union(...(o.keep || []), ...framed), kd = keep.g.getImageData(0, 0, w, h).data;
  // snap every pixel to its nearest colour → one plate per colour
  const lab = new Uint8Array(w * h), count = new Array(hexes.length).fill(0);
  for (let p = 0; p < w * h; p++) {
    if (kd[p * 4 + 3] > 127) { lab[p] = 255; continue; }
    let best = 0, bd = 1e9; const r = sd[p * 4], gg = sd[p * 4 + 1], b = sd[p * 4 + 2];
    for (let k = 0; k < cols.length; k++) { const c = cols[k], dd = (r - c[0]) ** 2 + (gg - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; best = k; } }
    lab[p] = best; count[best]++;
  }
  const kept = canvas(); draw(kept.g, src); draw(kept.g, keep, 'destination-in');
  const outC = canvas(); outC.g.fillStyle = bg; outC.g.fillRect(0, 0, W, H);
  const plateMask = (k) => { const m = canvas(), id = m.g.createImageData(w, h), d = id.data; for (let p = 0; p < w * h; p++) if (lab[p] === k) { d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = 255; d[p * 4 + 3] = 255; } m.g.putImageData(id, 0, 0); return m; };
  const used = hexes.map((_, k) => k).filter((k) => count[k] > 0), masks = {};
  used.forEach((k) => { masks[k] = plateMask(k); });
  // thin parts of any colour (small text, hairlines, 1-2px rules, and the same cut out of a colour, like text knocked
  // out to the paper) vanish under an opening: they keep exactly what was drawn and get only a light mottle
  // and small pieces whole (letters of the subline, little squares): anything whose bounding box is under ~40px
  const small = (k) => {
    const c = canvas(), id = c.g.createImageData(w, h), d = id.data, seen = new Uint8Array(w * h), lim = 40 * K;
    for (let i = 0; i < w * h; i++) {
      if (seen[i] || lab[i] !== k) continue;
      const st = [i], comp = []; seen[i] = 1; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, big = false;
      while (st.length) {
        const q = st.pop(); comp.push(q); const x = q % w, y = (q / w) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x1 - x0 > lim || y1 - y0 > lim) { big = true; }
        for (const r of [q - 1, q + 1, q - w, q + w]) { if (r < 0 || r >= w * h || seen[r] || lab[r] !== k) continue; if ((r === q - 1 && x === 0) || (r === q + 1 && x === w - 1)) continue; seen[r] = 1; st.push(r); }
      }
      if (!big) for (const q of comp) { d[q * 4] = d[q * 4 + 1] = d[q * 4 + 2] = 255; d[q * 4 + 3] = 255; }
    }
    c.g.putImageData(id, 0, 0); return c;
  };
  const thin = union(...used.map((k) => union(small(k), cut(masks[k], alphaThr(blurred(alphaThr(blurred(masks[k], 1.6), 0.8), 1.6), 0.2)))));
  const thinD = alphaThr(blurred(thin, 1.2), 0.05);
  const order = used.filter((k) => hexes[k] !== bg).sort((a, b) => count[b] - count[a]);
  order.forEach((k, n) => {
    const m = cut(masks[k], thinD);
    const plate = preset === 'crisp' ? lightInk(m, 0.12, seedN + n) : IM.print(m, preset, { wear, spread, seed: seedN + n });
    draw(outC.g, tint(plate, hexes[k]));
  });
  // the thin parts as drawn, lightly inked
  const thinOrig = canvas(); draw(thinOrig.g, src); draw(thinOrig.g, cut(thinD, keep), 'destination-in');
  draw(outC.g, lightInk(thinOrig, 0.15, seedN + 77));
  // smooth images stay as drawn; boxes get printed edges
  draw(outC.g, cut(kept, union(...framed)));
  for (const [i, fm] of framed.entries()) {
    const edge = preset === 'crisp' ? fm : IM.print(fm, preset, { wear, spread, seed: seedN + 80 + i });
    const b = canvas(); draw(b.g, kept); draw(b.g, fm, 'destination-in'); draw(b.g, edge, 'destination-in');
    draw(outC.g, preset === 'crisp' ? b : lightInk(b, 0.1, seedN + 90 + i));
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.drawImage(outC, 0, 0); g.restore();
}

// ---------- round 14: words in the corners ----------
// Ben, 24 Nov 2026: when a headline sits in blocks pinned to both margins and a line of two or more words falls a
// little short of the measure (CATCH MERCURY / BEFORE SUNRISE), fake it: open the WORD spaces (never the letters)
// so the line runs margin to margin and its outer words sit exactly in the corners. Returns line objects that drop
// into pinBlocks / pinInterlock like setOptical's. maxShort: only lines within this fraction of the measure are
// spread (a much shorter line keeps its own alignment).
function spreadWords(lines, maxW, { maxShort = 0.12 } = {}) {
  return lines.map((t) => {
    const words = t.text.split(' ');
    if (words.length < 2 || t.box.w >= maxW - 0.5 || t.box.w < maxW * (1 - maxShort)) return t;
    const ws = words.map((wd) => setOptical(wd, t.o)), ink = ws.reduce((a, q) => a + q.box.w, 0), gap = (maxW - ink) / (words.length - 1);
    const pad = t.o.size * 0.6, c = canvas(maxW + pad * 2, ws[0].c.height / K); let x = pad;
    ws.forEach((q) => { c.g.drawImage(q.c, x - q.box.x, 0, q.c.width / K, q.c.height / K); x += q.box.w + gap; });
    return { c, box: inkBox(c), base: ws[0].base, text: t.text, o: t.o };
  });
}

// ---------- making-of capture ----------
// With ?cap=1 (CAP=1 node render.mjs ...), snap(name, canvas) keeps a full-size copy of the canvas at that moment
// (the sheet so far, or a transparent layer on its own). render.mjs writes them to out/<poster>-snaps/ for the
// making-of reel (reel.py). Without ?cap=1 it does nothing, so templates can call it freely.
const CAPTURE = /[?&]cap=1/.test(location.search);
window.SNAPS = [];
function snap(name, c) {
  if (!CAPTURE) return;
  const s = document.createElement('canvas'); s.width = W * K; s.height = H * K; s.getContext('2d').drawImage(c, 0, 0, W * K, H * K);
  window.SNAPS.push([name, s.toDataURL('image/png')]);
}
// The headline's lines, one layer each, for typing them in (layer: the headline already in its colours).
function snapLines(layer, R) {
  if (!CAPTURE) return;
  R.forEach((r, i) => { const one = canvas(); one.g.fillStyle = '#fff'; one.g.fillRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8); snap(`line-${i}`, inter(layer, one)); });
}
// Ink trials for the reel: fn(g, k) prints the sheet with the ink k× the chosen setting. Snaps lighter, much
// heavier, then a bit heavier, before the real print (which the template snaps as 'printed').
function inkTrials(out, fn) {
  if (!CAPTURE) return;
  for (const [nm, k] of [['ink-light', 0.35], ['ink-heavy', 1.7], ['ink-mid', 1.3]]) { const tmp = canvas(); draw(tmp.g, out); fn(tmp.g, k); snap(nm, tmp); }
}
// A brief object's turntable, for moving posters: the 24 frames of a full turn (brief.objects[n].spin, from the
// daily brief). const turn = await spinFrames(latest.objects[0]); then turn(t) is the object at t (0..1), already
// trimmed to its edges like trim(). Falls back to the still image when a brief has no turntable.
async function spinFrames(obj) {
  if (!obj.spin) { const im = trim(await media(obj.image)); return () => im; }
  const ims = await Promise.all([...Array(obj.spin.frames)].map((_, i) => media(`${obj.spin.path}${String(i).padStart(3, '0')}.${obj.spin.ext}`)));
  const box = trim(ims[0]), w = box.width, h = box.height;   // one crop for all frames, so the object doesn't jump
  const c0 = document.createElement('canvas'); c0.width = ims[0].width; c0.height = ims[0].height;
  // the union of every frame's edges
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (const im of ims) { const g = c0.getContext('2d'); g.clearRect(0, 0, c0.width, c0.height); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c0.width, c0.height).data;
    for (let y = 0; y < c0.height; y += 2) for (let x = 0; x < c0.width; x += 2) if (d[(y * c0.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const crops = ims.map((im) => { const c = document.createElement('canvas'); c.width = x1 - x0 + 2; c.height = y1 - y0 + 2; c.getContext('2d').drawImage(im, -x0, -y0); return c; });
  return (t) => crops[Math.floor(((t % 1) + 1) % 1 * crops.length) % crops.length];
}

// ---------- round 20: the scanned sheet, and layers on it (Ben, 25 Nov 2026) ----------
// scan(g, seedN): run after stock(). Makes the poster look like a print that has been laid on a flatbed scanner:
// light falling off unevenly across the glass, one edge a touch darker where the sheet lifts, faint scanner banding
// along the travel, a little dust and the odd hair. Luminance only, so the palette holds.
function scan(g, seedN = 1, { amount = 1 } = {}) {
  seed(seedN * 977 + 3);
  const n = noise(420), m = noise(90), c = canvas(), id = c.g.createImageData(c.width, c.height), d = id.data, w = c.width, h = c.height;
  const lift = rand() < 0.5 ? 0 : 1, band = new Float32Array(h); let v = 0;
  for (let y = 0; y < h; y++) { v += (rand() - 0.5) * 0.02; v *= 0.995; band[y] = v + (rand() < 0.004 ? (rand() - 0.5) * 0.05 : 0); }
  for (let p = 0; p < n.length; p++) {
    const x = (p % w) / w, y = ((p / w) | 0);
    const edge = Math.pow(lift ? x : 1 - x, 6) * 0.07;                       // the lifted edge
    let l = 0.5 + ((n[p] - 0.5) * 0.09 + (m[p] - 0.5) * 0.025 + band[y] * 0.5 - edge) * amount;
    d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = clamp(l) * 255; d[p * 4 + 3] = 255;
  }
  c.g.putImageData(id, 0, 0); draw(g, c, 'soft-light', 1);
  // dust and hairs
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 26 * amount; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + rand() * 0.3})`; g.beginPath(); g.arc(rand() * W, rand() * H, 0.4 + Math.pow(rand(), 3) * 1.6, 0, 7); g.fill(); }
  for (let i = 0; i < 2 * amount; i++) {
    let x = rand() * W, y = rand() * H, a = rand() * 7; g.strokeStyle = `rgba(0,0,0,${0.12 + rand() * 0.12})`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 30; k++) { a += (rand() - 0.5) * 0.5; x += Math.cos(a) * 2.2; y += Math.sin(a) * 2.2; g.lineTo(x, y); } g.stroke();
  }
  g.restore();
}
// A torn end for tape: masking tape tears in a ragged zigzag of uneven teeth, not a clean line.
function _torn(g, x0, x1, y, depth) {
  let x = x0; const dir = Math.sign(x1 - x0), span = Math.abs(x1 - x0);
  while (Math.abs(x - x0) < span) { const step = 2 + rand() * 7, d = (rand() - 0.3) * depth * (0.4 + rand()); x += dir * step; g.lineTo(Math.abs(x - x0) > span ? x1 : x, y + d); }
}
// tape(g, {x, y, w, h, rot}, colour, seedN): a strip of masking tape stuck on the sheet, as scanned. Its own material,
// not the paper's: a fine crepe of ridges running across the strip, a little fibre, slightly darker long edges where
// the adhesive meets the paper, long edges a touch uneven, and both ends torn in ragged teeth. Opaque (nothing shows
// through). Use a palette colour that differs from the paper. Almost no shadow: it lies flat.
function tape(g, r, colour = '#F1E5B8', seedN = 1, { alpha = 1 } = {}) {
  seed(seedN * 131 + 7);
  const long = r.h >= r.w, L = long ? r.h : r.w, Wd = long ? r.w : r.h;   // draw in the tape's own frame: length along y
  const ang = (r.rot || 0) + (long ? 0 : Math.PI / 2);
  const local = (fn) => { const c = canvas(); c.g.save(); c.g.translate(r.x + r.w / 2, r.y + r.h / 2); c.g.rotate(ang); fn(c.g); c.g.restore(); return c; };
  const shape = local((sg) => {
    sg.fillStyle = '#fff'; sg.beginPath(); sg.moveTo(-Wd / 2, -L / 2);
    _torn(sg, -Wd / 2, Wd / 2, -L / 2, 9);
    for (let y = -L / 2; y <= L / 2; y += 12) sg.lineTo(Wd / 2 + (rand() - 0.5) * 1.2, y);
    _torn(sg, Wd / 2, -Wd / 2, L / 2, 9);
    for (let y = L / 2; y >= -L / 2; y -= 12) sg.lineTo(-Wd / 2 + (rand() - 0.5) * 1.2, y);
    sg.closePath(); sg.fill();
    // a few loose fibres at the torn ends
    sg.strokeStyle = '#fff'; sg.lineWidth = 0.7;
    for (const e of [-1, 1]) for (let i = 0; i < 6; i++) { const x = (rand() - 0.5) * Wd * 0.9, y = e * L / 2; sg.beginPath(); sg.moveTo(x, y); sg.lineTo(x + (rand() - 0.5) * 4, y + e * (3 + rand() * 6)); sg.stroke(); }
  });
  contactShadow(g, shape, seedN, { strength: 0.14, lift: false });
  // the tape's own surface: crepe ridges across the strip, fibre, darker long edges
  const surf = local((sg) => {
    sg.fillStyle = colour; sg.fillRect(-Wd / 2 - 10, -L / 2 - 14, Wd + 20, L + 28);
    let y = -L / 2 - 14;
    while (y < L / 2 + 14) { const gap = 1.4 + rand() * 2.6, a = 0.015 + rand() * 0.035; sg.fillStyle = rand() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.8})`; sg.save(); sg.translate(0, y); sg.rotate((rand() - 0.5) * 0.05); sg.fillRect(-Wd / 2 - 10, 0, Wd + 20, 0.6 + rand() * 0.9); sg.restore(); y += gap; }
    const gr = sg.createLinearGradient(-Wd / 2, 0, Wd / 2, 0); gr.addColorStop(0, 'rgba(0,0,0,0.09)'); gr.addColorStop(0.08, 'rgba(0,0,0,0)'); gr.addColorStop(0.92, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.09)');
    sg.fillStyle = gr; sg.fillRect(-Wd / 2 - 2, -L / 2 - 14, Wd + 4, L + 28);
  });
  const n = noise(0.7), fc = canvas(), id = fc.g.createImageData(fc.width, fc.height), d = id.data;
  for (let p = 0; p < n.length; p++) { const v = 0.5 + (n[p] - 0.5) * 0.16; d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = clamp(v) * 255; d[p * 4 + 3] = 255; }
  fc.g.putImageData(id, 0, 0); draw(surf.g, fc, 'soft-light', 0.8);
  draw(g, inter(surf, shape), 'source-over', alpha);
}
// card(g, rect, colour, seedN): a piece of card laid on the sheet before scanning: a flat colour, a tight contact
// shadow along its edges (not a soft drop shadow), one corner lifting a little so its shadow widens there, and
// slightly lighter cut edges.
function card(g, r, colour, seedN = 1) {
  seed(seedN * 71 + 5);
  const m = canvas(); m.g.save(); m.g.translate(r.x + r.w / 2, r.y + r.h / 2); m.g.rotate(r.rot || 0); m.g.fillStyle = '#fff'; m.g.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); m.g.restore();
  contactShadow(g, m, seedN);
  draw(g, tint(m, colour));
  fibres(g, m, seedN, 0.5);
  const core = cut(m, alphaThr(blurred(cut(rectMask({ x: 0, y: 0, w: W, h: H }), m), 1.2), 0.02));
  draw(g, tint(cut(m, core), '#ffffff'), 'soft-light', 0.5);
  return m;
}
// The shadow a flat piece of paper casts on the sheet under a scanner lid: a thin, dark-ish line hugging the edges
// away from the light, plus a wider soft patch under one lifted corner. Never used on type (Ben: no drop shadows on type).
function contactShadow(g, m, seedN = 1, { strength = 1, lift = true } = {}) {
  seed(seedN * 17 + 1);
  const a = canvas(); a.g.filter = `blur(${1.6 * K}px)`; a.g.drawImage(m, 1.5, 2.5, W, H); a.g.filter = 'none';
  draw(g, tint(cut(a, m), '#000000'), 'multiply', 0.32 * strength);
  // one lifted corner: a soft shadow, strongest at a random corner of the piece's bounds
  if (!lift) return;
  const b = inkBox(m); if (!b.w) return;
  const cx = rand() < 0.5 ? b.x : b.x + b.w, cy = rand() < 0.5 ? b.y : b.y + b.h, R = Math.min(b.w, b.h) * 0.35 + 20;
  const lc = canvas(); const gr = lc.g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  lc.g.fillStyle = gr; lc.g.fillRect(0, 0, W, H);
  const soft = canvas(); soft.g.filter = `blur(${6 * K}px)`; soft.g.drawImage(m, 4, 7, W, H); soft.g.filter = 'none';
  draw(g, tint(cut(inter(soft, lc), m), '#000000'), 'multiply', 0.28 * strength);
}
// Faint paper fibres and tooth inside a mask (for card and torn paper pieces).
function fibres(g, m, seedN = 1, amount = 1) {
  seed(seedN * 23 + 9);
  const n = noise(0.8), c = canvas(), id = c.g.createImageData(c.width, c.height), d = id.data;
  for (let p = 0; p < n.length; p++) { const v = 0.5 + (n[p] - 0.5) * 0.22 * amount; d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = clamp(v) * 255; d[p * 4 + 3] = 255; }
  c.g.putImageData(id, 0, 0); draw(g, inter(c, m), 'soft-light', 0.8);
}
// A ragged closed outline around a rectangle (torn paper), by midpoint displacement along each side.
function _raggedRect(r, rough) {
  const pts = [], sides = [[r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h], [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y]];
  for (const [x0, y0, x1, y1] of sides) {
    let seg = [[x0, y0], [x1, y1]], amp = rough;
    for (let k = 0; k < 7; k++) { const nxt = []; for (let i = 0; i < seg.length - 1; i++) { const [ax, ay] = seg[i], [bx, by] = seg[i + 1], L = Math.hypot(bx - ax, by - ay) || 1; const o = (rand() - 0.5) * amp; nxt.push([ax, ay], [(ax + bx) / 2 + (-(by - ay) / L) * o, (ay + by) / 2 + ((bx - ax) / L) * o]); } nxt.push(seg[seg.length - 1]); seg = nxt; amp *= 0.55; }
    pts.push(...seg.slice(0, -1));
  }
  return pts;
}
// torn(g, rect, colour, seedN, {rot, rough}): a torn piece of paper stuck on the sheet: ragged edges with a white
// fringe of fibres where the paper tore, fibre texture, and a contact shadow. Returns its mask.
function torn(g, r, colour, seedN = 1, { rot = 0, rough = 26 } = {}) {
  seed(seedN * 53 + 11);
  const pts = _raggedRect(r, rough), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const shape = (grow) => { const c = canvas(); c.g.save(); c.g.translate(cx, cy); c.g.rotate(rot); c.g.translate(-cx, -cy); c.g.fillStyle = '#fff'; c.g.beginPath(); pts.forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy) || 1, gx = x + dx / L * grow * (0.5 + rand()), gy = y + dy / L * grow * (0.5 + rand()); i ? c.g.lineTo(gx, gy) : c.g.moveTo(gx, gy); }); c.g.closePath(); c.g.fill(); c.g.restore(); return c; };
  const m = shape(0), fringe = shape(3.5);
  contactShadow(g, m, seedN, { strength: 0.7 });   // no white fringe: it looked fake (Ben)
  draw(g, tint(m, colour));
  fibres(g, m, seedN, 0.8);
  return m;
}
// paint(g, points, colour, width, seedN): a dry-brush stroke of paint along a path, as in Ben's references (white
// paint over a face): bristle streaks along the stroke, ragged dry ends, a little impasto light and shade.
function paint(g, pts, colour, width = 60, seedN = 1, { dry = 0.5, alpha = 0.95 } = {}) {
  seed(seedN * 97 + 13);
  // resample the path evenly
  const P = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 3)); for (let k = 0; k < n; k++) P.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]); } P.push(pts[pts.length - 1]);
  const m = canvas(), mg = m.g; mg.lineCap = 'butt'; mg.lineJoin = 'round';
  // the body of the stroke: solid, stopping short of the ends (the ends are left to the dry bristles)
  const i0 = Math.floor(P.length * 0.06), i1 = Math.floor(P.length * (0.8 - dry * 0.15));
  mg.strokeStyle = 'rgba(255,255,255,0.92)'; mg.lineWidth = width * 0.84; mg.beginPath(); mg.moveTo(...P[i0]); for (let i = i0 + 1; i <= i1; i++) mg.lineTo(...P[i]); mg.stroke();
  // bristles: fine streaks across the full width, ending raggedly (dry brush at the tail)
  const N = Math.max(24, Math.round(width * 1.4));
  mg.lineCap = 'round';
  for (let b = 0; b < N; b++) {
    const off = (b / (N - 1) - 0.5) * width * (0.92 + rand() * 0.12);
    const edge = Math.abs(off) / (width / 2);
    const t0 = rand() * 0.05, t1 = 1 - Math.pow(rand(), 1.5) * (0.12 + dry * 0.35) - edge * rand() * 0.15;
    mg.strokeStyle = `rgba(255,255,255,${0.55 + rand() * 0.45})`; mg.lineWidth = 1.2 + rand() * 1.8;
    mg.beginPath(); let started = false;
    for (let i = Math.floor(t0 * (P.length - 1)) + 1; i <= Math.floor(t1 * (P.length - 1)); i++) {
      const [x0, y0] = P[i - 1], [x1, y1] = P[i], L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      const wob = Math.sin(i * 0.05 + b) * 0.6;
      if (!started) { mg.moveTo(x0 + nx * (off + wob), y0 + ny * (off + wob)); started = true; }
      mg.lineTo(x1 + nx * (off + wob), y1 + ny * (off + wob));
    }
    mg.stroke();
  }
  // a few dry gaps along the stroke where the brush skipped
  const n = noise(2.5); { const id = mg.getImageData(0, 0, m.width, m.height), d = id.data; for (let p = 0; p < n.length; p++) if (d[p * 4 + 3]) d[p * 4 + 3] *= clamp(1 - smooth(0.68, 0.8, n[p]) * dry * 1.4); mg.putImageData(id, 0, 0); }
  draw(g, tint(m, colour), 'source-over', alpha);
  // impasto: a lit upper edge to the bristle ridges, a shaded lower edge
  // (no shadow under paint: it read as a drop shadow; Ben)
  return m;
}
// pencil(g, x0, y0, x1, y1, seedN, {ticks}): a graphite construction line, slightly uneven in pressure, with optional
// tick marks at its ends (the measured layout lines on a paste-up).
function pencil(g, x0, y0, x1, y1, seedN = 1, { ticks = false, alpha = 0.5 } = {}) {
  seed(seedN * 29 + 3);
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L / 6)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  g.save(); g.lineCap = 'round'; g.lineWidth = 0.9;
  for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n, j = (rand() - 0.5) * 0.4; g.strokeStyle = `rgba(0,0,0,${alpha * (0.55 + rand() * 0.45)})`; g.beginPath(); g.moveTo(x0 + (x1 - x0) * a + nx * j, y0 + (y1 - y0) * a + ny * j); g.lineTo(x0 + (x1 - x0) * b + nx * j, y0 + (y1 - y0) * b + ny * j); g.stroke(); }
  if (ticks) for (const [x, y] of [[x0, y0], [x1, y1]]) { g.strokeStyle = `rgba(0,0,0,${alpha})`; g.beginPath(); g.moveTo(x - nx * 8, y - ny * 8); g.lineTo(x + nx * 8, y + ny * 8); g.stroke(); }
  g.restore();
}

// ---------- round 22: one sheet of paper, faded ink, painted letters (Ben, 25 Nov 2026) ----------
// sheet(g, colour, seedN): the ground as one piece of scanned paper: the colour with a broad, uneven fade across it
// (lighter in one area, deeper towards an edge), fine grain and a few specks. Draw it first; it replaces a flat fill.
function sheet(g, colour, seedN = 1, { fade = 1 } = {}) {
  seed(seedN * 41 + 2);
  g.fillStyle = colour; g.fillRect(0, 0, W, H);
  const cx = W * (0.3 + rand() * 0.4), cy = H * (0.25 + rand() * 0.5), n = noise(260), f = noise(0.6);
  const c = canvas(), id = c.g.createImageData(c.width, c.height), d = id.data, w = c.width;
  for (let p = 0; p < n.length; p++) {
    const x = (p % w) / K, y = ((p / w) | 0) / K, r = Math.hypot((x - cx) / W, (y - cy) / H);
    const v = 0.5 + (0.07 - r * 0.16) * fade + (n[p] - 0.5) * 0.08 * fade + (f[p] - 0.5) * 0.1 + (rand() - 0.5) * 0.06;
    d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = clamp(v) * 255; d[p * 4 + 3] = 255;
  }
  c.g.putImageData(id, 0, 0); draw(g, c, 'soft-light', 1);
}
// fadedInk(mask, colour, seedN, {from, to, min}): ink that runs unevenly: its density fades across the sheet in a
// broad gradient (heavier at `from`, lighter at `to`, never below `min`), with a fine riso-like speckle in it.
// Returns a tinted layer to draw. Use the same call for the type and for an image mask, so they match.
function fadedInk(mask, colour, seedN = 1, { from = [0.8, 0.1], to = [0.2, 0.95], min = 0.62, speckle = 0.12 } = {}) {
  seed(seedN * 59 + 4);
  const n = noise(140), f = noise(0.5), o = canvas(mask.width / K, mask.height / K); draw(o.g, mask);
  const id = o.g.getImageData(0, 0, o.width, o.height), d = id.data, w = o.width;
  const ax = from[0] * W, ay = from[1] * H, bx = to[0] * W, by = to[1] * H, L2 = (bx - ax) ** 2 + (by - ay) ** 2;
  for (let p = 0; p < n.length; p++) {
    if (!d[p * 4 + 3]) continue;
    const x = (p % w) / K, y = ((p / w) | 0) / K, t = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2);
    let a = 1 - (1 - min) * smooth(0, 1, t) + (n[p] - 0.5) * 0.18;
    if (f[p] < speckle * 0.5 || rand() < speckle * 0.08) a *= 0.35;
    d[p * 4 + 3] *= clamp(a);
  }
  o.g.putImageData(id, 0, 0); return tint(o, colour);
}
// brushLetters(mask, seedN, {dir}): turns set type (or any mask) into sign-painted letters: the edges a little
// uneven, streaks of the bristles running along the strokes (vertical by default), and the paint thinning to dry
// streaks here and there. Returns a mask. The letters keep their shapes (no distortion).
function brushLetters(mask, seedN = 1, { streak = 0.22, rough = 1 } = {}) {
  seed(seedN * 67 + 8);
  // long vertical bristle streaks (most strokes of sign-written caps are pulled down)
  const s = document.createElement('canvas'); s.width = Math.ceil(W / 1.4); s.height = Math.ceil(H / 70); const sg = s.getContext('2d'), sid = sg.createImageData(s.width, s.height);
  for (let i = 0; i < sid.data.length; i += 4) { const v = rand() * 255; sid.data[i] = sid.data[i + 1] = sid.data[i + 2] = v; sid.data[i + 3] = 255; } sg.putImageData(sid, 0, 0);
  const sc = canvas(); sc.g.imageSmoothingQuality = 'high'; sc.g.drawImage(s, 0, 0, W, H); const vs = sc.g.getImageData(0, 0, sc.width, sc.height).data;
  const wob = noise(5), fine = noise(0.8), big = noise(40);
  const soft = canvas(); soft.g.filter = `blur(${2.2 * K}px)`; draw(soft.g, mask); soft.g.filter = 'none';
  const deep = canvas(); deep.g.filter = `blur(${7 * K}px)`; draw(deep.g, mask); deep.g.filter = 'none';
  const id = soft.g.getImageData(0, 0, soft.width, soft.height), d = id.data, dd = deep.g.getImageData(0, 0, deep.width, deep.height).data;
  for (let p = 0; p < fine.length; p++) {
    let a = d[p * 4 + 3] / 255; if (!a) continue;
    a = smooth(0.44, 0.56, a + (wob[p] - 0.5) * 0.5 * rough + (fine[p] - 0.5) * 0.12);   // a wobbling brush edge
    const inner = dd[p * 4 + 3] / 255;                                                     // 1 deep inside, less near edges
    const pool = 1 - 0.16 * smooth(0.75, 1, inner);                                        // paint pools at the edges, thinner inside
    const st = vs[p * 4] / 255;
    a *= pool * (1 - streak * smooth(0.3, 0.05, st)) * (1 - 0.18 * smooth(0.6, 0.85, big[p]));
    d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = 255; d[p * 4 + 3] = clamp(a) * 255;
  }
  soft.g.putImageData(id, 0, 0); return soft;
}
// vine(g, pts, wMax, {wMin, curl}): a hand-drawn vine through points (a smooth Catmull-Rom curve), swelling in the
// middle and tapering to a hairline, ending in a small hook. Draw in white on a mask. For whiplash, snake-like
// lines (Art Nouveau, Ben's swash A reference): give it S-bends and a loop that crosses itself, never a perfect
// spiral.
function vine(g, pts, wMax = 14, { wMin = 1.2, curl = 1, swell = 0.45 } = {}) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 24; k++) {
    const t = k / 24, [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], t2 = t * t, t3 = t2 * t;
    out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
  }
  out.push(pts[pts.length - 1]);
  // the end hook: a small tightening curl continuing the last direction
  if (curl) { let [x, y] = out[out.length - 1], [px, py] = out[out.length - 2], a = Math.atan2(y - py, x - px), r = 9 * curl; for (let k = 0; k < 26; k++) { a += 0.22 * Math.sign(curl); r *= 0.95; x += Math.cos(a) * r * 0.22; y += Math.sin(a) * r * 0.22; out.push([x, y]); } }
  g.save(); g.strokeStyle = '#fff'; g.lineCap = 'round';
  for (let i = 1; i < out.length; i++) { const t = i / out.length, w = wMin + (wMax - wMin) * Math.pow(Math.sin(Math.PI * Math.min(1, t / (1 - swell * 0.3))), 1.2); g.lineWidth = Math.max(wMin, w); g.beginPath(); g.moveTo(...out[i - 1]); g.lineTo(...out[i]); g.stroke(); }
  g.restore();
}

// ---------- round 23 helpers for the scanned, two-colour style ----------
// A4 scale: masking tape is about 24 mm wide on a 210 mm sheet, so about 120 px on the poster.
const TAPE_W = 120;
// vtape(g, x, end, colour, seedN, len): a straight vertical strip of tape on a grid line, stuck over the top ('top')
// or bottom ('bottom') edge of the sheet. One per poster (Ben).
function vtape(g, x, end, colour, seedN = 1, len = 200) {
  const y = end === 'top' ? -40 : H - len + 40;
  tape(g, { x: x - TAPE_W / 2, y, w: TAPE_W, h: len }, colour, seedN);
}
// pencilGrid(g, cols, rows, seedN): pencil lines exactly on the grid: column lines (0..8) and row lines (0..8).
function pencilGrid(g, cols = [0, 8], rows = [0, 8], seedN = 1, alpha = 0.28) {
  for (const c of cols) pencil(g, M + c * COL, M - 10, M + c * COL, H - M + 10, seedN + c, { alpha });
  for (const r of rows) pencil(g, M - 10, M + r * ROW, W - M + 10, M + r * ROW, seedN + 20 + r, { alpha: alpha * 0.9 });
}
// housed(im, shape, r, {crop, thr, invert, outline, obj}): one of the day's images thresholded by luminance into a
// single ink and housed in a shape ('circle' | 'square' | 'triangle' | 'diamond') in rect r. obj: true for a 3D
// object PNG (fitted on black so only the object inks). Returns a mask for the ink.
function housed(im, shape, r, o = {}) {
  const { crop, thr = 0.5, invert = false, outline = 3, obj = false, zoom = 1 } = o;
  const c = canvas();
  if (obj) { c.g.fillStyle = '#000'; c.g.fillRect(r.x, r.y, r.w, r.h); fit(c.g, im, { x: r.x + r.w * (1 - zoom) / 2, y: r.y + r.h * (1 - zoom) / 2, w: r.w * zoom, h: r.h * zoom }); }
  else clip(c.g, r, () => cover(c.g, im, r, { crop }));
  const sh = canvas(), sg = sh.g; sg.fillStyle = '#fff'; sg.beginPath();
  const { x, y, w, h } = r, cx = x + w / 2, cy = y + h / 2;
  if (shape === 'circle') sg.arc(cx, cy, Math.min(w, h) / 2, 0, 7);
  else if (shape === 'triangle') { sg.moveTo(x, y + h * 0.06); sg.lineTo(x + w, y + h * 0.06); sg.lineTo(cx, y + h); sg.closePath(); }
  else if (shape === 'diamond') { sg.moveTo(cx, y); sg.lineTo(x + w, cy); sg.lineTo(cx, y + h); sg.lineTo(x, cy); sg.closePath(); }
  else sg.rect(x, y, w, h);
  sg.fill();
  const L = levels(c, 0.02, 0.98), m = inter(lumMask(L, thr, { invert, blur: 0.7 }), sh);
  if (!outline) return m;
  const grow = alphaThr(blurred(sh, outline * 0.9), 0.02);
  return union(m, cut(grow, sh));
}
// stylePoster(C, seedN): the ground for this style: one sheet of paper in C.paper. Returns {out, g, ink} where ink is
// a mask canvas to draw everything printed in the single ink onto (type, housed images, vines, small type).
function stylePoster(C, seedN) { const out = canvas(), g = out.g; sheet(g, C.paper, seedN); return { out, g, ink: canvas() }; }
// styleFinish(g, ink, C, seedN, fade): print the ink layer with its fade, then the paper and the scanner. Tape and
// paper pieces go on after this call's ink but before the scan: pass them as fn(g).
function styleFinish(g, ink, C, seedN, fade = {}, layers = null) {
  draw(g, fadedInk(ink, C.ink, seedN, fade));
  stock(g, C.stock || 'uncoated', seedN);
  if (layers) layers(g);
  scan(g, seedN, { amount: 1.2 });
}

// ---------- round 25: real handwriting over the top (Ben, 25 Nov 2026) ----------
// The day's handwriting scans (site/media/<date>/hand-*.jpg, listed in hand.json; scripts/handwriting.mjs fetches
// public-domain letters, manuscripts and calligraphy) are laid over the finished sheet like pen or biro doodled on
// it: the ink strokes are lifted out of the scan by luminance and printed dark and sharp over the faded paper.
// inkiest(im, aspect): where in a scan the handwriting is densest; returns a crop [x, y, w, h] (fractions) with the
// given aspect (w/h of the place it's going), avoiding blank margins and solid dark areas.
function inkiest(im, aspect = 3, { size = 0.34, inset = 0.16 } = {}) {   // inset: keep clear of page edges, bindings and mounts
  const sw = 90, sh = Math.max(8, Math.round(90 * im.height / im.width)), c = document.createElement('canvas'); c.width = sw; c.height = sh;
  const cg = c.getContext('2d'); cg.drawImage(im, 0, 0, sw, sh); const d = cg.getImageData(0, 0, sw, sh).data, L = [];
  for (let i = 0; i < sw * sh; i++) L.push(0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]);
  const sorted = [...L].sort((a, b) => a - b), paper = sorted[Math.floor(L.length * 0.7)], thr = paper * 0.72;
  const ww = Math.round(sw * size), wh = Math.max(3, Math.round(ww / aspect * im.width / im.height * sh / sw * sw / sh));
  let best = [0, 0], bs = -1;
  const x0 = Math.round(sw * inset), y0 = Math.round(sh * inset), x1 = sw - x0, y1 = sh - Math.round(sh * inset * 0.6);
  for (let y = y0; y + wh <= y1; y += 1) for (let x = x0; x + ww <= x1; x += 1) {
    let n = 0; for (let j = y; j < y + wh; j++) for (let i = x; i < x + ww; i++) n += L[j * sw + i] < thr;
    const f = n / (ww * wh), s = f > 0.22 ? 0 : f;   // handwriting is sparse: dense strokes, never solid dark or ruled edges
    if (s > bs) { bs = s; best = [x, y]; }
  }
  return [best[0] / sw, best[1] / sh, ww / sw, wh / sh];
}
// handwriting(g, im, at, {crop, rot, colour, alpha, thr}): lay an excerpt of a handwriting scan over the sheet at
// rect `at` (rotated by rot), its strokes in a dark ink (black, or the palette's darkest), crisp and slightly uneven
// like pen. thr: how much of the excerpt counts as ink (0.15 = the darkest 15%).
function handwriting(g, im, at, o = {}) {
  const { crop = inkiest(im, at.w / at.h), rot = 0, colour = '#000000', alpha = 0.92, thr = 0.14 } = o;
  const c = canvas(); c.g.save(); c.g.translate(at.x + at.w / 2, at.y + at.h / 2); c.g.rotate(rot);
  c.g.drawImage(im, crop[0] * im.width, crop[1] * im.height, crop[2] * im.width, crop[3] * im.height, -at.w / 2, -at.h / 2, at.w, at.h); c.g.restore();
  const box = (() => { const m = canvas(); m.g.save(); m.g.translate(at.x + at.w / 2, at.y + at.h / 2); m.g.rotate(rot); m.g.fillStyle = '#fff'; m.g.fillRect(-at.w / 2, -at.h / 2, at.w, at.h); m.g.restore(); return m; })();
  const lv = levels(inter(c, box), 0.02, 0.98);
  // threshold at the darkest `thr` of the excerpt's own pixels
  const id = lv.g.getImageData(0, 0, lv.width, lv.height).data, ls = [];
  for (let i = 0; i < id.length; i += 4 * 3) if (id[i + 3] > 200) ls.push((0.2126 * id[i] + 0.7152 * id[i + 1] + 0.0722 * id[i + 2]) / 255);
  ls.sort((a, b) => a - b); const t = ls[Math.floor(ls.length * thr)] || 0.3;
  const strokes = inter(lumMask(lv, t, { invert: true, soft: 0.04, blur: 0.5 }), box);
  draw(g, tint(strokes, colour), 'multiply', alpha);
  return strokes;
}

// ---------- round 27: a pop colour, and tints and shades (Ben, 26 Nov 2026) ----------
// The brief's colour wheel (scripts/lib/palette.mjs): each day's lead colour is one step on it. A POP is a bright
// colour from across the wheel (3 to 6 steps away, e.g. orange with neon green, jade, teal or cobalt blue), used very
// sparingly: one small element per poster (a rope, a kite, a hat, a sign). popFor(brief) picks one, rotating by issue.
const WHEEL = [['Red', '#F33446'], ['Orange', '#F1592A'], ['Yellow', '#F1CF43'], ['Lime', '#B5E643'], ['Green', '#4BF761'], ['Jade', '#4CF1B7'],
  ['Teal', '#4CEBEB'], ['Blue', '#2987F1'], ['Indigo', '#473CED'], ['Violet', '#8D2EEE'], ['Magenta', '#F43BEC'], ['Rose', '#F33496']];
function popOptions(colourName) {
  const i = WHEEL.findIndex(([n]) => n === colourName); if (i < 0) return [];
  return [3, 5, 4, 6, -3, -4, -5].map((d) => WHEEL[(i + d + 12) % 12]);
}
// The brief now carries it as its highlight (brief.highlight.hex; Ben renamed the pop the highlight on the site, from scripts/lib/palette.mjs, same rotation); use that when present.
function popFor(brief, k = null) { const hl = brief.highlight || brief.pop; if (hl && k == null) return hl.hex; const o = popOptions(brief.colour.name); return o[(k ?? brief.issue) % 4][1]; }
// Tints and shades of a palette colour, for shading and for making an illustration feel complete: mix toward white
// (t > 0) or black (t < 0) in linear light, so steps look even. shadesOf(hex) → [-0.5, -0.25, 0, 0.3, 0.6] steps.
function mixLin(hex, t) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const m = c.map((v) => (t >= 0 ? v + (1 - v) * t : v * (1 + t)));
  return '#' + m.map((v) => Math.round(255 * clamp(v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)).toString(16).padStart(2, '0')).join('').toUpperCase();
}
const shadesOf = (hex, steps = [-0.5, -0.25, 0, 0.3, 0.6]) => steps.map((t) => (t ? mixLin(hex, t) : hex.toUpperCase()));
