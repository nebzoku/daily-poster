// Illustration test 2 (No. 055) · "CAUGHT BETWEEN / ROAD AND ROPE" · Anybody Black caps, one line on each margin.
// Story: the six cleared the ground's wall and came down over the public road, where a passenger on a passing
//   motorbike caught it.
// Scene: one-point perspective down the road outside the ground: the boundary wall running off to the horizon on the
//   left with the floodlights behind it, a verge on the right, and the motorbike coming up the road. The ball is a
//   small drawn disc high in the sky, its dashed flight rising from behind the wall: the moment before the catch.
// Drawn from: object-2 (the motorbike render) as a line drawing with cel fills; object-1's ball drawn as ballArt;
//   the rest of the scene drawn in code (wall, road, floodlights, clouds) from the story.
window.POSTER = async () => {
  const C = __CW__;
  seed(5592);
  const D = 'Anybody', T = 'Azeret Mono';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const bike = trim(await media('media/2026-11-26/object-2.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.sky; g.fillRect(0, 0, W, H);
  snap('bg', out);
  const I = illo(g), lw = 3;
  const shape = (pts, col, w = lw) => { const m = poly(pts); I.fill(m, col); I.ink(outline(m, w)); return m; };

  const HS = inkSafe(['CAUGHT BETWEEN', 'ROAD AND ROPE'], { font: D, weight: 900, size: 120, gap: 14, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'stamp', wear: 0.15, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C'], 1, 0.1);

  const VP = [640, 640];
  // clouds on the horizon
  for (const [x, y, w, h, s] of [[-100, 430, 520, 220, 21], [720, 470, 460, 180, 22], [330, 520, 380, 130, 23]]) { const cl = cumulus(x, y, w, h, s, { lobes: 9, curls: 4, lw: 2.5 }); I.fill(cl.fill, C.cloud); I.ink(cl.lines); }
  snap('place-clouds', out);
  // floodlight towers behind the wall: lattice masts with a lamp head
  const mast = (x, top, bot, wdt) => {
    const m = canvas(); inkLine(m, [[x - wdt, bot], [x - wdt * 0.35, top]], 2.6, { sd: x }); inkLine(m, [[x + wdt, bot], [x + wdt * 0.35, top]], 2.6, { sd: x + 1 });
    for (let y = bot; y > top + 10; y -= 26) { const f = (y - top) / (bot - top), a = wdt * (0.35 + 0.65 * f), f2 = (y - 26 - top) / (bot - top), b = wdt * (0.35 + 0.65 * f2); inkLine(m, [[x - a, y], [x + b, y - 26]], 1.6, { sd: y }); inkLine(m, [[x + a, y], [x - b, y - 26]], 1.6, { sd: y + 3 }); }
    const head = poly([[x - 60, top - 60], [x + 60, top - 60], [x + 55, top], [x - 55, top]]); I.fill(head, C.cloud); I.ink(outline(head, 2.5));
    for (let i = -2; i <= 2; i++) for (const r of [-40, -18]) { const d = canvas(); d.g.fillStyle = '#fff'; d.g.fillRect(x + i * 22 - 8, top + r - 8, 16, 12); I.fill(d, C.lamp); I.ink(outline(d, 1.6)); }
    I.ink(m);
  };
  mast(170, 340, 760, 30); mast(470, 460, 680, 18);
  snap('place-floodlights', out);
  // the ball, high up, its dashed flight rising from behind the wall
  const fl = canvas(), path = curve([[300, 760], [300, 520], [380, 330], [470, 270]], 3);
  for (let i = 0; i < path.length - 10; i += 20) inkLine(fl, path.slice(i, i + 10), 2.6, { sd: 300 + i, taper: 0.5 });
  I.ink(fl);
  const B = ballArt(520, 250, 46, { tilt: -0.5, lw: 2.6, sd: 9 });
  I.fill(B.body, C.ball); I.fill(B.shadow, C.shade); I.fill(B.light, C.cloud); I.ink(B.lines);
  snap('place-ball', out);

  // the ground: verge on the right, road, wall on the left
  shape([[VP[0], VP[1]], [W + 40, VP[1] - 6], [W + 40, H + 40], [VP[0] + 20, VP[1]]], C.verge);
  const road = shape([[VP[0] - 6, VP[1]], [VP[0] + 14, VP[1]], [W + 260, H + 40], [-120, H + 40]], C.road);
  // grass on the verge: short dashes leaning, denser near
  const verge = poly([[VP[0] + 20, VP[1]], [W + 40, VP[1] - 6], [W + 40, H + 40], [W + 240, H + 40]]);
  I.ink(hatch(verge, { angle: -Math.PI / 2 + 0.25, gap: 9, dash: [6, 22], skip: 0.55, lw: 1.5, sd: 41 }));
  // the wall: a long brick wall to the horizon, coping on top, brick courses converging on the vanishing point
  const wallTop = (x) => VP[1] - 40 + (1 - x / VP[0]) * 280, roadL = (x) => VP[1] + (VP[0] - x) * (H + 40 - VP[1]) / (VP[0] + 120);
  const wall = shape([[-40, wallTop(-40)], [VP[0], VP[1] - 40], [VP[0], VP[1]], [-40, roadL(-40)]], C.wall);
  const coping = shape([[-40, wallTop(-40) - 34], [VP[0], VP[1] - 44], [VP[0], VP[1] - 40], [-40, wallTop(-40)]], C.shade, 2.6);
  const courses = canvas();
  for (let k = 1; k < 14; k++) { const f = k / 14; inkLine(courses, [[-40, wallTop(-40) + (roadL(-40) - wallTop(-40)) * f], [VP[0], VP[1] - 40 + 40 * f]], 1.4, { sd: 500 + k, taper: 0.1 }); }
  I.ink(inter(courses, wall));
  // the road: a broken centre line in perspective and a few marks
  const cl2 = canvas();
  for (let k = 0; k < 9; k++) { const a = Math.pow(k / 9, 1.8), b = Math.pow((k + 0.45) / 9, 1.8), P = (t) => [VP[0] + 4 + (500 - VP[0]) * t, VP[1] + (H + 40 - VP[1]) * t];
    const [x0, y0] = P(a), [x1, y1] = P(b), w0 = 2 + 18 * a, w1 = 2 + 18 * b; const m = poly([[x0 - w0 / 2, y0], [x0 + w0 / 2, y0], [x1 + w1 / 2, y1], [x1 - w1 / 2, y1]]); draw(cl2.g, m); }
  I.fill(cl2, C.cloud); I.ink(outline(cl2, 2));
  I.ink(hatch(road, { angle: 0, gap: 26, dash: [8, 40], skip: 0.82, lw: 1.4, sd: 61 }));
  snap('place-road', out);

  // the motorbike on the road, drawn from the render, with its shadow
  const sh = canvas(); sh.g.fillStyle = '#fff'; sh.g.beginPath(); sh.g.ellipse(735, 1228, 250, 32, 0.27, 0, Math.PI * 2); sh.g.fill();
  I.fill(sh, C.shade);
  const A = objectArt(bike, { x: 470, y: 880, w: 500, h: 400 }, { lw: 3.2, inner: 0.1, innerR: 7, shade: [0.25, 0.85], simplify: 4 });
  I.fill(A.fill[0], C.bikeS); I.fill(A.fill[1], C.bikeB); I.fill(A.fill[2], C.bikeL); I.ink(A.lines);
  snap('place-bike', out);

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const smallM = canvas();
  block(smallM.g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], M, M + ROW, t);
  const sub = balance("Hit out of the ground in a local league match, the ball met a stranger's hand on the road.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(smallM.g, sub.lines, W - M, M + ROW, { ...t, align: 'right' });
  I.fill(dilate(alphaThr(smallM, 0.3), 10), C.sky);
  draw(g, tint(smallM, C.text));
  snap('text-small', out);

  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 5592, wear: 0.12, spread: 0.5 });
  I.print(g, C.line, 5592);
  printHead(g, head, C.type, C.finish, { bg: C.road, seed: 592, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 592);
  snap('final', out);
  return out;
};
