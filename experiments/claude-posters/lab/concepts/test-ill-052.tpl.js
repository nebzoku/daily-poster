// Illustration series · No. 052 (23 Nov, Green) · "EVERY WALL / BECAME A GARDEN" · Manrope ExtraBold caps.
// Story: Victorian decorator David Parr painted grand houses by day, then covered his own small house in patterns.
// Move: LOW ANGLE up at a painter on his scaffold, brush lifted to a wall already climbing with painted vines and
//   leaves; the pot of paint on the scaffold rail is the pop (cobalt). Traced from a photo of a decorator at work.
// Refs: refs/2026-11-23 ref-06 (painter on a scaffold, low angle), ref-11 (Victorian painted room).
window.POSTER = async () => {
  const C = __CW__;
  seed(5201);
  const D = 'Manrope', T = 'Manrope';
  await fonts([`800 100px "${D}"`, `500 16px "${T}"`]);
  const ref = await img('/experiments/claude-posters/refs/2026-11-23/ref-06.jpg');
  const out = canvas(), g = out.g; g.fillStyle = C.wall; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g), lw = 3;
  const HS = inkSafe(['EVERY WALL', 'BECAME A GARDEN'], { font: D, weight: 800, size: 120, gap: 12, minGap: 6, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['L', 'L'], 1, 0.1);
  const P = refMap(1.12, [400, 600], [560, 780]);

  // the wall: painted vines and leaves already climbing it, the newest stretch still to come
  const vines = canvas(), leaves = canvas();
  const leaf = (x, y, a, s) => { const l = canvas(); l.g.fillStyle = '#fff'; l.g.save(); l.g.translate(x, y); l.g.rotate(a); l.g.beginPath(); l.g.moveTo(0, 0); l.g.quadraticCurveTo(s * 0.6, -s * 0.45, s * 1.3, 0); l.g.quadraticCurveTo(s * 0.6, s * 0.45, 0, 0); l.g.fill(); l.g.restore(); draw(leaves.g, l); };
  seed(21);
  for (const [x0, h] of [[60, 0.9], [230, 0.5], [880, 0.95], [1010, 0.7], [420, 0.25]]) {
    const pts = []; let x = x0; for (let y = H + 40; y > H - H * h; y -= 60) { x += (rand() - 0.5) * 70; pts.push([x, y]); }
    const c = curve(pts, 5); inkLine(vines, c, 5, { taper: 0.6, sd: x0 });
    c.forEach(([x, y], i) => { if (i % 9 === 4) { leaf(x, y, -Math.PI / 2 + (i % 18 ? 0.9 : -0.9) + (rand() - 0.5) * 0.4, 30 + rand() * 18); if (rand() < 0.3) { const fl = circleMask(x + 26, y - 8, 9); draw(leaves.g, fl); } } });
  }
  I.fill(vines, C.vine); I.fill(leaves, C.leaf); I.ink(outline(leaves, 2)); I.ink(outline(vines, 1.6));
  // a strip of skirting and the wall's shadow corner
  I.fill(poly([[-20, 1380], [W + 20, 1380], [W + 20, H + 20], [-20, H + 20]]), C.wallShade);
  snap('place-wall', out);
  // the scaffold: tubes and a deck, traced
  const tubes = canvas();
  for (const [a, b] of [[[250, 640], [235, 1260]], [[725, 360], [760, 1260]], [[620, 700], [630, 960]], [[310, 520], [715, 482]], [[255, 690], [725, 665]], [[255, 870], [740, 880]], [[305, 1040], [800, 960]]])
    inkLine(tubes, P([a, b]), 15, { taper: 0, wobble: 0.3, sd: a[0] + a[1] });
  I.fill(tubes, C.tube); I.ink(outline(tubes, 2.4));
  const deck = closed(P([[300, 1010], [790, 945], [800, 985], [310, 1060]]), 8); I.fill(deck, C.deck); I.ink(outline(deck, lw));
  // the pot of paint, hooked on the rail (the pop), and its roller tray
  const pot = closed(P([[102, 500], [296, 500], [292, 640], [106, 640]]), 6); I.fill(pot, C.pop); I.fill(cut(pot, closed(P([[150, 500], [296, 500], [292, 640], [150, 640]]), 6)), C.popShade); I.ink(outline(pot, lw));
  const handle = canvas(); inkLine(handle, curve(P([[110, 495], [140, 410], [190, 405], [222, 440], [220, 495]]), 3), 4, { sd: 33 }); I.ink(handle);
  snap('place-scaffold', out);
  // the painter: overalls, cap, arm raised with the brush to the wall
  refFill(I, P, [[445, 130], [480, 126], [500, 145], [503, 205], [500, 228], [520, 262], [538, 320], [545, 400], [548, 470], [545, 500], [552, 560], [558, 650], [572, 750], [598, 850], [622, 935], [628, 960], [560, 978], [555, 1008], [500, 1008], [412, 992], [430, 975], [492, 948], [480, 880], [462, 790], [447, 700], [440, 610], [442, 520], [428, 500], [418, 455], [380, 455], [362, 440], [372, 425], [410, 420], [418, 380], [412, 320], [418, 262], [412, 245], [406, 220], [410, 195], [415, 170], [420, 152]], C.overall, C.overallShade, ref, 0.42, lw);
  refFill(I, P, [[425, 250], [398, 200], [384, 188], [376, 205], [393, 242], [414, 276]], C.overall, null, null, 0, lw);
  const capM = refFill(I, P, [[418, 152], [445, 128], [482, 126], [500, 145], [503, 180], [470, 172], [440, 168], [416, 162]], C.cap, null, null, 0, 2.6);
  refFill(I, P, [[406, 220], [410, 195], [420, 168], [440, 170], [436, 230], [416, 245]], C.skin, null, null, 0, 2.4);
  const belt = canvas(); inkLine(belt, P([[438, 500], [548, 492]]), 10, { taper: 0, sd: 44 }); I.fill(belt, C.tube); I.ink(outline(belt, 1.8));
  const brush = canvas(); inkLine(brush, P([[392, 196], [372, 160]]), 9, { taper: 0, sd: 45 }); I.fill(brush, C.tube); I.ink(outline(brush, 1.8));
  const folds = canvas(); for (const pts of [[[470, 560], [480, 640], [478, 700]], [[520, 700], [540, 800], [560, 880]], [[455, 300], [470, 380], [470, 440]]]) inkLine(folds, curve(P(pts), 4), 1.8, { sd: pts[0][1], taper: 0.6 }); I.ink(folds);
  snap('place-painter', out);

  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 052)', '(Monday 23 November)', '(BBC News)'], 'Victorian decorator David Parr papered mansions by day, then filled his own Cambridge terrace with patterns.', { padCol: C.wall });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.wall, 5201);
  snap('final', out);
  return out;
};
