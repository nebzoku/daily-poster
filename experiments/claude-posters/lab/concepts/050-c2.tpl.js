// No. 050 · Concept 2 · "The summer bottled early" · grid boxes, image stretch, a 50 crossing a circle.
// Story → everyday thing: the summer itself, poured into a bottle. Box A: Lhermitte's Grape Harvest thresholded,
// a band slit-stretched into stripes (a season compressed). Box B: the Met's 18th-century onion bottle, smooth tone.
// The number that matters, 50, crosses a circle and flips colour inside it.
window.POSTER = async () => {
  const C = __CW__;
  seed(5032);
  await fonts(['900 100px "Libre Franklin"', '500 16px "Libre Franklin"']);
  const harvest = await media('media/2026-11-21/image-02-2160.jpg'), bottle = await media('media/2026-11-21/image-07-2160.jpg');
  const F = 'Libre Franklin';
  const out = canvas(), g = out.g;
  paper(g, C.paper, { drift: 0.02, fibre: 0.05 });
  snap('bg', out);

  const { lines } = sameOptical8(['THE SUMMER', 'BOTTLED EARLY'], { font: F, weight: 900, size: 200, gap: 22, minGap: 10, word: 0.24 }, W - 2 * M);
  const head = canvas(); const R = pinBlocks(head, spreadWords(lines, W - 2 * M), ['L', 'L'], 2, 0.08);

  const A = cell(0, 2, 8, 3);
  let a = boxed(harvest, A, { crop: [0.0, 0.1, 1.0, 0.62], fy: 0.4 });
  a = stretch(a, { x: M + COL * 3, y: A.y, w: COL * 2, h: A.h }, 'x');
  if (CAPTURE) {   // the harvest placed as it is, thresholded, then stretched
    const p1 = canvas(); draw(p1.g, out); draw(p1.g, tone(levels(boxed(harvest, A, { crop: [0.0, 0.1, 1.0, 0.62], fy: 0.4 }), 0.05, 0.95), [C.boxBg, C.boxInk, C.paperLight])); snap('place-harvest', p1);
    const a0 = boxed(harvest, A, { crop: [0.0, 0.1, 1.0, 0.62], fy: 0.4 });
    const p2 = canvas(); draw(p2.g, out); p2.g.fillStyle = C.boxBg; p2.g.fillRect(A.x, A.y, A.w, A.h); draw(p2.g, tint(IM.print(inter(lumMask(a0, 1 - pct(a0, 0.5), { invert: true, blur: 1 }), rectMask(A)), 'riso', { wear: 0.4, spread: 0.45, seed: 1 }), C.boxInk)); snap('step-a-1', p2);
  }
  g.fillStyle = C.boxBg; g.fillRect(A.x, A.y, A.w, A.h);
  const am = IM.print(inter(lumMask(a, 1 - pct(a, 0.5), { invert: true, blur: 1 }), rectMask(A)), 'riso', { wear: 0.4, spread: 0.45, seed: 1 });
  draw(g, tint(am, C.boxInk));
  snap('step-a-2', out);

  const B = cell(0, 5, 3, 3);
  draw(g, tone(levels(boxed(bottle, B, { crop: [0.18, 0.12, 0.64, 0.8] }), 0.02, 0.98), [C.boxInk, C.mid, C.paperLight]));
  snap('place-bottle', out);

  // the 50 crossing a circle, XOR so the overlap flips
  const r = COL * 1.5, cx = M + COL * 5.75, cy = M + ROW * 6.35;
  const circ = circleMask(cx, cy, r);
  const fifty = setOptical('50', { font: F, weight: 900, size: 320, gap: 10, minGap: 6 });
  const fm = canvas(); place(fm, fifty, { right: W - M, bottom: H - M });
  const fInk = IM.print(fm, 'letterpress', { wear: 0.35, spread: 0.3, seed: 7 });
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, tint(circ, C.circle)); snap('shape-circle', p); }
  draw(g, tint(cut(circ, fInk), C.circle));
  draw(g, tint(cut(fInk, circ), C.ink));
  draw(g, tint(inter(fInk, circ), C.flip));
  snap('place-fifty', out);


  const t = { font: F, size: 16, weight: 500, lead: 0.9, color: C.ink };
  const sub = balance('A long, hot summer brought the earliest grape harvest at the Three Choirs vineyard in half a century.', { ...t, minW: 180, maxW: 300 });
  block(g, sub.lines, B.x + B.w, B.y + 16, t);
  snap('text-sub', out);
  block(g, ['(Daily Poster)', '(No. 050)', '(Friday 21 November)', '(The Guardian)'], B.x + B.w, B.y + B.h, { ...t, anchor: 'bottom' });
  snap('text-furniture', out);
  block(g, ['(Years since a harvest', 'started this early)'], W - M, A.y + A.h + 24, { ...t, align: 'right' });
  block(g, ['(01)'], A.x + A.w, A.y - 10, { ...t, align: 'right', anchor: 'bottom' });
  snap('text-labels', out);
  asterisk(g, A.x + A.w - 22, A.y + 22, 12, C.flip);
  snap('place-asterisk', out);
  pixels(g, M, A.y - 34, 8, ['#.#.', '.#.#', '#..#'], C.ink);
  snap('place-pixels', out);   // little marks are dragged in, not set in a text box
  snapLines(tint(head, C.ink), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { style: 'letterpress', boxes: [B], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); draw(gg, press(head, C.ink, 'letterpress', { wear: 0.35 * k, spread: Math.min(0.85, 0.4 * k), seed: 50 })); });
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'letterpress', boxes: [B] });
  draw(g, press(head, C.ink, 'letterpress', { wear: 0.35, spread: 0.25, seed: 50 }));
  snap('printed', out);
  scratches(g, 1, 502);   // wear from handling (round 16)
  draw(g, IM.paper(0.5, 50), 'source-over', 0.6); grain(g, 0.06, 0.5);
  snap('final', out);
  return out;
};
