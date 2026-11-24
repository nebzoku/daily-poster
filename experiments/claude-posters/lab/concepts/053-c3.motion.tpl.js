// No. 053 · Concept 3, moving · "CHASING / LIGHT / NEAR / THE SUN"
// The still poster set in motion, a loop (t runs 0 → 1):
//   - the headline breathes: LIGHT and NEAR (the lines short enough to move properly) open their tracking out to the full width and close back to the
//     hourglass (the "Never the first choice" move), so the type goes from hourglass to solid block and back
//   - the telescope swings a few degrees on its stand; the pixel grid stays fixed to the page, so its stepped edge
//     re-forms every frame
//   - one square in the row of 88 lights up and runs along it: Mercury going round its 88-day year once a loop
// Printed frame by frame at 12 fps like stop-motion, with the same paper and ink seed every frame so only what moves
// changes. Render: FRAMES=48 K=1 node render.mjs posters/<name>.js, then python3 motion.py <name>.
window.MOTION = async () => {
  const C = __CW__;
  const D = 'Work Sans', T = 'Work Sans';
  await fonts([`800 100px "${D}"`, `500 16px "${T}"`]);
  const scope = trim(await media('media/2026-11-24/object-1.png'));
  const TEXTS = ['CHASING', 'LIGHT', 'NEAR', 'THE SUN'];
  seed(5331);
  const HS = inkSafe(TEXTS, { font: D, weight: 800, size: 200, gap: 18, minGap: 8, word: 0.26 }, W - 2 * M, { preset: 'copy', wear: 0.45, spread: 0.4 });
  const o = { ...HS.o, size: HS.size }, g0 = HS.gap;
  // for each line, the tracking that runs it margin to margin (never wider)
  const gMax = TEXTS.map((tx) => {
    let lo = g0, hi = g0 + 900;
    if (setOptical(tx, { ...o, gap: lo }).box.w >= W - 2 * M - 1) return g0;
    for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if (setOptical(tx, { ...o, gap: mid }).box.w > W - 2 * M) hi = mid; else lo = mid; }
    return lo;
  }).map((g, i) => (setOptical(TEXTS[i], { ...o, gap: g }).box.w - setOptical(TEXTS[i], { ...o, gap: g0 }).box.w > 0.1 * (W - 2 * M) ? g : g0));
  // (a line that would only open a few pixels stays still: a tiny move looks like a mistake)
  const t0 = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const sub = balance('Stargazers get a good chance this week to see Mercury, one of the most elusive planets, low in the sky.', { ...t0, minW: 220, maxW: COL * 2.6 });
  const Rstill = pinBlocks(canvas(), HS.lines, ['C', 'C', 'C', 'C'], 2, 0.1);   // the still layout fixes the small type's places
  const midTop = Rstill[1].y + Rstill[1].h, midBot = Rstill[2].y;
  const yTop = Math.ceil((midTop + 24 - M) / ROW) * ROW + M, yB = Math.floor((midBot - 24 - M) / ROW) * ROW + M;
  const n = 88, pitch = 11, sq = 8, rowW = (n - 1) * pitch + sq, x0 = Math.round((W - rowW) / 2);

  return async (t) => {
    seed(5331);
    const out = canvas(), g = out.g;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    // the breath: tight (hourglass) → open (block) → tight, with a hold at each end
    const u = smooth(0.15, 0.85, 0.5 - 0.5 * Math.cos(2 * Math.PI * t));
    const lines = TEXTS.map((tx, i) => setOptical(tx, { ...o, gap: g0 + (gMax[i] - g0) * u }));
    const head = canvas(); pinBlocks(head, lines, ['C', 'C', 'C', 'C'], 2, 0.1);
    // the telescope swings
    const sc = canvas(), S = W * 1.25;
    fit(sc.g, scope, { x: (W - S) / 2, y: (H - S) / 2, w: S, h: S }, { rot: -0.36 + 0.055 * Math.sin(2 * Math.PI * t) });
    const om = lumMask(sc, 0, { soft: 0.001, blur: 2 });
    const scopeMask = lumMask(pixelate(om, 24, ['#ffffff']), 0.5, { soft: 0.01 });
    const lv = levels(sc, 0.02, 0.98), shade = inter(lumMask(pixelate(lumMask(lv, 1 - pct(lv, 0.35), { invert: true }), 24, ['#ffffff']), 0.5, { soft: 0.01 }), scopeMask);
    draw(g, tint(scopeMask, C.scope)); draw(g, tint(shade, C.shade));
    const inScope = inter(head, scopeMask), outScope = cut(head, scopeMask);
    block(g, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], W - M, yTop, { ...t0, align: 'right' });
    // the 88 days, one of them lit, running along once a loop
    const lit = Math.floor(t * n) % n, sqM = canvas(), litM = canvas(); sqM.g.fillStyle = litM.g.fillStyle = '#fff';
    for (let i = 0; i < n; i++) (i === lit ? litM : sqM).g.fillRect(x0 + i * pitch, yB - sq - (i === lit ? 4 : 0), sq, sq + (i === lit ? 8 : 0));
    draw(g, tint(cut(sqM, scopeMask), C.squares)); draw(g, tint(inter(sqM, scopeMask), C.knock));
    draw(g, tint(litM, C.type));
    block(g, sub.lines, M, yB - sq - 16, { ...t0, anchor: 'bottom' });
    block(g, ['(88) Days in', 'a Mercury year'], W - M, yB - sq - 16, { ...t0, align: 'right', anchor: 'bottom' });
    printAll(g, C, { seed: 551 });
    printHead(g, outScope, C.type, C.finish, { bg: C.bg, seed: 55 });
    printHead(g, inScope, C.knock, C.finish, { bg: C.scope, seed: 56 });
    stock(g, C.stock, 55);
    return out;
  };
};
