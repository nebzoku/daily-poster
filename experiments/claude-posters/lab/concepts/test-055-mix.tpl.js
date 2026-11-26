// The fourth concept, combined (No. 055) · "Caught between / road and rope" · Instrument Serif, sentence case.
// Ben, 26 Nov: a fourth option every day that combines the styles (spot illustrations in frames among thresholded,
//   masked and pixelated images, the scanned tape paste-up, the typography), iterated with his feedback until it is
//   unique and ownable. This one: a pale sheet with pencil grid lines; the road outside the ground thresholded in a
//   tall box (harsh); the motorbike pixelated big in a strip (machine); the catch itself as a spot illustration in a
//   circle, on a card taped over the box edge (drawn, the highlight ball); scanned as one paste-up.
window.POSTER = async () => {
  const C = __CW__;
  seed(5596);
  await fonts([`400 100px "Instrument Serif"`, `500 16px "Azeret Mono"`]);
  const road = await media('media/2026-11-26/texture-02-2160.jpg'), bike = trim(await media('media/2026-11-26/object-2.png'));
  const scamp = await img('/experiments/claude-posters/scamps/2026-11-26/scamp-04.png');
  const out = canvas(), g = out.g;
  sheet(g, C.paper, 5596); snap('bg', out);
  const HS = inkSafe(['Caught between', 'road and rope'], { font: 'Instrument Serif', weight: 400, size: 200, gap: 20, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);

  // (01) the road, thresholded in a tall box: cols 0-5, rows 1.5-6
  const b1 = cell(0, 1.5, 5, 4.5);
  const rc = canvas(); clip(rc.g, b1, () => cover(rc.g, road, b1, { crop: [0.25, 0.2, 0.45, 0.6] }));
  const RL = levels(rc, 0.03, 0.97);
  g.fillStyle = C.box; g.fillRect(b1.x, b1.y, b1.w, b1.h);
  draw(g, tint(inter(lumMask(RL, pct(RL, 0.62), { blur: 0.6 }), rectMask(b1)), C.thr));
  snap('step-thr-1', out);
  // (02) the motorbike, pixelated big in a strip: cols 5-8, rows 4-6
  const b2 = cell(5, 4, 3, 2);
  const bc = canvas(); bc.g.fillStyle = '#000'; bc.g.fillRect(b2.x, b2.y, b2.w, b2.h); clip(bc.g, b2, () => { const bw = b2.w * 0.95, bh = bw * bike.height / bike.width; bc.g.drawImage(bike, b2.x + b2.w * 0.03, b2.y + (b2.h - bh) / 2, bw, bh); });
  const px = inter(pixelate(levels(bc, 0.02, 0.98), 12), rectMask(b2));
  g.fillStyle = C.pixBg; g.fillRect(b2.x, b2.y, b2.w, b2.h);
  draw(g, tint(inter(lumMask(px, pct(px, 0.6), { soft: 0.001 }), rectMask(b2)), C.pix[0]));
  draw(g, tint(inter(lumMask(px, pct(px, 0.86), { soft: 0.001 }), rectMask(b2)), C.pix[1]));
  snap('step-pix-1', out);
  // small type in the gutter column, on the grid
  const t = { font: 'Azeret Mono', size: 16, weight: 500, lead: 0.9, color: C.text };
  const lb = block(g, ['(01) The road outside the ground', '(02) Two wheels', '(03) The catch'], W - M, b2.y + b2.h + 16, { ...t, align: 'right' });
  block(g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], W - M, lb.y + lb.h + 22, { ...t, align: 'right' });
  const sub = balance("Hit out of the ground in a local league match, the ball met a stranger's hand on the road.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, b1.x, b1.y + b1.h + 16, t);
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 5596, bg: C.paper });
  printHead(g, head, C.type, C.finish, { bg: C.paper, seed: 596, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);

  // (03) the catch: a spot illustration from the machine's scamp, in a circle on a card taped over the box edge
  const cr = { x: M + COL * 3.4, y: M + ROW * 2.3, w: COL * 3.1, h: COL * 3.1 };
  const cardM = card(g, { ...cr, x: cr.x - 14, y: cr.y - 14, w: cr.w + 28, h: cr.h + 28, rot: -0.03 }, C.card, 5596);
  draw(g, spotIn(scamp, cr, C.cols, { crop: [0.2, 0.47, 0.32, 0.22], shape: 'circle' }));
  snap('place-spot', out);
  tape(g, { x: cr.x + cr.w / 2 - 60, y: cr.y - 50, w: 120, h: 96, rot: 0.04 }, C.tape, 5597);
  snap('place-tape', out);
  stock(g, C.stock, 597);
  scan(g, 596);
  snap('final', out);
  return out;
};
