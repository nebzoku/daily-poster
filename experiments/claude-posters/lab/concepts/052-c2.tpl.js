// No. 052 · Concept 2 · "Morris by day / himself by night" · two circles, day and night, XOR where they meet.
// The two halves of his life as a sun and a moon on the grid. The day circle holds the Morris-era wallpaper he hung
// for other people, thresholded; the night circle holds an ornament design pixelated hard, the patterns of his own.
// Both edges step in pixels; where the circles overlap, the colour flips. Type follows the circles: day top left,
// night bottom right.
window.POSTER = async () => {
  const C = __CW__;
  seed(5232);
  await fonts(['800 100px "Manrope"', '500 16px "Manrope"']);
  const wallImg = await media('media/2026-11-23/image-03-2160.jpg'), orn = await media('media/2026-11-23/image-09-2160.jpg');
  const T = 'Manrope';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  const HS = inkSafe(['Morris by day', 'himself by night'], { font: T, weight: 800, size: 200, gap: 14, minGap: 6, word: 0.24 }, W - 2 * M);
  const { lines } = HS;
  const head = canvas(); const R = pinInterlock(head, lines, ['L', 'R'], 1, 6);

  const day = { x: M + COL * 3, y: M + ROW * 3.4, r: COL * 2.5 }, night = { x: M + COL * 5.2, y: M + ROW * 4.9, r: COL * 2.2 };
  const dm = pixelCircle(day.x, day.y, day.r, 16), nm = pixelCircle(night.x, night.y, night.r, 48);
  // day: wallpaper thresholded in two inks
  const ds = canvas(); cover(ds.g, wallImg, { x: day.x - day.r, y: day.y - day.r, w: 2 * day.r, h: 2 * day.r }, { crop: [0.15, 0.15, 0.3, 0.42] });
  if (CAPTURE) {   // the day circle drawn smooth, then its edge tried at different pixel sizes before settling on 16
    const p = canvas(); draw(p.g, out); draw(p.g, tint(circleMask(day.x, day.y, day.r), C.day0)); snap('shape-day', p);
    [40, 8, 28, 12].forEach((px, i) => { const q = canvas(); draw(q.g, out); draw(q.g, tint(pixelCircle(day.x, day.y, day.r, px), C.day0)); snap(`step-dedge-${i}`, q); });
  }
  draw(g, tint(dm, C.day0));
  snap('step-dedge-9', out);
  draw(g, press(inter(lumMask(ds, pct(ds, 0.5), { blur: 1.5 }), dm), C.day1, 'riso', { wear: 0.4, spread: 0.45, seed: 1 }));
  snap('step-day-1', out);
  // night: ornament pixelated big, in the night inks
  const ns = canvas(); ns.g.fillStyle = '#000'; ns.g.fillRect(night.x - night.r, night.y - night.r, 2 * night.r, 2 * night.r);
  cover(ns.g, orn, { x: night.x - night.r, y: night.y - night.r, w: 2 * night.r, h: 2 * night.r }, { crop: [0.3, 0.2, 0.4, 0.6] });
  if (CAPTURE) {   // the ornament placed in its circle, then pixelated harder
    const nt = tone(levels(ns, 0.05, 0.95), C.nightTones);
    const p = canvas(); draw(p.g, out); draw(p.g, inter(nt, circleMask(night.x, night.y, night.r))); snap('place-night', p);
    // pixelated back and forth, the edge stepping with it, before settling on 48
    [16, 64, 24, 36].forEach((px, i) => { const cm = pixelCircle(night.x, night.y, night.r, px), q = canvas(); draw(q.g, out); draw(q.g, inter(pixelate(nt, px), cm)); snap(`step-night-${i}`, q); });
  }
  draw(g, inter(pixelate(tone(levels(ns, 0.05, 0.95), C.nightTones), 48), nm));
  snap('step-night-9', out);
  // XOR overlap
  const xo = xorShapes([dm, nm], '#FF00FF', C.flip);
  const ed = xo.g.getImageData(0, 0, xo.width, xo.height); for (let p = 0; p < ed.data.length; p += 4) if (ed.data[p] === 255 && ed.data[p + 1] === 0 && ed.data[p + 2] === 255) ed.data[p + 3] = 0; xo.g.putImageData(ed, 0, 0);
  draw(g, xo);
  snap('step-xor-1', out);

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.type };
  const sub = balance("Paid to hang William Morris's patterns in grand rooms, a working man made a private palace at home.", { ...t, minW: 200, maxW: COL * 2.4 });
  block(g, sub.lines, M, M + ROW * 6.5, t);
  snap('text-sub', out);
  block(g, ['(Daily Poster)', '(No. 052)', '(Monday 23 November)', '(The Guardian)'], W - M, M + ROW * 1.5, { ...t, align: 'right' });
  snap('text-furniture', out);
  block(g, ['(Day)'], day.x - day.r, day.y - day.r - 10, { ...t, anchor: 'bottom' });
  block(g, ['(Night)'], night.x + night.r, night.y + night.r + 24, { ...t, align: 'right' });
  snap('text-labels', out);
  snapLines(tint(head, C.type), R);
  inkTrials(out, (gg, k) => { printAll(gg, C, { style: 'letterpress', shapes: [cut(nm, dm)], wear: 0.3 * k, spread: Math.min(0.85, 0.5 * k) }); draw(gg, press(head, C.type, HS.ink.preset, { ...HS.ink, wear: HS.ink.wear * k, spread: Math.min(0.85, HS.ink.spread * k * 1.5), seed: 52 })); });
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'letterpress', shapes: [cut(nm, dm)] });   // the night circle keeps its toned pixels; its edges are printed
  draw(g, press(head, C.type, HS.ink.preset, { ...HS.ink, seed: 52 }));
  snap('printed', out);
  scratches(g, 1, 522);   // wear from handling (round 16)
  draw(g, IM.paper(0.45, 52), 'source-over', 0.6); grain(g, 0.07, 0.5);
  snap('final', out);
  return out;
};
