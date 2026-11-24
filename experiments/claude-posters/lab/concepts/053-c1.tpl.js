// No. 053 · Concept 1 · "CATCH MERCURY / BEFORE SUNRISE" · Six Caps, all caps (condensed), top and bottom blocks.
// Story: Mercury, the smallest and hardest planet to see, has swung far enough from the sun that this week you can
//   catch it low in the east just before dawn.
// Everyday thing: the pre-dawn sky, a dark field of stars over a hard black horizon that starts to glow.
// Visual idea: the sky as horizontal bars that thicken towards the horizon (the glow before sunrise), the real
//   star plate thresholded through the dark sky above, one bright dot (Mercury) boxed and labelled on the grid just
//   above the glow, and the sun's place marked below the horizon. The slender condensed caps are the thin sliver.
// Image: the brief's 1885 Cygnus star plate (The Met), thresholded to its stars: real stars, not drawn ones.
// Finish and paper: foil-colour (a pale mint foil, from the palette) on smooth stock: dawn light catching on foil,
//   crisp and clean, nothing rough about a clear sky.
// Mood check: calm, clear, a little anticipation; dark but not sinister because the bottom third is glowing.
window.POSTER = async () => {
  const C = __CW__;
  seed(5311);
  const D = 'Six Caps', T = 'Work Sans';
  await fonts([`400 100px "${D}"`, `500 16px "${T}"`]);
  const plate = await media('media/2026-11-24/image-06-2160.jpg');
  const out = canvas(), g = out.g;
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  snap('bg', out);

  // headline: two lines, one size, top block on the top margin, bottom block on the bottom margin
  const HS = inkSafe(['CATCH MERCURY', 'BEFORE SUNRISE'], { font: D, weight: 400, size: 300, gap: 30, minGap: 10, word: 0.12 }, W - 2 * M, { preset: 'letterpress', wear: 0.2, spread: 0.2 });
  // both lines run margin to margin, so the four words sit in the four corners (round 14)
  const head = canvas(); const R = pinBlocks(head, spreadWords(HS.lines, W - 2 * M), ['L', 'L'], 1, 0.1);

  // the horizon: a hard edge on a grid line; ground below it is the background
  const hz = M + ROW * 6;
  const sky0 = M + ROW * 2 + 72;                     // the sky starts under the subline block
  // bars: 16px pitch, thickness ramps from a hairline to solid at the horizon
  const bars = canvas(), bg2 = bars.g; bg2.fillStyle = '#fff';
  const glowTop = M + ROW * 2.5;
  for (let y = hz - 16; y >= glowTop; y -= 16) {
    const t = Math.pow((y - glowTop) / (hz - glowTop), 1.6);
    const th = Math.max(1, Math.round(t * 16));
    bg2.fillRect(0, y + 16 - th, W, th);
  }
  // the star plate, thresholded to its stars, in the sky above the glow
  const src = canvas(); cover(src.g, plate, { x: 0, y: 0, w: W, h: H }, { crop: [0.08, 0.06, 0.6, 0.6] });
  const stars0 = inter(lumMask(levels(src, 0.4, 0.999), pct(src, 0.965), { blur: 0.6, soft: 0.06 }), rectMask({ x: 0, y: sky0, w: W, h: hz - sky0 }));
  // keep the labels clear of stars
  const clearR = union(rectMask({ x: M + COL * 5 - 8, y: M + ROW * 6 - 40, w: COL * 3, h: 40 }), rectMask({ x: M + COL * 5 - 8, y: M + ROW * 3 - 36, w: COL * 1.5, h: 36 }));
  const stars = cut(stars0, clearR), starsHi = cut(stars, bars);
  // Mercury: a small bright dot above the glow, sitting on a grid line
  const mx = M + COL * 5 + 48, my = M + ROW * 3 + 112;
  const merc = circleMask(mx, my, 10);
  draw(g, press(bars, C.mid, 'clean', { wear: 0.1, spread: 0.35, seed: 3 }));
  snap('shape-bars', out);
  if (CAPTURE) { const p = canvas(); draw(p.g, out); draw(p.g, inter(tone(levels(src, 0.05, 0.99), [C.bg, C.mid2]), rectMask({ x: 0, y: sky0, w: W, h: hz - sky0 }))); snap('place-plate', p); }
  draw(g, tint(starsHi, C.mid2));
  // overprint: where the stars cross the bars, they knock to the background
  draw(g, tint(inter(stars, bars), C.bg));
  snap('step-stars-1', out);
  draw(g, tint(merc, C.dot));
  // box and labels on the grid
  const box = cell(5, 3, 1, 1);
  g.save(); g.strokeStyle = C.dot; g.lineWidth = 2; g.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2); g.restore();
  const t = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text };
  snap('shape-mercury', out);
  block(g, ['(01) Mercury'], box.x, box.y - 8, { ...t, anchor: 'bottom', color: C.dot });
  snap('text-mercury', out);
  // ground
  g.fillStyle = C.bg; g.fillRect(0, hz, W, H - hz);
  snap('shape-ground', out);
  block(g, ['(02) The sun, below the horizon'], M + COL * 5, hz - 10, { ...t, anchor: 'bottom', color: C.bg });
  snap('text-sun', out);
  // subline and furniture in the dark sky under the top block, cap heights on a grid line
  const sub = balance('Mercury reached greatest western elongation on 20 November, giving a rare window to spot the smallest planet.', { ...t, minW: 220, maxW: COL * 2.8 });
  const gy = M + ROW * 2;
  block(g, sub.lines, M, gy, t);
  snap('text-sub', out);
  block(g, ['(Daily Poster)', '(No. 053)', '(Tuesday 24 November)', '(The Guardian)'], W - M, gy, { ...t, align: 'right' });
  snap('text-furniture', out);
  pixels(g, M + COL * 4, gy, 8, ['#.#.#.', '.#.#.#'], C.mid);
  snap('place-pixels', out);   // a little mark, dragged in, not set in a text box
  snapLines(tint(head, C.type), R);
  // foil trials: the same foil under different light, before the one kept
  inkTrials(out, (gg, k) => { printAll(gg, C, { seed: 531 }); printHead(gg, head, C.type, C.finish, { bg: C.bg, seed: 53, light: Math.min(0.95, 0.15 + (k - 0.35) * 0.55) }); });
  // the sheet printed crisp around the foil (round 14), then the headline foiled, then the paper
  printAll(g, C, { seed: 531 });
  printHead(g, head, C.type, C.finish, { bg: C.bg, seed: 53 });
  snap('printed', out);
  stock(g, C.stock, 53);
  snap('final', out);
  return out;
};
