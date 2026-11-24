// No. 053 · Concept 3 · "CHASING / LIGHT / NEAR THE / SUN" · Work Sans ExtraBold, all caps, centred, one word (or
// pair) per line, two blocks top and bottom.
// Story: spotting Mercury means chasing a speck of light that never strays far from the sun: you look for it in
//   the brief window before the sun comes up and drowns it out.
// Everyday thing: a telescope, the thing you point at the sky to chase that light.
// Visual idea: the brief's brass telescope, centred and big, pixelated hard into the palette until it is almost
//   pattern, runs straight through the centred headline; where telescope and letters cross they swap (XOR), so the
//   instrument and the words are one piece. The centred stack mirrors the centred object. A row of 88 small squares
//   counts Mercury's 88-day year.
// Image: object-1, the 18th-century Gregorian reflecting telescope render.
// Finish and paper: copy (photocopy ink from the Ink Machine) on photocopy stock: a stargazing-club flyer run off
//   on the office copier; rough, quick, friendly.
// Mood check: lively, a bit nerdy, hands-on; nothing dark.
window.POSTER = async () => {
  const C = __CW__;
  seed(5331);
  const D = 'Work Sans', T = 'Work Sans';
  await fonts([`800 100px "${D}"`, `500 16px "${T}"`]);
  const scope = await media('media/2026-11-24/object-1.png');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const HS = inkSafe(['CHASING', 'LIGHT', 'NEAR THE', 'SUN'], { font: D, weight: 800, size: 200, gap: 18, minGap: 8, word: 0.26 }, W - 2 * M, { preset: 'copy', wear: 0.45, spread: 0.4 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C', 'C', 'C'], 2, 0.1);

  // the telescope: pixelated hard into the palette, centred, big, running through both blocks
  const sc = canvas();
  const S = W * 1.25; fit(sc.g, trim(scope), { x: (W - S) / 2, y: (H - S) / 2, w: S, h: S }, { rot: -0.36 });
  const om = lumMask(sc, 0, { soft: 0.001, blur: 2 });
  const scopeMask = lumMask(pixelate(om, 24, ['#ffffff']), 0.5, { soft: 0.01 });
  // the brass's shadows, pixelated at the same size, as a second ink inside the silhouette
  const lv = levels(sc, 0.02, 0.98), shade = inter(lumMask(pixelate(lumMask(lv, 1 - pct(lv, 0.35), { invert: true }), 24, ['#ffffff']), 0.5, { soft: 0.01 }), scopeMask);
  draw(g, tint(scopeMask, C.scope));
  draw(g, tint(shade, C.shade));

  // XOR: letters outside the telescope in the type colour, inside it knocked to the background colour
  const inScope = inter(head, scopeMask), outScope = cut(head, scopeMask);
  printHead(g, outScope, C.type, C.finish, { bg: C.bg, seed: 55 });
  printHead(g, inScope, C.knock, C.finish, { bg: C.scope, seed: 56 });

  // furniture, subline and the 88 days in the middle band, centred like the type
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const midTop = R[1].y + R[1].h, midBot = R[2].y;
  const yTop = Math.ceil((midTop + 24 - M) / ROW) * ROW + M;   // first grid line clear of the top block
  block(g, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], W - M, yTop, { ...t, align: 'right' });
  const sub = balance('Stargazers get a good chance this week to see Mercury, one of the most elusive planets, low in the sky.', { ...t, minW: 220, maxW: COL * 2.6 });
  // 88 days: 8px squares on an 11px pitch, centred, on the grid line above the bottom block
  const n = 88, pitch = 11, sq = 8, rowW = (n - 1) * pitch + sq, x0 = Math.round((W - rowW) / 2);
  const yB = Math.floor((midBot - 24 - M) / ROW) * ROW + M;    // last grid line clear of the bottom block
  const sqM = canvas(); sqM.g.fillStyle = '#fff';
  for (let i = 0; i < n; i++) sqM.g.fillRect(x0 + i * pitch, yB - sq, sq, sq);
  draw(g, tint(cut(sqM, scopeMask), C.squares)); draw(g, tint(inter(sqM, scopeMask), C.knock));   // XOR with the telescope too
  block(g, sub.lines, M, yB - sq - 16, { ...t, anchor: 'bottom' });
  block(g, ['(88) Days in', 'a Mercury year'], W - M, yB - sq - 16, { ...t, align: 'right', anchor: 'bottom' });
  stock(g, C.stock, 55);
  return out;
};
