// Renders the pictures the Instagram account posts, as 1080 × 1350 JPEGs in site/media/ig:
//   brief-<date>.jpg   today's brief as a card, laid out like the homepage
//   <poster>.jpg       each waiting poster, centred on black
// Instagram's API only takes JPEGs between 4:5 and 1.91:1, so these are 4:5 rather than 3:4.
//
//   node scripts/instagram/images.mjs --list   prints how many pictures are missing
//   node scripts/instagram/images.mjs          renders them (needs Playwright's Chromium)
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, IG_DIR, readJSON, loadState, writeJSON, STATE, londonDate, pendingPosters, posterImage, briefImage, SITE } from "./common.mjs";

const W = 1080, H = 1350;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(3, "0");
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

// Fonts: Google's by default; IG_FONTS_CSS can point at local copies (for previews offline).
const FONTS = process.env.IG_FONTS_CSS || "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400&family=Geist+Mono:wght@400;500&display=block";

// Today's brief, laid out like the homepage: the kicker, the headline in EB Garamond, the
// day's images and one 3D render arranged around it, on white.
const AROUND = [
  { x: 6, y: 5, w: 190 }, { x: 37, y: 3, w: 120 }, { x: 70, y: 4, w: 230, obj: 1 }, { x: 85, y: 33, w: 130 },
  { x: 2, y: 31, w: 125 }, { x: 7, y: 70, w: 205 }, { x: 42, y: 82, w: 125 }, { x: 72, y: 68, w: 190 },
];
function briefCard(brief, pictures) {
  const d = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(brief.date + "T12:00:00Z"));
  const imgs = AROUND.map((s, i) => {
    const src = s.obj ? pictures.object : pictures.images.shift();
    if (!src) return "";
    return `<img class="${s.obj ? "obj" : ""}" src="${esc(src)}" style="left:${s.x}%;top:${s.y}%;width:${s.w}px">`;
  }).join("\n");
  return `<!doctype html><html><head><link rel="stylesheet" href="${esc(FONTS)}">
<style>
html,body{margin:0;width:${W}px;height:${H}px;background:#fff;color:#111;overflow:hidden}
img{position:absolute;display:block;height:auto}
img.obj{background:#f2f2f0}
.mid{position:absolute;left:150px;right:150px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.m{font-family:'Geist Mono',monospace;font-size:20px;font-weight:500;letter-spacing:.02em;text-transform:uppercase}
.k{display:inline-flex;align-items:center;gap:12px}
.dot{width:12px;height:12px;border-radius:50%;background:${brief.palette.colours[0]}}
.meta{color:#8a8a86;margin-top:12px}
h1{font-family:'EB Garamond',serif;font-weight:400;font-size:88px;line-height:1.08;letter-spacing:-.012em;margin:40px 0 0;max-width:13ch;text-wrap:balance}
.url{position:absolute;left:0;right:0;bottom:44px;text-align:center}
</style></head><body>
${imgs}
<div class="mid">
  <div class="m k"><i class="dot"></i>Today's headlines</div>
  <div class="m meta">No. ${pad(brief.issue)} · ${esc(d)} · ${esc(brief.story.source)}</div>
  <h1>${esc(brief.headlines[0])}</h1>
</div>
<div class="m url">dailyposter.design</div>
<script>Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => i.onload = i.onerror = r))])
  .then(() => { [...document.images].forEach(i => { if (!i.naturalWidth) i.remove(); }); document.body.dataset.ready = 1; });</script>
</body></html>`;
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
  if (latest && latest.date === londonDate() && !existsSync(briefImage(latest.date))) jobs.push({ kind: "brief", brief: latest, out: briefImage(latest.date) });
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
      const html = j.kind === "brief" ? briefCard(j.brief, picturesFor(j.brief)) : mockup("file://" + join(SITE, j.poster.image));
      const file = join("/tmp", `ig-${Date.now()}.html`);
      await writeFile(file, html);
      await page.goto("file://" + file);
      await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 30000 });
      await page.screenshot({ path: j.out, type: "jpeg", quality: 92 });
      console.log(`Rendered ${j.out.slice(SITE.length + 1)}`);
    }
    await browser.close();
  }
  // Clear out pictures a week after they've gone out: briefs by date, posters once posted.
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const done = new Set(Object.entries(state.posted).filter(([, v]) => v.at < weekAgo).map(([k]) => k));
  for (const f of await readdir(IG_DIR)) {
    const m = f.match(/^brief-(\d{4}-\d{2}-\d{2})\.jpg$/);
    const old = m ? m[1] < weekAgo.slice(0, 10) : [...done].some((k) => k.startsWith("poster:") && f === k.split("/").pop().replace(/\.[a-z]+$/i, "") + ".jpg");
    if (old) await rm(join(IG_DIR, f));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
