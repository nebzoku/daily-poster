// Illustration test 5 (No. 055) · "The ball / never landed" · Instrument Serif, sentence case, top and bottom blocks.
// Ben, 26 Nov: illustrations needn't be full bleed: contain them in boxes on the grid and combine them with the other
//   styles in the toolkit. Three boxes on the 8×8 grid, three treatments of one moment:
//   (01) the illustration: the ball hanging in a big sky above the cloud bank (line and flat colour, highlight sky)
//   (02) the motorbike, pixelated big into the palette (harsh, a still from the viral clip)
//   (03) the road outside the ground, thresholded from the brief's texture (the bright middle)
//   The ball's dashed flight leaves box 01 and runs across the gutterless grid into box 02: the catch.
window.POSTER = async () => {
  const C = __CW__;
  seed(5595);
  const D = 'Instrument Serif', T = 'Azeret Mono';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const bike = trim(await media('media/2026-11-26/object-2.png'));
  const road = await media('media/2026-11-26/texture-02-2160.jpg');
  const out = canvas(), g = out.g; g.fillStyle = C.bg; g.fillRect(0, 0, W, H); snap('bg', out);

  const HS = inkSafe(['The ball', 'never landed'], { font: D, weight: 400, size: 200, gap: 20, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);
  const b1 = cell(0, 1.5, 5, 5), b2 = cell(5, 1.5, 3, 2.5), b3 = cell(5, 4, 3, 2.5);

  // (01) the illustration, drawn on its own sheet and contained in the box
  const ill = canvas(), I = illo(ill.g);
  I.fill(rectMask(b1), C.sky);
  for (const [x, y, w, h, s] of [[300, 360, 260, 100, 3], [-40, 560, 220, 90, 4]]) { const cl = cumulus(x, y, w, h, s, { lobes: 6, curls: 2, lw: 2.2 }); I.fill(cl.fill, C.cloud); I.ink(cl.lines); }
  const fl = canvas(), path = curve([[80, 1080], [140, 860], [230, 720], [300, 680]], 3);
  for (let i = 0; i < path.length - 12; i += 22) inkLine(fl, path.slice(i, i + 12), 3, { sd: 90 + i, taper: 0.5 }); I.ink(fl);
  const B = ballArt(420, 640, 150, { tilt: -0.55, seamX: 0.16, lw: 3.4, sd: 7 });
  I.fill(B.body, C.ball); I.fill(B.shadow, C.ballShade); I.fill(B.light, C.cloud); I.fill(B.stitches, C.cloud); I.ink(B.lines);
  for (const [x, y, w, h, s] of [[-120, 900, 420, 240, 11], [200, 870, 520, 260, 12], [40, 1000, 520, 240, 13]]) { const cl = cumulus(x, y, w, h, s, { lobes: 10, curls: 5, lw: 2.6, flat: false }); I.fill(cl.fill, C.cloud); I.ink(cl.lines); }
  I.fill(rectMask({ x: 0, y: 1080, w: W, h: 200 }), C.cloud);
  I.print(ill.g, C.line, 5595);
  draw(g, inter(ill, rectMask(b1)));
  snap('place-illustration', out);
  // (02) the motorbike, pixelated big
  const bc = canvas(); clip(bc.g, b2, () => { const bw = b2.w * 0.98, bh = bw * bike.height / bike.width; bc.g.drawImage(bike, b2.x + b2.w * 0.01, b2.y + b2.h - bh - 12, bw, bh); });
  bc.g.globalCompositeOperation = 'destination-over'; bc.g.fillStyle = '#000'; bc.g.fillRect(b2.x, b2.y, b2.w, b2.h);
  const px = pixelate(levels(bc, 0.02, 0.98), 12, null);
  const L = inter(px, rectMask(b2)), pb = canvas();
  pb.g.fillStyle = C.box2; pb.g.fillRect(b2.x, b2.y, b2.w, b2.h);
  draw(pb.g, tint(inter(lumMask(L, pct(L, 0.62), { soft: 0.001 }), rectMask(b2)), C.pix[0]));
  draw(pb.g, tint(inter(lumMask(L, pct(L, 0.88), { soft: 0.001 }), rectMask(b2)), C.pix[1]));
  draw(g, pb);
  snap('step-pix-1', out);
  // (03) the road, thresholded in two layers
  const rc = canvas(); clip(rc.g, b3, () => cover(rc.g, road, b3, { crop: [0.2, 0.3, 0.5, 0.4] }));
  const RL = levels(rc, 0.03, 0.97);
  g.fillStyle = C.box3; g.fillRect(b3.x, b3.y, b3.w, b3.h);
  draw(g, tint(inter(cut(lumMask(RL, pct(RL, 0.6), { blur: 0.6 }), lumMask(RL, pct(RL, 0.85), { blur: 0.6 })), rectMask(b3)), C.thr2));
  draw(g, tint(inter(lumMask(RL, pct(RL, 0.85), { blur: 0.6 }), rectMask(b3)), C.thr));
  snap('step-thr-1', out);

  // the flight carries on out of the box, as small squares, to the bike
  const sq = canvas(); for (let k = 0; k < 5; k++) { const x = b1.x + b1.w + 8 + k * 32, y = 560 - k * 24; sq.g.fillStyle = '#fff'; sq.g.fillRect(Math.round(x / 8) * 8, Math.round(y / 8) * 8, 8, 8); }
  draw(g, tint(sq, C.ball));
  snap('place-squares', out);

  // labels on the box edges, furniture and subline in the right-hand column under the boxes
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(01) The ball, still up there'], b1.x, b1.y + b1.h + 16, t);
  block(g, ['(02) Two wheels', '(03) The road outside the ground'], b3.x + b3.w, b3.y + b3.h + 16, { ...t, align: 'right' });
  block(g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], W - M, M, { ...t, align: 'right' });
  const sub = balance("A motorbike passenger caught a six one-handed outside the ground at Pakistan's Swat Premier League.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, W - M, b2.y - 16, { ...t, align: 'right', anchor: 'bottom' });
  snap('text-small', out);

  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 5595, boxes: [b1] });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 595, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 595);
  snap('final', out);
  return out;
};
