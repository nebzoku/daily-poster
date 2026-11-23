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
  return { print, paper, P };
})();
