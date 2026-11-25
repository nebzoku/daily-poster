// No. 054 · Concept 1 · "A century after / the blight" · Gloock, sentence case, one tight interlocked block on the
// bottom margin (L / R).
// Story: a blight killed the American chestnut as a canopy tree nearly a hundred years ago; now resistant trees are
//   being bred and planted, and the species is coming back.
// Everyday thing: a big old chestnut tree, the sort you lie under, the giant the forests used to be full of.
// Visual idea: the tree as it was, thresholded bright (the leaves catch the light: the bright middle), turns lower
//   down into a field of letters: the same photograph re-set as ASCII made only of the letters of "chestnut". A
//   century on, the tree survives as a record, and the record is what it is being rebuilt from.
// Image: Charles Marville's 1850s photograph of a man lying at the foot of a chestnut tree (The Met): a real
//   chestnut in full leaf, from before the blight; zoomed into the trunk and canopy.
// Finish and paper: riso (calm, the paper's grain through the letters) on uncoated stock: an archive photograph
//   reprinted on soft paper; nothing glossy about a hundred years.
// Mood check: quiet, warm, a little elegiac but hopeful: the tree is lit yellow, not darkened.
window.POSTER = async () => {
  const C = __CW__;
  seed(5411);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`, `700 16px "Martian Mono"`]);
  const photo = await media('media/2026-11-25/image-02-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: sentence case, one size, interlocked, last line's ink on the bottom margin
  const HS = inkSafe(['A century after', 'the blight'], { font: D, weight: 400, size: 160, gap: 22, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.2, spread: 0.2 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 0, 6);

  // the image runs full bleed from the first grid line to a grid line above the headline
  const top = M + ROW;
  const bot = Math.floor((R[0].y - 24 - M) / ROW) * ROW + M;
  const split = M + ROW * 4;                           // above: the photograph; below: the record
  const r = { x: 0, y: top, w: W, h: bot - top };
  const src = canvas(); clip(src.g, r, () => cover(src.g, photo, r, { crop: [0.36, 0.18, 0.6, 0.7], fy: 0.5 }));
  const L = levels(src, 0.03, 0.97);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, src); snap('place-photo', p); }
  const above = rectMask({ x: 0, y: top, w: W, h: split - top });
  const lights = inter(lumMask(L, pct(L, 0.66), { blur: 1 }), above);
  const mids = cut(inter(lumMask(L, pct(L, 0.46), { blur: 1 }), above), lights);
  draw(g, tint(mids, C.mid2));
  snap('step-thr-1', out);
  draw(g, tint(lights, C.mid));
  snap('step-thr-2', out);

  // the record: the same photograph below the split, re-set in the letters of "chestnut" (dark → light)
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const labR = rectMask({ x: 0, y: split, w: COL * 3, h: 48 });
  const LA = levels(inter(L, rectMask({ x: 0, y: split, w: W, h: bot - split })), 0.02, 0.98);
  const asc = ascii(LA, { x: 0, y: split, w: W, h: bot - split }, { size: 16, chars: ' .:ctsnuhe', font: 'Martian Mono', weight: 700, lh: 1 });
  draw(g, tint(cut(asc, labR), C.mid));
  snap('step-ascii', out);
  // a hairline where the photograph becomes the record
  g.fillStyle = C.text; g.fillRect(0, split, W, 2);
  snap('shape-rule', out);
  block(g, ['(01) Chestnut, photographed in the 1850s'], M, top - 12, { ...t, anchor: 'bottom' });
  block(g, ['(02) The same tree, as a record'], M, split + 16, t);
  snap('text-labels', out);

  // furniture and subline in the top row, cap heights on the top margin
  block(g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], M, M, t);
  snap('text-furniture', out);
  const sub = balance('Nearly a century after a parasitic blight erased them, American chestnuts are being regrown across Appalachia from resistant seedlings.', { ...t, minW: 240, maxW: COL * 3.2 });
  block(g, sub.lines, W - M, M, { ...t, align: 'right' });
  snap('text-sub', out);
  pixels(g, M + COL * 2, M, 8, ['#..#..#', '.#..#..'], C.mid);
  snap('place-pixels', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 541, wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 54, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) }); });
  printAll(g, C, { seed: 541 });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 54, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 54);
  snap('final', out);
  return out;
};
