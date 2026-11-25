// No. 054 · Concept 2 · "BACK FROM / FUNCTIONAL / EXTINCTION" · Schibsted Grotesk Black, all caps, a top block
// (BACK FROM, the words in the corners) and a bottom block (FUNCTIONAL / EXTINCTION).
// Story: the American chestnut was "functionally extinct" (roots alive, no trees); new breeding is bringing it back.
// Everyday thing: the spiky chestnut burr, the husk you find on the ground in autumn.
// Visual idea: a flat grid rectangle (the empty place the species left) with the burr, smooth and in tone, breaking
//   out of it and through both blocks of type: the living thing pushing back into the frame. Where the burr crosses
//   the letters they flip colour (XOR), so object and words are one piece. Smooth object, harsh flat shapes.
// Image: object-1, the chestnut burr and nuts render, zoomed right in on the burr's spikes.
// Finish and paper: screen (screenprint, calm) on newsprint: a protest-poster, news-of-the-day feel for a comeback.
// Mood check: punchy and upbeat; the burr is spiky but warm, nothing menacing.
window.POSTER = async () => {
  const C = __CW__;
  seed(5421);
  const D = 'Schibsted Grotesk', T = 'Schibsted Grotesk';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const obj = trim(await media('media/2026-11-25/object-1.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  const HS = inkSafe(['BACK FROM', 'FUNCTIONAL', 'EXTINCTION'], { font: D, weight: 900, size: 200, gap: 16, minGap: 8, word: 0.26 }, W - 2 * M, { preset: 'screen', wear: 0.2, spread: 0.2 });
  const lines = spreadWords(HS.lines, W - 2 * M, { maxShort: 0.2 });
  const head = canvas(); const R = pinBlocks(head, lines, ['L', 'L', 'L'], 1, 0.1);

  // the empty place: a flat rectangle on the grid
  const box = cell(1, 1, 7, 4);
  g.fillStyle = C.box; g.fillRect(box.x, box.y, box.w, box.h);
  snap('shape-box', out);

  // the burr: zoomed in on the husk (top left of the render), hanging from its twig off the top edge, between the
  // words of the top block, big enough to break out of the box
  const crop = document.createElement('canvas'); const cw = obj.width * 0.37, ch = obj.height * 0.37;
  crop.width = cw; crop.height = ch; crop.getContext('2d').drawImage(obj, 0, 0);
  crop.getContext('2d').clearRect(obj.width * 0.25, obj.height * 0.3, cw, ch);   // just the burr on its twig, not the nut beside it
  const bc = canvas(); fit(bc.g, crop, { x: W / 2 - 500, y: 450 - 500, w: 1000, h: 1000 }, { rot: Math.PI - 0.06 });
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, bc); snap('place-burr', p); }
  const burr = lumMask(bc, 0, { soft: 0.001, blur: 1 });
  const toned = inter(tone(levels(bc, 0.02, 0.98), C.tones), burr);
  if (CAPTURE) {   // the making-of: the render toned in two passes, a flat duotone first, then the full tritone
    const p = canvas(); draw(p.g, out); draw(p.g, inter(tone(levels(bc, 0.02, 0.98), [C.tones[0], C.tones[2]]), burr)); snap('step-tone-1', p);
  }
  draw(g, toned);
  snap('step-tone-2', out);

  // small type: under the box, aligned to its left edge and the right margin, last baselines on a grid line
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const yb = M + ROW * 6;
  const sub = balance('New techniques are producing chestnut trees that can survive the fungus which once felled billions of stems across eastern forests.', { ...t, minW: 220, maxW: COL * 2.6 });
  const smallM = canvas();
  block(smallM.g, sub.lines, box.x, yb, { ...t, color: '#fff', anchor: 'bottom' });
  block(smallM.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, yb, { ...t, color: '#fff', align: 'right', anchor: 'bottom' });
  block(smallM.g, ['(01) Chestnut burr, the husk that holds the nuts'], box.x + box.w, box.y + box.h + 16, { ...t, color: '#fff', align: 'right' });
  // small type flips colour where the burr passes under it, so it always reads
  draw(g, tint(cut(smallM, burr), C.text)); draw(g, tint(inter(smallM, burr), C.knock));
  snap('text-small', out);
  asterisk(g, box.x + 8, box.y + box.h + 22, 8, C.text);
  snap('place-asterisk', out);

  // XOR: letters outside the burr in the type colour, inside it in the knock colour
  const inB = inter(head, burr), outB = cut(head, burr);
  if (CAPTURE) { const L = canvas(); draw(L.g, tint(outB, C.type)); draw(L.g, tint(inB, C.knock)); snapLines(L, R); }
  inkTrials(out, (gg, k) => {
    printAll(gg, C, { seed: 542, shapes: [burr], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) });
    printHead(gg, outB, C.type, C.finish, { bg: C.bg, seed: 57, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) });
    printHead(gg, inB, C.knock, C.finish, { bg: C.box, seed: 58, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) });
  });
  printAll(g, C, { seed: 542, shapes: [burr] });
  printHead(g, outB, C.type, C.finish, { bg: C.bg, seed: 57, wear: HS.ink.wear, spread: HS.ink.spread });
  printHead(g, inB, C.knock, C.finish, { bg: C.box, seed: 58, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 542);
  snap('final', out);
  return out;
};
