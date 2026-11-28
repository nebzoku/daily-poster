// No. 057 · Concept 2 · "The ground / gives way / slowly" · Libre Baskerville Bold, sentence case (the pairing swapped:
// serif headline, Necto Mono for the small type), ONE BLOCK CASCADING DOWN THE WHOLE SHEET, lines alternating sides
// (left, right, left): "The ground" edge to edge on the top margin, "gives way" ranged right lower down, "slowly" on the
// bottom margin. Each gap is bigger than the last: the words themselves sink.
// Story: satellite radar shows the ground under big African cities is sinking faster than earlier studies thought.
// Everyday thing: a city street map, the grid of blocks people live in.
// Visual idea: the city map pulled down the sheet. Longworth's 1817 plan of New York (a city on soft, made ground)
//   is thresholded full bleed; from the row-5 line down, every column of it is dragged straight down (image stretch),
//   so the streets above turn into long streaks below: the city settling. One lime benchmark pin on the line where the
//   dragging starts.
// Image: the Met's "The City of New York: Longworth's Explanatory Map and Plan" (1817), its street grid close up.
// Finish and paper: letterpress on newsprint: a serif bill on cheap city paper, the whole sheet inked with it.
// Mood check: slow and grave but not a disaster poster: pale ground, warm pinks, the streaks read as time passing.
window.POSTER = async () => {
  const C = __CW__;
  seed(5721);
  const D = 'Libre Baskerville', T = 'Necto Mono';
  await fonts([`700 100px "${D}"`, `400 16px "${T}"`]);
  const map = await media('media/2026-11-28/image-07-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: one size, the widest line ("The ground") margin to margin
  const HS = inkSafe(['The ground', 'gives way', 'slowly'], { font: D, weight: 700, size: 176, gap: 14, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'letterpress', wear: 0.1, spread: 0.12 });
  const [l1, l2, l3] = HS.lines, base = (t) => t.base - t.box.y;
  const head = canvas(), R = [];
  const capH = (() => { const t = setOptical('H', HS.o); return t.base - t.box.y; })();
  const b1 = M + capH;                                   // cap height on the top margin
  R.push(place(head, l1, { left: M, top: b1 - base(l1) }));
  const b2 = M + ROW * 3;                                // "gives way": baseline on the row-3 line, ranged right
  R.push(place(head, l2, { right: W - M, top: b2 - base(l2) }));
  R.push(place(head, l3, { left: M, top: H - M - l3.box.h }));   // "slowly": ink, descender included, on the bottom margin

  // the map, full bleed, close on the street grid
  const src = canvas(); cover(src.g, map, { x: 0, y: 0, w: W, h: H }, { crop: [0.2, 0.3, 0.32, 0.6] });
  const L = levels(src, 0.03, 0.97);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, src); snap('place-map', p); }
  // from the row-5 line down, every column repeats the pixel on the line (a slit scan downwards)
  const sy = M + ROW * 5, band = { x: 0, y: sy, w: W, h: H - sy };
  const S = stretch(L, band, 'y');
  const darks = lumMask(S, pct(L, 0.3), { blur: 0.8, invert: true });
  const mids = cut(lumMask(S, pct(L, 0.55), { blur: 0.8, invert: true }), darks);

  // small type sits in a clearing on the row-3.5 line, left
  const t = { font: T, size: 16, weight: 400, lead: 1.0, color: C.text };
  const ty = M + ROW * 4;   // cap height on the row-4 line
  const sub = balance('Radar from orbit can detect ground movement of a few millimetres, revealing how fast the land under whole cities is shifting.', { ...t, minW: 240, maxW: COL * 3, lines: [4, 4], strict: true });
  const fx = M, sx = M + COL * 2;
  const clearT = rectMask({ x: 0, y: M + ROW * 4, w: M + COL * 6, h: ROW });   // one grid box: edge to the column-6 line, row 4 to row 5
  const lime = { x: M + COL * 6 - 16, y: sy - 16 };   // in the clearing's bottom-right corner, on the row-5 line
  // no clearing round the headline (Ben, 28 Nov: no outline round type): it prints straight over the map
  const clear = clearT;

  draw(g, tint(cut(mids, clear), C.mid2));
  snap('step-thr-1', out);
  if (CAPTURE) {
    const unst = cut(lumMask(L, pct(L, 0.3), { blur: 0.8, invert: true }), clear);
    const p = canvas(); draw(p.g, out); draw(p.g, tint(unst, C.mid)); snap('step-stretch-1', p);
  }
  draw(g, tint(cut(darks, clear), C.mid));
  snap('step-stretch-2', out);

  // the line where the pulling starts: a hairline across, broken where the type and pin are; lime pin on it
  const hair = rectMask({ x: 0, y: sy - 1, w: W, h: 2 });
  draw(g, tint(hair, C.text));
  snap('shape-line', out);
  g.fillStyle = C.hl; g.fillRect(lime.x, lime.y, 16, 16);
  snap('place-pin', out);

  block(g, ['(Daily Poster)', '(No. 057)', '(Saturday 28 November)', '(BBC News)'], fx, ty, t);
  snap('text-furniture', out);
  block(g, sub.lines, sx, ty, t);
  snap('text-sub', out);
  block(g, ['(01)'], lime.x - 16, sy, { ...t, align: 'right', anchor: 'bottom' });
  snap('text-labels', out);

  snapLines(tint(head, C.type), R);
  const pr = (gg, k) => {
    printAll(gg, C, { seed: 572, wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) });
    printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 73, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) });
  };
  inkTrials(out, pr);
  pr(g, 1);
  snap('printed', out);
  stock(g, C.stock, 72);
  snap('final', out);
  return out;
};
