// No. 055 · Concept 3 · "Caught between / road and rope" · Azeret Mono SemiBold, sentence case, centred: one line on
// the top margin, one on the bottom margin, both edge to edge.
// Story: a six sailed over the boundary rope and out of the ground, and was caught on the public road outside by a
//   passenger on a passing motorbike.
// Everyday thing: the boundary rope round a cricket field, and a dusty road; a ball in between them.
// Visual idea: the poster is the slice of world the ball crossed. A rope line across the top, the road across the
//   bottom, and the ball held dead centre between them, set in type: an ASCII ball made of sixes (the six it was),
//   in a scoreboard mono. Centred type mirrors the centred ball; the headline literally sits either side of it.
// Image: object-1, the cricket ball render, re-set as characters; the brief's Rocky Trail texture, pixelated big into
//   the road band.
// Finish and paper: foil-colour (a bright foil in a palette colour) on uncoated stock: a trophy-cabinet shine on a
//   souvenir card for the catch of the season.
// Mood check: crisp, playful, a scorecard; the dark ground keeps the foil bright, nothing heavy.
window.POSTER = async () => {
  const C = __CW__;
  seed(5531);
  const D = 'Azeret Mono', T = 'Azeret Mono';
  await fonts([`600 100px "${D}"`, `500 16px "${T}"`, `700 16px "${T}"`]);
  const ball = trim(await media('media/2026-11-26/object-1.png'));
  const road = await media('media/2026-11-26/texture-02-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  const HS = inkSafe(['Caught between', 'road and rope'], { font: D, weight: 600, size: 120, gap: 16, minGap: 8, word: 0.3 }, W - 2 * M, { preset: 'letterpress', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C'], 1, 0.1);

  // the rope: a bar margin to margin on the row-2 grid line
  const ropeY = M + ROW * 2;
  g.fillStyle = C.rope; g.fillRect(M, ropeY - 8, W - 2 * M, 8);
  snap('shape-rope', out);

  // the road: a band from row 6 to row 7, the trail texture pixelated big and posterised in two colours
  const rr = { x: 0, y: M + ROW * 6, w: W, h: ROW };
  const src = canvas(); clip(src.g, rr, () => cover(src.g, road, rr, { crop: [0.0, 0.3, 1, 0.3] }));
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, src); snap('place-road', p); }
  const roadBlocks = (s) => {
    const px = inter(pixelate(levels(src, 0.02, 0.98), s), rectMask(rr)), c = canvas();
    draw(c.g, tint(rectMask(rr), C.road[0]));
    draw(c.g, tint(inter(lumMask(px, pct(px, 0.45), { soft: 0.001 }), rectMask(rr)), C.road[1]));
    draw(c.g, tint(inter(lumMask(px, pct(px, 0.88), { soft: 0.001 }), rectMask(rr)), C.road[2]));
    return c;
  };
  if (CAPTURE) { for (const [n, s] of [[1, 8], [2, 48], [3, 16]]) { const p = canvas(); draw(p.g, out); draw(p.g, roadBlocks(s)); snap(`step-pix-${n}`, p); } }
  draw(g, roadBlocks(24));
  snap('step-pix-4', out);

  // the ball, dead centre between rope and road (centre on row 4), set in sixes: dark → light
  const cx = W / 2, cy = M + ROW * 4, r = COL * 2;
  const bc = canvas(); fit(bc.g, ball, { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }, { rot: -0.6 });
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, bc); snap('place-ball', p); }
  const L = levels(bc, 0.02, 0.98);
  const box = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
  const asc = ascii(L, box, { size: 16, chars: ' .:+66', font: T, weight: 700, lh: 1 });
  draw(g, tint(asc, C.mid));
  snap('step-ascii-1', out);

  // small type: furniture left and subline right with cap heights on row 1; labels on the rope and the road
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], M, M + ROW, t);
  snap('text-furniture', out);
  const sub = balance('The clip travelled the world, and the BBC has since tracked down the rider behind the catch.', { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, W - M, M + ROW, { ...t, align: 'right' });
  snap('text-sub', out);
  block(g, ['(01) Rope'], M, ropeY + 16, t);
  block(g, ['(02) Road'], M, rr.y - 16, { ...t, anchor: 'bottom' });
  block(g, ['(6) Out of the ground'], W - M, rr.y - 16, { ...t, align: 'right', anchor: 'bottom' });
  snap('text-labels', out);
  asterisk(g, W - M - 4, ropeY + 22, 8, C.mid);
  snap('place-asterisk', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 553, wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 57, light: 0.3 + 0.25 * k }); });
  printAll(g, C, { seed: 553 });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 57 });
  snap('printed', out);
  stock(g, C.stock, 57);
  snap('final', out);
  return out;
};
