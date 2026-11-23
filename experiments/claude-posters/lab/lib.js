// Daily Poster toolkit. Design in 1080×1528 units; every canvas is K× for print-quality output.
const W = 1080, H = 1528, K = 2, M = 16;
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
  const { font, size = 12, weight = 500, color = '#000', align = 'left', track = 0, caps = false } = o;
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
  if (blur) g.filter = `blur(${blur}px)`; g.drawImage(src, 0, 0, src.width / K, src.height / K); g.filter = 'none';
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
const TEXT = { size: 16, lead: 0.9 };
// Break text into lines for a width.
function breakLines(g, text, w) {
  const words = text.split(/\s+/), lines = []; let line = [];
  for (const wd of words) { const t = [...line, wd].join(' '); if (g.measureText(t).width > w && line.length) { lines.push(line.join(' ')); line = [wd]; } else line.push(wd); }
  if (line.length) lines.push(line.join(' ')); return lines;
}
// A subline as a block: try widths between minW and maxW, keep the one whose lines are most even, with 3–4 lines
// preferred, never a one-word last line (no orphans) and never a last line much shorter than the rest.
function balance(text, o) {
  const { font, size = TEXT.size, weight = 500, minW = 160, maxW = 420, lines: want = [3, 4] } = o;
  const g = canvas(10, 10).g; g.font = `${weight} ${size}px "${font}"`;
  let best = null;
  for (let w = minW; w <= maxW; w += 2) {
    const L = breakLines(g, text, w), ws = L.map((l) => g.measureText(l).width), mx = Math.max(...ws);
    const lastWords = L[L.length - 1].split(' ').length;
    let score = Math.min(...ws) / mx;                                    // evenness
    if (lastWords < 2) score -= 1;                                       // orphan
    if (ws[ws.length - 1] < mx * 0.6) score -= 0.5;                      // short last line
    if (!(L.length >= want[0] && L.length <= want[1])) score -= 0.3;
    if (!best || score > best.score) best = { score, w: Math.ceil(mx), lines: L };
  }
  return best;
}
// Set a block of lines with its ink edge exactly on x (left, or right with align 'right') and its first cap
// height on y (anchor 'top') or its last baseline on y (anchor 'bottom'). Returns the block's rect.
function block(g, lines, x, y, o) {
  const { font, size = TEXT.size, weight = 500, lead = TEXT.lead, color = '#000', align = 'left', anchor = 'top', track = 0 } = o;
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
  const merged = (lines, k) => lines.some((t) => blobs(t.c) > blobs(IM.print(t.c, k.preset, { wear: k.wear, spread: k.spread, seed: 7 })));
  let k = { ...ink };
  for (const sp of [ink.spread, 0.18, 0.12, 0.07, 0.03]) { k = { ...ink, spread: Math.min(ink.spread, sp) }; if (!merged(r.lines, k)) return { ...r, o, ink: k }; }
  let oo = { ...o };
  for (let i = 0; i < 6; i++) { oo = { ...oo, minGap: (oo.minGap ?? 18) + 3 }; const r2 = sameOptical8(texts, oo, maxW); if (!merged(r2.lines, k)) return { ...r2, o: oo, ink: k }; }
  return { ...sameOptical8(texts, oo, maxW), o: oo, ink: k };
}

// ---------- print styles and paper stocks (vary them: one look across every poster is a giveaway) ----------
// printHead(g, mask, colour, style, o): put a mask on the poster with a print process.
//   ink:   'letterpress' | 'riso' | 'screen' | 'stamp' | 'copy' (photocopy) | 'clean' | 'bleed' (fat, soaked) | 'crisp'
//   foil:  'foil-black' | 'foil-white' (gloss) | 'foil-gold' | 'foil-silver' | 'foil-copper' | 'foil-holo' |
//          'foil-colour' (raised colourful foil in `colour`) | 'varnish' (spot varnish: tone-on-tone gloss, o.paper = the colour under it)
//   press: 'emboss' (flat colour, raised) | 'deboss' (flat colour, pressed in)
// o: wear, spread, seed, paper (the colour underneath, for varnish/tone), light.
const PRINT_STYLES = ['letterpress', 'riso', 'screen', 'stamp', 'copy', 'clean', 'bleed', 'crisp', 'foil-black', 'foil-white', 'foil-gold', 'foil-silver', 'foil-holo', 'foil-colour', 'varnish', 'emboss', 'deboss'];
function printHead(g, mask, colour, style = 'letterpress', o = {}) {
  const seed = o.seed ?? 11;
  const INKS = { bleed: ['riso', { wear: 0.6, spread: 0.85 }], crisp: ['clean', { wear: 0.1, spread: 0.15 }] };
  if (INKS[style] || ['letterpress', 'riso', 'screen', 'stamp', 'copy', 'clean'].includes(style)) {
    const [preset, d] = INKS[style] || [style, {}];
    draw(g, tint(IM.print(mask, preset, { wear: o.wear ?? d.wear ?? 0.4, spread: o.spread ?? d.spread ?? 0.3, seed }), colour));
    return;
  }
  if (style.startsWith('foil') || style === 'varnish') {
    const metal = style === 'varnish' ? 'tone' : style === 'foil-colour' ? 'custom' : style.slice(5);
    const fo = { metal, colour, paper: o.paper || colour, seed, shine: o.shine ?? (style === 'varnish' ? 0.75 : 0.6), light: o.light ?? 0.42,
      dome: o.dome ?? (style === 'foil-colour' ? 0.55 : ['foil-black', 'foil-white'].includes(style) ? 0.35 : 0), edge: o.edge ?? 0.3 };
    if (o.room !== false) draw(g, IM.foilRoom(fo), 'source-over', 0.35);   // once per poster: pass room: false for a second foil
    draw(g, IM.foil(mask, fo));
    if (style === 'foil-colour' || style === 'varnish') draw(g, IM.relief(mask, { depth: 0.45, seed }));
    return;
  }
  if (style === 'emboss' || style === 'deboss') {
    draw(g, tint(IM.print(mask, 'clean', { wear: 0.15, spread: 0.2, seed }), colour));
    draw(g, IM.relief(mask, { deboss: style === 'deboss', depth: 0.6, seed }));
  }
}
// stock(g, kind): the paper the poster is printed on, drawn last over everything.
//   'smooth' | 'uncoated' | 'rough' | 'newsprint' (grey fibres and specks) | 'photocopy' (toner grain and streaks) | 'none'
function stock(g, kind = 'uncoated', seedN = 1) {
  if (kind === 'none') return;
  const rough = { smooth: 0.15, uncoated: 0.45, rough: 0.9, newsprint: 0.7, photocopy: 0.3 }[kind] ?? 0.45;
  draw(g, IM.paper(rough, seedN), 'source-over', kind === 'smooth' ? 0.5 : 0.8);
  if (kind === 'newsprint') grain(g, 0.16, 0.9, 'multiply');
  if (kind === 'photocopy') { grain(g, 0.12, 0.35, 'overlay'); const s = canvas(); s.g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 9; i++) s.g.fillRect(0, rand() * H, W, 1 + rand() * 3); draw(g, s, 'multiply'); }
  else grain(g, kind === 'smooth' ? 0.04 : 0.07, 0.5);
}
