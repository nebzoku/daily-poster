// No. 051 · Concept 3 · "The long road's quiet pause" · image stretch, centred type mirroring the image.
// Story: the break is becoming part of the journey. Everyday thing: the road. Hiroshige's Kannon Slope of the Kiso
// Highway, slit-stretched sideways into long road stripes across the whole sheet, except for one window in the
// middle where the picture stands still: the pause. The headline is centred, mirroring the window.
window.POSTER = async () => {
  const C = __CW__;
  seed(5133);
  await fonts(['900 100px "Mattone"', '500 16px "Albert Sans"']);
  const kiso = await media('media/2026-11-22/image-07-2160.jpg');
  const T = 'Albert Sans';
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

  const { lines } = sameOptical8(["THE LONG ROAD'S", 'QUIET PAUSE'], { font: 'Mattone', weight: 900, size: 200, gap: 18, minGap: 8, word: 0.26 }, W - 2 * M);
  const head = canvas(); const R = pinBlocks(head, lines, ['C', 'C'], 1, 0.06);

  // the road band between the lines; stretched left and right of a centred window two columns wide
  const band = { x: 0, y: R[0].y + R[0].h + 120, w: W, h: R[1].y - R[0].y - R[0].h - 240 };
  const win = cell(3, 0, 2, 1); win.y = band.y + band.h * 0.2; win.h = band.h * 0.6;
  let im = canvas(); cover(im.g, kiso, band, { crop: [0.05, 0.3, 0.75, 0.55] });
  im = tone(levels(im, 0.05, 0.98), [C.t0, C.t1, C.t2]);
  const left = { x: 0, y: band.y, w: win.x, h: band.h }, right = { x: win.x + win.w, y: band.y, w: W - win.x - win.w, h: band.h };
  // stretch from the window's edges outwards: rows repeat the pixel at the window edge
  let st = stretch(im, right, 'x');
  const flip = canvas(); flip.g.save(); flip.g.translate(W, 0); flip.g.scale(-1, 1); draw(flip.g, st); flip.g.restore();
  let st2 = stretch(flip, { x: W - win.x, y: band.y, w: win.x, h: band.h }, 'x');
  const back = canvas(); back.g.save(); back.g.translate(W, 0); back.g.scale(-1, 1); draw(back.g, st2); back.g.restore();
  draw(g, inter(back, rectMask(band)));
  // the window: the picture as it is, thresholded hard, framed
  const wm = inter(lumMask(im, 1 - pct(im, 0.45), { invert: true, blur: 1 }), rectMask(win));
  g.fillStyle = C.winBg; g.fillRect(win.x, win.y, win.w, win.h);
  draw(g, press(wm, C.winInk, 'riso', { wear: 0.35, spread: 0.45, seed: 4 }));

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.type };
  const sub = balance('The humble roadside stop is being rebuilt as a destination, and the journey now includes the break.', { ...t, minW: 180, maxW: COL * 2 });
  block(g, sub.lines, W / 2, band.y + band.h + 40, { ...t, align: 'center' });
  block(g, ['(Daily Poster) (No. 051)', '(Saturday 22 November) (BBC News)'], W / 2, band.y - 40, { ...t, align: 'center', anchor: 'bottom' });
  block(g, ['(Pause)'], win.x, win.y - 10, { ...t, anchor: 'bottom' });
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'letterpress', boxes: [band] });
  draw(g, press(head, C.type, 'letterpress', { wear: 0.35, spread: 0.25, seed: 51 }));
  scratches(g, 1, 513);   // wear from handling (round 16)
  draw(g, IM.paper(0.45, 51), 'source-over', 0.6); grain(g, 0.07, 0.5);
  return out;
};
