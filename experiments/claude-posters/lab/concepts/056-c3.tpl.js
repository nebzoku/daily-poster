// No. 056 · Concept 3 · "Turkeys fall / from Alaskan skies" · Sora SemiBold, sentence case, interlocked, both lines in one
// block on the top margin (the sky), the boxes falling away beneath it (re-set after Ben's note on samey layouts).
// Story: each Thanksgiving a team of Alaskan pilots drops turkeys out of small planes to villages off the road network.
// Everyday thing: the Thanksgiving turkey itself; something dropping out of the sky in stages.
// Visual idea: one turkey, falling across the grid. The same old Dutch drawing of a turkey repeats in three grid boxes
//   that step down and to the left, a column and a half and a row and a half at a time, each overlapping the last
//   (overprinted where they cross): (01) smooth and toned, high up; (02) thresholded on the way down; (03) pixelated
//   big as it lands. Only the bird's wattle in the first box is lime: the one eye-catching thing.
// Image: the Met's 17th-century Dutch watercolour "A Turkey" (CC0), cropped in close on the bird.
// Finish and paper: bleed (soaked ink, the whole sheet with it) on smooth stock: a glossy holiday card that
//   got rained on.
// Mood check: festive and a bit comic (a turkey dropping in), the warm reds keep it a celebration.
window.POSTER = async () => {
  const C = __CW__;
  seed(5631);
  const D = 'Sora', T = 'Sora';
  await fonts([`600 100px "${D}"`, `500 16px "${T}"`]);
  const bird = await media('media/2026-11-27/image-06-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  const HS = inkSafe(['Turkeys fall', 'from Alaskan skies'], { font: D, weight: 600, size: 160, gap: 8, minGap: 6, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.3, spread: 0.3 });
  const lines = [HS.lines[0], ...spreadWords([HS.lines[1]], W - 2 * M, { maxShort: 0.1 })];   // the bottom line margin to margin
  const head = canvas(); const R = pinInterlock(head, lines, ['L', 'L'], 2, 6);

  // three boxes stepping down the grid, 3.5 columns × 2 rows each
  const B = [cell(4.5, 2, 3.5, 2), cell(2.75, 3.5, 3.5, 2), cell(1, 5, 3.5, 2)];
  const crop = [0.3, 0.17, 0.52, 0.68];
  const srcs = B.map((b) => boxed(bird, b, { crop }));
  const Ls = srcs.map((s) => levels(s, 0.02, 0.98));
  const layers = [];
  // (01) smooth, toned; the wattle (the red of the drawing) picked out in lime
  {
    const c = canvas(); draw(c.g, tone(Ls[0], C.tones));
    const s = srcs[0], d = s.g.getImageData(0, 0, s.width, s.height), m = canvas(), md = m.g.createImageData(s.width, s.height);
    for (let p = 0; p < d.data.length; p += 4) { const [r, gg, b, a] = [d.data[p], d.data[p + 1], d.data[p + 2], d.data[p + 3]]; if (a && r > gg + 60 && r > b + 35) { md.data[p] = md.data[p + 1] = md.data[p + 2] = 255; md.data[p + 3] = 255; } }
    m.g.putImageData(md, 0, 0);
    draw(c.g, tint(alphaThr(blurred(m, 2), 0.45), C.hl));
    layers.push(c);
  }
  // (02) thresholded in two layers on the box colour
  {
    const c = canvas(); c.g.fillStyle = C.box2; c.g.fillRect(B[1].x, B[1].y, B[1].w, B[1].h);
    draw(c.g, tint(inter(lumMask(Ls[1], pct(Ls[1], 0.28), { blur: 0.6, invert: true }), rectMask(B[1])), C.thr));
    layers.push(c);
  }
  // (03) pixelated big, snapped to the palette
  const L3 = canvas(); L3.g.fillStyle = '#fff'; L3.g.fillRect(B[2].x, B[2].y, B[2].w, B[2].h); draw(L3.g, Ls[2]);
  const pix = (s) => inter(pixelate(L3, s, C.pix), rectMask(B[2]));
  layers.push(pix(32));
  // overprint: where a later box crosses an earlier one, the crossing goes flat in the overprint colour with the later
  // box's darkest marks knocked through
  const ov = (a, b) => { const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y), w = Math.min(a.x + a.w, b.x + b.w) - x, h = Math.min(a.y + a.h, b.y + b.h) - y; return w > 0 && h > 0 ? { x, y, w, h } : null; };
  layers.forEach((c, i) => {
    if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, srcs[i]); snap(`place-box-${i + 1}`, p); }
    if (CAPTURE && i === 2) for (const [n, s] of [[1, 8], [2, 64], [3, 16]]) { const p = canvas(); draw(p.g, out); draw(p.g, pix(s)); snap(`step-pix-${n}`, p); }
    draw(g, c);
    if (i) { const o = ov(B[i - 1], B[i]); if (o) { g.fillStyle = C.over; g.fillRect(o.x, o.y, o.w, o.h); draw(g, tint(inter(lumMask(Ls[i], pct(Ls[i], 0.3), { invert: true, blur: 0.6 }), rectMask(o)), C.bg)); } }
    snap(i === 2 ? 'step-pix-4' : `step-box-${i + 1}`, out);
  });

  // small type: subline under box 3 on its left edge, furniture beside it in line with the labels; labels by each box
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const ty = B[2].y + B[2].h + 24;
  block(g, ['(Daily Poster)', '(No. 056)', '(Friday 27 November)', '(BBC News)'], B[2].x + B[2].w + 16, ty, t);
  snap('text-furniture', out);
  const sub = balance('For the last few years, the so-called turkey bombers have taken to the skies so isolated villages can share the holiday meal.', { ...t, minW: 200, maxW: B[2].w - 8, lines: [4, 4], strict: true });
  block(g, sub.lines, B[2].x, ty, t);
  snap('text-sub', out);
  block(g, ['(01) Away'], B[0].x + B[0].w, B[0].y + B[0].h + 16, { ...t, align: 'right' });
  block(g, ['(02) Falling'], B[1].x + B[1].w + 16, B[1].y + B[1].h, { ...t, anchor: 'bottom' });
  block(g, ['(03) Landed'], B[2].x + B[2].w + 16, B[2].y + B[2].h, { ...t, anchor: 'bottom' });
  snap('text-labels', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 563, boxes: [B[0]] }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 63, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) }); });
  printAll(g, C, { seed: 563, boxes: [B[0]] });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 63, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 63);
  snap('final', out);
  return out;
};
