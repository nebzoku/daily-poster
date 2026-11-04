// Renders the pictures the Instagram account posts, as 1080 × 1350 JPEGs in site/media/ig:
//   brief-<date>.jpg   today's brief as a card: the first headline in the day's display face
//   <poster>.jpg       each waiting poster in a 4:5 version of the mockup frame
// Instagram's API only takes JPEGs between 4:5 and 1.91:1, so these are 4:5 rather than 3:4.
//
//   node scripts/instagram/images.mjs --list   prints how many pictures are missing
//   node scripts/instagram/images.mjs          renders them (needs Playwright's Chromium)
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, IG_DIR, readJSON, loadState, writeJSON, STATE, londonDate, pendingPosters, posterImage, briefImage, variantFor, SITE } from "./common.mjs";

const W = 1080, H = 1350;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(3, "0");
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const MONO = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=block";

function briefCard(brief) {
  const main = brief.palette.colours[0], ink = lum(main) > 0.22 ? "#111111" : "#FFFFFF";
  const [, , , dark] = brief.palette.colours;
  return `<!doctype html><html><head><link rel="stylesheet" href="${MONO}"><link rel="stylesheet" href="${esc(brief.type.css)}">
<style>
html,body{margin:0;width:${W}px;height:${H}px;background:${main};color:${ink};overflow:hidden}
.m{font-family:'Geist Mono',monospace;font-size:24px;font-weight:500;letter-spacing:.04em;text-transform:uppercase}
.top,.bot{position:absolute;left:56px;right:56px;display:flex;justify-content:space-between;align-items:center}
.top{top:52px}.bot{bottom:52px}
.dot{display:inline-block;width:16px;height:16px;border-radius:50%;background:${dark};margin-right:14px;vertical-align:1px}
.hl{position:absolute;left:56px;right:56px;top:180px;bottom:180px;display:flex;align-items:center;margin:0;
  font-family:"${esc(brief.type.display)}",serif;font-weight:400;line-height:.98;letter-spacing:-.01em;text-wrap:balance}
</style></head><body>
<div class="top m"><span><i class="dot"></i>Daily Poster</span><span>No. ${pad(brief.issue)}</span></div>
<h1 class="hl" id="hl">${esc(brief.headlines[0])}</h1>
<div class="bot m"><span>Today's brief</span><span>dailyposter.design</span></div>
<script>
// Largest size that fits the box.
document.fonts.ready.then(() => { const h = document.getElementById('hl'); let s = 220;
  h.style.fontSize = s + 'px';
  while ((h.scrollHeight > h.clientHeight || h.scrollWidth > h.clientWidth) && s > 60) { s -= 4; h.style.fontSize = s + 'px'; }
  document.body.dataset.ready = 1; });
</script></body></html>`;
}

function mockup(poster, brief, variant, posterUrl) {
  const bg = variant === "colour" ? brief.palette.colours[3] : variant === "black" ? "#000000" : "#FFFFFF";
  const fg = variant === "white" ? "#111111" : "#FFFFFF";
  const ph = H - 88, pw = Math.round(ph / 1.41481), px = Math.round((W - pw) / 2);   // 44 px above and below
  const [y, m, d] = brief.date.split("-");
  return `<!doctype html><html><head><link rel="stylesheet" href="${MONO}">
<style>
html,body{margin:0;width:${W}px;height:${H}px;background:${bg};color:${fg};overflow:hidden}
img{position:absolute;left:${px}px;top:44px;width:${pw}px;height:${ph}px;object-fit:cover;object-position:50% 0}
.l{position:absolute;font-family:'Geist Mono',monospace;font-size:16px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;line-height:1;transform:translate(-50%,-50%)}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:${brief.palette.colours[0]};margin-right:10px;vertical-align:0}
</style></head><body>
<img src="${esc(posterUrl)}">
<div class="l" style="left:50%;top:22px"><i class="dot"></i>Daily Poster</div>
<div class="l" style="left:${px / 2}px;top:50%;transform:translate(-50%,-50%) rotate(-90deg)">No. ${pad(brief.issue)}</div>
<div class="l" style="left:${W - px / 2}px;top:50%;transform:translate(-50%,-50%) rotate(90deg)">${d}.${m}.${y.slice(2)}</div>
<div class="l" style="left:50%;top:${H - 22}px">${esc(brief.story.source)}</div>
<script>Promise.all([document.fonts.ready, new Promise(r => { const i = document.images[0]; i.complete ? r() : (i.onload = i.onerror = r); })]).then(() => document.body.dataset.ready = 1);</script>
</body></html>`;
}

async function todo(state) {
  const latest = await readJSON(join(DATA, "latest.json"), null);
  const showcase = await readJSON(join(DATA, "showcase.json"), []);
  const jobs = [];
  if (latest && latest.date === londonDate() && !existsSync(briefImage(latest.date))) jobs.push({ kind: "brief", brief: latest, out: briefImage(latest.date) });
  // Posters waiting now, plus today's (they go out tomorrow).
  const waiting = [...await pendingPosters(state, "9999-12-31")];
  for (const p of waiting) {
    if (existsSync(posterImage(p))) continue;
    const brief = await readJSON(join(DATA, `${p.date}.json`), null);
    if (brief) jobs.push({ kind: "poster", poster: p, brief, variant: variantFor(p, showcase), out: posterImage(p) });
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
      const html = j.kind === "brief" ? briefCard(j.brief) : mockup(j.poster, j.brief, j.variant, "file://" + join(SITE, j.poster.image));
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
