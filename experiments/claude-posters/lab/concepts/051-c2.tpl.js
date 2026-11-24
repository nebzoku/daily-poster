// No. 051 · Concept 2 · "Pit stop promoted to destination" · grid boxes, three treatments, a crossing circle.
// Story: the stop for fuel and a sandwich is becoming the reason to go. Everyday things: the fuel pump and the
// coffee. (01) the brief's 3D fuel pump zoomed to its globe and nozzle, thresholded; (02) the enamel coffee cup,
// zoomed to its rim, left smooth; (03) the pump again, pixelated. A circle crosses (01) and (02), flipping them.
window.POSTER = async () => {
  const C = __CW__;
  seed(5132);
  await fonts(['900 100px "Mattone"', '500 16px "Albert Sans"']);
  const pump = await media('media/2026-11-22/object-1.png'), cup = await media('media/2026-11-22/object-3.png');
  const T = 'Albert Sans';
  const out = canvas(), g = out.g;
  paper(g, C.paper, { drift: 0.02, fibre: 0.05 });

  const { lines } = sameOptical8(['Pit stop', 'promoted', 'to destination'], { font: 'Mattone', weight: 900, size: 200, gap: 12, minGap: 5, word: 0.26 }, W - 2 * M);
  const head = canvas(); pinInterlock(head, lines, ['L', 'L', 'L'], 0, 6);

  const b1 = cell(0, 0, 4, 3), b2 = cell(4, 0, 4, 3), b3 = cell(6, 3, 2, 2);
  // 01 pump, thresholded
  const p1 = boxed(pump, b1, { crop: [0.41, 0.2, 0.2, 0.3] });
  g.fillStyle = C.box1; g.fillRect(b1.x, b1.y, b1.w, b1.h);
  const m1 = inter(lumMask(levels(p1, 0.05, 0.95), 0.5, { blur: 1 }), rectMask(b1));
  const m1i = IM.print(m1, 'riso', { wear: 0.4, spread: 0.45, seed: 1 });
  draw(g, tint(m1i, C.ink1));
  // 02 cup, smooth
  draw(g, tone(levels(boxed(cup, b2, { crop: [0.25, 0.22, 0.45, 0.4] }), 0.02, 0.98), [C.tone0, C.tone1, C.tone2]));
  // 03 pump, big pixels
  draw(g, inter(pixelate(tone(levels(boxed(pump, b3, { crop: [0.42, 0.45, 0.16, 0.2] }), 0.05, 0.95), [C.tone0, C.box1, C.tone2]), 33), rectMask(b3)));
  // the circle across the join of 01 and 02, colours flipped inside it
  const cx = b2.x, cy = b1.y + b1.h, r = COL * 1.25, cm = circleMask(cx, cy, r);
  draw(g, tint(inter(cm, rectMask(b1)), C.ink1)); draw(g, tint(inter(inter(m1i, cm), rectMask(b1)), C.box1));
  draw(g, tint(cut(cm, union(rectMask(b1), rectMask(b2))), C.circle));
  draw(g, tint(inter(cm, rectMask(b2)), C.circle), 'multiply');

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.ink };
  [b1, b2].forEach((b, i) => block(g, [`(0${i + 1})`], b.x, b.y + b.h + 8, t));
  const sub = balance('Fuel and a sandwich are giving way to better food, design and reasons to linger beside the motorway.', { ...t, minW: 200, maxW: COL * 2.6 });
  block(g, sub.lines, b3.x, b3.y + b3.h, { ...t, align: 'right', anchor: 'bottom' });
  block(g, ['(Daily Poster) (No. 051)', '(Saturday 22 November) (BBC News)'], W - M, b3.y + b3.h + 24, { ...t, align: 'right' });
  pixels(g, M, M + ROW * 3 + 40, 8, ['#.#..#', '.#.##.', '#....#'], C.ink);
  // round 14 (re-rendered 24 Nov): the whole sheet printed like the headline, then the headline, then the paper
  printAll(g, C, { style: 'letterpress', boxes: [b2, b3] });
  draw(g, press(head, C.ink, 'letterpress', { wear: 0.35, spread: 0.25, seed: 51 }));
  draw(g, IM.paper(0.5, 51), 'source-over', 0.6); grain(g, 0.06, 0.5);
  return out;
};
