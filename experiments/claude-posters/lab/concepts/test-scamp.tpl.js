// Scamp → poster: an image from the illustration machine (Nano Banana, styled on Ben's references) printed as a Daily
// Poster. Every pixel is snapped to the day's palette, its tints and shades, black, white and the highlight, and each
// colour printed as a plate (printAll) like the rest of the toolkit; the headline goes in the plain band the scamp left
// for it (made perfectly flat here), in the colour that reads best on it; then paper and scratches.
window.POSTER = async () => {
  const C = __CW__;
  seed(7001);
  await fonts([`${C.weight} 100px "${C.font}"`, `500 16px "${C.text_font}"`]);
  const sc = await img(C.scamp);
  const out = canvas(), g = out.g;
  cover(g, sc, { x: 0, y: 0, w: W, h: H });
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
  const first = bands[0], top = first.isTop, yy = top ? first.y1 - 18 : first.y0 + 18;
  const sm = canvas();
  block(sm.g, C.furniture, M, yy, { ...t, anchor: top ? 'bottom' : 'top' });
  const sub = balance(C.subline, { ...t, minW: 220, maxW: COL * 2.6 });
  block(sm.g, sub.lines, W - M, yy, { ...t, align: 'right', anchor: top ? 'bottom' : 'top' });
  draw(g, tint(sm, typeCol));
  printAll(g, { ...C, bg: bands[0].col }, { seed: 7001, wear: 0.14, spread: 0.45, bg: bands[0].col });
  printHead(g, head, typeCol, C.finish, { bg: band0, seed: 7002, wear: HS.ink.wear, spread: HS.ink.spread });
  stock(g, C.stock, 7003);
  return out;
};
