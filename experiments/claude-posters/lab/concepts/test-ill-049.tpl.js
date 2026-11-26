// Illustration series · No. 049 (20 Nov, Blue) · "GRAVITY / LEARNS TO SPEAK" · Terminal Grotesque caps, top and bottom.
// Story: physicists sent the word "gravity" through a brick wall using a slow 1950s elevator's mass as the signal.
// Move: WORM'S-EYE up a brick lift shaft. The walls converge to a square of daylight; the old cage hangs halfway up
//   on its cables; its plumb bob drops on a thread straight at us (the pop, red): the weight that speaks.
// Refs: refs/2026-11-20 ref-03, ref-07 (looking up lift shafts), ref-10 (plumb bob).
window.POSTER = async () => {
  const C = __CW__;
  seed(4901);
  const D = 'Terminal Grotesque', T = 'Martian Mono';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const out = canvas(), g = out.g; g.fillStyle = C.wallL; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g), lw = 3;
  const HS = inkSafe(['GRAVITY', 'LEARNS TO SPEAK'], { font: D, weight: 400, size: 200, gap: 14, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C'], 1, 0.1);

  // the shaft: four walls from the sheet's edges to a small square of sky round the vanishing point
  const V = [560, 640], s0 = 70, lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const O = [[-60, -60], [W + 60, -60], [W + 60, H + 60], [-60, H + 60]], In = [[V[0] - s0, V[1] - s0], [V[0] + s0, V[1] - s0], [V[0] + s0, V[1] + s0], [V[0] - s0, V[1] + s0]];
  const walls = [[0, 1, C.wallT], [1, 2, C.wallR], [2, 3, C.wallB], [3, 0, C.wallL]];
  const ws = walls.map(([a, b, col]) => { const m = poly([O[a], O[b], In[b], In[a]]); I.fill(m, col); return m; });
  // brick courses: rings of the square getting closer together towards the top (depth), joints radiating
  const courses = canvas(), joints = canvas();
  for (let k = 1; k < 44; k++) { const t = 1 - Math.pow(0.93, k); const ring = [0, 1, 2, 3].map((i) => lerp(O[i], In[i], t)); for (let i = 0; i < 4; i++) inkLine(courses, [ring[i], ring[(i + 1) % 4]], 1.3 * (1 - t * 0.6), { sd: k * 4 + i, taper: 0.05 });
    if (k % 1 === 0) { const t2 = 1 - Math.pow(0.93, k + 1), r2 = [0, 1, 2, 3].map((i) => lerp(O[i], In[i], t2)); for (let i = 0; i < 4; i++) for (let j = 1; j < 7; j++) { const f = (j + (k % 2) * 0.5) / 7; inkLine(joints, [lerp(ring[i], ring[(i + 1) % 4], f), lerp(r2[i], r2[(i + 1) % 4], f)], 1.1 * (1 - t * 0.6), { sd: k * 31 + i * 7 + j }); } } }
  I.ink(union(courses, joints));
  for (let i = 0; i < 4; i++) I.ink(inkLine(canvas(), [O[i], In[i]], 2.6, { sd: 90 + i, taper: 0.4 }));
  const sky = poly(In); I.fill(sky, C.sky); I.ink(outline(sky, 2.4));
  snap('place-shaft', out);
  // the cage, halfway up: its floor seen from below, a frame with a mesh, and the cables
  const tc = 0.62, cage = [0, 1, 2, 3].map((i) => lerp(O[i], In[i], tc)).map(([x, y]) => [V[0] + (x - V[0]) * 0.78, V[1] + (y - V[1]) * 0.78]);
  const cm = poly(cage); I.fill(cm, C.cage); I.ink(outline(cm, lw));
  const mesh = canvas(); for (let j = 1; j < 9; j++) { const f = j / 9; inkLine(mesh, [lerp(cage[0], cage[1], f), lerp(cage[3], cage[2], f)], 1.4, { sd: 300 + j }); inkLine(mesh, [lerp(cage[0], cage[3], f), lerp(cage[1], cage[2], f)], 1.4, { sd: 320 + j }); }
  I.ink(inter(mesh, cm));
  const cab = canvas(); for (const i of [0, 1]) { const a = lerp(cage[0], cage[1], 0.35 + i * 0.3); inkLine(cab, [a, lerp(a, V, 0.92)], 2, { sd: 340 + i }); } I.ink(cut(cab, cm));
  snap('place-cage', out);
  // the plumb bob: a thread from the cage's centre to the bob, close to us, seen from below: a disc with a point
  const bc = [V[0] + 10, V[1] + 290], br = 120;
  const thr = canvas(); inkLine(thr, [[V[0] + 6, V[1] + 8], [bc[0], bc[1] - br + 6]], 2.2, { sd: 400, taper: 0 }); I.ink(cut(thr, cm));
  const bob = circleMask(bc[0], bc[1], br); I.fill(bob, C.pop);
  I.fill(cut(bob, circleMask(bc[0] - 26, bc[1] - 30, br * 1.02)), C.popShade);
  const facets = canvas(); for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2 + 0.2; inkLine(facets, [[bc[0] + Math.cos(t) * br * 0.18, bc[1] + Math.sin(t) * br * 0.18], [bc[0] + Math.cos(t) * br * 0.96, bc[1] + Math.sin(t) * br * 0.96]], 1.4, { sd: 410 + a, taper: 0.6 }); }
  I.ink(inter(facets, bob)); I.fill(circleMask(bc[0] - 4, bc[1] - 4, 16), C.sky); I.ink(outline(circleMask(bc[0] - 4, bc[1] - 4, 16), 2)); I.ink(outline(bob, lw + 0.6));
  snap('place-bob', out);

  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 049)', '(Friday 20 November)', '(The Guardian)'], "Australian physicists sent the word 'gravity' in binary through a brick wall, using a slow 1950s elevator.", { padCol: C.wallT });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.wallT, 4901);
  snap('final', out);
  return out;
};
