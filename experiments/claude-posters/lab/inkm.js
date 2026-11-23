// The Ink Machine's own press (site/ink-machine), lifted verbatim and wrapped so posters can call it.
// Presets: letterpress, riso, screen, stamp, copy, clean. wear/spread are the machine's two sliders (0..1).
const IM = (() => {
  const P = { m_wear: 0.5, m_spread: 0.5, m_tilt: 0, m_off: 8, m_shine: 0.55, m_light: 0.45, m_depth: 0.5, m_paper: 0.5, p_light: 135 };
  let inkPreset = 'letterpress';
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function blur1(src, dst, W, H, r, horiz) {
  const n = horiz ? W : H, m = horiz ? H : W, s1 = horiz ? 1 : W, s2 = horiz ? W : 1, inv = 1 / (2 * r + 1);
  for (let j = 0; j < m; j++) {
    const base = j * s2;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[base + clamp(k, 0, n - 1) * s1];
    for (let i = 0; i < n; i++) {
      dst[base + i * s1] = acc * inv;
      acc += src[base + Math.min(i + r + 1, n - 1) * s1] - src[base + Math.max(i - r, 0) * s1];
    }
  }
}
function blur(src, W, H, r) {
  r = Math.max(1, Math.round(r));
  const a = Float32Array.from(src), b = new Float32Array(W * H);
  for (let p = 0; p < 3; p++) { blur1(a, b, W, H, r, true); blur1(b, a, W, H, r, false); }
  return a;
}
function noise(W, H, sx, sy, seed, oct) {
  const out = new Float32Array(W * H); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const cx = Math.max(1, sx / (1 << o)), cy = Math.max(1, sy / (1 << o));
    const gw = Math.ceil(W / cx) + 2, gh = Math.ceil(H / cy) + 2, R = rng(seed * 131 + o * 977 + 7);
    const g = new Float32Array(gw * gh); for (let i = 0; i < g.length; i++) g[i] = R();
    const ix = new Int32Array(W), tx = new Float32Array(W);
    for (let x = 0; x < W; x++) { const f = x / cx; ix[x] = f | 0; const t = f - ix[x]; tx[x] = t * t * (3 - 2 * t); }
    for (let y = 0; y < H; y++) {
      const f = y / cy, iy = f | 0, t0 = f - iy, ty = t0 * t0 * (3 - 2 * t0), r0 = iy * gw, r1 = r0 + gw, row = y * W;
      for (let x = 0; x < W; x++) {
        const i = ix[x], t = tx[x];
        const a = g[r0 + i] + (g[r0 + i + 1] - g[r0 + i]) * t, b = g[r1 + i] + (g[r1 + i + 1] - g[r1 + i]) * t;
        out[row + x] += amp * (a + (b - a) * ty);
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function labels(mask, W, H, t) {
  const lab = new Int32Array(W * H), parent = [0];
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (mask[i] < t) continue;
    const l = x ? lab[i - 1] : 0, u = y ? lab[i - W] : 0;
    if (!l && !u) { lab[i] = parent.length; parent.push(parent.length); }
    else if (l && u) { const a = find(l), b = find(u); const m = Math.min(a, b); parent[a] = m; parent[b] = m; lab[i] = m; }
    else lab[i] = l || u;
  }
  const map = new Int32Array(parent.length); let n = 0;
  for (let i = 1; i < parent.length; i++) { const r = find(i); if (!map[r]) map[r] = ++n; map[i] = map[r]; }
  for (let i = 0; i < lab.length; i++) if (lab[i]) lab[i] = map[lab[i]];
  return { lab, n };
}
function shift(m, W, H, dx, dy) {
  if (!dx && !dy) return m;
  const o = new Float32Array(W * H);
  for (let y = 0; y < H; y++) { const sy = y - dy; if (sy < 0 || sy >= H) continue;
    for (let x = 0; x < W; x++) { const sx = x - dx; if (sx >= 0 && sx < W) o[y * W + x] = m[sy * W + sx]; } }
  return o;
}
function ink(src, W, H, s, seed) {
  const R = rng(seed);
  // per-letter wobble and ink bias
  const { lab, n } = labels(src, W, H, 0.15);
  const dx = new Int32Array(n + 1), dy = new Int32Array(n + 1), bias = new Float32Array(n + 1);
  for (let c = 1; c <= n; c++) { dx[c] = Math.round((R() * 2 - 1) * P.wobble * s); dy[c] = Math.round((R() * 2 - 1) * P.wobble * s); bias[c] = (R() * 2 - 1) * P.letterVar * 0.35; }
  let m = src, bm = new Float32Array(W * H);
  if (P.wobble > 0) {
    m = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, v = src[i]; if (!v) continue; const c = lab[i];
      const nx = x + (c ? dx[c] : 0), ny = y + (c ? dy[c] : 0); if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx; if (v > m[j]) { m[j] = v; bm[j] = v * bias[c]; }
    }
  } else for (let i = 0; i < m.length; i++) bm[i] = m[i] * bias[lab[i]];

  const r = (1 + P.grain * 0.7 + P.bleed * 6) * s;
  const b = blur(m, W, H, r), bb = blur(bm, W, H, r);
  const en = noise(W, H, P.grain * s * 1.6, P.grain * s * 1.6, seed + 1, 3);
  const patch = noise(W, H, P.patchSize * s, P.patchSize * s, seed + 2, 3);
  const streak = P.streaks > 0 ? (P.vStreaks
    ? noise(W, H, Math.max(1, 2.5 * s), P.patchSize * 2.5 * s, seed + 3, 2)   // squeegee pulled down the screen
    : noise(W, H, P.patchSize * 2.5 * s, Math.max(1, 2.5 * s), seed + 3, 2)) : null;
  const fine = noise(W, H, Math.max(1, 1.3 * s), Math.max(1, 1.3 * s), seed + 4, 2);
  const W2 = new Float32Array(W * H), R2 = rng(seed + 5);
  const thr = 0.5 - P.bleed * 0.3, out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) {
    const bi = b[i]; if (bi < 0.02) continue;
    const e = bi + (en[i] - 0.5) * P.rough * 0.9;
    const inside = sstep(thr - 0.04, thr + 0.04, e); if (!inside) continue;
    const core = clamp((bi - thr) / 0.45, 0, 1);
    const lb = bb[i] / Math.max(bi, 1e-3);
    let d = P.load + lb - P.patchy * (patch[i] - 0.5) * 1.8 + P.squeeze * (1 - core) * 0.55 - P.squeeze * 0.12 * core;
    if (streak) d -= P.streaks * (streak[i] - 0.5) * 1.4;
    const a = clamp(d, 0, 1);
    const g = clamp(fine[i] * 0.7 + R2() * 0.3, 0, 1);
    const holes = sstep(g - 0.05, g + 0.05, a);
    out[i] = inside * (a + (holes - a) * P.speckle);
  }
  return out;
}
function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
}
function noiseRot(W, H, sx, sy, ang, seed, oct) {
  const out = new Float32Array(W * H), ca = Math.cos(ang), sa = Math.sin(ang);
  let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const kx = (1 << o) / sx, ky = (1 << o) / sy, sd = seed * 31 + o * 7;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = (x * ca + y * sa) * kx, v = (-x * sa + y * ca) * ky;
      const iu = Math.floor(u), iv = Math.floor(v); let tu = u - iu, tv = v - iv;
      tu = tu * tu * (3 - 2 * tu); tv = tv * tv * (3 - 2 * tv);
      const a = hash2(iu, iv, sd), b = hash2(iu + 1, iv, sd), c = hash2(iu, iv + 1, sd), d = hash2(iu + 1, iv + 1, sd);
      out[y * W + x] += amp * ((a + (b - a) * tu) * (1 - tv) + (c + (d - c) * tu) * tv);
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function roughEdges(src, W, H, s, seed, amt) {
  const m = blur(src, W, H, Math.max(1, (0.5 + amt * 1.5) * s)), out = new Float32Array(W * H);
  if (amt <= 0) { for (let i = 0; i < m.length; i++) out[i] = sstep(0.42, 0.58, m[i]); return out; }
  const en = noise(W, H, Math.max(1, 2.2 * s), Math.max(1, 2.2 * s), seed + 31, 3);
  const bites = noise(W, H, Math.max(1, 5 * s), Math.max(1, 5 * s), seed + 32, 2);
  const fl = noise(W, H, Math.max(1, 1.6 * s), Math.max(1, 1.6 * s), seed + 33, 1);
  for (let i = 0; i < m.length; i++) {
    const v = m[i]; if (v < 0.03) continue;
    const band = 1 - Math.abs(v - 0.5) * 2;                       // 1 at the edge, 0 deep inside/outside
    let e = v + (en[i] - 0.5) * amt * 0.55;                       // wandering edge
    let a = sstep(0.44, 0.56, e);
    a *= 1 - sstep(0.72, 0.8, bites[i] + band * amt * 0.25) * band * amt;   // bites out of the edge
    if (v < 0.45 && v > 0.08 && fl[i] > 0.86 - amt * 0.06) a = Math.max(a, 0.9); // stray flecks just outside
    out[i] = a;
  }
  return out;
}
function press(src, W, H, s, seed, deboss, sheet = true) {
  // A real impression is a flat face with a thin, steep wall, and the paper's own fibres
  // are what catch the light. So: build a height map in pixels (steep walls, gentle pull,
  // fibrous paper, smoother where the die has crushed it), then light it properly.
  const sg = deboss ? -1 : 1, Hs = P.p_height * 4 * s, ts = P.p_texScale;
  const wall = blur(src, W, H, Math.max(1, P.p_depth * s * 0.6));
  const pull = P.p_pull > 0 ? blur(src, W, H, 16 * s) : null;
  const near = !sheet ? blur(src, W, H, 24 * s) : null;
  let t1 = null, t2 = null, t3 = null, t4 = null;
  if (P.p_grain > 0) {
    t1 = noise(W, H, Math.max(1, 1.3 * s * ts), Math.max(1, 1.3 * s * ts), seed + 21, 2);
    t2 = noise(W, H, 6 * s * ts, 6 * s * ts, seed + 22, 2);
    t3 = noiseRot(W, H, 10 * s * ts, Math.max(0.8, 1.1 * s * ts), 0.5, seed + 23, 1);
    t4 = noiseRot(W, H, 8 * s * ts, Math.max(0.8, 1.1 * s * ts), -1.1, seed + 24, 1);
  }
  const Hp = new Float32Array(W * H), face = new Float32Array(W * H);
  for (let i = 0; i < Hp.length; i++) {
    const base = sstep(0.3, 0.7, wall[i]); face[i] = base;
    let h = Math.max(base, pull ? sstep(0, 0.5, pull[i]) * P.p_pull * 0.35 : 0) * Hs * sg;
    if (t1) {
      const tex = (t1[i] - 0.5) * 0.7 + (t2[i] - 0.5) * 0.2 + Math.max(t3[i] - 0.62, 0) * 1.1 + Math.max(t4[i] - 0.64, 0) * 0.9;
      h += tex * P.p_grain * 1.6 * s * (1 - 0.65 * base) * (near ? sstep(0, 0.06, near[i]) : 1);
    }
    Hp[i] = h;
  }
  const th = P.p_light * Math.PI / 180, el = P.p_elev * Math.PI / 180;
  const lx = Math.cos(th) * Math.cos(el), ly = -Math.sin(th) * Math.cos(el), lz = Math.sin(el), tanE = Math.tan(el);
  const ux = Math.cos(th), uy = -Math.sin(th), cd = P.p_cast * Hs / tanE * 1.5;
  const [c, x, im] = blankCanvas(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = y * W + X;
    const dx = (Hp[X < W - 1 ? i + 1 : i] - Hp[X > 0 ? i - 1 : i]) * 0.5, dy = (Hp[y < H - 1 ? i + W : i] - Hp[y > 0 ? i - W : i]) * 0.5;
    const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    const delta = (-dx * lx - dy * ly + lz) * inv - lz;
    let hi = 0, lo = 0;
    if (delta > 0) hi = delta / (1 - lz) * P.p_hi * 1.3; else lo = -delta / lz * P.p_lo * 1.1;
    if (cd >= 1 && (wall[i] > 0.01 && wall[i] < 0.99 || face[i] > 0.5 === deboss)) {
      for (let k = 1; k <= 3; k++) {
        const dist = cd * k / 3, sx = Math.round(X + ux * dist), sy = Math.round(y + uy * dist);
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) break;
        if (Hp[sy * W + sx] - Hp[i] > dist * tanE * 0.9) { lo += 0.35 * P.p_cast; break; }
      }
    }
    lo = clamp(lo, 0, 0.85); hi = clamp(hi, 0, 0.85);
    const A = lo + hi * (1 - lo); if (A < 0.004) continue;
    const v = 255 * hi * (1 - lo) / A, o = i * 4; d[o] = v; d[o + 1] = v; d[o + 2] = v; d[o + 3] = A * 255;
  }
  x.putImageData(im, 0, 0); return c;
}
function blankCanvas(W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); return [c, x, x.createImageData(W, H)]; }
const INK = {
  letterpress: { bleed: .2, rough: .35, grain: 3, load: 1, patchy: .35, patchSize: 300, squeeze: .7, speckle: .35, streaks: .05, letterVar: .35 },
  riso:        { bleed: .1, rough: .3, grain: 2, load: .88, patchy: .5, patchSize: 180, squeeze: .1, speckle: .7, streaks: .35, letterVar: .5 },
  screen:      { bleed: .3, rough: .45, grain: 5, load: .95, patchy: .3, patchSize: 400, squeeze: .3, speckle: .25, streaks: .5, letterVar: .3, vStreaks: true },
  stamp:       { bleed: .3, rough: .75, grain: 6, load: .8, patchy: .75, patchSize: 120, squeeze: .5, speckle: .75, streaks: .12, letterVar: .75 },
  copy:        { bleed: .45, rough: .6, grain: 2.5, load: 1.08, patchy: .15, patchSize: 500, squeeze: 0, speckle: .3, streaks: .2, letterVar: .1 },
  clean:       { bleed: .12, rough: .2, grain: 2.5, load: 1, patchy: .15, patchSize: 300, squeeze: .25, speckle: .15, streaks: 0, letterVar: .15 },
};
function applyMacros() {
  const b = INK[inkPreset], w = 0.3 + P.m_wear * 1.4, sp = P.m_spread * 2;
  Object.assign(P, { vStreaks: false }, b, {
    bleed: clamp(b.bleed * sp, 0, 0.8), rough: clamp(b.rough * w, 0, 1), speckle: clamp(b.speckle * w, 0, 1), patchy: clamp(b.patchy * w, 0, 1),
    streaks: clamp(b.streaks * w, 0, 1), letterVar: clamp(b.letterVar * w, 0, 1), wobble: 0, rot: P.m_tilt, load: b.load - (P.m_wear - 0.5) * 0.2,
    ox: Math.round(P.m_off * 0.82), oy: Math.round(P.m_off * 0.57), op2: 1,
  });
  const sh = P.m_shine;
  Object.assign(P, { f_angle: 125, f_pos: P.m_light, f_width: 0.42 - 0.27 * sh, f_contrast: 0.25 + 0.55 * sh, f_warp: 0.45, f_scuff: 0.55 - 0.35 * sh, f_tooth: 0.5 - 0.35 * sh, f_breaks: 0 });
  const d = P.m_depth, pp = P.m_paper;
  Object.assign(P, { p_height: 0.2 + 0.7 * d, p_depth: 1 + 1.6 * d, p_pull: 0.12 + 0.35 * d, p_cast: 0.2 + 0.4 * d, p_grain: 0.9 * pp, p_texScale: 0.8 + 0.6 * pp, p_elev: 38, p_hi: 0.7, p_lo: 0.7 });
}
  // --- foil (from the Ink Machine) and the state it reads from the page there ---
  let metal = 'gold', paperHex = '#ffffff', foilHex = '#ffffff';
  const $ = (sel) => ({ value: sel === '#paper' ? paperHex : foilHex });
const METALS = {
  gold:   ['#4a3510', '#9c7429', '#d8b65e', '#fff3cc'],
  silver: ['#3c3f45', '#878b93', '#c6c9cf', '#fbfcfd'],
  copper: ['#4e2210', '#9e512a', '#d58d60', '#fbe1cb'],
  rose:   ['#5a2e2a', '#a7685e', '#dcab9d', '#fff0ea'],
  black:  ['#040404', '#0e0e0e', '#3a3a3a', '#f4f4f4'],
  white:  ['#9a9a9a', '#d8d8d8', '#f1f1f1', '#ffffff'],
};
const rgbOf = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function hsl(h, s, l) {
  const k = n => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const tone4 = (st, e) => e < 1 / 3 ? mixc(st[0], st[1], e * 3) : e < 2 / 3 ? mixc(st[1], st[2], (e - 1 / 3) * 3) : mixc(st[2], st[3], (e - 2 / 3) * 3);
function foil(src, W, H, s, seed) {
  // Foil is a mirror: what you see is the room's light reflected across the whole sheet,
  // continuous from letter to letter, bent a little by the paper and roughed by fine scratches.
  const m = roughEdges(src, W, H, s, seed, P.m_fedge), D = Math.max(W, H);
  const ang = P.f_angle * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const warp = noise(W, H, D * 0.45, D * 0.45, seed + 11, 3);
  // Mirror finish: the foil reflects a real room, so add hard-edged reflections (softboxes, window bars,
  // a horizon) that bend with the paper. Matte blurs them away into the smooth gradient.
  const mir = Math.pow(P.m_shine, 1.3), edgeW = 0.003 + (1 - P.m_shine) * 0.06;
  const ripple = mir > 0 ? noise(W, H, D * 0.07, D * 0.07, seed + 16, 3) : null;
  const RB = rng(seed + 17), bands = [];
  for (let k = 0; k < 6; k++) bands.push({ c: RB() * 1.2 - 0.1, w: 0.005 + RB() * 0.05, v: k < 2 ? 0.95 : 0.35 + RB() * 0.4 });
  const horizon = 0.25 + RB() * 0.5;
  // Only some of a real foil catches the light: small tilts in the stamp send the rest into shadow.
  const catchN = P.m_catch > 0 ? noise(W, H, D * 0.09, D * 0.09, seed + 18, 3) : null;
  const scuff = P.f_scuff > 0 ? noiseRot(W, H, 160 * s, Math.max(0.7, 0.9 * s), ang + 1.2, seed + 12, 2) : null;
  const tooth = P.f_tooth > 0 ? noise(W, H, Math.max(1, 2.2 * s), Math.max(1, 2.2 * s), seed + 13, 2) : null;
  const brk = P.f_breaks > 0 ? noise(W, H, Math.max(1, 3 * s), Math.max(1, 3 * s), seed + 14, 2) : null;
  const holo = metal === 'holo';
  let st;
  if (metal === 'tone') {
    // a satin foil a shade off the paper: nearly invisible until it catches the light
    const c = rgbOf($('#paper').value), warm = mixc(c, [120, 60, 30], 0.18);
    st = [mixc(warm, [0, 0, 0], 0.65), mixc(mixc(warm, [110, 45, 25], 0.25), [0, 0, 0], 0.3), mixc(warm, [200, 140, 105], 0.3), mixc(c, [255, 225, 200], 0.5)];
  } else if (metal === 'custom') { const c = rgbOf($('#foilColour').value); st = [mixc(c, [0, 0, 0], 0.65), mixc(c, [0, 0, 0], 0.25), mixc(c, [255, 255, 255], 0.3), mixc(c, [255, 255, 255], 0.82)]; }
  else if (!holo) st = METALS[metal].map(rgbOf);
  let pmin = Infinity, pmax = -Infinity;
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const p = cx * ca + cy * sa; pmin = Math.min(pmin, p); pmax = Math.max(pmax, p); }
  const span = pmax - pmin, wd = P.f_width, pos = P.f_pos, con = 0.6 + P.f_contrast * 1.3;
  // Sculpted: a pillowed height map (plus a little liquid wobble) whose normals bend the reflection,
  // so each letter picks up its own window highlight and rim, like a sculpted gloss foil.
  const dome = P.m_dome, gloss = metal === 'black' || metal === 'white';
  let Hp = null;
  if (dome > 0) {
    const r = (3 + 9 * dome) * s, b = blur(src, W, H, r), wob = noise(W, H, 70 * s, 70 * s, seed + 15, 2), Hs = dome * 9 * s;
    Hp = new Float32Array(W * H);
    for (let i = 0; i < Hp.length; i++) Hp[i] = (sstep(0.5, 0.97, b[i]) * Hs + (wob[i] - 0.5) * 4 * s * dome) * sstep(0.45, 0.6, b[i]);
  }
  const [c, x, im] = blankCanvas(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = y * W + X, v = m[i]; if (v < 0.02) continue;
    let al = v;
    if (brk) { const t = P.f_breaks * 0.55; al *= sstep(t - 0.03, t + 0.03, brk[i]); if (!al) continue; }
    let t = ((X * ca + y * sa) - pmin) / span + (warp[i] - 0.5) * P.f_warp * 0.5, win = 0, rim = 0;
    if (Hp) {
      const dx = (Hp[X < W - 1 ? i + 1 : i] - Hp[X > 0 ? i - 1 : i]) * 0.5, dy = (Hp[y < H - 1 ? i + W : i] - Hp[y > 0 ? i - W : i]) * 0.5;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1), nx = -dx * inv, ny = -dy * inv, nz = inv;
      const rx = 2 * nz * nx, ry = 2 * nz * ny;
      t += (rx * ca + ry * sa) * 0.8;
      // a soft-edged studio window, up and to the left, seen in the reflection
      const wx = (rx + 0.42) / 0.3, wy = (ry + 0.36) / 0.22;
      win = (1 - sstep(0.7, 1, Math.abs(wx))) * (1 - sstep(0.6, 1, Math.abs(wy)));
      rim = sstep(0.75, 0.35, nz) * 0.5;
    }
    const d1 = (t - pos) / wd, d2 = (t - pos - 0.55) / (wd * 1.6), d3 = (t - pos + 0.5) / (wd * 2.2);
    const main = Math.exp(-d1 * d1 * 2);
    let e = 0.12 + 0.74 * Math.min(1, main * 0.95 + 0.25 * Math.exp(-d2 * d2 * 2) + 0.14 * Math.exp(-d3 * d3 * 2));
    if (mir > 0) {
      const tm = t + (ripple[i] - 0.5) * 0.05 * mir - (pos - 0.45);
      let sharp = sstep(horizon - edgeW, horizon + edgeW, tm) * 0.22;
      for (const bd of bands) { const dd = Math.abs(tm - bd.c); if (dd < bd.w + edgeW) sharp = Math.max(sharp, bd.v * (1 - sstep(bd.w - edgeW, bd.w + edgeW, dd))); }
      e = e * (1 - 0.75 * mir) + Math.max(sharp, main * 0.45) * mir;
    }
    if (catchN) {
      const g = sstep(0.62 - P.m_catch * 0.12, 0.72 - P.m_catch * 0.1, catchN[i] + (main - 0.5) * 0.35);
      e = e * (1 - P.m_catch * 0.7 * (1 - g)) + g * P.m_catch * 0.18 * main;
    }
    if (gloss) e = 0.08 + (e - 0.12) * 0.55;
    if (Hp) e = Math.min(1, e + win * (gloss ? 0.95 : 0.6) + rim * (0.3 + 0.4 * main));
    if (scuff) e += (scuff[i] - 0.5) * P.f_scuff * 0.22 * (0.35 + main) * (gloss ? 0.3 : 1);
    if (tooth) e += (tooth[i] - 0.5) * P.f_tooth * 0.16;
    e = clamp(0.5 + (e - 0.5) * con, 0, 1);
    const col = holo ? hsl(((t * 0.9 + warp[i] * 0.4) % 1 + 1) % 1, 0.35, 0.38 + 0.5 * e) : tone4(st, e);
    const o = i * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = al * 255;
  }
  x.putImageData(im, 0, 0); return c;
}
function roomLight(W, H, s, seed) {
  const D = Math.max(W, H), ang = P.f_angle * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const warp = noise(W, H, D * 0.45, D * 0.45, seed + 11, 3);
  let pmin = Infinity, pmax = -Infinity;
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const p = cx * ca + cy * sa; pmin = Math.min(pmin, p); pmax = Math.max(pmax, p); }
  const span = pmax - pmin, wd = Math.max(0.2, P.f_width * 2.4);
  const [c, x, im] = blankCanvas(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = y * W + X, t = ((X * ca + y * sa) - pmin) / span + (warp[i] - 0.5) * P.f_warp * 0.5, q = (t - P.f_pos) / wd;
    const L = Math.exp(-q * q * 2), hi = 0.16 * L, lo = 0.22 * (1 - L);
    const A = lo + hi * (1 - lo), o = i * 4, v = 255 * hi * (1 - lo) / A;
    d[o] = v; d[o + 1] = v; d[o + 2] = v; d[o + 3] = A * 255;
  }
  x.putImageData(im, 0, 0); return c;
}
  const alphaOf = (c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, a = new Float32Array(c.width * c.height); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255; return a; };
  const toCanvas = (a, w, h) => { const c = canvas(w / K, h / K), im = c.g.createImageData(w, h), d = im.data; for (let i = 0; i < a.length; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = clamp(a[i], 0, 1) * 255; } c.g.putImageData(im, 0, 0); return c; };
  // Print a mask (white on transparent) with an Ink Machine preset; returns a mask.
  function print(mask, preset = 'letterpress', o = {}) {
    inkPreset = preset; P.m_wear = o.wear ?? 0.5; P.m_spread = o.spread ?? 0.5; applyMacros();
    const w = mask.width, h = mask.height;
    return toCanvas(ink(alphaOf(mask), w, h, 1, o.seed ?? 47), w, h);
  }
  // The machine's paper: fibres lit from the top left, as a light/shadow overlay to draw over everything.
  function paper(rough = 0.5, seed = 47) {
    P.m_paper = rough; applyMacros();
    const c = press(new Float32Array(W * K * H * K), W * K, H * K, 1, seed, true, true);
    const o = canvas(); o.g.drawImage(c, 0, 0, W, H); return o;
  }
  // Foil: metal 'gold' | 'silver' | 'copper' | 'rose' | 'black' | 'white' (gloss) | 'holo' | 'tone' (a satin foil a
  // shade off the paper: use for spot varnish) | 'custom' (any colour: colourful foil). Returns a colour canvas.
  // o: shine 0..1 (matte..mirror), light 0..1 (where the highlight sits), catch 0..1, dome 0..1 (flat..sculpted/raised),
  //    edge 0..1 (crisp..rough), colour (custom), paper (tone), seed.
  function foilPrint(mask, o = {}) {
    metal = o.metal || 'gold'; foilHex = o.colour || '#ffffff'; paperHex = o.paper || '#ffffff';
    Object.assign(P, { m_shine: o.shine ?? 0.55, m_light: o.light ?? 0.45, m_catch: o.catch ?? 0.5, m_dome: o.dome ?? 0, m_fedge: o.edge ?? 0.35 });
    applyMacros();
    const w = mask.width, h = mask.height, f = foil(alphaOf(mask), w, h, 1, o.seed ?? 47);
    const c = canvas(w / K, h / K); c.g.drawImage(f, 0, 0, w / K, h / K); return c;
  }
  // The room light that falls on the paper around a foil (draw it under the foil, over the paper).
  function foilRoom(o = {}) {
    Object.assign(P, { m_shine: o.shine ?? 0.55, m_light: o.light ?? 0.45 }); applyMacros();
    const r = roomLight(W * K, H * K, 1, o.seed ?? 47), c = canvas(); c.g.drawImage(r, 0, 0, W, H); return c;
  }
  // Emboss (raised) or deboss (pressed in): light and shadow only, to draw over whatever is printed there.
  function relief(mask, o = {}) {
    Object.assign(P, { m_depth: o.depth ?? 0.5, m_paper: o.paper ?? 0.5, p_light: o.light ?? 135 }); applyMacros();
    const w = mask.width, h = mask.height, r = press(alphaOf(mask), w, h, 1, o.seed ?? 47, !!o.deboss, false);
    const c = canvas(w / K, h / K); c.g.drawImage(r, 0, 0, w / K, h / K); return c;
  }
  return { print, paper, foil: foilPrint, foilRoom, relief, P };
})();
