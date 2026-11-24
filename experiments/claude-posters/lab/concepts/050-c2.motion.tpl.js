// No. 050 · Concept 2, moving · "The summer bottled early" · a scan and a slide.
// The slit-scan band sweeps across the harvest picture and back, smearing a different strip of the season into
// stripes as it goes: the summer being compressed. The 50 slides left across the circle and back (the "00 3" move),
// flipping colour where they cross, while the circle swells a little. The bottle and the type stay still.
window.MOTION = async () => {
  const C = __CW__;
  await fonts(['900 100px "Libre Franklin"', '500 16px "Libre Franklin"']);
  const harvest = await media('media/2026-11-21/image-02-2160.jpg'), bottle = await media('media/2026-11-21/image-07-2160.jpg');
  const F = 'Libre Franklin';
  seed(5032);
  const { lines } = sameOptical8(['THE SUMMER', 'BOTTLED EARLY'], { font: F, weight: 900, size: 200, gap: 22, minGap: 10, word: 0.24 }, W - 2 * M);
  const head = canvas(); pinBlocks(head, spreadWords(lines, W - 2 * M), ['L', 'L'], 2, 0.08);
  const A = cell(0, 2, 8, 3), B = cell(0, 5, 3, 3);
  const a0 = boxed(harvest, A, { crop: [0.0, 0.1, 1.0, 0.62], fy: 0.4 });
  const bottleT = tone(levels(boxed(bottle, B, { crop: [0.18, 0.12, 0.64, 0.8] }), 0.02, 0.98), [C.boxInk, C.mid, C.paperLight]);
  const fifty = setOptical('50', { font: F, weight: 900, size: 320, gap: 10, minGap: 6 });
  const t0 = { font: F, size: 16, weight: 500, lead: 0.9, color: C.ink };
  const sub = balance('A long, hot summer brought the earliest grape harvest at the Three Choirs vineyard in half a century.', { ...t0, minW: 180, maxW: 300 });
  return async (t) => {
    seed(5032);
    const out = canvas(), g = out.g;
    paper(g, C.paper, { drift: 0.02, fibre: 0.05 });
    const s = 0.5 - 0.5 * Math.cos(2 * Math.PI * t), e = smooth(0, 1, s);
    // the scan band moves across the picture
    const bx = M + COL * (0.5 + 5 * e);
    const a = stretch(a0, { x: bx, y: A.y, w: COL * 2, h: A.h }, 'x');
    g.fillStyle = C.boxBg; g.fillRect(A.x, A.y, A.w, A.h);
    draw(g, tint(IM.print(inter(lumMask(a, 1 - pct(a0, 0.5), { invert: true, blur: 1 }), rectMask(A)), 'riso', { wear: 0.4, spread: 0.45, seed: 1 }), C.boxInk));
    draw(g, bottleT);
    // the 50 slides across the circle and back; the circle swells
    const r = COL * 1.5 * (1 + 0.07 * e), cx = M + COL * 5.75, cy = M + ROW * 6.35;
    const circ = circleMask(cx, cy, r);
    const fm = canvas(); place(fm, fifty, { right: W - M - COL * 1.6 * e, bottom: H - M });
    const fInk = IM.print(fm, 'letterpress', { wear: 0.35, spread: 0.3, seed: 7 });
    draw(g, tint(cut(circ, fInk), C.circle)); draw(g, tint(cut(fInk, circ), C.ink)); draw(g, tint(inter(fInk, circ), C.flip));
    block(g, sub.lines, B.x + B.w, B.y + 16, t0);
    block(g, ['(Daily Poster)', '(No. 050)', '(Friday 21 November)', '(The Guardian)'], B.x + B.w, B.y + B.h, { ...t0, anchor: 'bottom' });
    block(g, ['(Years since a harvest', 'started this early)'], W - M, A.y + A.h + 24, { ...t0, align: 'right' });
    block(g, ['(01)'], A.x + A.w, A.y - 10, { ...t0, align: 'right', anchor: 'bottom' });
    asterisk(g, A.x + A.w - 22, A.y + 22, 12, C.flip);
    pixels(g, M, A.y - 34, 8, ['#.#.', '.#.#', '#..#'], C.ink);
    printAll(g, C, { style: 'letterpress', boxes: [B] });
    draw(g, press(head, C.ink, 'letterpress', { wear: 0.35, spread: 0.25, seed: 50 }));
    scratches(g, 1, 502);
    draw(g, IM.paper(0.5, 50), 'source-over', 0.6); grain(g, 0.06, 0.5);
    return out;
  };
};
