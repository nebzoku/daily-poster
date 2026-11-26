// No. 055 · Concept 1 · "The ball / never landed" · Instrument Serif, sentence case, interlocked: "The ball" on the
// top margin (L), "never landed" edge to edge on the bottom margin.
// Story: a six cleared the ground in a Swat Premier League match and a passenger on a passing motorbike caught it
//   one-handed on the road outside; the clip went round the world.
// Everyday thing: a red cricket ball in the air, and the dusty road outside a local ground.
// Visual idea: the ball's flight drawn as a run of small squares rising off the road and arching over, stopping
//   dead in mid-air where the hand took it. The ball hangs there, smooth and real, above a harsh thresholded road
//   it never reaches; the words "never landed" are the only thing that sits on the ground.
// Image: object-1, the cricket ball render (smooth, toned into the palette), against the brief's Rocky Trail texture
//   (the road), thresholded in two layers: the stones catch the light as the bright middle.
// Finish and paper: letterpress (calm ink, grain through the letters) on smooth stock: a club fixture card, a
//   classic serif bitten into good paper; the smooth sheet keeps the ball's lacquer clean.
// Mood check: light and celebratory, a held breath; nothing ominous in the dark ground because the stones glow.
window.POSTER = async () => {
  const C = __CW__;
  seed(5511);
  const D = 'Instrument Serif', T = 'Azeret Mono';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const ball = trim(await media('media/2026-11-26/object-1.png'));
  const road = await media('media/2026-11-26/texture-02-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: one size, sentence case, tight; "never landed" sets the measure
  const HS = inkSafe(['The ball', 'never landed'], { font: D, weight: 400, size: 200, gap: 20, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'letterpress', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);

  // the road: full bleed from the row-5 grid line down, thresholded in two layers
  const roadTop = M + ROW * 5;
  const rr = { x: 0, y: roadTop, w: W, h: H - roadTop };
  const src = canvas(); clip(src.g, rr, () => cover(src.g, road, rr, { crop: [0.1, 0.2, 0.8, 0.5] }));
  const L = levels(src, 0.03, 0.97);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, src); snap('place-road', p); }
  const lights = lumMask(L, pct(L, 0.9), { blur: 0.6 });
  const mids = cut(lumMask(L, pct(L, 0.8), { blur: 0.6 }), lights);
  // the stones stop a few px short of the letters, so "never landed" reads clean on the road
  const clear = alphaThr(blurred(head, 5), 0.04);
  const inRoad = cut(rectMask(rr), clear);
  draw(g, tint(inter(mids, inRoad), C.mid2));
  snap('step-thr-1', out);
  draw(g, tint(inter(lights, inRoad), C.mid));
  snap('step-thr-2', out);

  // the ball, smooth and toned, held in the air on the grid (centre on column 6, row 2)
  const bx = M + COL * 6, by = M + ROW * 2, br = 184;
  const bc = canvas(); fit(bc.g, ball, { x: bx - br, y: by - br, w: br * 2, h: br * 2 }, { rot: -0.35 });
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, bc); snap('place-ball', p); }
  const ballM = lumMask(bc, 0, { soft: 0.001 });
  draw(g, inter(tone(levels(bc, 0.04, 0.96), C.tones), ballM));
  snap('step-tone-1', out);

  // the flight: small squares off the road, up and over, stopping at the ball
  const P0 = [M + 8, roadTop - 8], P1 = [330, -70], P2 = [bx - br - 24, by + 8];
  const q = (t) => [0, 1].map((i) => (1 - t) ** 2 * P0[i] + 2 * (1 - t) * t * P1[i] + t * t * P2[i]);
  const pts = []; let last = null;
  for (let t = 0; t <= 1.0001; t += 0.0005) { const p = q(t); if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 32) { pts.push(p); last = p; } }
  const flight = canvas();
  pts.forEach(([x, y], i) => { const s = i % 4 === 3 ? 16 : 8; flight.g.fillStyle = '#fff'; flight.g.fillRect(Math.round((x - s / 2) / 8) * 8, Math.round((y - s / 2) / 8) * 8, s, s); });
  const flightM = cut(flight, union(ballM, head));
  draw(g, tint(flightM, C.mid));
  snap('place-flight', out);

  // small type: furniture top right on the top margin, subline under the ball on the row-4 line, labels on the path
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], W - M, M, { ...t, align: 'right' });
  snap('text-furniture', out);
  const sub = balance("A motorbike passenger caught a six one-handed outside the ground at Pakistan's Swat Premier League.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, W - M, M + ROW * 4, { ...t, align: 'right' });
  snap('text-sub', out);
  block(g, ['(01) Hit out of the ground'], M + COL, roadTop - 16, { ...t, anchor: 'bottom' });
  block(g, ['(02) Taken one-handed on the road'], bx - br, by + br + 24, t);
  snap('text-labels', out);
  asterisk(g, bx - br - 24 + 4, by + br + 30, 8, C.mid);
  snap('place-asterisk', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 551, shapes: [ballM], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 55, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) }); });
  printAll(g, C, { seed: 551, shapes: [ballM] });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 55, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 55);
  snap('final', out);
  return out;
};
