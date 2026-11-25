// Test (Round 19/20) · giant illuminated "A" · Gloock, "A century after the blight".
// Story: a blight killed the American chestnut as a canopy tree; a century on, resistant trees are coming back.
// Move: one giant glyph filling the sheet, drawn round with vines that curl into spirals (an insular, Gaelic
//   illuminated initial), chestnut leaves on the vines and a burr at each foot. Mirrored left and right.
// The one subtle change: the illumination is symmetrical except for a single new leaf on the right-hand vine.
// Finish and paper: letterpress on uncoated, scanned.
function spiralPath(g, cx, cy, r0, turns, dir, a0) {
  const steps = 120 * turns; g.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0);
  for (let i = 1; i <= steps; i++) { const t = i / steps, a = a0 + dir * t * turns * Math.PI * 2, r = r0 * Math.pow(0.18, t); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
}
function leafPath(g, x, y, len, ang, wid = 0.3) {
  // a chestnut leaf: long, pointed, with small forward teeth, a midrib and side veins
  const pts = [], n = 22, w = len * wid;
  for (let s of [1, -1]) for (let i = 0; i <= n; i++) { const t = s > 0 ? i / n : 1 - i / n, half = Math.sin(Math.PI * Math.pow(t, 0.8)) * w / 2, tooth = (i % 2 ? 0.12 : 0) * w * Math.sin(Math.PI * t); pts.push([t * len, s * (half + tooth)]); }
  const c = Math.cos(ang), sn = Math.sin(ang), P = ([u, v]) => [x + u * c - v * sn, y + u * sn + v * c];
  g.moveTo(...P(pts[0])); for (const p of pts.slice(1)) g.lineTo(...P(p)); g.closePath();
  g.moveTo(...P([0, 0])); g.lineTo(...P([len * 0.96, 0]));
  for (let i = 1; i < 5; i++) { const t = i / 5, half = Math.sin(Math.PI * Math.pow(t, 0.8)) * w / 2 * 0.8; for (const s of [1, -1]) { g.moveTo(...P([t * len, 0])); g.lineTo(...P([t * len + half * 0.7, s * half])); } }
}
// a swash: a cubic curve drawn in short pieces whose width swells in the middle and tapers to a hairline at the ends
function swash(g, p0, p1, p2, p3, wMax, wMin = 1.5) {
  const B = (t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  let prev = B(0);
  for (let i = 1; i <= 80; i++) { const t = i / 80, q = B(t); g.lineWidth = wMin + (wMax - wMin) * Math.pow(Math.sin(Math.PI * t), 0.8); g.beginPath(); g.moveTo(...prev); g.lineTo(...q); g.stroke(); prev = q; }
}
function burrPath(g, cx, cy, r) {
  g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, Math.PI * 2);
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + (i % 2) * 0.05, l = r * (0.55 + (i % 3) * 0.12); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); }
}
window.POSTER = async () => {
  const C = __CW__;
  seed(5493);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  // the giant A, as big as the sheet allows between the headline and the bottom furniture, centred
  const A0 = setOptical('A', { font: D, weight: 400, size: 1000, gap: 0, minGap: 0 });
  const availH = H - M - 72 - (M + 48 + 40);
  const size = Math.floor(1000 * Math.min((W - 2 * M) / A0.box.w, availH / A0.box.h) / 8) * 8;
  const A = setOptical('A', { font: D, weight: 400, size, gap: 0, minGap: 0 });
  const head = canvas(); const RA = place(head, A, { cx: W / 2, bottom: H - M - 72 });
  const cx = W / 2, top = RA.y, bot = RA.y + RA.h, hh = bot - top;
  const X = (u) => cx - (W / 2 - M) * u, Y = (v) => top + hh * v;   // u: 0 centre → 1 left margin; v: 0 apex → 1 feet
  const ill = canvas(), ig = ill.g;
  const style = (gg, w) => { gg.strokeStyle = '#fff'; gg.lineCap = 'round'; gg.lineJoin = 'round'; gg.lineWidth = w; };
  // the left side (mirrored for the right): the empty triangle between the left leg and the sheet's edge
  const drawSide = (gg, extra) => {
    // a long vine from beside the apex, out along the top and down into a big curl
    style(gg, 13); swash(gg, [X(0.16), Y(0.05)], [X(0.45), Y(-0.06)], [X(0.92), Y(0.0)], [X(0.86), Y(0.2)], 18, 4);
    style(gg, 11); gg.beginPath(); spiralPath(gg, X(0.72), Y(0.22), hh * 0.1, 1.7, 1, Math.PI); gg.stroke();
    // a second vine from the leg, swinging out and down into a smaller curl, then a tail to the foot
    style(gg, 10); swash(gg, [X(0.42), Y(0.42)], [X(0.7), Y(0.36)], [X(1.0), Y(0.5)], [X(0.88), Y(0.64)], 14, 3);
    style(gg, 8); gg.beginPath(); spiralPath(gg, X(0.76), Y(0.64), hh * 0.07, 1.6, -1, 0); gg.stroke();
    style(gg, 6); swash(gg, [X(0.95), Y(0.72)], [X(1.0), Y(0.86)], [X(0.86), Y(0.88)], [X(0.93), Y(0.98)], 9, 2);
    // chestnut leaves on the vines
    style(gg, 3.5); gg.beginPath();
    leafPath(gg, X(0.4), Y(0.0), hh * 0.15, Math.PI * 1.04); leafPath(gg, X(0.6), Y(0.0), hh * 0.12, Math.PI * 0.86);
    leafPath(gg, X(0.62), Y(0.42), hh * 0.13, Math.PI * 1.15); leafPath(gg, X(0.93), Y(0.52), hh * 0.11, Math.PI * 0.55);
    gg.stroke();
    if (extra) { style(gg, 3.5); gg.beginPath(); leafPath(gg, X(0.82), Y(0.36), hh * 0.08, Math.PI * 1.4, 0.26); gg.stroke(); }   // the new leaf
    // a burr by the foot
    style(gg, 4); gg.beginPath(); burrPath(gg, X(0.97) + hh * 0.03, Y(0.9), hh * 0.022); gg.stroke();
  };
  drawSide(ig, false);
  const right = canvas(); right.g.save(); right.g.translate(W, 0); right.g.scale(-1, 1); drawSide(right.g, true); right.g.restore();
  draw(ig, right);
  // in the counter under the crossbar: a stem with two curls either side, symmetrical
  style(ig, 8); ig.beginPath(); ig.moveTo(cx, Y(0.66)); ig.lineTo(cx, Y(0.9)); ig.stroke();
  for (const sgn of [1, -1]) { style(ig, 7); ig.beginPath(); ig.moveTo(cx, Y(0.74)); ig.quadraticCurveTo(cx + sgn * hh * 0.08, Y(0.7), cx + sgn * hh * 0.1, Y(0.78)); ig.stroke(); ig.beginPath(); spiralPath(ig, cx + sgn * hh * 0.07, Y(0.8), hh * 0.035, 1.4, sgn, sgn > 0 ? 0 : Math.PI); ig.stroke(); }
  style(ig, 4); ig.beginPath(); burrPath(ig, cx, Y(0.94), hh * 0.022); ig.stroke();
  const illM = cut(ill, alphaThr(blurred(head, 8), 0.02));   // the vines stop just short of the letter
  // headline small on the top margin, furniture and subline at the bottom corners
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const hl = setOptical('A century after the blight', { font: D, weight: 400, size: 48, gap: 30, minGap: 6, word: 0.24 });
  place(head, hl, { cx: W / 2, top: M });
  const sub = balance('Nearly a century after a parasitic blight erased them, American chestnuts are being regrown across Appalachia from resistant seedlings.', { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, M, H - M, { ...t, anchor: 'bottom' });
  block(g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, H - M, { ...t, align: 'right', anchor: 'bottom' });
  printAll(g, C, { seed: 547 });
  printHead(g, union(head, illM), C.type, C.finish, { bg: C.bg, seed: 57, wear: 0.15, spread: 0.12 });
  stock(g, C.stock, 547);
  scan(g, 547);
  return out;
};
