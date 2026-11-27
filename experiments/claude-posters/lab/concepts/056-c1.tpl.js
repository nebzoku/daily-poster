// No. 056 · Concept 1 · "Dinner arrives / by parachute" · Alfa Slab One, sentence case, interlocked: "Dinner arrives"
// edge to edge on the top margin, "by parachute" on the bottom margin (R).
// Story: a team of Alaskan bush pilots, the "turkey bombers", fly over off-grid villages and airdrop Thanksgiving
//   turkeys to the people below, so places no road reaches still get the holiday meal.
// Everyday thing: a parcel swinging under a parachute; the roasting pan on the Thanksgiving table.
// Visual idea: the meal literally on its way down. A smooth, real parachute with the roast pan hanging from its cords
//   comes down the middle of the sheet, through a harsh thresholded sky taken from Rowlandson's 1785 parachute
//   cartoon (a crowd once stared up at a parachute too). One small lime square on the ground marks the drop zone.
// Image: object-2 (parachute) and object-3 (roast pan), smooth and toned; the Met's Rowlandson etching, its cloudy sky
//   thresholded full bleed in two layers so the clouds make the bright middle.
// Finish and paper: screen print on newsprint: a village noticeboard bill, cheap paper, flat, confident ink.
// Mood check: cheerful and a little absurd (dinner falling from the sky), never ominous: the bright sky keeps it light.
window.POSTER = async () => {
  const C = __CW__;
  seed(5611);
  const D = 'Alfa Slab One', T = 'Sora';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const chute = trim(await media('media/2026-11-27/object-2.png'));
  const pan = trim(await media('media/2026-11-27/object-3.png'));
  const sky = await media('media/2026-11-27/image-03-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: one size, sentence case, interlocked; "Dinner arrives" sets the measure
  const HS = inkSafe(['Dinner arrives', 'by parachute'], { font: D, weight: 400, size: 160, gap: 18, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'screen', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);

  // the sky: Rowlandson's clouds, full bleed, thresholded in two layers (clouds bright, hatching mid)
  const src = canvas(); cover(src.g, sky, { x: 0, y: 0, w: W, h: H }, { crop: [0.56, 0.16, 0.34, 0.355] });
  const L = levels(src, 0.03, 0.97);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, src); snap('place-sky', p); }
  const lights = lumMask(L, pct(L, 0.58), { blur: 1.4 });
  const mids = cut(lumMask(L, pct(L, 0.47), { blur: 1.4 }), lights);

  // the parachute and the pan, centred on the sheet's centre line, between the two headline blocks
  const cx = W / 2, cw = COL * 2.5, ch = cw * chute.height / chute.width;
  const cTop = M + ROW * 2;
  const cc = canvas(); cc.g.drawImage(chute, cx - cw / 2, cTop, cw, ch);
  const pw = COL * 1.6, ph = pw * pan.height / pan.width, pTop = cTop + ch - 6;
  const pc = canvas(); pc.g.drawImage(pan, cx - pw / 2 + 4, pTop, pw, ph);
  const objM = union(lumMask(cc, 0, { soft: 0.001 }), lumMask(pc, 0, { soft: 0.001 }));
  // the sky stops a few px short of the letters and the falling meal, so both read clean
  const pockets = rectMask({ x: 0, y: M + ROW - 24, w: W, h: 24 + 4 * 14.4 + 40 });
  // the labels and the drop-zone square get a small clearing of their own, so they read on any sky
  const dz = M + ROW * 7 - 24;
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const labels = (gg, col) => {
    const o = { ...t, color: col };
    block(gg, ['(01) The canopy'], cx + cw / 2 + 16, cTop + ch * 0.42, o);
    block(gg, ['(02) The dinner'], cx + pw / 2 + 24, pTop + ph * 0.5, o);
    block(gg, ['(03) The drop zone'], cx + 28, dz + 24, { ...o, anchor: 'bottom' });
    gg.fillStyle = col; gg.fillRect(cx - 12, dz, 24, 24);
  };
  const lab = canvas(); labels(lab.g, '#fff');
  const clear = union(alphaThr(blurred(head, 5), 0.04), alphaThr(blurred(objM, 6), 0.04), pockets, alphaThr(blurred(lab, 14), 0.02));
  draw(g, tint(cut(mids, clear), C.mid2));
  snap('step-thr-1', out);
  draw(g, tint(cut(lights, clear), C.mid));
  snap('step-thr-2', out);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, cc); draw(p.g, pc); snap('place-chute', p); }
  draw(g, inter(tone(levels(union(cc, pc), 0.1, 0.99), C.tones), objM));
  snap('step-tone-1', out);

  // the drop zone: one small lime square on the row-7 line, on the centre line under the meal
  g.fillStyle = C.hl; g.fillRect(cx - 12, dz, 24, 24);
  snap('place-drop', out);

  // small type: furniture left and subline beside it, cap heights on the row-1 line; labels by the meal and the square
  block(g, ['(Daily Poster)', '(No. 056)', '(Friday 27 November)', '(BBC News)'], M, M + ROW, t);
  snap('text-furniture', out);
  const sub = balance('A volunteer flying team drops Thanksgiving turkeys from small planes to remote, off-grid communities.', { ...t, minW: 240, maxW: COL * 3, lines: [4, 4], strict: true });
  block(g, sub.lines, W - M, M + ROW, { ...t, align: 'right' });
  snap('text-sub', out);
  { const o = t; block(g, ['(01) The canopy'], cx + cw / 2 + 16, cTop + ch * 0.42, o); block(g, ['(02) The dinner'], cx + pw / 2 + 24, pTop + ph * 0.5, o); block(g, ['(03) The drop zone'], cx + 28, dz + 24, { ...o, anchor: 'bottom' }); }
  snap('text-labels', out);

  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 561, shapes: [objM], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 61, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k) }); });
  printAll(g, C, { seed: 561, shapes: [objM] });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 61, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 61);
  snap('final', out);
  return out;
};
