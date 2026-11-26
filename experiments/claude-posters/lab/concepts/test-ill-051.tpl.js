// Illustration series · No. 051 (22 Nov, Jade) · "NEON IN THE MIDDLE / OF NOWHERE" · Mattone Black caps.
// Story: service stations are turning from quick stops into places people drive to on purpose.
// Move: LOW ANGLE from the wet forecourt, under the canopy at night: its underside full of round lamps rushes
//   overhead in steep perspective, the pumps stand small beneath, the canopy's edge carries a neon stripe (the pop,
//   rose), and past it a huge empty night with a few stars. Ripples of reflected light in the puddles.
// Refs: refs/2026-11-22 ref-03, ref-07, ref-08, ref-09 (petrol stations at night), ref-13 (pump nozzle in hand).
window.POSTER = async () => {
  const C = __CW__;
  seed(5101);
  const D = 'Mattone', T = 'Albert Sans';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const out = canvas(), g = out.g; g.fillStyle = C.night; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g), lw = 3;
  const HS = inkSafe(['NEON IN THE MIDDLE', 'OF NOWHERE'], { font: D, weight: 900, size: 80, gap: 12, minGap: 6, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['L', 'L'], 1, 0.1);

  // the night: stars, and a low line of hills far off
  const stars = canvas(); seed(9); for (let i = 0; i < 70; i++) { const x = rand() * W, y = 640 + rand() * 280, r = rand() < 0.15 ? 2.4 : 1.2; stars.g.drawImage(circleMask(x, y, r), 0, 0, W, H); } I.fill(stars, C.star);
  const horizon = 1010, hills = poly([...curve([[-40, horizon], [200, horizon - 40], [420, horizon - 18], [700, horizon - 60], [900, horizon - 22], [W + 40, horizon - 34]], 8), [W + 40, horizon + 4], [-40, horizon + 4]]);
  I.fill(hills, C.hill); I.ink(outline(hills, 2.2));
  // the forecourt: wet tarmac with ripples of reflected light
  const ground = poly([[-40, horizon], [W + 40, horizon], [W + 40, H + 40], [-40, H + 40]]); I.fill(ground, C.ground); I.ink(outline(ground, 2.6));
  const glow = canvas(); glow.g.fillStyle = '#fff'; glow.g.beginPath(); glow.g.ellipse(560, 1240, 520, 120, 0, 0, Math.PI * 2); glow.g.fill(); I.fill(inter(glow, ground), C.wet);
  I.ink(ripples(ground, { density: 0.0012, len: [12, 60], lw: 1.2, sd: 4 }));
  const reflect = canvas(); seed(12); for (let i = 0; i < 26; i++) { const x = 80 + rand() * 900, y = 1060 + rand() * 360, L = 20 + rand() * 70; inkLine(reflect, [[x, y], [x + L, y]], 4, { taper: 0.8, sd: 500 + i }); } I.fill(inter(reflect, ground), C.pop);
  // the pumps, small under the canopy
  for (const [x, w] of [[300, 90], [560, 96], [820, 90]]) { const p = poly([[x - w / 2, 860], [x + w / 2, 860], [x + w / 2, horizon + 30], [x - w / 2, horizon + 30]]); I.fill(p, C.pump); I.ink(outline(p, 2.6));
    const scr = poly([[x - w / 3, 880], [x + w / 3, 880], [x + w / 3, 920], [x - w / 3, 920]]); I.fill(scr, C.lamp); I.ink(outline(scr, 1.8));
    const hose = canvas(); inkLine(hose, curve([[x + w / 2, 930], [x + w / 2 + 24, 980], [x + w / 2 + 6, 1020]], 3), 3, { sd: x }); I.ink(hose); }
  const pillars = [[170, 40], [940, 40]].map(([x, w]) => poly([[x - w / 2, 700], [x + w / 2, 700], [x + w / 2 * 1.3, horizon + 60], [x - w / 2 * 1.3, horizon + 60]]));
  pillars.forEach((p) => { I.fill(p, C.pillar); I.ink(outline(p, 2.6)); });
  snap('place-pumps', out);
  // the canopy overhead: a slab whose underside fills the top of the sheet in steep perspective, rows of lamps
  const near = [[-200, -40], [W + 200, -40]], far = [[60, 640], [W - 60, 640]];
  const under = poly([near[0], near[1], far[1], far[0]]); I.fill(under, C.canopy);
  const lamps = canvas(), grid = canvas();
  for (let r = 0; r < 6; r++) { const t = 1 - Math.pow(0.62, r + 0.6); for (let c = 0; c < 5; c++) { const u = (c + 0.5) / 5, xa = near[0][0] + (near[1][0] - near[0][0]) * u, xb = far[0][0] + (far[1][0] - far[0][0]) * u;
    const x = xa + (xb - xa) * t, y = -40 + 680 * t, s = 70 * (1 - t * 0.85); const lm = canvas(); lm.g.fillStyle = '#fff'; lm.g.beginPath(); lm.g.ellipse(x, y, s, s * 0.45, 0, 0, Math.PI * 2); lm.g.fill(); draw(lamps.g, lm); } }
  for (let c = 0; c <= 5; c++) { const u = c / 5; inkLine(grid, [[near[0][0] + (near[1][0] - near[0][0]) * u, -40], [far[0][0] + (far[1][0] - far[0][0]) * u, 640]], 1.3, { sd: 600 + c }); }
  for (let r = 1; r < 7; r++) { const t = 1 - Math.pow(0.62, r); const xl = near[0][0] + (far[0][0] - near[0][0]) * t, xr = near[1][0] + (far[1][0] - near[1][0]) * t; inkLine(grid, [[xl, -40 + 680 * t], [xr, -40 + 680 * t]], 1.3, { sd: 620 + r }); }
  I.ink(inter(cut(grid, lamps), under)); I.fill(inter(lamps, under), C.lamp); I.ink(inter(outline(lamps, 2), under));
  // the canopy's edge: a deep fascia with the neon stripe
  const fascia = poly([[40, 640], [W - 40, 640], [W - 40, 700], [40, 700]]); I.fill(fascia, C.fascia); I.ink(outline(fascia, lw));
  const neon = poly([[40, 662], [W - 40, 662], [W - 40, 678], [40, 678]]); I.fill(neon, C.pop); I.ink(outline(neon, 1.8));
  I.ink(outline(under, lw));
  snap('place-canopy', out);

  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 051)', '(Sunday 22 November)', '(BBC News)'], 'Once a quick break on a long journey, service stations are becoming places people travel to on purpose.', { padCol: C.night, y: M + ROW * 4 });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.night, 5101);
  snap('final', out);
  return out;
};
