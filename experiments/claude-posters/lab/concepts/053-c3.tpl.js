// No. 053 · Concept 3 · "CHASING / LIGHT / NEAR / THE SUN" · Work Sans ExtraBold, all caps, centred, two blocks
// top and bottom set as an hourglass: the widest lines on the outer edges (CHASING, THE SUN), narrowing to the middle.
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
  snap('bg', out);

  const HS = inkSafe(['CHASING', 'LIGHT', 'NEAR', 'THE SUN'], { font: D, weight: 800, size: 200, gap: 18, minGap: 8, word: 0.26 }, W - 2 * M, { preset: 'copy', wear: 0.45, spread: 0.4 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C', 'C', 'C'], 2, 0.1);

  // the telescope: pixelated hard into the palette, centred, big, running through both blocks
  const sc = canvas();
  const S = W * 1.25; fit(sc.g, trim(scope), { x: (W - S) / 2, y: (H - S) / 2, w: S, h: S }, { rot: -0.36 });
  const om = lumMask(sc, 0, { soft: 0.001, blur: 2 });
  const scopeMask = lumMask(pixelate(om, 24, ['#ffffff']), 0.5, { soft: 0.01 });
  // the brass's shadows, pixelated at the same size, as a second ink inside the silhouette
  const lv = levels(sc, 0.02, 0.98), shade = inter(lumMask(pixelate(lumMask(lv, 1 - pct(lv, 0.35), { invert: true }), 24, ['#ffffff']), 0.5, { soft: 0.01 }), scopeMask);
  if (CAPTURE) {   // the making-of: the render dropped in, then pixelated harder and harder into the palette
    const ph = canvas(); draw(ph.g, out); draw(ph.g, sc); snap('place-photo', ph);
    for (const px of [4, 8, 12, 16, 20]) {
      const p = canvas(), sm = lumMask(pixelate(om, px, ['#ffffff']), 0.5, { soft: 0.01 });
      const sh = inter(lumMask(pixelate(lumMask(lv, 1 - pct(lv, 0.35), { invert: true }), px, ['#ffffff']), 0.5, { soft: 0.01 }), sm);
      draw(p.g, out); draw(p.g, tint(sm, C.scope)); draw(p.g, tint(sh, C.shade)); snap(`step-pix-${String(px).padStart(2, '0')}`, p);
    }
  }
  draw(g, tint(scopeMask, C.scope));
  draw(g, tint(shade, C.shade));
  snap('step-pix-24', out);

  // XOR: letters outside the telescope in the type colour, inside it knocked to the background colour
  const inScope = inter(head, scopeMask), outScope = cut(head, scopeMask);

  // furniture, subline and the 88 days in the middle band, centred like the type
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const midTop = R[1].y + R[1].h, midBot = R[2].y;
  const yTop = Math.ceil((midTop + 24 - M) / ROW) * ROW + M;   // first grid line clear of the top block
  block(g, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], W - M, yTop, { ...t, align: 'right' });
  snap('text-furniture', out);
  const sub = balance('Stargazers get a good chance this week to see Mercury, one of the most elusive planets, low in the sky.', { ...t, minW: 220, maxW: COL * 2.6 });
  // 88 days: 8px squares on an 11px pitch, centred, on the grid line above the bottom block
  const n = 88, pitch = 11, sq = 8, rowW = (n - 1) * pitch + sq, x0 = Math.round((W - rowW) / 2);
  const yB = Math.floor((midBot - 24 - M) / ROW) * ROW + M;    // last grid line clear of the bottom block
  const sqM = canvas(); sqM.g.fillStyle = '#fff';
  for (let i = 0; i < n; i++) sqM.g.fillRect(x0 + i * pitch, yB - sq, sq, sq);
  draw(g, tint(cut(sqM, scopeMask), C.squares)); draw(g, tint(inter(sqM, scopeMask), C.knock));   // XOR with the telescope too
  snap('shape-squares', out);
  block(g, sub.lines, M, yB - sq - 16, { ...t, anchor: 'bottom' });
  block(g, ['(88) Days in', 'a Mercury year'], W - M, yB - sq - 16, { ...t, align: 'right', anchor: 'bottom' });
  snap('text-sub', out);
  if (CAPTURE) HS.lines.forEach((ln, i) => {   // each headline line on its own, flat, for typing it in
    const one = canvas(); one.g.fillStyle = '#fff'; one.g.fillRect(R[i].x - 4, R[i].y - 4, R[i].w + 8, R[i].h + 8);
    const L = canvas(); draw(L.g, tint(inter(outScope, one), C.type)); draw(L.g, tint(inter(inScope, one), C.knock)); snap(`line-${i}`, L);
  });
  // the whole sheet photocopied like the headline (round 14), then the headline
  if (CAPTURE) {   // the making-of: ink trials, lighter and heavier, before the one that was kept
    for (const [nm, k] of [['ink-light', 0.35], ['ink-heavy', 1.7], ['ink-mid', 1.3]]) {
      const tmp = canvas(); draw(tmp.g, out);
      printAll(tmp.g, C, { seed: 551, wear: 0.4 * k, spread: Math.min(0.85, 0.5 * k) });
      printHead(tmp.g, outScope, C.type, C.finish, { bg: C.bg, seed: 55, wear: 0.45 * k, spread: Math.min(0.85, 0.4 * k) });
      printHead(tmp.g, inScope, C.knock, C.finish, { bg: C.scope, seed: 56, wear: 0.45 * k, spread: Math.min(0.85, 0.4 * k) });
      snap(nm, tmp);
    }
  }
  printAll(g, C, { seed: 551 });
  printHead(g, outScope, C.type, C.finish, { bg: C.bg, seed: 55, wear: HS.ink.wear, spread: HS.ink.spread });
  printHead(g, inScope, C.knock, C.finish, { bg: C.scope, seed: 56, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 55);
  snap('final', out);
  return out;
};
