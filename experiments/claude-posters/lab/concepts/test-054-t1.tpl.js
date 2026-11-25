// Test (Round 19 guidance) · "The forest / remembers / its giant" · Gloock sentence case, ledger lines, type only.
// Story: the chestnut was the giant of the eastern forests, gone for a century, now coming back.
// Move: Vinho Verde ledger: big words one per line, each on a hairline rule, alternating indents, small engraved
//   ornaments in the gaps, a tiny note in a corner. Type, ink and paper only.
// The one subtle change: "giant" is too big for the sheet: its last letter runs off the right edge.
// Ornaments: cut from the brief's 1892 Lockwood de Forest gilt cutout (leaf scrolls), thresholded.
// Finish and paper: letterpress on uncoated, tone on a lime-yellow ground.
window.POSTER = async () => {
  const C = __CW__;
  seed(5491);
  const D = 'Gloock', T = 'Schibsted Grotesk';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const orn = await media('media/2026-11-25/image-07-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const HS = inkSafe(['The forest', 'remembers', 'its giant'], { font: D, weight: 400, size: 240, gap: 22, minGap: 8, word: 0.2 }, W - 2 * M, { preset: 'letterpress', wear: 0.15, spread: 0.15 });
  const [L0, L1, L2] = HS.lines, base = (t) => t.base - t.box.y;
  const H1 = setOptical('H', { ...HS.o, size: HS.size }), cap = H1.base - H1.box.y;
  const head = canvas();
  // first line: cap height on the top margin, left; last line: descender on the bottom margin, run off the right edge
  const b0 = M + cap, b2 = H - M - (L2.box.h - base(L2)), b1 = Math.round((b0 + b2) / 2);   // on the middle rule
  const R0 = place(head, L0, { left: M, top: b0 - base(L0) });
  const R1 = place(head, L1, { right: W - M, top: b1 - base(L1) });
  const tW = setOptical('t', { ...HS.o, size: HS.size }).box.w;
  const R2 = place(head, L2, { right: W + tW * 0.45, top: b2 - base(L2) });
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
  const rD = cap * 0.62, d1 = diamond(M + rD, b2 - cap / 2, rD);
  const gapT = (W - M) - (R0.x + R0.w), t1 = tri(R0.x + R0.w + gapT / 2, b0 - cap / 2 - 6, Math.min(cap * 0.5, gapT * 0.38));
  const shapes = union(d1, t1), edge = ring(shapes, 3), inset = cut(shapes, alphaThr(blurred(edge, 10), 0.02));
  const Lo = levels(src, 0.05, 0.98), pattern = lumMask(Lo, pct(Lo, 0.5), { blur: 0.8 });
  draw(ink.g, union(edge, inter(pattern, inset)));
  draw(g, tint(cut(ink, head), C.type));
  // the small type: subline in the gap left of the middle line's indent, furniture bottom left of the last line
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const sub = balance('Nearly a century after a parasitic blight erased them, American chestnuts are being regrown across Appalachia from resistant seedlings.', { ...t, minW: 200, maxW: COL * 2.4 });
  block(g, sub.lines, M, ruleY[1] - 10, { ...t, anchor: 'bottom' });
  block(g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, ruleY[5] - 10, { ...t, align: 'right', anchor: 'bottom' });
  printAll(g, C, { seed: 549 });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 59, wear: HS.ink.wear, spread: HS.ink.spread });
  stock(g, C.stock, 549);
  return out;
};
