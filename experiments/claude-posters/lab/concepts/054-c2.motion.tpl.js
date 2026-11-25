// No. 054 · Concept 2, moving · "BACK FROM / FUNCTIONAL / EXTINCTION" · the letters coming back.
// The headline holds, then its letters scatter across the sheet and come back one by one, landing in place: the
// species reassembling ("back from extinction"). Each letter flies on its own eased path with its own delay and a
// little turn; the burr, box and small type hold still. Letters still flip colour (XOR) where they cross the burr,
// and the small type flips where a flying letter passes over it, so it always reads.
window.MOTION = async () => {
  const C = __CW__;
  const D = 'Schibsted Grotesk', T = 'Schibsted Grotesk';
  await fonts([`900 100px "${D}"`, `500 16px "${T}"`]);
  const obj = trim(await media('media/2026-11-25/object-1.png'));
  seed(5421);
  const HS = inkSafe(['BACK FROM', 'FUNCTIONAL', 'EXTINCTION'], { font: D, weight: 900, size: 200, gap: 16, minGap: 8, word: 0.26 }, W - 2 * M, { preset: 'screen', wear: 0.2, spread: 0.2 });
  const lines = spreadWords(HS.lines, W - 2 * M, { maxShort: 0.2 });
  const head = canvas(); pinBlocks(head, lines, ['L', 'L', 'L'], 1, 0.1);
  // split the set headline into its letters (each cap is one connected shape)
  const w = head.width, h = head.height, d = head.g.getImageData(0, 0, w, h).data, lab = new Int32Array(w * h).fill(-1), letters = [];
  for (let i = 0; i < w * h; i++) {
    if (lab[i] >= 0 || d[i * 4 + 3] < 20) continue;
    const st = [i], comp = []; lab[i] = letters.length; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    while (st.length) { const p = st.pop(); comp.push(p); const x = p % w, y = (p / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const q of [p - 1, p + 1, p - w, p + w]) { if (q < 0 || q >= w * h || lab[q] >= 0 || d[q * 4 + 3] < 20) continue; if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue; lab[q] = letters.length; st.push(q); } }
    if (comp.length < 200 * K * K) { comp.forEach((p) => { lab[p] = -2; }); continue; }
    const c = document.createElement('canvas'); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1; const cg = c.getContext('2d'), id = cg.createImageData(c.width, c.height);
    const me = letters.length; comp.forEach((p) => { const x = p % w - x0, y = ((p / w) | 0) - y0, o = (y * c.width + x) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = 255; id.data[o + 3] = d[p * 4 + 3]; });
    // antialiased edge pixels below the threshold join their letter
    cg.putImageData(id, 0, 0);
    letters.push({ c, x: x0 / K, y: y0 / K, w: c.width / K, h: c.height / K, id: me });
  }
  // where each letter flies to (kept on the sheet), its delay and turn
  seed(77);
  letters.forEach((L) => { L.tx = M + rand() * (W - 2 * M - L.w) - L.x; L.ty = M + ROW * 0.5 + rand() * (H - ROW - 2 * M - L.h) - L.y; L.rot = (rand() - 0.5) * 1.4; L.out = rand() * 0.08; L.back = rand() * 0.16; });
  const box = cell(1, 1, 7, 4);
  const crop = document.createElement('canvas'); const cw = obj.width * 0.37, ch = obj.height * 0.37;
  crop.width = cw; crop.height = ch; crop.getContext('2d').drawImage(obj, 0, 0);
  crop.getContext('2d').clearRect(obj.width * 0.25, obj.height * 0.3, cw, ch);
  const bc = canvas(); fit(bc.g, crop, { x: W / 2 - 500, y: 450 - 500, w: 1000, h: 1000 }, { rot: Math.PI - 0.06 });
  const burr = lumMask(bc, 0, { soft: 0.001, blur: 1 }), toned = inter(tone(levels(bc, 0.02, 0.98), C.tones), burr);
  const t0 = { font: T, size: 16, weight: 500, lead: 0.9, color: C.text }, yb = M + ROW * 6;
  const sub = balance('New techniques are producing chestnut trees that can survive the fungus which once felled billions of stems across eastern forests.', { ...t0, minW: 220, maxW: COL * 2.6 });
  const smallM = canvas();
  block(smallM.g, sub.lines, box.x, yb, { ...t0, color: '#fff', anchor: 'bottom' });
  block(smallM.g, ['(Daily Poster)', '(No. 054)', '(Wednesday 25 November)', '(The Guardian)'], W - M, yb, { ...t0, color: '#fff', align: 'right', anchor: 'bottom' });
  block(smallM.g, ['(01) Chestnut burr, the husk that holds the nuts'], box.x + box.w, box.y + box.h + 16, { ...t0, color: '#fff', align: 'right' });
  return async (t) => {
    seed(5421);
    const out = canvas(), g = out.g;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = C.box; g.fillRect(box.x, box.y, box.w, box.h);
    draw(g, toned);
    // the headline this frame: set (t < 0.3), scattering (0.3–0.45), scattered, flying back one by one (0.55–0.9), set
    const hd = canvas();
    for (const L of letters) {
      const a = smooth(0.3 + L.out, 0.42 + L.out, t), b = smooth(0.55 + L.back, 0.72 + L.back, t), k = a * (1 - b);
      hd.g.save(); hd.g.translate(L.x + L.w / 2 + L.tx * k, L.y + L.h / 2 + L.ty * k); hd.g.rotate(L.rot * k);
      hd.g.drawImage(L.c, -L.w / 2, -L.h / 2, L.w, L.h); hd.g.restore();
    }
    const over = union(burr, hd);
    draw(g, tint(cut(smallM, over), C.text)); draw(g, tint(inter(cut(smallM, hd), burr), C.knock)); draw(g, tint(inter(smallM, hd), C.bg));
    asterisk(g, box.x + 8, box.y + box.h + 22, 8, C.text);
    const inB = inter(hd, burr), outB = cut(hd, burr);
    printAll(g, C, { seed: 542, shapes: [burr] });
    printHead(g, outB, C.type, C.finish, { bg: C.bg, seed: 57, wear: HS.ink.wear, spread: HS.ink.spread });
    printHead(g, inB, C.knock, C.finish, { bg: C.box, seed: 58, wear: HS.ink.wear, spread: HS.ink.spread });
    stock(g, C.stock, 542);
    return out;
  };
};
