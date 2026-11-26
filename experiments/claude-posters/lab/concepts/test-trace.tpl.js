// Trace test: one reference photo through traceArt, with its levels in a ramp and the lines in black.
window.POSTER = async () => {
  const C = __CW__;
  seed(1);
  const ph = await img(C.ref);
  const out = canvas(), g = out.g; g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const I = illo(g);
  const A = traceArt(ph, { x: 0, y: 0, w: W, h: H }, C.o);
  A.levels.forEach((m, i) => I.fill(m, C.ramp[i]));
  I.ink(A.lines);
  printAll(g, { ...C, bg: C.bg }, { seed: 3, wear: 0.12, spread: 0.5 });
  I.print(g, '#000000', 3);
  stock(g, 'uncoated', 3);
  return out;
};
