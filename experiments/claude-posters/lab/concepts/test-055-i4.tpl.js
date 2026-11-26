// Illustration test 4 (No. 055) · "ONE HAND / TWO WHEELS" · Anybody Black caps, top and bottom, words in the corners.
// Drawn from a reference photo (refs/2026-11-26/ref-14: a hand holding up a cricket ball), traced by hand as clean
// contours, its shadows taken from the photo's own light.
// Scene: a low angle, looking up past the passenger's raised hand at the ball it has just taken, against a big
//   sunset-orange sky with outlined cumulus and thin wind streaks. Pop: the wristband (cobalt), the one small focal
//   point. Tints and shades of the palette for the skin and the ball.
window.POSTER = async () => {
  const C = __CW__;
  seed(5594);
  const D = 'Anybody', T = 'Azeret Mono';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const ref = await img('/experiments/claude-posters/refs/2026-11-26/ref-14.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.sky; g.fillRect(0, 0, W, H);
  snap('bg', out);
  const I = illo(g), lw = 3.2;

  const HS = inkSafe(['ONE HAND', 'TWO WHEELS'], { font: D, weight: 900, size: 160, gap: 14, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const lines = spreadWords(HS.lines, W - 2 * M, { maxShort: 0.3 });
  const head = canvas(); const R = pinBlocks(head, lines, ['L', 'L'], 1, 0.1);

  // sky: thin wind streaks, then clouds
  const streaks = canvas();
  seed(77); for (let i = 0; i < 26; i++) { const y = 200 + rand() * 900, x = rand() * W, L = 60 + rand() * 260; inkLine(streaks, curve([[x, y], [x + L / 2, y - 3], [x + L, y + 2]], 4), 1.3, { taper: 0.9, sd: i }); }
  I.ink(streaks);
  for (const [x, y, w, h, s] of [[-140, 760, 520, 260, 31], [700, 300, 420, 180, 32], [-60, 1020, 420, 240, 33], [760, 980, 420, 200, 34]]) { const cl = cumulus(x, y, w, h, s, { lobes: 9, curls: 4, lw: 2.6, flat: false }); I.fill(cl.fill, C.cloud); I.ink(cl.lines); }
  snap('place-sky', out);

  // the reference, mapped: ball centre (393, 463) on an 800-wide view → poster (540, 560), at 1.31×
  const P = refMap(1.31, [393, 463], [540, 560]);
  const hand = closed(P([[395, 1260], [385, 1110], [360, 1000], [330, 900], [300, 800], [275, 700], [258, 630], [262, 600], [300, 615], [340, 660], [390, 720], [425, 745],
    [540, 730], [570, 718], [605, 725], [622, 750], [626, 790], [670, 810], [690, 840], [700, 880], [705, 930], [712, 970], [705, 1020], [700, 1100], [695, 1260]]));
  const peek = closed(P([[572, 396], [600, 402], [613, 432], [603, 468], [580, 480]]));
  const thumb = closed(P([[432, 770], [425, 700], [415, 640], [412, 610], [445, 592], [485, 600], [515, 622], [533, 670], [540, 740], [532, 815], [500, 838], [462, 805]]));
  const shade = (m, q) => photoShade(ref, 800, P, m, q);
  for (const m of [peek, hand]) { I.fill(m, C.skin); I.fill(shade(m, 0.38), C.skinShade); I.ink(outline(m, lw)); }
  // knuckle folds of the curled fingers, traced
  const folds = canvas();
  for (const pts of [[[548, 728], [560, 790], [585, 850], [600, 900]], [[626, 792], [640, 850], [650, 905]], [[690, 845], [672, 900], [668, 950]], [[700, 960], [660, 1000], [610, 1010]]])
    inkLine(folds, curve(P(pts), 4), 2.2, { sd: pts[0][0], taper: 0.5 });
  I.ink(folds);
  snap('place-hand', out);
  // the wristband: the pop
  const band = closed(P([[392, 1000], [530, 985], [706, 995], [704, 1052], [530, 1045], [398, 1068]]), 6);
  I.fill(band, C.pop); I.ink(outline(band, lw));
  snap('place-band', out);
  // the ball, drawn, in front of the fingers; the thumb over it
  const [bc] = P([[393, 463]]);
  const B = ballArt(bc[0], bc[1], 190 * 1.31, { tilt: -0.32, seamX: 0.42, lw: 3.6, sd: 11 });
  I.fill(B.body, C.ball); I.fill(B.shadow, C.ballShade); I.fill(B.light, C.ballLight); I.fill(B.stitches, C.stitch); I.ink(B.lines);
  I.fill(thumb, C.skin); I.fill(shade(thumb, 0.4), C.skinShade); I.ink(outline(thumb, lw));
  const nail = closed(P([[418, 612], [440, 600], [470, 606], [462, 620], [432, 622]]), 3); I.fill(nail, C.ballLight); I.ink(outline(nail, 2));
  snap('place-ball', out);

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const smallM = canvas();
  block(smallM.g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], M, M + ROW, t);
  const sub = balance("A motorbike passenger caught a six one-handed outside the ground at Pakistan's Swat Premier League.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(smallM.g, sub.lines, W - M, M + ROW, { ...t, align: 'right' });
  I.fill(dilate(alphaThr(smallM, 0.3), 10), C.sky);
  draw(g, tint(smallM, C.text));
  snap('text-small', out);

  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 5594, wear: 0.12, spread: 0.5, bg: C.sky });
  I.print(g, C.line, 5594);
  printHead(g, head, C.type, C.finish, { bg: C.sky, seed: 594, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 594);
  snap('final', out);
  return out;
};
