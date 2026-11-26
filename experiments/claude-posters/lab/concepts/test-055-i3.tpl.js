// Illustration test 3 (No. 055) · "CAUGHT BETWEEN / ROAD AND ROPE" · Anybody Black caps, one line on each margin.
// (Test 2 reworked after Ben's notes: a dramatic angle, gappy strokes, thin-line shading, tints and shades, one pop.)
// Story: a six cleared the boundary rope and the wall, and was caught on the road outside by a motorbike passenger.
// Scene: a very high, fish-eye view from the top of the stand, looking straight down across the boundary: the
//   outfield with the rope curving through it at the top, the wall, the road with the motorbike passing, the verge.
//   Every band bows with the lens. The ball's dashed flight drops from the field, over rope and wall, to the bike.
// Pop: the boundary rope, in a bright colour from across the wheel (popFor), the only thing in it.
// Shading: blades in the grass, ripples of sheen on the tarmac, strata along the wall; tints and shades of the
//   palette for the cel shadows.
window.POSTER = async () => {
  const C = __CW__;
  seed(5593);
  const D = 'Anybody', T = 'Azeret Mono';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const bike = trim(await media('media/2026-11-26/object-2.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.field; g.fillRect(0, 0, W, H);
  snap('bg', out);
  const I = illo(g), lw = 3;

  // the lens: a slight dutch tilt and barrel distortion about the sheet's centre
  const cx = W / 2, cy = H / 2, tilt = -0.14, kb = 0.17, R0 = Math.hypot(cx, cy);
  const F = ([x, y]) => { let dx = x - cx, dy = y - cy; const r = Math.hypot(dx, dy) / R0, s = 1 - kb * r * r; dx *= s; dy *= s;
    return [cx + dx * Math.cos(tilt) - dy * Math.sin(tilt), cy + dx * Math.sin(tilt) + dy * Math.cos(tilt)]; };
  const dens = (pts, step = 12) => { const o = []; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step)); for (let k = 0; k < n; k++) o.push([p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]); }); return o; };
  const band = (y0, y1) => poly(dens([[-400, y0], [W + 400, y0], [W + 400, y1], [-400, y1]]).map(F));
  const lineAt = (y, x0 = -400, x1 = W + 400) => dens([[x0, y], [x1, y]], 8).slice(0, -1).map(F);

  const HS = inkSafe(['CAUGHT BETWEEN', 'ROAD AND ROPE'], { font: D, weight: 900, size: 120, gap: 14, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C'], 1, 0.1);

  // the outfield: mown stripes in two tones, blades of grass thickening towards us
  const field = band(-120, 640);
  for (let k = -6; k < 12; k++) if (k % 2 === 0) { const s = poly(dens([[k * 120 - 200, -120], [k * 120 - 80, -120], [k * 120 + 40, 640], [k * 120 - 80, 640]]).map(F)); I.fill(inter(s, field), C.field2); }
  I.ink(blades(field, { density: 0.00035, h: [6, 16], near: 640, lw: 1.1, sd: 31 }));
  snap('place-field', out);
  // the boundary rope: the pop, a fat curve through the field, with its shadow
  const ropePts = curve([[-300, 470], [200, 400], [600, 380], [1000, 410], [1400, 480]], 6).map(F);
  const rs = canvas(); inkLine(rs, ropePts.map(([x, y]) => [x + 6, y + 10]), 22, { taper: 0, wobble: 0.3, sd: 3 }); I.fill(rs, C.fieldShade);
  const rope = canvas(); inkLine(rope, ropePts, 22, { taper: 0, wobble: 0.3, sd: 4 }); I.fill(rope, C.pop); I.ink(outline(rope, 2.6));
  const twist = canvas(); for (let i = 0; i < ropePts.length - 2; i += 3) { const [x, y] = ropePts[i]; inkLine(twist, [[x - 5, y + 8], [x + 5, y - 8]], 1.4, { sd: i }); } I.ink(inter(twist, rope));
  snap('place-rope', out);
  // the wall: its top seen from above (coping), its outer face falling away to the road, strata on the face
  const top = band(640, 700), face = band(700, 790);
  I.fill(top, C.wall); I.ink(outline(top, lw));
  I.fill(face, C.wallShade); I.ink(outline(face, lw)); I.ink(strata(face, { step: 12, n: 5, lw: 1.4, sd: 5, keep: 0.7 }));
  const joints = canvas(); for (let x = -300; x < W + 300; x += 90) { const [a, b] = [F([x, 640]), F([x, 700])]; inkLine(joints, [a, b], 1.6, { sd: x + 900 }); } I.ink(inter(joints, top));
  snap('place-wall', out);
  // the road: tarmac with sheen ripples, the wall's shadow along its near edge, a broken centre line
  const road = band(790, 1250);
  I.fill(road, C.road);
  I.fill(inter(band(790, 860), road), C.roadShade);
  I.ink(ripples(road, { density: 0.0007, len: [14, 50], lw: 1.1, sd: 8 }));
  const cl = canvas(); for (let x = -300; x < W + 300; x += 150) { const m = poly(dens([[x, 1015], [x + 80, 1015], [x + 80, 1029], [x, 1029]], 6).map(F)); draw(cl.g, m); }
  I.fill(cl, C.mark); I.ink(outline(cl, 2));
  I.ink(outline(road, lw));
  snap('place-road', out);
  // the verge at the bottom: grass, longer blades towards us
  const verge = band(1250, H + 120);
  I.fill(verge, C.verge); I.ink(outline(verge, lw));
  I.ink(blades(verge, { density: 0.0011, h: [10, 30], near: H, lw: 1.3, sd: 41, lean: 0.15 }));
  snap('place-verge', out);

  // the motorbike passing along the road (the render is seen from above, which suits the angle), its shadow on the
  // tarmac, cel-shaded in tints and shades
  const bx = 300, by = 820, bw = 560, bh = bw * bike.height / bike.width;
  const A = objectArt(bike, { x: bx, y: by, w: bw, h: bh }, { lw: 3, inner: 0.1, innerR: 7, shade: [0.25, 0.85], simplify: 4, rot: tilt * 0.6 });
  const sh = canvas(); draw(sh.g, A.silhouette); const shOff = canvas(); offset(shOff.g, sh, 26, 34); I.fill(cut(inter(shOff, road), A.silhouette), C.roadShade2);
  I.fill(A.fill[0], C.bikeS); I.fill(A.fill[1], C.bikeB); I.fill(A.fill[2], C.bikeL); I.ink(A.lines);
  snap('place-bike', out);
  // the ball, coming down over the wall towards the bike, its dashed flight from the field
  const fl = canvas(), path = curve([[240, 230], [330, 420], [470, 600], [560, 760]], 3);
  for (let i = 0; i < path.length - 10; i += 20) inkLine(fl, path.slice(i, i + 10), 2.8, { sd: 300 + i, taper: 0.5 });
  I.ink(cut(fl, circleMask(580, 790, 44)));
  const B = ballArt(580, 790, 34, { tilt: -0.6, lw: 2.6, sd: 9 });
  I.fill(B.body, C.ball); I.fill(B.shadow, C.ballShade); I.fill(B.light, C.mark); I.ink(B.lines);
  snap('place-ball', out);

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const smallM = canvas();
  block(smallM.g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], M, M + ROW, t);
  const sub = balance("Hit out of the ground in a local league match, the ball met a stranger's hand on the road.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(smallM.g, sub.lines, W - M, M + ROW, { ...t, align: 'right' });
  const pad = dilate(alphaThr(smallM, 0.3), 10);
  I.fill(pad, C.field);
  draw(g, tint(smallM, C.text));
  snap('text-small', out);

  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 5593, wear: 0.12, spread: 0.5, bg: C.field });
  I.print(g, C.line, 5593);
  printHead(g, head, C.type, C.finish, { bg: C.field, seed: 593, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 593);
  snap('final', out);
  return out;
};
