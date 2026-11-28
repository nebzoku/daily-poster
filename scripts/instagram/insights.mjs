// Daily snapshot of the account's reels: views and engagement, for the making-of reel trial (Ben, 28 Nov 2026:
// two weeks alternating reels that open on the finished poster with reels that open on the empty artboard, then
// compare; instagram/reel-trial.json says which reel opened which way).
//
// Writes instagram/insights.json: one entry per reel (id, permalink, posted time, caption's issue number, the trial
// arm when it's a making-of in the trial) with a snapshot per London date, so reels can be compared at the same age
// (e.g. views after 72 hours), not just by today's totals. Metrics Instagram won't give for a reel are left out.
//   node scripts/instagram/insights.mjs            (needs INSTAGRAM_TOKEN and INSTAGRAM_USER_ID)
//   node scripts/instagram/insights.mjs --report   (prints the trial comparison from the saved snapshots, no API)
import { join } from "node:path";
import { ROOT, readJSON, writeJSON, londonDate } from "./common.mjs";

const FILE = join(ROOT, "instagram", "insights.json"), TRIAL = join(ROOT, "instagram", "reel-trial.json");
const TOKEN = process.env.INSTAGRAM_TOKEN, USER = process.env.INSTAGRAM_USER_ID;
const API = /^EAA/.test(TOKEN || "") ? "https://graph.facebook.com/v26.0" : "https://graph.instagram.com/v26.0";
const METRICS = ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];

const get = async (path, params = {}) => {
  const q = new URLSearchParams({ ...params, access_token: TOKEN });
  const r = await (await fetch(`${API}/${path}?${q}`)).json();
  if (r.error) throw new Error(r.error.message);
  return r;
};
const issueOf = (caption = "") => (caption.match(/#dailyposter(\d{3})\b/) || [])[1] || null;

async function snapshot() {
  if (!TOKEN || !USER) { console.log("No Instagram token: skipping insights."); return; }
  const db = await readJSON(FILE, { reels: {} }), trial = await readJSON(TRIAL, { reels: {} }), today = londonDate();
  let url = `${USER}/media`, params = { fields: "id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count", limit: "50" }, seen = 0;
  for (let page = 0; page < 8 && url; page++) {
    const r = await get(url, params);
    for (const m of r.data || []) {
      // every grid post too (Ben, 28 Nov: to pick the best-liked posters): likes, comments, saves, reach
      if (m.media_product_type !== "REELS" && m.media_type !== "VIDEO") {
        const p = (db.posts ??= {})[m.id] ??= { id: m.id, permalink: m.permalink, posted: m.timestamp, title: (m.caption || "").split("\n")[0], issue: issueOf(m.caption), history: {} };
        const snap = { likes: m.like_count, comments: m.comments_count };
        for (const k of ["saved", "reach", "shares", "total_interactions"]) {
          try { const x = await get(`${m.id}/insights`, { metric: k }); const v = x.data?.[0]?.values?.[0]?.value ?? x.data?.[0]?.total_value?.value; if (v != null) snap[k] = v; } catch {}
        }
        p.history[today] = snap; continue;
      }
      const issue = issueOf(m.caption), makingOf = /^The making of /.test(m.caption || "");
      const e = (db.reels[m.id] ??= { id: m.id, permalink: m.permalink, posted: m.timestamp, issue, makingOf, history: {} });
      e.trial = makingOf && issue && trial.reels?.[issue] ? trial.reels[issue].opening : e.trial ?? null;
      const snap = { likes: m.like_count, comments: m.comments_count };
      for (const k of METRICS) {   // one at a time: Instagram rejects the whole call if any one metric is unavailable
        try { const x = await get(`${m.id}/insights`, { metric: k }); const v = x.data?.[0]?.values?.[0]?.value ?? x.data?.[0]?.total_value?.value; if (v != null) snap[k] = v; } catch {}
      }
      e.history[today] = snap; seen++;
    }
    const next = r.paging?.next; if (!next) break;
    const u = new URL(next); url = u.pathname.split("/").slice(2).join("/"); params = Object.fromEntries([...u.searchParams].filter(([k]) => k !== "access_token"));
  }
  db.updated = new Date().toISOString();
  await writeJSON(FILE, db);
  console.log(`Insights: ${seen} reels snapshotted for ${today}.`);
}

// The comparison: each trial reel's numbers at the snapshot closest to 72 hours old (and its latest), averaged per arm.
async function report() {
  const db = await readJSON(FILE, { reels: {} }), rows = Object.values(db.reels).filter((e) => e.trial);
  const at = (e, hours) => {
    const want = new Date(e.posted).getTime() + hours * 3600e3, ds = Object.keys(e.history).sort();
    return ds.length ? e.history[ds.reduce((b, d) => (Math.abs(new Date(d + "T23:00:00Z") - want) < Math.abs(new Date(b + "T23:00:00Z") - want) ? d : b))] : {};
  };
  const keys = ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions", "ig_reels_avg_watch_time"];
  const arms = {};
  for (const e of rows) (arms[e.trial] ??= []).push({ issue: e.issue, d3: at(e, 72), latest: e.history[Object.keys(e.history).sort().pop()] });
  for (const [arm, list] of Object.entries(arms)) {
    console.log(`\n${arm} (${list.length} reels: ${list.map((x) => x.issue).join(", ")})`);
    for (const k of keys) {
      const v = list.map((x) => x.d3[k]).filter((n) => typeof n === "number");
      if (v.length) console.log(`  ${k} at ~72 h: mean ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}, median ${v.sort((a, b) => a - b)[Math.floor(v.length / 2)]}`);
    }
  }
  console.log(JSON.stringify(arms, null, 1));
}

await (process.argv.includes("--report") ? report() : snapshot());
