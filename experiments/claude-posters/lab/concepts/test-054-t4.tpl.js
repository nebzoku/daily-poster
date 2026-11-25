// Test (Round 20) · "The forest / remembers / its giant" · Instrument Serif (condensed) sentence case, ledger lines.
// Same ledger as test 1, now with a condensed serif (fills the lines the way the reference does), the sheet scanned,
// and layers on it: a vertical strip of masking tape down a grid line, a piece of card taped on for the small type.
// Story: the chestnut was the giant of the eastern forests, gone for a century, now coming back.
// Move: Vinho Verde ledger: big words one per line, each on a hairline rule, alternating indents, small engraved
//   ornaments in the gaps, a tiny note in a corner. Type, ink and paper only.
// (Ben: no drop shadows on type, so the faint after-image on "remembers" is gone.)
// Ornaments: cut from the brief's 1892 Lockwood de Forest gilt cutout (leaf scrolls), thresholded.
// Finish and paper: letterpress on uncoated, tone on a lime-yellow ground.
window.POSTER = async () => {
  const C = __CW__;
  seed(5491);
  const D = 'Instrument Serif', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const orn = await media('media/2026-11-25/image-07-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const HS = inkSafe(['The forest', 'remembers', 'its giant'], { font: D, weight: 400, size: 320, gap: 18, minGap: 6, word: 0.2 }, W - 2 * M, { preset: 'letterpress', wear: 0.15, spread: 0.15 });
  const [L0, L1, L2] = HS.lines, base = (t) => t.base - t.box.y;
  const H1 = setOptical('H', { ...HS.o, size: HS.size }), cap = H1.base - H1.box.y;
  const head = canvas();
  // first line: cap height on the top margin, left; last line: descender on the bottom margin, run off the right edge
  const b0 = M + cap, b2 = H - M - (L2.box.h - base(L2)), b1 = Math.round((b0 + b2) / 2);   // on the middle rule
  const R0 = place(head, L0, { left: M, top: b0 - base(L0) });
  const R1 = place(head, L1, { right: W - M, top: b1 - base(L1) });
  const tW = setOptical('t', { ...HS.o, size: HS.size }).box.w;
  const R2 = place(head, L2, { left: M + COL, top: b2 - base(L2) });
  // ledger paper: hairline rules at one pitch down the whole sheet; the three lines sit on three of them
  const n = 6, p = (b2 - b0) / n;
  const ink = canvas(); ink.g.fillStyle = '#fff';
  const ruleY = [];
  for (let k = 0; k <= n; k++) { const y = Math.round(b0 + k * p + HS.size * 0.05); ruleY.push(y); ink.g.fillRect(M, y, W - 2 * M, 1); }
  // ornaments from the gilt cutout, about a cap height tall: a diamond in the gap left of "its", a triangle after "The forest"
  const src = canvas(); cover(src.g, orn, { x: 0, y: 0, w: W, h: H }, { crop: [0.3, 0.33, 0.26, 0.2] });   // zoomed in, so the scrolls survive the ink
  const lights = lumMask(levels(src, 0.05, 0.98), 0.55, { blur: 0.8 });
  const diamond = (cx, cy, r) => { const c = canvas(); c.g.fillStyle = '#fff'; c.g.beginPath(); c.g.moveTo(cx, cy - r); c.g.lineTo(cx + r, cy); c.g.lineTo(cx, cy + r); c.g.lineTo(cx - r, cy); c.g.closePath(); c.g.fill(); return c; };
  const tri = (cx, cy, r) => { const c = canvas(); c.g.fillStyle = '#fff'; c.g.beginPath(); c.g.moveTo(cx - r, cy - r * 0.8); c.g.lineTo(cx + r, cy - r * 0.8); c.g.lineTo(cx, cy + r * 0.9); c.g.closePath(); c.g.fill(); return c; };
  const ring = (m, w) => cut(alphaThr(blurred(m, w), 0.02), cut(m, alphaThr(blurred(cut(rectMask({ x: 0, y: 0, w: W, h: H }), m), w), 0.02)));   // a thin outline
  const gapR = W - M - (R2.x + R2.w), rD = Math.min(cap * 0.5, gapR / 2 - 24), d1 = diamond(W - M - rD, b2 - cap / 2, rD);   // in the gap after the last line, clear of it
  const gapT = (W - M) - (R0.x + R0.w), t1 = tri(R0.x + R0.w + gapT / 2, b0 - cap / 2 - 6, Math.min(cap * 0.5, gapT * 0.38));
  const shapes = union(d1, t1), edge = ring(shapes, 3), inset = cut(shapes, alphaThr(blurred(edge, 10), 0.02));
  const Lo = levels(src, 0.05, 0.98), pattern = lumMask(Lo, pct(Lo, 0.5), { blur: 0.8 });
  draw(ink.g, union(edge, inter(pattern, inset)));
  draw(g, tint(cut(ink, head), C.type));
  // a piece of pale card taped on in the gap above the last line, holding the subline and furniture
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const cr = { x: M + COL * 4, y: ruleY[4] + 14, w: COL * 4 - 16, h: Math.round(ruleY[5] - ruleY[4] - 28), rot: 0 };
  card(g, cr, C.card, 54);
  const sub = balance('Nearly a century after a parasitic blight erased them, American chestnuts are being regrown across Appalachia from resistant seedlings.', { ...t, minW: 200, maxW: COL * 2.2 });
  block(g, sub.lines, cr.x + 16, cr.y + 40, t);
  block(g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], cr.x + cr.w - 16, cr.y + 40, { ...t, align: 'right' });
  // the after-image: "remembers" again, a hair out of register, faint
  const echo = canvas(); place(echo, L1, { right: W - M + 3, top: b1 - base(L1) - 2 });
  printAll(g, C, { seed: 549 });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 59, wear: HS.ink.wear, spread: HS.ink.spread });
  stock(g, C.stock, 549);
  // tape: a long strip down a grid line, and two short pieces holding the card's top corners
  tape(g, { x: M + COL * 2 - 22, y: -30, w: 44, h: H + 60 }, C.tape, 1, { alpha: 0.55 });
  tape(g, { x: cr.x - 44, y: cr.y - 20, w: 100, h: 30, rot: -0.62 }, C.tape, 2);
  tape(g, { x: cr.x + cr.w - 56, y: cr.y - 20, w: 100, h: 30, rot: 0.55 }, C.tape, 3);
  scan(g, 549);
  return out;
};
