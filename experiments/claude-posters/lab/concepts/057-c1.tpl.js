// No. 057 · Concept 1 · "A millimetre / at a time" · Necto Mono, sentence case, interlocked and centred in the MIDDLE
// BAND (rows 2.5 to 4.5), over the pillar, the pillar owning top and bottom. Text in Libre Baskerville.
// Story: satellite radar shows African cities like Lagos and Alexandria sinking faster than anyone had estimated.
// Everyday thing: a concrete pillar, the stuff a city stands on, and the ground line it stands in.
// Visual idea: one pillar standing in the middle of the sheet, crossing a hard ground line on the row-5 line. Above
//   the ground it is smooth and real; below the line it turns into big palette pixels: the part that has gone under,
//   only known as measurements. A hairline where its top used to be and a lime square where it is now: the drop.
//   A millimetre ruler runs down the left margin. The ground is the Rome 1645 city plan, thresholded: the city underfoot.
// Image: object-3 (the concrete pillar) smooth toned and pixelated; the Met's Plan of the City of Rome (1645) thresholded.
// Finish and paper: riso on uncoated: a calm, slightly grainy public-information print.
// Mood check: quiet, factual, a little uneasy (it is sinking) but not alarmist: the measured ruler keeps it calm.
window.POSTER = async () => {
  const C = __CW__;
  seed(5711);
  const D = 'Necto Mono', T = 'Libre Baskerville';
  await fonts([`400 100px "${D}"`, `400 16px "${T}"`]);
  const pillar = trim(await media('media/2026-11-28/object-3.png'));
  const rome = await media('media/2026-11-28/image-04-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: one size, sentence case, widest line margin to margin, interlocked, centred in the middle band
  const HS = inkSafe(['A millimetre', 'at a time'], { font: D, weight: 400, size: 136, gap: 30, minGap: 14, word: 0.3 }, W - 2 * M, { preset: 'riso', wear: 0.1, spread: 0.12 });
  const [a, b] = HS.lines, base = (t) => t.base - t.box.y;
  const pitch = interlockPitch(a, 'C', b, 'C', 8);
  const capH = (() => { const t = setOptical('H', HS.o); return t.base - t.box.y; })();
  const b1 = M + ROW * 2.5 + capH;   // first line's cap height on the row-2.5 line
  const head = canvas();
  const R = [place(head, a, { cx: W / 2, top: b1 - base(a) }), place(head, b, { cx: W / 2, top: b1 + pitch - base(b) })];

  // the ground: the row-5 line, the Rome plan thresholded below it
  const gy = M + ROW * 5;
  g.fillStyle = C.ground; g.fillRect(0, gy, W, H - gy);
  snap('shape-ground', out);
  const src = canvas(); cover(src.g, rome, { x: 0, y: gy, w: W, h: H - gy }, { crop: [0.3, 0.22, 0.4, 0.6] });
  const L = levels(src, 0.03, 0.97);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, src); snap('place-map', p); }
  const streets = inter(lumMask(L, pct(L, 0.42), { blur: 0.8, invert: true }), rectMask({ x: 0, y: gy, w: W, h: H - gy }));
  draw(g, tint(streets, C.mapInk));
  snap('step-thr-1', out);

  // the pillar: centred, top on the row-1 line plus a little, base deep under the ground
  const ph = ROW * 6.2, pw = ph * pillar.width / pillar.height, px = W / 2 - pw / 2, py = M + ROW * 1.25;
  const pc = canvas(); pc.g.drawImage(pillar, px, py, pw, ph);
  const pM = lumMask(pc, 0, { soft: 0.001 });
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, pc); snap('place-pillar', p); }
  const above = rectMask({ x: 0, y: 0, w: W, h: gy }), below = rectMask({ x: 0, y: gy, w: W, h: H - gy });
  const upM = inter(pM, above);
  draw(g, inter(tone(levels(pc, 0.02, 0.98), C.tones), upM));
  snap('step-tone-1', out);
  const pixOn = levels(pc, 0.02, 0.98);   // transparent round the pillar, so the cells follow its shape
  // under the ground the pillar is a pixel column (a little wider than the pillar, the cells on a 32 px step)
  const cell = 32, colX = Math.floor((px - 8) / cell) * cell, colW = Math.ceil((pw + 16) / cell) * cell;
  const pixM = rectMask({ x: colX, y: gy, w: colW, h: py + ph - gy });
  const pix = (s) => inter(pixelate(pixOn, s, C.pix), pixM);
  if (CAPTURE) for (const [n, s] of [[1, 8], [2, 64], [3, 16]]) { const p = canvas(); draw(p.g, out); draw(p.g, pix(s)); snap(`step-pix-${n}`, p); }
  const pixL = pix(cell);
  draw(g, pixL);
  snap('step-pix-4', out);

  // the drop: a hairline where the top used to be, a lime square where it is now
  const was = py - 40;
  g.fillStyle = C.text; g.fillRect(px - 40, was, pw + 80, 2);
  snap('shape-was', out);
  g.fillStyle = C.hl; g.fillRect(px + pw + 24, py - 8, 16, 16);
  snap('place-now', out);

  // the ruler: millimetre ticks down the left margin from the row-1 line to the ground
  for (let y = M + ROW, i = 0; y <= gy; y += 8, i++) { const l = i % 10 === 0 ? 32 : i % 5 === 0 ? 20 : 10; g.fillStyle = C.text; g.fillRect(M, y, l, 2); }
  snap('place-ruler', out);

  // small type: furniture top left, subline top right (four lines each, cap heights on the top margin)
  const t = { font: T, size: 16, weight: 400, lead: 1.1, color: C.text };
  block(g, ['(Daily Poster)', '(No. 057)', '(Saturday 28 November)', '(BBC News)'], M, M, t);
  snap('text-furniture', out);
  const sub = balance('New satellite data shows Lagos, Alexandria and other African cities are subsiding faster than earlier studies had estimated.', { ...t, minW: 240, maxW: COL * 3.2, lines: [4, 4], strict: true });
  block(g, sub.lines, W - M, M, { ...t, align: 'right' });
  snap('text-sub', out);
  block(g, ['(01) Where it stood'], px + pw + 56, was, { ...t, anchor: 'top' });
  block(g, ['(02) Where it stands'], px + pw + 56, py - 8, { ...t, anchor: 'top' });
  block(g, ['(03) Ground level'], M + 48, gy - 12, { ...t, anchor: 'bottom' });
  block(g, ['(04) Below, by radar'], W - M, gy - 12, { ...t, align: 'right', anchor: 'bottom' });
  snap('text-labels', out);

  // the headline: where it crosses the pillar it flips colour, so it reads on both
  const cross = inter(head, upM), rest = cut(head, upM);
  snapLines(union(tint(rest, C.type), tint(cross, C.cross)), R);
  const pr = (gg, k) => {
    printAll(gg, C, { seed: 571, shapes: [upM], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) });
    printHead(gg, rest, C.type, C.finish, { bg: C.bg, seed: 71, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) });
    printHead(gg, cross, C.cross, C.finish, { bg: C.bg, seed: 72, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) });
  };
  inkTrials(out, pr);
  pr(g, 1);
  snap('printed', out);
  stock(g, C.stock, 71);
  snap('final', out);
  return out;
};
