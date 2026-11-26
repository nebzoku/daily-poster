// Illustration series · No. 050 (21 Nov, Teal) · "First taste / of a hot year" · Libre Caslon Display, sentence case.
// Story: a Gloucestershire vineyard released an early "nouveau" wine: summers are ripening grapes sooner.
// Move: STRAIGHT DOWN from above (aerial). Vine rows sweep over rolling ground as fine parallel lines; a pale lane
//   winds through; two pickers and their crate of grapes (the pop, magenta) sit in the hot afternoon, long shadows.
// Refs: refs/2026-11-21 ref-06, ref-07, ref-08 (aerial vineyards), ref-15, ref-16 (pickers, crates).
window.POSTER = async () => {
  const C = __CW__;
  seed(5001);
  const D = 'Libre Caslon Display', T = 'Libre Franklin';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const out = canvas(), g = out.g; g.fillStyle = C.ground; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g);
  const HS = inkSafe(['First taste', 'of a hot year'], { font: D, weight: 400, size: 200, gap: 20, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 1, 6);

  // the ground: parcels of vines whose rows run different ways, split by the winding lane
  const f = (x, y) => y + 90 * Math.sin(x / 260) + 50 * Math.sin(x / 120 + y / 300);
  const lane = canvas(); inkLine(lane, curve([[-80, 1180], [200, 980], [430, 860], [560, 620], [760, 470], [1180, 360]], 6), 56, { taper: 0, wobble: 0.3, sd: 5 });
  const parcels = [poly([[-50, -50], [W + 50, -50], [W + 50, 300], [700, 560], [-50, 800]]), poly([[-50, 800], [700, 560], [W + 50, 300], [W + 50, H + 50], [-50, H + 50]])];
  parcels.forEach((pm, i) => { I.fill(cut(pm, lane), i ? C.ground : C.ground2); });
  const shade = canvas(); seed(55); for (let i = 0; i < 6; i++) { const cl = cumulus(rand() * W - 200, rand() * H, 500, 260, 60 + i, { lobes: 7, curls: 0, flat: false }); draw(shade.g, cl.fill); }
  I.fill(cut(inter(shade, union(...parcels)), lane), C.groundShade);
  const rows = canvas();
  for (let k = -40; k < 160; k++) { const pts = []; for (let x = -60; x <= W + 60; x += 8) { const y = k * 13 - 90 * Math.sin(x / 260) - 50 * Math.sin(x / 120 + k * 13 / 300); pts.push([x, y]); } inkLine(rows, pts, 1.5, { sd: k + 700, taper: 0.05, wobble: 0.6 }); }
  const rows2 = canvas();
  for (let k = -60; k < 120; k++) { const x0 = k * 12; inkLine(rows2, [[x0, 820], [x0 + 520, H + 60]], 1.4, { sd: k + 900, taper: 0.05 }); }
  I.ink(cut(union(inter(rows, parcels[0]), inter(rows2, parcels[1])), dilate(lane, 4)));
  I.fill(lane, C.lane); I.ink(outline(lane, 2.6));
  const ruts = canvas(); inkLine(ruts, curve([[-80, 1172], [200, 972], [430, 852], [560, 612], [760, 462], [1180, 352]], 6), 1.2, { sd: 6, taper: 0.1 }); inkLine(ruts, curve([[-80, 1190], [200, 990], [430, 870], [560, 630], [760, 480], [1180, 370]], 6), 1.2, { sd: 7, taper: 0.1 });
  I.ink(inter(ruts, lane));
  snap('place-vineyard', out);
  // two pickers from above: hat discs with shoulders, long shadows, and the crate of grapes
  const fig = (x, y, r, sd) => {
    const sh = canvas(); inkLine(sh, [[x, y], [x + r * 4.2, y + r * 2.2]], r * 1.5, { taper: 0.4, sd }); I.fill(cut(sh, circleMask(x, y, r)), C.groundShade2);
    const sho = canvas(); sho.g.fillStyle = '#fff'; sho.g.beginPath(); sho.g.ellipse(x + r * 0.2, y + r * 0.35, r * 1.25, r * 0.8, 0.3, 0, Math.PI * 2); sho.g.fill(); I.fill(sho, C.shirt); I.ink(outline(sho, 2.4));
    const hat = circleMask(x - r * 0.1, y - r * 0.05, r * 0.95); I.fill(hat, C.hat); I.ink(outline(hat, 2.4));
    const band = canvas(); inkLine(band, curve([[x - r * 0.55, y - r * 0.4], [x - r * 0.1, y - r * 0.62], [x + r * 0.38, y - r * 0.4]], 3), 1.6, { sd: sd + 1 }); I.ink(band);
  };
  fig(520, 700, 26, 31); fig(612, 640, 24, 32);
  const crate = poly([[548, 590], [604, 572], [622, 620], [566, 640]]); const csh = poly([[566, 640], [622, 620], [660, 650], [610, 676]]); I.fill(csh, C.groundShade2);
  I.fill(crate, C.pop); I.ink(outline(crate, 2.4));
  const grapes = canvas(); seed(8); for (let i = 0; i < 18; i++) grapes.g.drawImage(circleMask(560 + rand() * 50, 585 + rand() * 40, 5), 0, 0, W, H);
  I.fill(inter(grapes, crate), C.grape); I.ink(inter(outline(grapes, 1.2), crate));
  snap('place-pickers', out);

  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 050)', '(Saturday 21 November)', '(The Guardian)'], 'Three Choirs in Gloucestershire has released its 2026 First Release, an English answer to beaujolais nouveau.', { padCol: C.ground2, y: M + ROW * 1.5 });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.ground, 5001);
  snap('final', out);
  return out;
};
