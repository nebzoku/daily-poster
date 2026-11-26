// Illustration series · No. 054 (25 Nov, Yellow) · "The forest remembers / its giant" · Gloock, sentence case.
// Story: the American chestnut, wiped out by blight a century ago, is being brought back.
// Move: WORM'S-EYE up a giant trunk: the bark's grooves race up to a canopy of leaf clusters against the sky; at the
//   foot a small person hugs the tree, cheek to the bark, a teal beanie (the pop) the one focal point. Traced from a
//   photo of someone hugging a giant tree; bark drawn as strata.
// Refs: refs/2026-11-25 ref-08 (looking up a giant trunk), ref-12 (person hugging a giant tree).
window.POSTER = async () => {
  const C = __CW__;
  seed(5401);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const ref = await img('/experiments/claude-posters/refs/2026-11-25/ref-12.jpg');
  const out = canvas(), g = out.g; g.fillStyle = C.sky; g.fillRect(0, 0, W, H); snap('bg', out);
  const I = illo(g), lw = 3;
  const HS = inkSafe(['The forest remembers', 'its giant'], { font: D, weight: 400, size: 120, gap: 20, minGap: 8, word: 0.22 }, W - 2 * M, { preset: 'riso', wear: 0.1, spread: 0.12 });
  const head = canvas(); const R = pinInterlock(head, HS.lines, ['L', 'R'], 2, 6);

  const canopyM = [];
  // the canopy: lumpy leaf masses (cumulus shapes) in two tones round the top, light breaking through
  for (const [x, y, w, h, s, col] of [[-200, 120, 700, 420, 41, C.leaf2], [520, 60, 760, 460, 42, C.leaf2], [-120, 260, 600, 360, 43, C.leaf], [480, 240, 700, 380, 44, C.leaf], [160, 340, 700, 300, 45, C.leaf]]) {
    const cl = cumulus(x, y, w, h, s, { lobes: 12, curls: 7, lw: 2.2, flat: false }); I.fill(cl.fill, col); I.ink(cl.lines); canopyM.push(cl.fill); }
  snap('place-canopy', out);
  // the trunk: off-centre, flaring into roots at the foot, bulging, knotted, splitting into limbs in the canopy
  const L = [[-220, H + 40], [-60, 1300], [40, 1180], [150, 1080], [250, 900], [330, 700], [360, 520], [300, 360], [220, 250]];
  const Rr = [[560, 250], [500, 360], [520, 520], [590, 700], [700, 900], [860, 1080], [1000, 1200], [1150, 1320], [W + 260, H + 40]];
  const trunk = poly([...curve(L, 8), ...curve([[300, 330], [420, 300], [500, 340]], 6), ...curve(Rr, 8)]);
  I.fill(trunk, C.bark);
  const lit = poly([...curve([[260, H + 40], [330, 1100], [400, 800], [420, 520], [400, 330]], 8), ...curve([[460, 330], [500, 520], [560, 800], [660, 1100], [720, H + 40]], 8)]); I.fill(inter(lit, trunk), C.barkLight);
  // limbs off into the leaves
  const limbs = canvas(); inkLine(limbs, curve([[330, 420], [200, 300], [60, 260], [-40, 240]], 6), 60, { taper: 0.6, sd: 3 }); inkLine(limbs, curve([[500, 400], [640, 300], [820, 230], [980, 200]], 6), 54, { taper: 0.6, sd: 4 });
  I.fill(cut(limbs, trunk), C.bark); I.ink(outline(union(limbs, trunk), 3));
  // bark: wavy grooves that follow the trunk up and swing round the knots
  const grooves = canvas(); seed(12);
  for (let k = 0; k < 40; k++) { const u = k / 39, pts = []; for (let j = 0; j <= 16; j++) { const t = j / 16, y = H + 40 - (H + 40 - 300) * t;
      const xl = -220 + 440 * t * t + 260 * t, xr = W + 260 - (W + 260 - 520) * Math.pow(t, 0.8); const x = xl + (xr - xl) * u + Math.sin(j * 0.9 + k * 1.7) * 16 * (1 - t * 0.6);
      pts.push([x, y]); }
    inkLine(grooves, curve(pts, 5), 2.4, { sd: 700 + k, taper: 0.4, wobble: 1.2 }); }
  const brk = canvas(), nz = noise(12); { const id = brk.g.createImageData(brk.width, brk.height); for (let p = 0; p < nz.length; p++) if (nz[p] < 0.6) id.data[p * 4 + 3] = 255; brk.g.putImageData(id, 0, 0); }
  const knots = canvas(); for (const [x, y, rx, ry] of [[600, 1040, 60, 44], [300, 820, 40, 52], [470, 600, 34, 26]]) { const kn = canvas(); kn.g.fillStyle = '#fff'; kn.g.beginPath(); kn.g.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2); kn.g.fill(); draw(knots.g, kn); }
  I.ink(cut(inter(inter(grooves, brk), trunk), dilate(knots, 6))); I.fill(knots, C.barkLight); I.ink(outline(knots, 2.4)); I.ink(strata(knots, { step: 9, n: 3, lw: 1.3, sd: 5, keep: 0.8 }));
  I.ink(outline(trunk, lw));
  // fallen leaves and burrs at the foot
  I.ink(blades(poly([[-40, 1440], [W + 40, 1440], [W + 40, H + 40], [-40, H + 40]]), { density: 0.0012, h: [6, 16], lw: 1.2, sd: 22 }));
  for (const [x, y, w, h, sd, col] of [[-260, 120, 520, 260, 51, C.leaf], [700, 70, 520, 240, 52, C.leaf], [200, 160, 420, 200, 53, C.leaf2]]) { const cl = cumulus(x, y, w, h, sd, { lobes: 10, curls: 5, lw: 2.2, flat: false }); I.fill(cl.fill, col); I.ink(cl.lines); canopyM.push(cl.fill); }
  snap('place-trunk', out);
  // the person at the foot, hugging the trunk, traced
  const P = refMap(0.86, [300, 1198], [470, 1530]);
  refFill(I, P, [[345, 590], [380, 585], [395, 605], [393, 640], [386, 668], [378, 690], [392, 710], [388, 760], [410, 790], [440, 800], [470, 828], [450, 836], [410, 818], [372, 840], [345, 850], [250, 822], [160, 830], [152, 825], [170, 760], [205, 698], [255, 658], [300, 648], [322, 640], [323, 615]], C.coat, C.coatShade, ref, 0.45, lw);
  refFill(I, P, [[160, 830], [250, 822], [330, 840], [345, 850], [330, 900], [325, 980], [335, 1040], [330, 1110], [350, 1150], [405, 1185], [395, 1198], [300, 1198], [290, 1165], [292, 1110], [285, 1050], [250, 1080], [240, 1110], [270, 1135], [272, 1150], [160, 1150], [158, 1125], [190, 1100], [205, 1060], [190, 990], [170, 900]], C.trousers, C.trousersShade, ref, 0.4, lw);
  refFill(I, P, [[330, 640], [372, 630], [395, 632], [388, 668], [375, 690], [345, 692], [332, 672]], C.skin, null, null, 0, 2.4);
  refFill(I, P, [[322, 640], [323, 612], [345, 590], [380, 585], [395, 605], [395, 630], [370, 628], [340, 632]], C.pop, null, null, 0, 2.6);
  refFill(I, P, [[440, 798], [470, 826], [452, 834], [425, 816]], C.skin, null, null, 0, 2);
  snap('place-person', out);

  // the headline's zone goes calm: the canopy there is one flat colour, no line work
  calmZone(I, headZone(R, 28), canopyM, C.leaf);
  illoSmall(g, I, C, T, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], 'Nearly a century after a parasitic blight erased them, American chestnuts are being regrown across Appalachia.', { padCol: C.sky, y: M + ROW * 1.5 });
  snap('text-small', out);
  snapLines(tint(head, C.type), R);
  illoPrint(g, I, C, head, HS, C.sky, 5401);
  snap('final', out);
  return out;
};
