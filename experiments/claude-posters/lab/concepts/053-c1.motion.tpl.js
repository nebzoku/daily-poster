// No. 053 · Concept 1, moving · "CATCH MERCURY / BEFORE SUNRISE" · dawn coming up.
// Over the loop the dawn comes up and goes again: the glow bars thicken and climb towards the stars, the stars drift
// a little, Mercury rises a few pixels above the horizon, and the light moves across the lime foil of the headline,
// so the foil catches and loses the light like a real foiled sheet tilted in the hand.
window.MOTION = async () => {
  const C = __CW__;
  const D = 'Six Caps', T = 'Work Sans';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const plate = await media('media/2026-11-24/image-06-2160.jpg');
  seed(5311);
  const HS = inkSafe(['CATCH MERCURY', 'BEFORE SUNRISE'], { font: D, weight: 400, size: 300, gap: 30, minGap: 10, word: 0.12 }, W - 2 * M, { preset: 'letterpress', wear: 0.2, spread: 0.2 });
  const head = canvas(); pinBlocks(head, spreadWords(HS.lines, W - 2 * M), ['L', 'L'], 1, 0.1);
  const hz = M + ROW * 6, sky0 = M + ROW * 2 + 72, gy = M + ROW * 2;
  const t0 = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  const sub = balance('Mercury reached greatest western elongation on 20 November, giving a rare window to spot the smallest planet.', { ...t0, minW: 220, maxW: COL * 2.8 });
  const box = cell(5, 3, 1, 1);
  const clearR = union(rectMask({ x: M + COL * 5 - 8, y: M + ROW * 6 - 40, w: COL * 3, h: 40 }), rectMask({ x: M + COL * 5 - 8, y: M + ROW * 3 - 36, w: COL * 1.5, h: 36 }));
  return async (t) => {
    seed(5311);
    const out = canvas(), g = out.g;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const s = 0.5 - 0.5 * Math.cos(2 * Math.PI * t), e = smooth(0, 1, s);
    // the glow climbs as the dawn comes up
    const bars = canvas(); bars.g.fillStyle = '#fff';
    const glowTop = M + ROW * 2.5 - ROW * 0.5 * e, power = 1.6 - 0.7 * e;
    for (let y = hz - 16; y >= glowTop; y -= 16) { const k = Math.pow((y - glowTop) / (hz - glowTop), power); const th = Math.max(1, Math.round(k * 16)); bars.g.fillRect(0, y + 16 - th, W, th); }
    const src = canvas(); cover(src.g, plate, { x: 0, y: 0, w: W, h: H }, { crop: [0.08 + 0.025 * e, 0.06 + 0.012 * e, 0.6, 0.6] });
    const stars = cut(inter(lumMask(levels(src, 0.4, 0.999), pct(src, 0.965), { blur: 0.6, soft: 0.06 }), rectMask({ x: 0, y: sky0, w: W, h: hz - sky0 })), clearR);
    draw(g, press(bars, C.mid, 'clean', { wear: 0.1, spread: 0.35, seed: 3 }));
    draw(g, tint(cut(stars, bars), C.mid2)); draw(g, tint(inter(stars, bars), C.bg));
    draw(g, tint(circleMask(M + COL * 5 + 48, M + ROW * 3 + 112 - 36 * e, 10), C.dot));
    g.save(); g.strokeStyle = C.dot; g.lineWidth = 2; g.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2); g.restore();
    block(g, ['(01) Mercury'], box.x, box.y - 8, { ...t0, anchor: 'bottom', color: C.dot });
    g.fillStyle = C.bg; g.fillRect(0, hz, W, H - hz);
    block(g, ['(02) The sun, below the horizon'], M + COL * 5, hz - 10, { ...t0, anchor: 'bottom', color: C.bg });
    block(g, sub.lines, M, gy, t0);
    block(g, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], W - M, gy, { ...t0, align: 'right' });
    pixels(g, M + COL * 4, gy, 8, ['#.#.#.', '.#.#.#'], C.mid);
    printAll(g, C, { seed: 531 });
    printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 53, light: 0.1 + 0.8 * e });
    stock(g, C.stock, 53);
    return out;
  };
};
