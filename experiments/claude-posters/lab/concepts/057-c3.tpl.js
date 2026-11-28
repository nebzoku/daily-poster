// No. 057 · Concept 3 · "SEEN FROM ORBIT / CITIES SETTLE" · Necto Mono, all caps, WORDS PUSHED INTO THE CORNERS: SEEN,
// FROM and ORBIT across the top margin edge to edge, CITIES and SETTLE in the two bottom corners (spreadWords).
// Text in Libre Baskerville.
// Story: radar satellites measure the ground under Lagos, Alexandria and other cities to the millimetre, and find it
//   sinking faster than thought.
// Everyday thing: the satellite overhead, and the numbers on a survey: a city as a field of measurements.
// Visual idea: data-driven type. The Rome 1645 city plan redrawn as a field of digits (ASCII, the characters picked by
//   the plan's darkness), and the field SAGS: every digit is pushed down by a subsidence bowl centred on one point, so
//   the rows dip like a sinking district. The digits pushed down the furthest turn pale. The satellite hangs above,
//   smooth and real, a dashed radar line down to the bottom of the bowl, where one lime square marks the reading.
// Image: object-1 (the satellite) smooth toned; the Met's Plan of the City of Rome (1645) as ASCII digits.
// Finish and paper: foil-colour (a bright pale-pink foil) on smooth: a clean, technical stamp over a precise print
//   (a white or black flat foil read as silver here).
// Mood check: cool, precise and curious, a scientific instrument rather than a threat.
window.POSTER = async () => {
  const C = __CW__;
  seed(5731);
  const D = 'Necto Mono', T = 'Libre Baskerville';
  await fonts([`400 100px "${D}"`, `400 16px "${T}"`, `400 16px "${D}"`]);
  const sat = trim(await media('media/2026-11-28/object-1.png'));
  const rome = await media('media/2026-11-28/image-04-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: caps, one size; top line edge to edge, the bottom line's two words spread into the corners
  const HS = inkSafe(['SEEN FROM ORBIT', 'CITIES SETTLE'], { font: D, weight: 400, size: 112, gap: 40, minGap: 16, word: 0.5 }, W - 2 * M, { preset: 'letterpress', wear: 0.1, spread: 0.12 });
  const top = spreadWords([HS.lines[0]], W - 2 * M, { maxShort: 0.2 })[0];
  const bot = spreadWords([HS.lines[1]], W - 2 * M, { maxShort: 0.3 })[0];
  const head = canvas(); const R = pinBlocks(head, [top, bot], ['L', 'L'], 1, 0.1);

  // the field: the plan sampled in cells, each cell a digit by darkness, pushed down by a bowl round the target
  const F = { x: M, y: M + ROW * 1, w: W - 2 * M, h: ROW * 5.4 };
  const src = canvas(); cover(src.g, rome, F, { crop: [0.42, 0.12, 0.36, 0.8] });
  const L = levels(src, 0.03, 0.97);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, inter(src, rectMask(F))); snap('place-map', p); }
  const size = 16, cw = 10, chh = 16, cols = Math.floor(F.w / cw), rows = Math.floor(F.h / chh);
  const s = document.createElement('canvas'); s.width = cols; s.height = rows; const sg = s.getContext('2d');
  sg.drawImage(L, F.x * K, F.y * K, F.w * K, F.h * K, 0, 0, cols, rows);
  const d = sg.getImageData(0, 0, cols, rows).data;
  const chars = '8965327 1.  ';
  const tx = M + COL * 5, ty = M + ROW * 4.25, A = 120, sig = 230;   // the bowl: deepest 120 px at the target
  const satW = COL * 3.6, satH = satW * sat.height / sat.width, sx = M + COL * 1.4, sy = M + ROW * 1.1;
  const sc = canvas(); sc.g.drawImage(sat, sx, sy, satW, satH);
  const satM = lumMask(sc, 0, { soft: 0.001 });
  const satClear = alphaThr(blurred(satM, 14), 0.02);
  const field = (bowl) => {
    const a = canvas(), b = canvas();
    for (const c of [a, b]) { c.g.font = `400 ${size}px "${D}"`; c.g.textBaseline = 'top'; c.g.fillStyle = '#fff'; }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4, l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      const ch = chars[Math.min(chars.length - 1, Math.floor(l * chars.length))]; if (ch === ' ') continue;
      const X = F.x + x * cw, Y0 = F.y + y * chh, r2 = (X - tx) ** 2 + (Y0 - ty) ** 2, dy = bowl * A * Math.exp(-r2 / (sig * sig));
      (dy > A * 0.45 ? b : a).g.fillText(ch, X, Y0 + dy);
    }
    return [a, b];
  };
  const keepOut = union(satClear, rectMask({ x: tx - 12, y: ty + A - 20, w: 220, h: 40 }), rectMask({ x: 0, y: F.y + F.h + A * 0.2, w: W, h: H }));
  if (CAPTURE) { const [a, b] = field(0); const p = canvas(); draw(p.g, out); draw(p.g, tint(cut(union(a, b), keepOut), C.ascii)); snap('step-ascii-1', p); }
  if (CAPTURE) { const [a, b] = field(0.5); const p = canvas(); draw(p.g, out); draw(p.g, tint(cut(a, keepOut), C.ascii)); draw(p.g, tint(cut(b, keepOut), C.deep)); snap('step-ascii-2', p); }
  const [fa, fb] = field(1);
  draw(g, tint(cut(fa, keepOut), C.ascii));
  draw(g, tint(cut(fb, keepOut), C.deep));
  snap('step-ascii-3', out);

  // the satellite, smooth toned
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, sc); snap('place-sat', p); }
  draw(g, inter(tone(levels(sc, 0.02, 0.99), C.tones), satM));
  snap('step-tone-1', out);
  // radar: a dashed line from the satellite's dish down to the bottom of the bowl; lime square on the reading
  const ax = sx + satW * 0.47, ay = sy + satH * 0.62, bx = tx + 8, by = ty + A;
  g.save(); g.strokeStyle = C.text; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by - 16); g.stroke(); g.restore();
  snap('shape-beam', out);
  g.fillStyle = C.hl; g.fillRect(bx - 8, by - 8, 16, 16);
  snap('place-reading', out);

  // small type on the row-6.75 line: furniture on the left, subline beside it, the reading label right
  const t = { font: T, size: 16, weight: 400, lead: 1.1, color: C.text };
  const yy = M + ROW * 6.75;
  block(g, ['(Daily Poster)', '(No. 057)', '(Saturday 28 November)', '(BBC News)'], M, yy, t);
  snap('text-furniture', out);
  const sub = balance('A fresh study maps the sinking of major African cities, giving planners firmer numbers to build on.', { ...t, minW: 240, maxW: COL * 3, lines: [4, 4], strict: true });
  block(g, sub.lines, M + COL * 2, yy, t);
  snap('text-sub', out);
  block(g, ['(01) Radar, from orbit'], W - M, yy, { ...t, align: 'right' });
  block(g, ['(02) The reading'], bx + 24, by - 8, t);
  snap('text-labels', out);

  snapLines(tint(head, C.type), R);
  const pr = (gg, k) => {
    printAll(gg, C, { seed: 573, shapes: [satM] });
    printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 74, light: 0.3 + 0.25 * k });
  };
  inkTrials(out, pr);
  pr(g, 1);
  snap('printed', out);
  stock(g, C.stock, 73);
  snap('final', out);
  return out;
};
