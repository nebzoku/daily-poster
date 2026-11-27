// No. 056 · Concept 5 · "Turkeys fall / from Alaskan skies" · Alfa Slab One, sentence case, in the plain band the scamp left
// (bottom). Illustrated: scamp-04 from the illustration machine (Nano Banana, Ben's references + our kept set).
// Scene: slight fish-eye street-level view across a snowy village square at the moment of landing.
// Finish and paper: machine-riso on photocopy. Colourways: A as drawn, B vivid and mid swapped, C vivid and pale swapped.
// The illustrated concept's template (copy to concepts/<issue>-cN.tpl.js). Scamp → poster: an image from the illustration machine (Nano Banana, styled on Ben's references) printed as a Daily
// Poster. Every pixel is snapped to the day's palette, its tints and shades, black, white and the highlight, and each
// colour printed as a plate (printAll) like the rest of the toolkit; the headline goes in the plain band the scamp left
// for it (made perfectly flat here), in the colour that reads best on it; then paper and scratches.
window.POSTER = async () => {
  const C = __CW__;
  seed(7001);
  await fonts([`${C.weight} 100px "${C.font}"`, `500 16px "${C.text_font}"`]);
  const sc = await img(C.scamp);
  const out = canvas(), g = out.g;
  g.fillStyle = C.palette[3]; g.fillRect(0, 0, W, H);
  snap('bg', out);
  cover(g, sc, { x: 0, y: 0, w: W, h: H });
  // colourways: snap every pixel to the day's colours, then swap palette roles (C.remap: {from: to}, with each colour's
  // tints and shades following it), so B and C are the same drawing in a different arrangement of the palette
  if (C.remap && Object.keys(C.remap).length) {
    const id = g.getImageData(0, 0, W * K, H * K), dd = id.data, hx = C.cols.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    const to = C.cols.map((h, i) => { const m = C.remap[h]; return m ? [1, 3, 5].map((k) => parseInt(m.slice(k, k + 2), 16)) : hx[i]; });
    for (let p = 0; p < dd.length; p += 4) { let bi = 0, bd = 1e9; for (let i = 0; i < hx.length; i++) { const c = hx[i], v = (dd[p] - c[0]) ** 2 + (dd[p + 1] - c[1]) ** 2 + (dd[p + 2] - c[2]) ** 2; if (v < bd) { bd = v; bi = i; } } [dd[p], dd[p + 1], dd[p + 2]] = to[bi]; }
    g.putImageData(id, 0, 0);
  }
  snap('place-illustration', out);
  const HS = inkSafe(C.lines, { font: C.font, weight: C.weight, size: 200, gap: C.caps ? 14 : 20, minGap: 8, word: C.caps ? 0.26 : 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.18 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, C.sides, C.split, C.caps ? 12 : 6);
  // each headline block's band: the scamp's most common colour there, made flat
  const d = g.getImageData(0, 0, W * K, H * K).data, hexes = C.cols.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const nearest = (r, gg, b) => { let bi = 0, bd = 1e9; hexes.forEach((c, i) => { const dd = (r - c[0]) ** 2 + (gg - c[1]) ** 2 + (b - c[2]) ** 2; if (dd < bd) { bd = dd; bi = i; } }); return bi; };
  const blocks = C.split > 0 && C.split < R.length ? [R.slice(0, C.split), R.slice(C.split)] : [R];
  const bands = blocks.map((z, bi) => {
    const isTop = blocks.length > 1 ? bi === 0 : C.split > 0;
    let y0 = Math.max(0, Math.min(...z.map((r) => r.y)) - 28), y1 = Math.min(H, Math.max(...z.map((r) => r.y + r.h)) + 28);
    if (bi === 0) { if (isTop) y1 += 72; else y0 -= 72; }   // room for the furniture and subline, on the band
    const cnt = new Array(hexes.length).fill(0);
    for (let y = Math.round(y0 * K); y < y1 * K; y += 6) for (let x = 0; x < W * K; x += 6) { const p = (y * W * K + x) * 4; cnt[nearest(d[p], d[p + 1], d[p + 2])]++; }
    const col = C.cols[cnt.indexOf(Math.max(...cnt))];
    return { y0, y1, col, isTop };
  });
  bands.forEach(({ y0, y1, col, isTop }) => { g.fillStyle = col; if (isTop) g.fillRect(0, 0, W, y1); else g.fillRect(0, y0, W, H - y0); });
  // type colour: the palette colour (or black/white) with the most contrast against the band
  const L = (h) => { const [r, gg, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * gg + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const band0 = bands[0].col, typeCol = [...C.palette, '#000000', '#FFFFFF'].sort((a, b) => ratio(b, band0) - ratio(a, band0))[0];
  // furniture and subline tucked under (or over) the first band
  const t = { font: C.text_font, size: 16, weight: 500, lead: 0.9, color: typeCol };
  // furniture left, subline right: the same number of lines (the subline balanced to four, wider), the same first
  // cap line and last baseline, a clear gap from the headline (Ben, 26 Nov: five narrow lines touched the headline
  // and didn't line up with the labels)
  const first = bands[0], top = first.isTop;
  const fb = top ? Math.max(...blocks[0].map((r) => r.y + r.h)) + 28 : Math.min(...blocks[0].map((r) => r.y)) - 28;
  const sm = canvas();
  const subLines = balance(C.subline, { ...t, minW: COL * 1.8, maxW: COL * 4, lines: [C.furniture.length, C.furniture.length], strict: true }).lines;
  block(sm.g, C.furniture, M, fb, { ...t, anchor: top ? 'top' : 'bottom' });
  block(sm.g, subLines, W - M, fb, { ...t, align: 'right', anchor: top ? 'top' : 'bottom' });
  snap('shape-bands', out);
  draw(g, tint(sm, typeCol));
  snap('text-small', out);
  snapLines(tint(head, typeCol), R);
  printAll(g, { ...C, bg: bands[0].col }, { seed: 7001, wear: 0.14, spread: 0.45, bg: bands[0].col });
  printHead(g, head, typeCol, C.finish, { bg: band0, seed: 7002, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 7003);
  snap('final', out);
  return out;
};
