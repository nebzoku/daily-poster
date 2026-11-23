// The print finishes from benharwood.design (Ben's portfolio), from its ink-worker.js (kept unchanged beside this file
// as portfolio-ink-worker.js). Same engine as the Ink Machine, with Ben's calmer ink values, neutral spot varnishes,
// brighter colour foils and monochrome foils. Wrapped so posters can call it directly: PF.render({...}) → RGBA pixels.
const PF = (() => {
/* Ink treatments for the wordmark, ported from the Daily Poster Ink Machine.
   The page sends the wordmark as a coverage mask (0..1 per pixel); this sends back
   RGBA pixels for one monochrome print finish. Runs off the main thread. */

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function blur1(src, dst, W, H, r, horiz) {
  const n = horiz ? W : H, m = horiz ? H : W, s1 = horiz ? 1 : W, s2 = horiz ? W : 1, inv = 1 / (2 * r + 1);
  for (let j = 0; j < m; j++) {
    const base = j * s2; let acc = 0;
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
function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
}
function noiseRot(W, H, sx, sy, ang, seed, oct) {
  const out = new Float32Array(W * H), ca = Math.cos(ang), sa = Math.sin(ang); let amp = 1, tot = 0;
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

/* ---------- ink: letterpress, screen print, riso, rubber stamp ---------- */
// Tuned to be quiet: tight edges and light wear, so they read as real printing rather than distressed.
const INK = {
  letterpress: { bleed: .06, rough: .14, grain: 2, load: 1.02, patchy: .14, patchSize: 320, squeeze: .45, speckle: .12, streaks: 0, letterVar: .15 },
  riso:        { bleed: .04, rough: .12, grain: 1.6, load: .96, patchy: .22, patchSize: 220, squeeze: .05, speckle: .3, streaks: .12, letterVar: .25 },
  screen:      { bleed: .08, rough: .16, grain: 2.6, load: 1, patchy: .12, patchSize: 420, squeeze: .15, speckle: .08, streaks: .16, letterVar: .12, vStreaks: true },
  stamp:       { bleed: .1, rough: .3, grain: 3, load: .93, patchy: .32, patchSize: 160, squeeze: .3, speckle: .3, streaks: .04, letterVar: .35 },
};
function ink(src, W, H, s, seed, P) {
  const k = sizeK(s); P = { ...P, rough: P.rough * (0.35 + 0.65 * k), speckle: P.speckle * (0.3 + 0.7 * k), bleed: P.bleed * (0.5 + 0.5 * k) };
  const { lab, n } = labels(src, W, H, 0.15), R = rng(seed), bias = new Float32Array(n + 1);
  for (let c = 1; c <= n; c++) bias[c] = (R() * 2 - 1) * P.letterVar * 0.35;
  const bm = new Float32Array(W * H);
  for (let i = 0; i < src.length; i++) bm[i] = src[i] * bias[lab[i]];
  const r = (1 + P.grain * 0.7 + P.bleed * 6) * s;
  const b = blur(src, W, H, r), bb = blur(bm, W, H, r);
  const en = noise(W, H, P.grain * s * 1.6, P.grain * s * 1.6, seed + 1, 3);
  const patch = noise(W, H, P.patchSize * s, P.patchSize * s, seed + 2, 3);
  const streak = P.streaks > 0 ? (P.vStreaks
    ? noise(W, H, Math.max(1, 2.5 * s), P.patchSize * 2.5 * s, seed + 3, 2)
    : noise(W, H, P.patchSize * 2.5 * s, Math.max(1, 2.5 * s), seed + 3, 2)) : null;
  const fine = noise(W, H, Math.max(1, 1.3 * s), Math.max(1, 1.3 * s), seed + 4, 2);
  const R2 = rng(seed + 5), thr = 0.5 - P.bleed * 0.3, out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) {
    const bi = b[i]; if (bi < 0.02) continue;
    const e = bi + (en[i] - 0.5) * P.rough * 0.9;
    const inside = sstep(thr - 0.04, thr + 0.04, e); if (!inside) continue;
    const core = clamp((bi - thr) / 0.45, 0, 1), lb = bb[i] / Math.max(bi, 1e-3);
    let d = P.load + lb - P.patchy * (patch[i] - 0.5) * 1.8 + P.squeeze * (1 - core) * 0.55 - P.squeeze * 0.12 * core;
    if (streak) d -= P.streaks * (streak[i] - 0.5) * 1.4;
    const a = clamp(d, 0, 1), g = clamp(fine[i] * 0.7 + R2() * 0.3, 0, 1), holes = sstep(g - 0.05, g + 0.05, a);
    out[i] = inside * (a + (holes - a) * P.speckle);
  }
  return out;
}

/* ---------- foil: black on a light page, white on a dark one ---------- */
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgbOf = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const tone4 = (st, e) => e < 1 / 3 ? mixc(st[0], st[1], e * 3) : e < 2 / 3 ? mixc(st[1], st[2], (e - 1 / 3) * 3) : mixc(st[2], st[3], (e - 2 / 3) * 3);
const METALS = { black: ['#040404', '#0e0e0e', '#3a3a3a', '#f4f4f4'], white: ['#9a9a9a', '#d8d8d8', '#f1f1f1', '#ffffff'],
  silver: ['#5c5c5c', '#9c9c9c', '#d4d4d4', '#ffffff'], graphite: ['#1c1c1c', '#2e2e2e', '#555555', '#b4b4b4'] };
// Small prints (phones, case-page headers): the edge texture can't shrink below a pixel, so it reads coarse.
// Calm it down as the print gets smaller: 0 at the tiniest, 1 at desktop size.
const sizeK = (s) => clamp((s - 0.25) / 0.75, 0, 1);
function roughEdges(src, W, H, s, seed, amt) {
  amt *= 0.25 + 0.75 * sizeK(s);
  const m = blur(src, W, H, Math.max(1, (0.5 + amt * 1.5) * s)), out = new Float32Array(W * H);
  const en = noise(W, H, Math.max(1, 2.2 * s), Math.max(1, 2.2 * s), seed + 31, 3);
  const bites = noise(W, H, Math.max(1, 5 * s), Math.max(1, 5 * s), seed + 32, 2);
  for (let i = 0; i < m.length; i++) {
    const v = m[i]; if (v < 0.03) continue;
    const band = 1 - Math.abs(v - 0.5) * 2;
    const e = v + (en[i] - 0.5) * amt * 0.55;
    let a = sstep(0.44, 0.56, e);
    a *= 1 - sstep(0.72, 0.8, bites[i] + band * amt * 0.25) * band * amt;
    out[i] = a;
  }
  return out;
}
function foil(src, W, H, s, seed, metal, P) {
  const m = roughEdges(src, W, H, s, seed, 0.3), D = Math.max(W, H);
  const ang = P.f_angle * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const warp = noise(W, H, D * 0.45, D * 0.45, seed + 11, 3);
  const mir = Math.pow(P.m_shine, 1.3), edgeW = 0.003 + (1 - P.m_shine) * 0.06;
  const ripple = noise(W, H, D * 0.07, D * 0.07, seed + 16, 3);
  const RB = rng(seed + 17), bands = [];
  for (let k = 0; k < 6; k++) bands.push({ c: RB() * 1.2 - 0.1, w: 0.005 + RB() * 0.05, v: k < 2 ? 0.95 : 0.35 + RB() * 0.4 });
  const horizon = 0.25 + RB() * 0.5;
  const scuff = noiseRot(W, H, 160 * s, Math.max(0.7, 0.9 * s), ang + 1.2, seed + 12, 2);
  const tooth = noise(W, H, Math.max(1, 2.2 * s), Math.max(1, 2.2 * s), seed + 13, 2);
  const st = Array.isArray(metal) ? metal : METALS[metal].map(rgbOf);
  let pmin = Infinity, pmax = -Infinity;
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const p = cx * ca + cy * sa; pmin = Math.min(pmin, p); pmax = Math.max(pmax, p); }
  const span = pmax - pmin, wd = P.f_width, pos = P.f_pos, con = 0.6 + P.f_contrast * 1.3;
  const dome = P.m_dome || 0;
  let Hp = null;
  if (dome > 0) {
    const r = (3 + 9 * dome) * s, b = blur(src, W, H, r), wob = noise(W, H, 70 * s, 70 * s, seed + 15, 2), Hs = dome * 9 * s;
    Hp = new Float32Array(W * H);
    for (let i = 0; i < Hp.length; i++) Hp[i] = (sstep(0.5, 0.97, b[i]) * Hs + (wob[i] - 0.5) * 4 * s * dome) * sstep(0.45, 0.6, b[i]);
  }
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = y * W + X, v = m[i]; if (v < 0.02) continue;
    let t = ((X * ca + y * sa) - pmin) / span + (warp[i] - 0.5) * P.f_warp * 0.5, win = 0, rim = 0;
    if (Hp) {
      const dx = (Hp[X < W - 1 ? i + 1 : i] - Hp[X > 0 ? i - 1 : i]) * 0.5, dy = (Hp[y < H - 1 ? i + W : i] - Hp[y > 0 ? i - W : i]) * 0.5;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1), nx = -dx * inv, ny = -dy * inv, nz = inv, rx = 2 * nz * nx, ry = 2 * nz * ny;
      t += (rx * ca + ry * sa) * 0.8;
      const wx = (rx + 0.42 + (P.light - 0.5) * 0.55) / 0.3, wy = (ry + 0.36 - (P.light - 0.5) * 0.12) / 0.22;        // a soft studio window, up and to the left
      win = (1 - sstep(0.7, 1, Math.abs(wx))) * (1 - sstep(0.6, 1, Math.abs(wy)));
      rim = sstep(0.75, 0.35, nz) * 0.5;
    }
    const d1 = (t - pos) / wd, d2 = (t - pos - 0.55) / (wd * 1.6), d3 = (t - pos + 0.5) / (wd * 2.2), main = Math.exp(-d1 * d1 * 2);
    let e = 0.12 + 0.74 * Math.min(1, main * 0.95 + 0.25 * Math.exp(-d2 * d2 * 2) + 0.14 * Math.exp(-d3 * d3 * 2));
    const tm = t + (ripple[i] - 0.5) * 0.05 * mir - (pos - 0.45);
    let sharp = sstep(horizon - edgeW, horizon + edgeW, tm) * 0.22;
    for (const bd of bands) { const dd = Math.abs(tm - bd.c); if (dd < bd.w + edgeW) sharp = Math.max(sharp, bd.v * (1 - sstep(bd.w - edgeW, bd.w + edgeW, dd))); }
    e = e * (1 - 0.75 * mir) + Math.max(sharp, main * 0.45) * mir;
    e = 0.08 + (e - 0.12) * 0.55;                                 // gloss foil: mostly deep, with bright reflections
    if (Hp) e = Math.min(1, e + win * 0.8 + rim * (0.3 + 0.4 * main));
    e += (scuff[i] - 0.5) * P.f_scuff * 0.22 * (0.35 + main) * 0.3 + (tooth[i] - 0.5) * P.f_tooth * 0.16;
    e = clamp(0.5 + (e - 0.5) * con, 0, 1);
    const col = tone4(st, e), o = i * 4;
    out[o] = col[0]; out[o + 1] = col[1]; out[o + 2] = col[2]; out[o + 3] = v * 255;
  }
  return out;
}

/* ---------- emboss / deboss: light and shadow only, so the page itself is the paper ---------- */
function press(src, W, H, s, seed, deboss, P) {
  const sg = deboss ? -1 : 1, Hs = P.p_height * 4 * s, ts = P.p_texScale;
  const wall = blur(src, W, H, Math.max(1, P.p_depth * s * 0.6));
  const pull = blur(src, W, H, 16 * s), near = blur(src, W, H, 24 * s);
  const t1 = P.p_grain > 0 ? noise(W, H, Math.max(1, 1.3 * s * ts), Math.max(1, 1.3 * s * ts), seed + 21, 2) : null;
  const t2 = P.p_grain > 0 ? noise(W, H, 6 * s * ts, 6 * s * ts, seed + 22, 2) : null;
  const Hp = new Float32Array(W * H), face = new Float32Array(W * H);
  for (let i = 0; i < Hp.length; i++) {
    const base = sstep(0.3, 0.7, wall[i]); face[i] = base;
    let h = Math.max(base, sstep(0, 0.5, pull[i]) * P.p_pull * 0.35) * Hs * sg;
    const tex = !t1 ? 0 : (t1[i] - 0.5) * 0.7 + (t2[i] - 0.5) * 0.2;
    h += tex * P.p_grain * 1.6 * s * (P.insideOnly ? base : (1 - 0.65 * base) * (P.everywhere ? 1 : sstep(0, 0.06, near[i])));
    Hp[i] = h;
  }
  const th = P.p_light * Math.PI / 180, el = P.p_elev * Math.PI / 180;
  const lx = Math.cos(th) * Math.cos(el), ly = -Math.sin(th) * Math.cos(el), lz = Math.sin(el), tanE = Math.tan(el);
  const ux = Math.cos(th), uy = -Math.sin(th), cd = P.p_cast * Hs / tanE * 1.5;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = y * W + X;
    const dx = (Hp[X < W - 1 ? i + 1 : i] - Hp[X > 0 ? i - 1 : i]) * 0.5, dy = (Hp[y < H - 1 ? i + W : i] - Hp[y > 0 ? i - W : i]) * 0.5;
    const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1), delta = (-dx * lx - dy * ly + lz) * inv - lz;
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
    const v = 255 * hi * (1 - lo) / A, o = i * 4;
    out[o] = v; out[o + 1] = v; out[o + 2] = v; out[o + 3] = A * 255;
  }
  return out;
}

/* ---------- blind emboss / deboss, soft: rounded shoulders, no outline, the face is just paper ---------- */
function blind(src, W, H, s, deboss, P) {
  const r = Math.max(1.5, P.b_soft * s);
  const h = blur(blur(src, W, H, r), W, H, r * 0.6), Hs = P.b_height * s * (deboss ? -1 : 1);
  const Hp = new Float32Array(W * H);
  for (let i = 0; i < Hp.length; i++) { const v = h[i]; Hp[i] = v * v * (3 - 2 * v) * Hs; }   // a pillow, not a wall
  const th = P.p_light * Math.PI / 180, el = P.p_elev * Math.PI / 180;
  const lx = Math.cos(th) * Math.cos(el), ly = -Math.sin(th) * Math.cos(el), lz = Math.sin(el);
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 1; y < H - 1; y++) for (let X = 1; X < W - 1; X++) {
    const i = y * W + X, dx = (Hp[i + 1] - Hp[i - 1]) * 0.5, dy = (Hp[i + W] - Hp[i - W]) * 0.5;
    if (!dx && !dy) continue;
    const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1), d = (-dx * lx - dy * ly + lz) * inv - lz;
    let hi = 0, lo = 0;
    if (d > 0) hi = Math.min(0.6, d / (1 - lz) * P.b_hi); else lo = Math.min(0.6, -d / lz * P.b_lo);
    // a little ambient shade where the sheet bends, on both sides, so the form reads even side-on to the light
    const bend = Math.min(1, Math.hypot(dx, dy) * 2) * P.b_amb; lo = lo + bend * (1 - lo);
    const A = lo + hi * (1 - lo); if (A < 0.003) continue;
    const v = 255 * hi * (1 - lo) / A, o = i * 4;
    out[o] = v; out[o + 1] = v; out[o + 2] = v; out[o + 3] = A * 255;
  }
  return out;
}

/* ---------- compositing ---------- */
function paint(alpha, rgb) {
  const out = new Uint8ClampedArray(alpha.length * 4);
  for (let j = 0, o = 0; j < alpha.length; j++, o += 4) { out[o] = rgb[0]; out[o + 1] = rgb[1]; out[o + 2] = rgb[2]; out[o + 3] = alpha[j] * 255; }
  return out;
}
function over(dst, src) {           // src drawn over dst, in place
  for (let o = 0; o < dst.length; o += 4) {
    const sa = src[o + 3] / 255; if (!sa) continue;
    const da = dst[o + 3] / 255, a = sa + da * (1 - sa);
    for (let k = 0; k < 3; k++) dst[o + k] = (src[o + k] * sa + dst[o + k] * da * (1 - sa)) / a;
    dst[o + 3] = a * 255;
  }
  return dst;
}

// Foil variants, all monochrome: the metal follows the page (dark on light, light on dark) unless it is silver or graphite
const FOILS = {
  'foil-mirror': { metal: (d) => d ? 'white' : 'black', P: { m_dome: 0.15, m_shine: 0.95, f_width: 0.18, f_contrast: 0.75 },   // flat mirror, sharp reflections
    press: { p_height: 0.45, p_depth: 1.4, p_pull: 0.2, p_cast: 0.15, p_grain: 0, p_hi: 0.45, p_lo: 0.4 } },
  'foil-debossed': { metal: (d) => d ? 'white' : 'black', P: { m_dome: 0, m_shine: 0.55, f_width: 0.3 },              // foil sunk deep into the sheet
    press: { p_height: 1, p_depth: 2.2, p_pull: 0.4, p_cast: 0.25, p_grain: 0, p_hi: 0.6, p_lo: 0.55 } },
  'foil-flat': { metal: (d) => d ? 'white' : 'black', P: { m_dome: 0, m_shine: 0.7, f_width: 0.22 },        // classic hot-foil, flat and bitten in
    press: { p_height: 0.55, p_depth: 1.6, p_pull: 0.25, p_cast: 0.18, p_grain: 0, p_hi: 0.5, p_lo: 0.45 } },
  'foil-satin': { metal: 'graphite', P: { m_dome: 0.35, m_shine: 0.2, f_scuff: 0.75, f_width: 0.4, f_contrast: 0.4 },  // brushed, soft sheen
    press: { p_height: 0.4, p_depth: 1.4, p_pull: 0.2, p_cast: 0.15, p_grain: 0, p_hi: 0.4, p_lo: 0.35 } },
  'foil-silver': { metal: 'silver', P: { m_dome: 0.45, f_warp: 0.15, m_shine: 0.8, f_scuff: 0.15 },                                                         // domed mirror silver
    press: { p_height: 0.4, p_depth: 1.4, p_pull: 0.2, p_cast: 0.15, p_grain: 0, p_hi: 0.4, p_lo: 0.4 } },
  'foil-emboss': { metal: (d) => d ? 'white' : 'black', raised: true, P: { m_dome: 1 },                        // pushed up from behind, then foiled
    press: { p_height: 0.9, p_depth: 2.2, p_pull: 0.35, p_cast: 0.2, p_grain: 0, p_hi: 0.6, p_lo: 0.5 } } };

// Spot varnishes: tint stops are offsets from the paper colour ('w' = white highlight)
const VARNISH = {
  varnish: { light: [-25, -20, -13, 'w'], dark: [14, 20, 33, 92] },                                                  // spot gloss
  'varnish-raised': { light: [-27, -21, -11, 'w'], dark: [14, 22, 37, 106], P: { m_dome: 0.8, m_shine: 0.5 },          // thick raised UV, a bead of gloss
    press: { p_height: 0.55, p_depth: 1.6, p_pull: 0.15, p_cast: 0.12, p_hi: 0.45, p_lo: 0.35 } },
  'varnish-satin': { light: [-29, -25, -19, 1], dark: [13, 17, 24, 46], P: { m_dome: 0.2, m_shine: 0.1, f_width: 0.5, f_contrast: 0.35 } },  // soft-touch satin
  'varnish-ink': { light: [-215, -205, -170, -60], dark: [16, 22, 39, 102], P: { m_dome: 0.35, m_shine: 0.6 } } };  // gloss varnish over solid ink: black on black (or the paper's own black at night)

const BASE = { f_angle: 125, f_pos: 0.45, f_width: 0.27, f_contrast: 0.55, f_warp: 0.45, f_scuff: 0.35, f_tooth: 0.3, m_shine: 0.55,
  p_light: 135, p_elev: 38, p_hi: 0.75, p_lo: 0.8, p_texScale: 1.1, p_grain: 0.45 };

function render(data) {
  const e = { data };
  const { mask, W, H, s, seed, style, inkHex, paperHex, spotHex, dark, id, paper } = e.data, light = e.data.light == null ? 0.5 : e.data.light;
  // The paper on its own, for the whole page: fibres lit by the same light as the press.
  if (paper) {
    const P2 = { ...BASE, p_height: 0.75, p_depth: 2, p_pull: 0, p_cast: 0, p_grain: 0.38, everywhere: true, p_lo: dark ? 0.5 : 0.6, p_hi: dark ? 0.3 : 0.6 };
    const px = press(new Float32Array(W * H), W, H, s, seed, true, P2);
    return px;
  }
  // light: 0 at the top of the page, 1 a screen further down. The lamp swings across the sheet as you scroll.
  const rgb = rgbOf(inkHex), P = { ...BASE, light, p_light: 135 + (light - 0.5) * 80 };
  let px;
  // ink sits in the paper, so the paper's grain shows through it (the page supplies the paper around it)
  const grainIn = () => press(mask, W, H, s, seed + 50, true, { ...P, p_height: 0.12, p_depth: 1.2, p_pull: 0, p_cast: 0, p_grain: 0.45, insideOnly: true, p_hi: 0.45, p_lo: 0.4 });
  if (INK[style]) px = over(paint(ink(mask, W, H, s, seed, INK[style]), rgb), grainIn());
  else if (style === 'foil') {
    // sculpted gloss foil stamped into the sheet, like the London Film School identity
    Object.assign(P, { f_pos: 0.3 + rng(seed + 9)() * 0.3 + (light - 0.5) * 0.45, m_dome: 0.7 });
    px = over(foil(mask, W, H, s, seed, dark ? 'white' : 'black', P),
      press(mask, W, H, s, seed, true, { ...P, p_height: 0.4, p_depth: 1.4, p_pull: 0.2, p_cast: 0.15, p_grain: 0, p_hi: 0.4, p_lo: 0.35 }));
  } else if (style === 'blind' || style === 'blind-deboss') {
    Object.assign(P, { b_soft: 3.6, b_height: 3.2, b_hi: dark ? 0.55 : 0.5, b_lo: dark ? 0.75 : 0.45, b_amb: dark ? 0.05 : 0.04, p_elev: 32 });
    px = blind(mask, W, H, s, style === 'blind-deboss', P);
  } else if (style === 'foil-colour') {
    // a bright spot-colour foil, domed and glossy like the black one: deep shade in the troughs, the colour itself, a hot highlight
    const c = rgbOf(spotHex || '#F33446'), sh = (k) => c.map((v) => Math.round(v * k)), tint = (t) => c.map((v) => Math.round(v + (255 - v) * t));
    Object.assign(P, { f_pos: 0.3 + rng(seed + 9)() * 0.3 + (light - 0.5) * 0.45, m_dome: 0.7, f_contrast: 0.45 });
    px = over(foil(mask, W, H, s, seed, [sh(0.78), sh(0.97), tint(0.3), tint(0.9)], P),
      press(mask, W, H, s, seed, true, { ...P, p_height: 0.4, p_depth: 1.4, p_pull: 0.2, p_cast: 0.15, p_grain: 0, p_hi: 0.4, p_lo: 0.35 }));
  } else if (VARNISH[style]) {
    // spot varnish: the letters are the paper's own colour, just a touch richer, and catch the light
    const V = VARNISH[style], pc = rgbOf(paperHex || '#eeeeea'), add = (n) => pc.map((c) => Math.max(0, Math.min(255, c + n)));
    const tint = (dark ? V.dark : V.light).map((n) => n === 'w' ? [255, 255, 255] : add(n));
    Object.assign(P, { f_pos: 0.3 + rng(seed + 9)() * 0.3 + (light - 0.5) * 0.45, m_dome: 0.3, m_shine: 0.4, f_scuff: 0.1, f_tooth: 0.08, f_warp: 0.15, f_contrast: 0.6, f_width: 0.32 }, V.P);
    px = over(foil(mask, W, H, s, seed, tint, P),
      press(mask, W, H, s, seed, false, { ...P, p_height: 0.2, p_depth: 1, p_pull: 0, p_cast: 0, p_grain: 0, p_hi: dark ? 0.5 : 0.35, p_lo: dark ? 0.45 : 0.25, ...V.press }));
  } else if (FOILS[style]) {
    // the other foils: same metal-and-light model, different metal, sheen and sculpting
    const F = FOILS[style];
    Object.assign(P, { f_pos: 0.3 + rng(seed + 9)() * 0.3 + (light - 0.5) * 0.45 }, F.P);
    const metal = typeof F.metal === 'function' ? F.metal(dark) : F.metal;
    px = over(foil(mask, W, H, s, seed, metal, P), press(mask, W, H, s, seed, !F.raised, { ...P, ...F.press }));
  } else if (style === 'deboss' || style === 'emboss') {
    Object.assign(P, { p_depth: 2, p_pull: 0.3, p_cast: 0.18, p_grain: 0, p_lo: dark ? 1 : 0.45, p_hi: dark ? 1.45 : 0.75, p_height: dark ? 1.05 : 0.75 });
    px = press(mask, W, H, s, seed, style === 'deboss', P);
  } else if (style === 'inked-deboss') {     // letterpress bitten into the sheet: ink, then the impression over it
    Object.assign(P, { p_height: 0.45, p_depth: 1.5, p_pull: 0.2, p_cast: 0.15, p_grain: 0.45, insideOnly: true, p_hi: 0.45, p_lo: 0.4 });   // the page's paper shows through the ink
    px = over(paint(ink(mask, W, H, s, seed, { ...INK.letterpress, squeeze: .3 }), rgb), press(mask, W, H, s, seed, true, P));
  }
  return px;
}

  return { render, INK, FOILS, VARNISH };
})();
