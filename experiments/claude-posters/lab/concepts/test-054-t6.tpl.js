// Test (Round 22) · giant swash "A", stripped back · Gloock, "A century after the blight". Two colours.
// One sheet of lime-yellow paper, faded and grainy; one ink, a soft olive grey, fading across the sheet. The giant A
// with whiplash vines that snake and loop round it (no perfect spirals), the headline small above, pencil lines on
// the real grid, two strips of opaque masking tape on the centre line, top and bottom. Nothing else.
// Imagery only from the day (Ben): the brief's chestnut burr, thresholded and printed in the same ink, housed in a
//   circle in the A's counter, where a seed would fall. No made-up drawings of leaves or burrs.
window.POSTER = async () => {
  const C = __CW__;
  seed(5496);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const out = canvas(), g = out.g;
  sheet(g, C.bg, 6);
  // pencil, exactly on the grid: the margins, the centre column line, two row lines
  const gx = (c) => M + c * COL, gy = (r) => M + r * ROW;
  for (const c of [0, 4, 8]) pencil(g, gx(c), gy(0) - 10, gx(c), gy(8) + 10, c + 1, { alpha: 0.3 });
  for (const r of [0, 1, 7, 8]) pencil(g, gx(0) - 10, gy(r), gx(8) + 10, gy(r), r + 20, { alpha: 0.26 });
  // the giant A between row 1 and the bottom margin
  const A0 = setOptical('A', { font: D, weight: 400, size: 1000, gap: 0, minGap: 0 });
  const size = Math.floor(1000 * Math.min((W - 2 * M) / A0.box.w, (gy(8) - gy(1) - 24) / A0.box.h) / 8) * 8;
  const A = setOptical('A', { font: D, weight: 400, size, gap: 0, minGap: 0 });
  const ink = canvas(); const RA = place(ink, A, { cx: W / 2, bottom: gy(8) });
  const cx = W / 2, top = RA.y, hh = RA.h, half = W / 2 - M;
  const X = (u) => cx - half * u, Y = (v) => top + hh * v;
  // the vines: drawn for the left and mirrored
  const vines = canvas();
  const side = (gg, extra) => {
    const P = (a) => a.map(([u, v]) => [X(u), Y(v)]);
    vine(gg, P([[0.1, 0.06], [0.35, -0.02], [0.7, 0.02], [0.88, 0.16], [0.82, 0.3], [0.68, 0.35], [0.63, 0.3], [0.7, 0.27], [0.78, 0.34], [0.86, 0.5], [0.82, 0.62], [0.92, 0.68]]), 20, { curl: 1 });
    vine(gg, P([[0.47, 0.42], [0.66, 0.44], [0.8, 0.52], [0.79, 0.6], [0.73, 0.59], [0.76, 0.55], [0.9, 0.66], [0.96, 0.8], [0.9, 0.9], [0.96, 0.96]]), 16, { curl: -1 });
  };
  side(vines.g, false);
  const right = canvas(); right.g.save(); right.g.translate(W, 0); right.g.scale(-1, 1); side(right.g, false); right.g.restore(); draw(vines.g, right);
  // in the counter: the day's chestnut burr, thresholded, in a circle
  const burrIm = trim(await media('media/2026-11-25/object-1.png'));
  const r0 = hh * 0.085, ccx = cx, ccy = Y(0.82);
  const bc = canvas(); { const cw = burrIm.width * 0.37, ch = burrIm.height * 0.33, cr = document.createElement('canvas'); cr.width = cw; cr.height = ch; cr.getContext('2d').drawImage(burrIm, 0, 0); cr.getContext('2d').clearRect(burrIm.width * 0.25, burrIm.height * 0.3, cw, ch); bc.g.fillStyle = '#000'; bc.g.fillRect(ccx - r0, ccy - r0, r0 * 2, r0 * 2); fit(bc.g, cr, { x: ccx - r0 * 0.92, y: ccy - r0 * 0.92, w: r0 * 1.84, h: r0 * 1.84 }); }
  const Lb = levels(bc, 0.02, 0.99), circ = circleMask(ccx, ccy, r0);
  const burrInk = inter(lumMask(Lb, 0.32, { blur: 0.6 }), circ);
  draw(ink.g, union(burrInk, cut(circleMask(ccx, ccy, r0 + 3), circleMask(ccx, ccy, r0))));
  draw(ink.g, cut(vines, alphaThr(blurred(A.c ? (() => { const a = canvas(); place(a, A, { cx: W / 2, bottom: gy(8) }); return a; })() : ink, 6), 0.02)));
  // the headline, small, centred in the first row, and the furniture at the foot, all in the same ink
  const hl = setOptical('A century after the blight', { font: D, weight: 400, size: 56, gap: 28, minGap: 6, word: 0.24 });
  place(ink, hl, { cx: W / 2, bottom: gy(1) - 40 });
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: '#fff' };
  block(ink.g, ['(Daily Poster) (No. 054)'], gx(0), gy(1) - 40, { ...t, anchor: 'bottom' });
  block(ink.g, ['(Wednesday 25 November)'], gx(8), gy(1) - 40, { ...t, align: 'right', anchor: 'bottom' });
  draw(g, fadedInk(ink, C.type, 6, { from: [0.85, 0.05], to: [0.1, 0.95], min: 0.55 }));
  // two strips of masking tape on the centre line, opaque
  tape(g, { x: W / 2 - 26, y: -30, w: 52, h: gy(1) - 70 }, C.tape, 1);
  tape(g, { x: W / 2 - 26, y: H - 56, w: 52, h: 120 }, C.tape, 2);
  stock(g, C.stock, 546);
  scan(g, 546, { amount: 1.2 });
  return out;
};
