// Renders the pictures the Instagram account posts, as 1080 × 1350 JPEGs in site/media/ig:
//   brief-<date>-1..3.jpg   today's brief as a carousel, one headline per card
//   <poster>.jpg       each waiting poster, centred on black
// Instagram's API only takes JPEGs between 4:5 and 1.91:1, so these are 4:5 rather than 3:4.
//
//   node scripts/instagram/images.mjs --list   prints how many pictures are missing
//   node scripts/instagram/images.mjs          renders them (needs Playwright's Chromium)
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, IG_DIR, readJSON, loadState, writeJSON, STATE, londonDate, pendingPosters, posterImage, briefImages, SITE } from "./common.mjs";

const W = 1080, H = 1350;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(3, "0");
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

// Fonts: Google's by default; IG_FONTS_CSS can point at local copies (for previews offline).
const FONTS = process.env.IG_FONTS_CSS || "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400&family=Geist+Mono:wght@400;500&display=block";

// Today's brief as a carousel: three cards, one headline each, laid out like the homepage on a
// phone. The pictures are placed across one long strip (three cards wide) and some cross the
// joins, so they carry on from one card to the next as you swipe.
// Fixed frames (pictures are cropped to fill them), along the top and bottom of the strip.
// Two cross the first join and one the second, so the strip reads as one piece when swiped.
const STRIP = [
  { x: 70, w: 220, h: 290, top: 1 }, { x: 880, w: 330, h: 330, top: 1, obj: 1 }, { x: 1520, w: 260, h: 200, top: 1 },
  { x: 2040, w: 240, h: 310, top: 1 }, { x: 2860, w: 300, h: 230, top: 1 },
  { x: 120, w: 260, h: 330, top: 0 }, { x: 980, w: 240, h: 200, top: 0 }, { x: 1600, w: 300, h: 300, top: 0 },
  { x: 2560, w: 230, h: 300, top: 0 },
];
function briefStrip(brief, pictures) {
  const d = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(brief.date + "T12:00:00Z"));
  const imgs = STRIP.map((s) => {
    const src = s.obj ? pictures.object : pictures.images.shift();
    if (!src) return "";
    return `<img class="${s.obj ? "obj" : ""}" src="${esc(src)}" style="left:${s.x}px;${s.top ? "top" : "bottom"}:40px;width:${s.w}px;height:${s.h}px">`;
  }).join("\n");
  const cards = brief.headlines.slice(0, 3).map((h, i) => `
<section style="left:${i * W}px">
  <div class="m k"><i class="dot"></i>Today's headlines</div>
  <div class="m meta">No. ${pad(brief.issue)} · ${esc(d)} · ${esc(brief.story.source)}</div>
  <h1 class="fit">${esc(h)}</h1>
  <div class="m count">${[1, 2, 3].map((n) => `<span${n === i + 1 ? ' class="on"' : ""}>0${n}</span>`).join("")}</div>
</section>`).join("");
  return `<!doctype html><html><head><link rel="stylesheet" href="${esc(FONTS)}">
<style>
html,body{margin:0;width:${W * 3}px;height:${H}px;background:#fff;color:#111;overflow:hidden}
img{position:absolute;display:block;object-fit:cover}
img.obj{background:#f2f2f0;object-fit:contain}
section{position:absolute;top:370px;bottom:370px;width:${W}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.m{font-family:'Geist Mono',monospace;font-size:22px;font-weight:500;letter-spacing:.02em;text-transform:uppercase}
.k{display:inline-flex;align-items:center;gap:12px}
.dot{width:13px;height:13px;border-radius:50%;background:${brief.palette.colours[0]}}
.meta{color:#8a8a86;margin-top:12px;line-height:1.2}
h1{font-family:'EB Garamond',serif;font-weight:400;font-size:132px;line-height:1.02;letter-spacing:-.015em;margin:34px 0 0;max-width:900px;text-wrap:balance}
.count{line-height:1.2;display:flex;gap:18px;color:#c9c9c5}
.count .on{color:#111}
</style></head><body>
${imgs}
${cards}
<script>
// One size for all three headlines, set by the longest. Two lines where possible; if any
// needs three, all go to three. Then the counter sits as far below the headline as the
// labels sit above it (measured on the letters, not the boxes).
Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => i.onload = i.onerror = r))]).then(() => {
  [...document.images].forEach(i => { if (!i.naturalWidth) i.remove(); });
  const hs = [...document.querySelectorAll('h1.fit')], LH = 1.02, MAXW = 900, OPTICAL = 18; // extra space below, so the gaps look equal
  const lines = (h) => Math.round(h.getBoundingClientRect().height / (parseFloat(h.style.fontSize) * LH));
  const fits = (h) => h.parentElement.scrollHeight <= h.parentElement.clientHeight && h.scrollWidth <= h.clientWidth;
  const setAll = (px) => hs.forEach(h => { h.style.fontSize = px + 'px'; h.style.maxWidth = MAXW + 'px'; });
  let size = 0, n = 2;
  for (n of [2, 3]) {
    for (let px = 132; px >= (n === 2 ? 84 : 56); px -= 2) { setAll(px); if (hs.every(h => lines(h) <= n && fits(h))) { size = px; break; } }
    if (size) break;
  }
  if (!size) { size = 56; setAll(size); }
  const most = Math.max(...hs.map(lines));
  hs.forEach(h => { let w = MAXW; while (lines(h) < most && w > 360) { w -= 10; h.style.maxWidth = w + 'px'; } });
  const m = document.createElement('canvas').getContext('2d');
  const metric = (font) => { m.font = font; const t = m.measureText('H'); return { a: t.fontBoundingBoxAscent, d: t.fontBoundingBoxDescent, cap: t.actualBoundingBoxAscent }; };
  const g = metric("400 " + size + "px 'EB Garamond'"), mono = metric("500 22px 'Geist Mono'");
  const lead = (lh, f) => (lh - (f.a + f.d)) / 2;
  const glh = size * LH, mlh = parseFloat(getComputedStyle(document.querySelector('.meta')).lineHeight) || 22 * 1.2;
  document.querySelectorAll('section').forEach(sec => {
    const meta = sec.querySelector('.meta').getBoundingClientRect(), h = sec.querySelector('h1').getBoundingClientRect(), c = sec.querySelector('.count');
    const metaBase = meta.bottom - lead(mlh, mono) - mono.d;
    const capTop = h.top + lead(glh, g) + g.a - g.cap;
    const base = h.bottom - lead(glh, g) - g.d;
    const gap = capTop - metaBase;
    const countInk = lead(mlh, mono) + mono.a - mono.cap;
    c.style.marginTop = Math.round(gap - (h.bottom - base) - countInk + OPTICAL) + 'px';
  });
  document.body.dataset.ready = 1; });
</script></body></html>`;
}

// Posters on plain black, nothing else: the poster may carry its own date and number.
function mockup(posterUrl) {
  const ph = H - 88, pw = Math.round(ph / 1.41481), px = Math.round((W - pw) / 2);   // 44 px above and below
  return `<!doctype html><html><head><style>
html,body{margin:0;width:${W}px;height:${H}px;background:#000;overflow:hidden}
img{position:absolute;left:${px}px;top:44px;width:${pw}px;height:${ph}px;object-fit:cover;object-position:50% 0}
</style></head><body><img src="${esc(posterUrl)}">
<script>const i = document.images[0]; (i.complete ? Promise.resolve() : new Promise(r => i.onload = i.onerror = r)).then(() => document.body.dataset.ready = 1);</script>
</body></html>`;
}

// The day's pictures for the brief card: local copies where we have them, else the thumbnails.
function picturesFor(brief) {
  const images = (brief.images || []).map((im) => (im.local ? "file://" + join(SITE, im.local) : im.thumb)).filter(Boolean);
  const objs = brief.objects || [];
  const o = objs.length ? objs[(brief.issue || 0) % objs.length] : null;
  return { images, object: o ? "file://" + join(SITE, o.thumb) : null };
}

async function todo(state) {
  const latest = await readJSON(join(DATA, "latest.json"), null);
  const jobs = [];
  if (latest && latest.date === londonDate() && !briefImages(latest.date).every((f) => existsSync(f))) jobs.push({ kind: "brief", brief: latest, out: briefImages(latest.date) });
  // Posters waiting now, plus today's (they go out tomorrow).
  const waiting = [...await pendingPosters(state, "9999-12-31")];
  for (const p of waiting) {
    if (existsSync(posterImage(p))) continue;
    jobs.push({ kind: "poster", poster: p, out: posterImage(p) });
  }
  return jobs;
}

async function main() {
  if (!process.env.INSTAGRAM_TOKEN && !process.env.FORCE_IG) { console.log(process.argv.includes("--list") ? 0 : "Instagram isn't set up; nothing to render."); return; }
  const state = await loadState();
  // The first time it runs, posting begins today: yesterday's posters onwards.
  const fresh = !state.start;
  state.start ??= londonDate();
  const jobs = await todo(state);
  if (process.argv.includes("--list")) { console.log(jobs.length); return; }
  if (fresh) { await mkdir(join(STATE, ".."), { recursive: true }); await writeJSON(STATE, state); }
  await mkdir(IG_DIR, { recursive: true });
  if (jobs.length) {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    for (const j of jobs) {
      const html = j.kind === "brief" ? briefStrip(j.brief, picturesFor(j.brief)) : mockup("file://" + join(SITE, j.poster.image));
      const file = join("/tmp", `ig-${Date.now()}.html`);
      await writeFile(file, html);
      await page.setViewportSize({ width: j.kind === "brief" ? W * 3 : W, height: H });
      await page.goto("file://" + file);
      await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 });
      // The brief strip is cut into its three cards.
      const outs = [].concat(j.out);
      for (const [n, out] of outs.entries()) {
        await page.screenshot({ path: out, type: "jpeg", quality: 92, clip: { x: n * W, y: 0, width: W, height: H } });
        console.log(`Rendered ${out.slice(SITE.length + 1)}`);
      }
    }
    await browser.close();
  }
  // Clear out pictures a week after they've gone out: briefs by date, posters once posted.
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const done = new Set(Object.entries(state.posted).filter(([, v]) => v.at < weekAgo).map(([k]) => k));
  for (const f of await readdir(IG_DIR)) {
    const m = f.match(/^brief-(\d{4}-\d{2}-\d{2})-\d\.jpg$/);
    const old = m ? m[1] < weekAgo.slice(0, 10) : [...done].some((k) => k.startsWith("poster:") && f === k.split("/").pop().replace(/\.[a-z]+$/i, "") + ".jpg");
    if (old) await rm(join(IG_DIR, f));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
