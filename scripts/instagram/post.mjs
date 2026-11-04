// Posts to Instagram, at most once a run (the workflow runs it hourly). See common.mjs for the
// rhythm. Uses Instagram's official API with Instagram Login; needs INSTAGRAM_TOKEN and
// INSTAGRAM_USER_ID. DRY_RUN=1 says what it would post without posting.
//
// Once a week it renews the token. If GH_SECRETS_TOKEN is set, the workflow saves the renewed
// token back to the repo's secrets; otherwise it warns when the token is close to expiring.
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, STATE, SLOTS, WINDOW_MS, readJSON, writeJSON, loadState, londonDate, londonToUtc, addDays,
  pendingPosters, posterImage, briefImage, url } from "./common.mjs";

const API = "https://graph.instagram.com/v26.0";
const TOKEN = process.env.INSTAGRAM_TOKEN, USER = process.env.INSTAGRAM_USER_ID;
const DRY = !!process.env.DRY_RUN;
const pad = (n) => String(n).padStart(3, "0");
const longDate = (d) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));

// Captions, in plain words, no emoji.
const TAGS = (issue) => `#dailyposter #dailyposter${pad(issue)} #posterdesign #typography #graphicdesign #designchallenge`;
function posterCaption(p, brief) {
  return [
    p.title,
    "",
    `Daily Poster No. ${pad(brief.issue)}, made from the brief for ${longDate(brief.date)}.`,
    brief.story.summary,
    "",
    `Source: ${brief.story.source}`,
    `Type: ${brief.type.display} and ${brief.type.text}`,
    `Poster by ${p.instagram ? "@" + p.instagram.replace(/^@/, "") : p.designer}`,
    "",
    "Today's brief is live at dailyposter.design",
    "",
    TAGS(brief.issue),
  ].join("\n");
}
function briefCaption(brief) {
  return [
    `Today's brief, No. ${pad(brief.issue)}.`,
    "",
    brief.story.summary,
    "",
    `Three headlines to choose from, today's palette, a typeface pairing, images and 3D renders, all at dailyposter.design. Make a poster and tag it #dailyposter${pad(brief.issue)}.`,
    "",
    TAGS(brief.issue),
  ].join("\n");
}

async function api(path, params, method = "POST") {
  const q = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = await fetch(`${API}/${path}${method === "GET" ? "?" + q : ""}`, method === "GET" ? {} : { method, body: q });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`Instagram ${res.status}: ${body.error?.message || JSON.stringify(body)}`);
  return body;
}

async function publish(imageUrl, caption, alt) {
  const head = await fetch(imageUrl, { method: "HEAD" });
  if (!head.ok) throw new Error(`picture isn't online yet (${head.status}): ${imageUrl}`);
  const { id } = await api(`${USER}/media`, { image_url: imageUrl, caption, alt_text: alt });
  for (let i = 0; i < 20; i++) {                       // wait for Instagram to fetch and process it
    const { status_code } = await api(id, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`container ${status_code}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  return (await api(`${USER}/media_publish`, { creation_id: id })).id;
}

async function renewToken(state) {
  const week = 7 * 864e5;
  if (state.renewedAt && Date.now() - Date.parse(state.renewedAt) < week) return;
  try {
    const r = await (await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`)).json();
    if (!r.access_token) throw new Error(r.error?.message || "no token returned");
    state.renewedAt = new Date().toISOString();
    state.tokenExpires = new Date(Date.now() + r.expires_in * 1000).toISOString().slice(0, 10);
    if (r.access_token !== TOKEN) {
      await mkdir("/tmp/ig", { recursive: true });
      await writeFile("/tmp/ig/new-token", r.access_token, { mode: 0o600 });   // the workflow saves it, if it can
    }
    console.log(`Token renewed; it now lasts until ${state.tokenExpires}.`);
  } catch (e) { console.warn(`Couldn't renew the Instagram token: ${e.message}`); }
}

async function main() {
  if (!TOKEN || !USER) { console.log("Instagram isn't set up (INSTAGRAM_TOKEN, INSTAGRAM_USER_ID); nothing to post."); return; }
  const state = await loadState();
  state.start ??= londonDate();
  const now = process.env.NOW ? Date.parse(process.env.NOW) : Date.now();   // NOW is for testing
  const today = londonDate(new Date(now));
  const due = (time) => { const t = londonToUtc(today, time).getTime(); return now >= t && now < t + WINDOW_MS; };

  // What's due: the brief card in the morning; posters at their times.
  let job = null;
  const briefKey = `brief:${today}`, briefSlot = `${today} ${SLOTS.brief}`;
  if (due(SLOTS.brief) && !state.slots[briefSlot] && !state.posted[briefKey]) {
    const brief = await readJSON(join(DATA, "latest.json"), null);
    if (brief?.date === today && existsSync(briefImage(today)))
      job = { key: briefKey, slot: briefSlot, image: url(briefImage(today)), caption: briefCaption(brief), alt: `Daily Poster No. ${pad(brief.issue)}: today's brief. ${brief.headlines[0]}.` };
  }
  if (!job) {
    const waiting = (await pendingPosters(state, today)).filter((p) => existsSync(posterImage(p)));
    for (const [time, needed] of SLOTS.posters) {
      const slot = `${today} ${time}`;
      if (!due(time) || state.slots[slot] || waiting.length < needed) continue;
      const p = waiting[0], brief = await readJSON(join(DATA, `${p.date}.json`), null);
      if (!brief) continue;
      job = { key: `poster:${p.image}`, slot, image: url(posterImage(p)), caption: posterCaption(p, brief), alt: `Poster: ${p.title}, by ${p.designer}, for Daily Poster No. ${pad(brief.issue)}.` };
      break;
    }
  }

  if (job) {
    console.log(`${DRY ? "Would post" : "Posting"} ${job.key} for the ${job.slot} slot:\n${job.image}\n---\n${job.caption}\n---`);
    if (!DRY) {
      try {
        const id = await publish(job.image, job.caption, job.alt);
        state.posted[job.key] = { slot: job.slot, at: new Date().toISOString(), id };
        state.slots[job.slot] = job.key;
        console.log(`Posted: ${id}`);
      } catch (e) {
        console.error(`Couldn't post ${job.key}: ${e.message}`);
        process.exitCode = 1;
      }
    }
  } else console.log("Nothing due this hour.");

  if (!DRY) await renewToken(state);
  if (state.tokenExpires && !process.env.GH_SECRETS_TOKEN && state.tokenExpires < addDays(today, 10))
    console.log(`::warning::The Instagram token runs out on ${state.tokenExpires}. Make a new one and update INSTAGRAM_TOKEN.`);
  // Keep the slot log short.
  for (const k of Object.keys(state.slots)) if (k.slice(0, 10) < addDays(today, -14)) delete state.slots[k];
  if (!DRY) { await mkdir(join(STATE, ".."), { recursive: true }); await writeJSON(STATE, state); }
}

main().catch((e) => { console.error(e); process.exit(1); });
