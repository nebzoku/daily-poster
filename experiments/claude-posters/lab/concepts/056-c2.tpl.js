// No. 056 · Concept 2 · "WHERE NO ROAD / REACHES" · Sora ExtraBold, all caps, a top block edge to edge on the top
// margin and REACHES on the bottom margin (R), the furniture and subline tucked in beside it.
// Story: in Alaska, villages that no road reaches still get their Thanksgiving turkey, dropped from a small plane by
//   volunteer bush pilots.
// Everyday thing: the end of the road (the tarmac just stops), and a small plane going over.
// Visual idea: the plane makes the road. The bush plane, smooth and real, is slit-scan stretched behind it into a band
//   of long stripes that runs off the right edge: the only road out here is drawn in the air. Below, a flat road bar
//   comes in from the left edge and stops dead on the grid; out past its end, a few houses as pixel runs, and one lime
//   square dropping towards them from the band: the parcel.
// Image: object-1 (the Super Cub bush plane render), toned smooth into the palette, its trail made by image stretch.
// Finish and paper: foil-emboss on rough stock: a raised foil like a club's commemorative card, the rough sheet like
//   snow crust; the rest of the sheet printed crisp around it.
// Mood check: calm, wide and a bit heroic; lots of empty dark space, nothing threatening.
window.POSTER = async () => {
  const C = __CW__;
  seed(5621);
  const D = 'Sora', T = 'Sora';
  await fonts([`800 100px "${D}"`, `500 16px "${T}"`]);
  const plane = trim(await media('media/2026-11-27/object-1.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: one size, caps, the widest line margin to margin
  const HS = inkSafe(['WHERE NO ROAD', 'REACHES'], { font: D, weight: 800, size: 160, gap: 10, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'letterpress', wear: 0.1, spread: 0.12 });
  const lines = spreadWords(HS.lines, W - 2 * M, { maxShort: 0.12 });   // the top line's three words run margin to margin
  const head = canvas(); const R = pinBlocks(head, lines, ['L', 'R'], 1, 0.1);

  // the plane: on the left, nose to the left margin, between rows 2 and 4
  const pw = COL * 5, ph = pw * plane.height / plane.width, px = M - 40, py = M + ROW * 3 - ph / 2;
  const pc = canvas(); pc.g.drawImage(plane, px, py, pw, ph);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, pc); snap('place-plane', p); }
  const planeM = lumMask(pc, 0, { soft: 0.001 });
  draw(g, inter(tone(levels(pc, 0.04, 0.98), C.tones), planeM));
  snap('step-tone-1', out);
  // its trail: every row from a column through the fuselage repeated to the right edge (a slit scan)
  const sx = Math.round(px + pw * 0.44), band = { x: sx, y: py, w: W - sx, h: ph };
  const planeT = tone(levels(pc, 0.04, 0.98), C.tones);
  const trailT = inter(stretch(planeT, band, 'x'), rectMask(band));
  if (CAPTURE) {
    for (const [n, f] of [[1, 0.35], [2, 0.75]]) { const p = canvas(); draw(p.g, out); draw(p.g, inter(trailT, rectMask({ ...band, w: band.w * f }))); snap(`step-stretch-${n}`, p); }
  }
  draw(g, trailT);
  snap('step-stretch-3', out);

  // the road: a flat bar from the left edge to the column-2 line on the row-6 line, centre dashes stopping with it
  const ry = M + ROW * 6, rw = M + COL * 2;
  g.fillStyle = C.road; g.fillRect(0, ry - 48, rw, 48);
  snap('shape-road', out);
  g.fillStyle = C.bg; for (let x = 0; x + 32 <= rw - 16; x += 56) g.fillRect(x, ry - 28, 32, 8);
  snap('place-dashes', out);

  // the village, out past the end of the road: houses as little pixel runs on the row-6 line, cols 5-6
  const hx = M + COL * 5, s = 8;
  pixels(g, hx, ry - 24, s, ['.#.', '###', '###'], C.house);
  pixels(g, hx + 40, ry - 32, s, ['.#..', '####', '####', '####'], C.house);
  pixels(g, hx + 96, ry - 24, s, ['.#.', '###', '###'], C.house);
  snap('place-houses', out);
  // the parcel's fall: small squares from the trail down towards the houses, the last one lime
  const fx = hx + 56, f0 = band.y + band.h + 32, f1 = ry - 88;
  for (let y = f0, i = 0; y < f1 - 40; y += 48, i++) { g.fillStyle = C.fall; g.fillRect(fx, y, 8, 8); }
  g.fillStyle = C.hl; g.fillRect(fx - 4, f1 - 16, 16, 16);
  snap('place-fall', out);

  // small type: furniture in the bottom-left corner, last baseline on the bottom margin; subline beside it
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(Daily Poster)', '(No. 056)', '(Friday 27 November)', '(BBC News)'], M, H - M, { ...t, anchor: 'bottom' });
  snap('text-furniture', out);
  const sub = balance('No roads, no shops, no problem: a small aircraft crosses the snow and delivers the feast to the doorstep.', { ...t, minW: 200, maxW: R[1].x - M - COL * 1.5 - 32, lines: [4, 4], strict: true });
  block(g, sub.lines, M + COL * 1.5, H - M, { ...t, anchor: 'bottom' });
  snap('text-sub', out);
  block(g, ['(01) End of the road'], M, ry + 16, t);
  block(g, ['(02) No road from here'], rw + 16, ry - 48, t);
  block(g, ['(03) Dinner'], fx + 24, f1 - 16, t);
  snap('text-labels', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 562, shapes: [planeM], boxes: [band] }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 62, light: 0.3 + 0.25 * k }); });
  printAll(g, C, { seed: 562, shapes: [planeM], boxes: [band] });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 62 });
  snap('printed', out);
  stock(g, C.stock, 62);
  snap('final', out);
  return out;
};
