// The fourth concept, combined (No. 056) · "Where no road / reaches" · Alfa Slab One, sentence case, interlocked.
// Story: off-grid Alaskan villages that no road reaches get their Thanksgiving turkey by air, dropped by bush pilots.
// Everyday thing: the parcel under its parachute; the kitchen table it ends up on.
// What changed since the last combined concept (055, "Caught between road and rope"), following Ben's feedback that it
//   felt uncanny and the stuck-on pieces should be textural:
//   1. The illustration is printed on the sheet itself, square in a box on the grid (no card, no circle, no tilt).
//      The illustration machine had no scamps for today, so the spot is drawn with our own illustration toolkit
//      (objectArt line drawings of the brief's parachute and roast pan, over outlined cumulus).
//   2. The one stuck-on piece is textural: a scrap of photocopied, thresholded wood grain (the table the dinner lands on),
//      laid square to the grid with a single strip of tape. The pixelated plane box and the pencil grid stay.
// Finish and paper: copy (photocopy ink) on uncoated, scanned: a paste-up run off at the village hall.
// Mood check: homely and warm, a little hand-made; the drawing is calm, the wood and pixels give the grit.
window.POSTER = async () => {
  const C = __CW__;
  seed(5641);
  const D = 'Alfa Slab One', T = 'Sora';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const chute = trim(await media('media/2026-11-27/object-2.png')), pan = trim(await media('media/2026-11-27/object-3.png'));
  const plane = trim(await media('media/2026-11-27/object-1.png')), wood = await media('media/2026-11-27/texture-04-2160.jpg');
  const out = canvas(), g = out.g;
  sheet(g, C.paper, 5641); snap('bg', out);
  pencilGrid(g, [0, 5, 8], [1.5, 5.5, 6], 5641, 0.22);
  snap('place-pencil', out);
  const HS = inkSafe(['Where no road', 'reaches'], { font: D, weight: 400, size: 160, gap: 18, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'copy', wear: 0.2, spread: 0.2 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);

  // (01) the illustration, printed in a box: cols 0-5, rows 1.5-5.5
  const b1 = cell(0, 1.5, 5, 4);
  g.fillStyle = C.sky; g.fillRect(b1.x, b1.y, b1.w, b1.h);
  const I = illo(g), lay = (m, col) => (col === C.line ? I.ink(m) : I.fill(m, col));
  const inBox = (m) => inter(m, rectMask(b1));
  for (const [x, y, w, h, s] of [[b1.x - 60, b1.y + b1.h - 190, 330, 230, 11], [b1.x + 230, b1.y + b1.h - 150, 300, 200, 12], [b1.x + 440, b1.y + b1.h - 210, 320, 260, 13]]) {
    const cl = cumulus(x, y, w, h, s, { lobes: 7, curls: 3, lw: 2.6, flat: false }); lay(inBox(cl.fill), C.cloud); lay(inBox(cl.lines), C.line);
  }
  const ccx = b1.x + b1.w * 0.5, cw = COL * 1.9, ch = cw * chute.height / chute.width, cy0 = b1.y + 48;
  const A = objectArt(chute, { x: ccx - cw / 2, y: cy0, w: cw, h: ch }, { lw: 3 });
  lay(A.fill[0], C.shade); lay(A.fill[1], C.canopy); lay(A.fill[2], C.light); lay(A.lines, C.line);
  const pw = COL * 0.95, ph = pw * pan.height / pan.width;
  const P = objectArt(pan, { x: ccx - pw / 2, y: cy0 + ch - 4, w: pw, h: ph }, { lw: 3 });
  lay(P.fill[0], C.shade); lay(P.fill[1], C.hl); lay(P.fill[2], C.light); lay(P.lines, C.line);
  snap('place-illo', out);

  // (02) the plane, pixelated big in a strip: cols 5-8, rows 4-5.5
  const b2 = cell(5, 4, 3, 1.5);
  const bc = canvas(); bc.g.fillStyle = '#000'; bc.g.fillRect(b2.x, b2.y, b2.w, b2.h);
  clip(bc.g, b2, () => { const bw = b2.w * 1.25, bh = bw * plane.height / plane.width; bc.g.drawImage(plane, b2.x - b2.w * 0.05, b2.y + (b2.h - bh) / 2, bw, bh); });
  const pix = (s) => { const px = inter(pixelate(levels(bc, 0.02, 0.98), s), rectMask(b2)), c = canvas(); c.g.fillStyle = C.pixBg; c.g.fillRect(b2.x, b2.y, b2.w, b2.h); draw(c.g, tint(inter(lumMask(px, pct(px, 0.55), { soft: 0.001 }), rectMask(b2)), C.pix[0])); draw(c.g, tint(inter(lumMask(px, pct(px, 0.85), { soft: 0.001 }), rectMask(b2)), C.pix[1])); return c; };
  if (CAPTURE) for (const [n, s] of [[1, 6], [2, 40], [3, 12]]) { const p = canvas(); draw(p.g, out); draw(p.g, pix(s)); snap(`step-pix-${n}`, p); }
  draw(g, pix(20));
  snap('step-pix-4', out);

  // small type: labels under the boxes, furniture and subline under box 1 on the row-6 line
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(01) Dinner, by parachute'], b1.x, b1.y + b1.h + 16, t);
  block(g, ['(02) The bush plane'], W - M, b2.y + b2.h + 16, { ...t, align: 'right' });
  block(g, ['(03) The table'], W - M, b1.y - 16, { ...t, align: 'right', anchor: 'bottom' });
  const fy = M + ROW * 6 + 24;
  const fb = block(g, ['(Daily Poster)', '(No. 056)', '(Friday 27 November)', '(BBC News)'], M, fy, t);
  const sub = balance('No roads, no shops, no problem: a small aircraft crosses the snow and delivers the feast to the doorstep.', { ...t, minW: 220, maxW: COL * 2.6, lines: [4, 4], strict: true });
  block(g, sub.lines, M + COL * 2, fy, t);
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 5641, bg: C.paper });
  I.print(g, C.line, 564);
  printHead(g, head, C.type, C.finish, { bg: C.paper, seed: 641, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);

  // (03) the stuck-on scrap: photocopied wood grain, thresholded, square to the grid (cols 5-8, rows 1.5-3.5), one tape
  const b3 = cell(5.25, 1.5, 2.75, 2.25);
  const cardM = card(g, b3, C.scrap, 5641);
  const wc = canvas(); clip(wc.g, b3, () => cover(wc.g, wood, b3, { crop: [0.2, 0.15, 0.55, 0.5] }));
  const WL = levels(wc, 0.03, 0.97);
  draw(g, tint(inter(lumMask(WL, pct(WL, 0.5), { blur: 0.5, invert: true }), cardM), C.grain));
  snap('place-scrap', out);
  tape(g, { x: b3.x + b3.w / 2 - 60, y: b3.y - 44, w: 120, h: 88 }, C.tape, 5642);
  snap('place-tape', out);
  stock(g, C.stock, 641);
  scan(g, 641);
  snap('final', out);
  return out;
};
