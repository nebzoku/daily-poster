// Illustration series · No. 049, drawn over a 3D scamp (lab/3d/scene.py shaft) · "GRAVITY / LEARNS TO SPEAK".
// Ben, 26 Nov: build the scene in 3D and shoot it from a super low angle so the geometry and perspective are right,
//   then illustrate on top. Blender gives the exact lines, a part-ID map (each part filled with a palette colour) and
//   the light (cel shadows). The headline's zones (top and bottom) go calm: flat wall colour, no line work.
window.POSTER = async () => {
  const C = __CW__;
  seed(4902);
  const D = 'Terminal Grotesque', T = 'Martian Mono';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const out = canvas(), g = out.g; g.fillStyle = C.wallS; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g);
  const HS = inkSafe(['GRAVITY', 'LEARNS TO SPEAK'], { font: D, weight: 400, size: 200, gap: 14, minGap: 8, word: 0.24 }, W - 2 * M, { preset: 'riso', wear: 0.12, spread: 0.2 });
  const head = canvas(); const R = pinBlocks(head, HS.lines, ['C', 'C'], 1, 0.1);
  const S = await sceneArt('/experiments/claude-posters/lab/3d/out/shaft', {
    mortar: [C.mortar, C.mortar], wallN: [C.wallN, C.wallNs], wallS: [C.wallS, C.wallSs], wallE: [C.wallE, C.wallEs], wallW: [C.wallW, C.wallWs],
    cage: [C.cage, C.cageS], cageframe: [C.line2, null], thread: [C.line2, null], bob: [C.pop, C.popShade], sky: [C.sky, null] });
  for (const [m, col] of S.fills) I.fill(m, col);
  I.ink(S.lines);
  snap('place-scene', out);
  // calm zones for the two headline lines: the wall there goes one flat colour
  calmZone(I, headZone([R[0]], 28, { edge: 'straight' }), [rectMask({ x: 0, y: 0, w: W, h: H })], C.wallS);
  calmZone(I, headZone([R[1]], 28, { edge: 'straight' }), [rectMask({ x: 0, y: 0, w: W, h: H })], C.wallN);
  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 049)', '(Friday 20 November)', '(The Guardian)'], "Australian physicists sent the word 'gravity' in binary through a brick wall, using a slow 1950s elevator.", { padCol: C.wallS, y: M + ROW });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.wallS, 4902);
  snap('final', out);
  return out;
};
