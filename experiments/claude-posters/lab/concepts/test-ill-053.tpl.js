// Illustration series · No. 053 (24 Nov, Lime) · "CATCH MERCURY / BEFORE SUNRISE" · Six Caps, top and bottom.
// Story: a rare few mornings to spot Mercury low in the east before dawn.
// Move: TINY FIGURE, HUGE SKY. A stepped dawn glow fills most of the sheet; layers of hills recede in strata; on a
//   near ridge a small figure holds a phone up to the sky. Mercury is one bright dot just above the glow (the pop,
//   indigo, ringed), the only thing to find. Line work in the day's darkest shade, not black.
// Refs: refs/2026-11-24 ref-08 (figure photographing the dawn from a ridge), ref-01..03 (dawn horizons).
window.POSTER = async () => {
  const C = __CW__;
  seed(5301);
  const D = 'Six Caps', T = 'Work Sans';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const ref = await img('/experiments/claude-posters/refs/2026-11-24/ref-08.jpg');
  const out = canvas(), g = out.g; g.fillStyle = C.sky[0]; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g);
  const HS = inkSafe(['CATCH MERCURY', 'BEFORE SUNRISE'], { font: D, weight: 400, size: 300, gap: 18, minGap: 8, word: 0.26 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['L', 'L'], 1, 0.1);

  // the sky: stepped bands, darkest at the top, brightest on the horizon, bowing with the lens
  for (const [m, col] of bands(C.sky, 280, 1020, { bow: 40 })) I.fill(m, col);
  const streaks = canvas(); seed(31); for (let i = 0; i < 14; i++) { const y = 700 + rand() * 260, x = rand() * W, L = 120 + rand() * 300; inkLine(streaks, curve([[x, y], [x + L / 2, y - 2], [x + L, y + 1]], 4), 1.2, { taper: 0.9, sd: i }); } I.ink(streaks);
  // Mercury: a small dot with a ring, just above the glow, with a hairline label
  const merc = circleMask(700, 880, 9); I.fill(merc, C.pop); I.ink(outline(merc, 1.8));
  const ring = canvas(); const rp = []; for (let a = 0; a <= 64; a++) rp.push([700 + Math.cos(a / 64 * Math.PI * 2) * 30, 880 + Math.sin(a / 64 * Math.PI * 2) * 30]); inkLine(ring, rp, 1.3, { sd: 4, taper: 0 }); I.ink(ring);
  snap('place-sky', out);
  // the hills: four ridges receding, each lighter, with strata along their faces
  const ridge = (y, amp, sd) => { seed(sd); const pts = [[-40, y]]; for (let x = 0; x <= W + 40; x += 60) pts.push([x, y - amp * (0.5 + 0.5 * Math.sin(x / 170 + sd)) - rand() * amp * 0.4]); return curve(pts, 8); };
  [[1040, 60, C.hills[0], 3], [1100, 80, C.hills[1], 5], [1180, 90, C.hills[2], 7]].forEach(([y, amp, col, sd]) => { const m = poly([...ridge(y, amp, sd), [W + 40, H + 40], [-40, H + 40]]); I.fill(m, col); I.ink(outline(m, 2)); I.ink(strata(m, { step: 14, n: 3, lw: 1.1, sd, keep: 0.45 })); });
  const near = poly([...curve([[-40, 1210], [300, 1150], [520, 1135], [760, 1170], [W + 40, 1250]], 8), [W + 40, H + 40], [-40, H + 40]]); I.fill(near, C.hills[3]); I.ink(outline(near, 2.6));
  I.ink(blades(near, { density: 0.0006, h: [8, 20], near: H, lw: 1.1, sd: 9 }));
  snap('place-hills', out);
  // the figure on the near ridge, traced: hood, coat, arms up with the phone
  const P = refMap(0.62, [360, 875], [520, 1142]);
  refFill(I, P, [[330, 552], [350, 546], [365, 556], [367, 580], [380, 575], [388, 552], [397, 553], [398, 575], [412, 600], [415, 625], [395, 645], [392, 700], [395, 760], [382, 810], [380, 875], [365, 880], [358, 820], [350, 820], [352, 870], [335, 872], [330, 810], [325, 760], [325, 700], [318, 660], [318, 600], [325, 585]], C.figure, null, null, 0, 2.4);
  const phone = closed(P([[384, 548], [396, 548], [397, 572], [385, 572]]), 2); I.fill(phone, C.sky[C.sky.length - 1]); I.ink(outline(phone, 1.6));
  snap('place-figure', out);

  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], 'Mercury reached greatest western elongation on 20 November, giving a rare window to spot the smallest planet before dawn.', { padCol: C.sky[0], y: M + ROW * 2 });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.sky[0], 5301);
  snap('final', out);
  return out;
};
