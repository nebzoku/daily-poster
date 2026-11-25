// No. 054 · Concept 1, moving · "A century after / the blight" · the record sweeping through the tree.
// Over the loop the line where the photograph becomes the record (the ASCII of "chestnut") sweeps up the tree and
// back down, like a slit-scan band: above it the thresholded photograph, below it the same tree re-set in letters.
// The ASCII grid stays fixed to the page (the line moves a character row at a time), so the letters re-form row by
// row as the line passes. The headline, subline and furniture hold still; the (02) label rides on the line.
window.MOTION = async () => {
  const C = __CW__;
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`, `700 16px "Martian Mono"`]);
  const photo = await media('media/2026-11-25/image-02-2160.jpg');
  seed(5411);
  const HS = inkSafe(['A century after', 'the blight'], { font: D, weight: 400, size: 160, gap: 22, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.2, spread: 0.2 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 0, 6);
  const top = M + ROW, bot = Math.floor((R[0].y - 24 - M) / ROW) * ROW + M;
  const r = { x: 0, y: top, w: W, h: bot - top };
  const src = canvas(); clip(src.g, r, () => cover(src.g, photo, r, { crop: [0.36, 0.18, 0.6, 0.7], fy: 0.5 }));
  const L = levels(src, 0.03, 0.97);
  const lightsAll = lumMask(L, pct(L, 0.66), { blur: 1 });
  const midsAll = cut(lumMask(L, pct(L, 0.46), { blur: 1 }), lightsAll);
  const LA = levels(L, 0.02, 0.98);
  const t0 = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const sub = balance('Nearly a century after a parasitic blight erased them, American chestnuts are being regrown across Appalachia from resistant seedlings.', { ...t0, minW: 240, maxW: COL * 3.2 });
  const lo = M + ROW * 2.5, hi = bot - 96;
  return async (t) => {
    seed(5411);
    const out = canvas(), g = out.g;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    // the line starts where the still poster has it (row 4), sweeps up, then down past it, and back
    const u = Math.sin(2 * Math.PI * t), base = M + ROW * 4;
    const raw = u >= 0 ? base - u * (base - lo) : base - u * (hi - base);
    const split = top + Math.round((raw - top) / 16) * 16;
    const above = rectMask({ x: 0, y: top, w: W, h: split - top });
    draw(g, tint(inter(midsAll, above), C.mid2)); draw(g, tint(inter(lightsAll, above), C.mid));
    const asc = ascii(LA, { x: 0, y: split, w: W, h: bot - split }, { size: 16, chars: ' .:ctsnuhe', font: 'Martian Mono', weight: 700, lh: 1 });
    draw(g, tint(cut(asc, rectMask({ x: 0, y: split, w: COL * 3, h: 48 })), C.mid));
    g.fillStyle = C.text; g.fillRect(0, split, W, 2);
    block(g, ['(01) Chestnut, photographed in the 1850s'], M, top - 12, { ...t0, anchor: 'bottom' });
    block(g, ['(02) The same tree, as a record'], M, split + 16, t0);
    block(g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], M, M, t0);
    block(g, sub.lines, W - M, M, { ...t0, align: 'right' });
    pixels(g, M + COL * 2, M, 8, ['#..#..#', '.#..#..'], C.mid);
    printAll(g, C, { seed: 541 });
    printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 54, wear: HS.ink.wear, spread: HS.ink.spread });
    stock(g, C.stock, 54);
    return out;
  };
};
