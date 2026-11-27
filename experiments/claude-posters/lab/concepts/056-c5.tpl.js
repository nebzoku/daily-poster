// No. 056 · Concept 5 · "Turkeys fall / from Alaskan skies" · Alfa Slab One, sentence case, in the plain band the scamp left
// (top). Illustrated: scamp-01 from the illustration machine (Nano Banana, Ben's references + our kept set).
// Scene: very low worm's-eye looking straight up at a small plane and falling parcels.
// Finish and paper: machine-riso on photocopy. Colourways: A as drawn, B vivid and mid swapped, C vivid and pale swapped.
// The illustrated concept's template (copy to concepts/<issue>-cN.tpl.js). Scamp → poster: an image from the illustration machine (Nano Banana, styled on Ben's references) printed as a Daily
// Poster. Every pixel is snapped to the day's palette, its tints and shades, black, white and the highlight, and each
// colour printed as a plate (printAll) like the rest of the toolkit; the headline goes in the plain band the scamp left
// for it (only faint detail right round the letters is calmed, never a flat box), in the colour that reads best on it; then paper and scratches.
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
  // Ben, 27 Nov (056 6C): the scamp's plain zone is often a faint gradient, and snapping it to the palette (worse after a
  // colourway swap, where two near-identical pales become two different reds) turned it into a hard band behind the
  // type. So the plain area that runs into each headline zone (flooded through the zone colour and the lighter tints of
  // its family) becomes the one colour most of that area uses.
  {
    const WK = W * K, HK = H * K, id = g.getImageData(0, 0, WK, HK), dd = id.data, N = WK * HK, lab = new Uint8Array(N);
    for (let q = 0; q < N; q++) lab[q] = nearest(dd[q * 4], dd[q * 4 + 1], dd[q * 4 + 2]);
    const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], fam = (i) => (i < 20 ? Math.floor(i / 5) : -1 - i);
    for (const bd of bands) {
      const di = C.cols.indexOf(bd.col); if (di < 0 || fam(di) < 0) continue;
      const ok = new Uint8Array(hexes.length); hexes.forEach((c, i) => { if (fam(i) === fam(di) && lum(c) >= lum(hexes[di]) - 1) ok[i] = 1; });
      const seen = new Uint8Array(N), st = [], cnt = new Array(hexes.length).fill(0);
      const ya = Math.round((bd.isTop ? 0 : bd.y0) * K), yb = Math.round((bd.isTop ? bd.y1 : H) * K);
      for (let y = ya; y < yb; y += 4) for (let x = 0; x < WK; x += 4) { const q = y * WK + x; if (ok[lab[q]] && !seen[q]) { seen[q] = 1; st.push(q); } }
      const region = [];
      while (st.length) { const q = st.pop(); region.push(q); cnt[lab[q]]++; const x = q % WK; for (const r of [q - 1, q + 1, q - WK, q + WK]) { if (r < 0 || r >= N || seen[r] || !ok[lab[r]]) continue; if ((r === q - 1 && x === 0) || (r === q + 1 && x === WK - 1)) continue; seen[r] = 1; st.push(r); } }
      const best = cnt.indexOf(Math.max(...cnt)), c = hexes[best];
      for (const q of region) { dd[q * 4] = c[0]; dd[q * 4 + 1] = c[1]; dd[q * 4 + 2] = c[2]; }
      bd.col = C.cols[best];
    }
    g.putImageData(id, 0, 0);
  }
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
  // Ben, 27 Nov: no flat band. A box across the zone cut the illustration off and made it less full bleed. Instead, only
  // just round the letters (and the small type), faint detail (snow texture, soft shading, anything close to the zone's
  // own colour) is calmed into that colour, while the drawing's real lines and shapes stay. The illustration still runs
  // edge to edge, and the type reads.
  // (the small type, being small, gets everything under it calmed, just round its letters)
  const near = alphaThr(blurred(head, 14), 0.04), nd = near.g.getImageData(0, 0, W * K, H * K).data;
  const nearS = alphaThr(blurred(sm, 3), 0.12), ns = nearS.g.getImageData(0, 0, W * K, H * K).data;
  // each spot calms towards its OWN surroundings (the drawing blurred wide, snapped to the palette), never one colour
  // for the whole zone, which made a band where the zone's colour differed from the sky or snow round it (056 6C)
  const loc = blurred(out, 18), ld = loc.g.getImageData(0, 0, W * K, H * K).data;
  const id2 = g.getImageData(0, 0, W * K, H * K), d2 = id2.data;
  for (let p = 0; p < d2.length; p += 4) {
    if (nd[p + 3] < 128 && ns[p + 3] < 128) continue;
    const c = hexes[nearest(ld[p], ld[p + 1], ld[p + 2])];
    const dist = Math.sqrt((d2[p] - c[0]) ** 2 + (d2[p + 1] - c[1]) ** 2 + (d2[p + 2] - c[2]) ** 2);
    if (ns[p + 3] >= 128 || dist < (C.calm ?? 70)) { d2[p] = c[0]; d2[p + 1] = c[1]; d2[p + 2] = c[2]; }
  }
  g.putImageData(id2, 0, 0);
  snap('shape-calm', out);
  draw(g, tint(sm, typeCol));
  snap('text-small', out);
  snapLines(tint(head, typeCol), R);
  // the making-of reel's ink trials, up close (Ben, 27 Nov: the illustrated reel needs the zooms and the finish going on
  // too): lighter, much heavier, a bit heavier, then the real print
  const foil = /^(foil|varnish)/.test(C.finish);
  inkTrials(out, (gg, k) => { printAll(gg, { ...C, bg: bands[0].col }, { seed: 7001, wear: 0.14 * k, spread: Math.min(0.85, 0.45 * k), bg: bands[0].col }); printHead(gg, head, typeCol, C.finish, foil ? { bg: band0, seed: 7002, light: 0.3 + 0.25 * k } : { bg: band0, seed: 7002, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) }); });
  printAll(g, { ...C, bg: bands[0].col }, { seed: 7001, wear: 0.14, spread: 0.45, bg: bands[0].col });
  printHead(g, head, typeCol, C.finish, { bg: band0, seed: 7002, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 7003);
  snap('final', out);
  return out;
};
