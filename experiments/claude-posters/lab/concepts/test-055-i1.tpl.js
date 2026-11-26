// Illustration test 1 (No. 055) · "The ball / never landed" · Instrument Serif sentence case, top and bottom.
// Story: a six left the ground and was caught on the road outside; it never came down where it should have.
// Scene: the ball as a big drawn object hanging high in an open sky, above a bank of outlined cumulus: it never came
//   back down to earth. A dashed line rises out of the clouds to it (the flight). Line and flat colour, in the day's
//   palette plus black and white, printed and scratched like the rest.
// Drawn from: object-1 (the cricket ball render) turned into a line drawing with cel fills; clouds drawn in code.
window.POSTER = async () => {
  const C = __CW__;
  seed(5591);
  const D = 'Instrument Serif', T = 'Azeret Mono';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const ball = trim(await media('media/2026-11-26/object-1.png'));
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);
  const I = illo(g), lay = (m, col) => (col === C.line ? I.ink(m) : I.fill(m, col));

  const HS = inkSafe(['The ball', 'never landed'], { font: D, weight: 400, size: 200, gap: 20, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);

  // far clouds, small, in the upper sky
  for (const [x, y, w, h, s] of [[700, 250, 300, 110, 3], [-80, 600, 240, 90, 4], [860, 560, 260, 90, 5]]) {
    const cl = cumulus(x, y, w, h, s, { lobes: 6, curls: 2, lw: 2.2 }); lay(cl.fill, C.cloud); lay(cl.lines, C.line);
  }
  snap('place-far-clouds', out);

  // the flight: a dashed line rising out of the cloud bank, curving up to the ball
  const fl = canvas(), path = curve([[120, 1120], [190, 860], [300, 700], [390, 660]], 3);
  for (let i = 0; i < path.length - 12; i += 22) inkLine(fl, path.slice(i, i + 12), 3, { sd: 90 + i, taper: 0.5 });
  lay(fl, C.line);
  snap('place-flight', out);

  // the ball, drawn: cel fills and a worn outline, seam stitches from the render
  const A = ballArt(660, 600, 250, { tilt: -0.55, seamX: 0.16, lw: 4, sd: 7 });
  lay(A.body, C.body); lay(A.shadow, C.shadow); lay(A.light, C.light); lay(A.stitches, C.light);
  snap('step-ball-1', out);
  lay(A.lines, C.line);
  snap('step-ball-2', out);

  // the cloud bank: big cumulus overlapping, back to front, running off the bottom and both edges
  const bank = [[-120, 1040, 560, 300, 11], [420, 1000, 760, 340, 12], [180, 1150, 640, 300, 13], [-80, 1230, 520, 260, 14], [620, 1210, 600, 300, 15]];
  for (const [x, y, w, h, s] of bank) { const cl = cumulus(x, y, w, h, s, { lobes: 10, curls: 6, lw: 3, flat: false }); lay(cl.fill, C.cloud); lay(cl.lines, C.line); }
  // the bank's foot: solid cloud to the bottom edge
  I.fill(rectMask({ x: 0, y: 1320, w: W, h: H - 1320 }), C.cloud);
  snap('place-bank', out);

  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  block(g, ['(Daily Poster)', '(No. 055)', '(Thursday 26 November)', '(BBC News)'], W - M, M, { ...t, align: 'right' });
  const sub = balance("A motorbike passenger caught a six one-handed outside the ground at Pakistan's Swat Premier League.", { ...t, minW: 220, maxW: COL * 2.6 });
  block(g, sub.lines, M, M + ROW * 2, t);
  snap('text-small', out);

  snapLines(tint(head, C.type), R);
  printAll(g, C, { seed: 559, wear: 0.12, spread: 0.5 });
  I.print(g, C.line, 559);
  printHead(g, head, C.type, C.finish, { bg: C.cloud, seed: 59, wear: HS.ink.wear, spread: HS.ink.spread });
  snap('printed', out);
  stock(g, C.stock, 59);
  snap('final', out);
  return out;
};
