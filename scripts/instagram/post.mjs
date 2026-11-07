// Posts to Instagram, at most once a run (the workflow runs it hourly). See common.mjs for the
// rhythm. Uses Instagram's official API (Instagram Login or Meta's Unified login); needs INSTAGRAM_TOKEN and
// INSTAGRAM_USER_ID. DRY_RUN=1 says what it would post without posting.
//
// Unified login (system-user) tokens never expire. Instagram Login tokens are renewed once a week;
// if GH_SECRETS_TOKEN is set the workflow saves the renewed token back to the repo's secrets,
// otherwise it warns when the token is close to expiring.
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SITE, DATA, STATE, BACKFILL, SLOTS, WINDOW_MS, readJSON, writeJSON, loadState, londonDate, londonToUtc, addDays,
  pendingPosters, posterImage, posterReel, posterMedia, briefImages, briefStories, url } from "./common.mjs";

const TOKEN = process.env.INSTAGRAM_TOKEN, USER = process.env.INSTAGRAM_USER_ID;
// Instagram Login tokens (IGAA…) go to graph.instagram.com and last 60 days, renewed weekly.
// Meta's newer "Unified login" gives a system-user token (EAA…) that goes to graph.facebook.com
// and never expires, so there's nothing to renew.
const FB_TOKEN = /^EAA/.test(TOKEN || "");
const API = FB_TOKEN ? "https://graph.facebook.com/v26.0" : "https://graph.instagram.com/v26.0";
const DRY = !!process.env.DRY_RUN;
const pad = (n) => String(n).padStart(3, "0");
const longDate = (d) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));

// Captions, in plain words, no emoji.
const TAGS = (issue) => `#dailyposter #dailyposter${pad(issue)} #posterdesign #typography #graphicdesign #designchallenge`;
export function posterCaption(p, brief) {
  return [
    p.title,
    "",
    `Daily Poster No. ${pad(brief.issue)}, made from the brief for ${longDate(brief.date)}.`,
    "",
    brief.story.summary,
    "",
    `Source: ${brief.story.source}`,
    `Type: ${p.typeUsed || `${brief.type.display} and ${brief.type.text}`}`,   // typeUsed: when a poster sets its own
    `Poster by ${p.instagram ? "@" + p.instagram.replace(/^@/, "") : p.designer}`,
    "",
    // A line on how it was made, when the archive entry has one (handy for moving posters).
    ...(p.made ? [`How it was made: ${p.made}`, ""] : []),
    "Today's brief is live at dailyposter.design",
    "",
    TAGS(brief.issue),
  ].join("\n");
}
// past: for briefs posted after their day (catching the feed up).
export function briefCaption(brief, past = false) {
  return [
    past ? `The brief for ${longDate(brief.date)}, No. ${pad(brief.issue)}. Swipe for all three headlines.`
      : `Today's brief, No. ${pad(brief.issue)}. Swipe for all three headlines.`,
    "",
    brief.story.summary,
    "",
    past ? `A new brief goes up every morning at dailyposter.design: three headlines to choose from, the day's palette, a typeface pairing, images and 3D renders. Make a poster, tag @dailyposter.design and add the day's number, like #dailyposter${pad(brief.issue)}.`
      : `Three headlines to choose from, today's palette, a typeface pairing, images and 3D renders, all at dailyposter.design. Make a poster, tag @dailyposter.design and add #dailyposter${pad(brief.issue)}.`,
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

// Wait for Instagram to fetch and process a container.
async function ready(id) {
  for (let i = 0; i < 20; i++) {
    const { status_code } = await api(id, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`container ${status_code}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

// One picture, or several as a carousel.
async function publish(images, caption, alt) {
  for (const u of images) {
    const head = await fetch(u, { method: "HEAD" });
    if (!head.ok) throw new Error(`picture isn't online yet (${head.status}): ${u}`);
  }
  let id;
  if (images.length === 1) {
    ({ id } = await api(`${USER}/media`, { image_url: images[0], caption, alt_text: alt }));
  } else {
    const children = [];
    for (const u of images) { const c = await api(`${USER}/media`, { image_url: u, is_carousel_item: "true" }); await ready(c.id); children.push(c.id); }
    ({ id } = await api(`${USER}/media`, { media_type: "CAROUSEL", children: children.join(","), caption }));
  }
  await ready(id);
  return (await api(`${USER}/media_publish`, { creation_id: id })).id;
}

// A Reel: Instagram fetches the video and takes a while to process it.
async function publishReel(video, caption) {
  const head = await fetch(video, { method: "HEAD" });
  if (!head.ok) throw new Error(`video isn't online yet (${head.status}): ${video}`);
  const { id } = await api(`${USER}/media`, { media_type: "REELS", video_url: video, caption, share_to_feed: "true", thumb_offset: "9000" });
  for (let i = 0; i < 60; i++) {
    const { status_code, status } = await api(id, { fields: "status_code,status" }, "GET");
    if (status_code === "FINISHED") return (await api(`${USER}/media_publish`, { creation_id: id })).id;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`video ${status_code}: ${status || ""}`);
    await new Promise((r) => setTimeout(r, 10e3));
  }
  throw new Error("Instagram was still processing the video after ten minutes");
}
const posterJob = (p, brief) => ({
  ...(p.video ? { reel: url(posterReel(p)) } : { images: [url(posterImage(p))] }),
  caption: posterCaption(p, brief), alt: `Poster: ${p.title}, by ${p.designer}, for Daily Poster No. ${pad(brief.issue)}.`,
});
const send = (job) => (job.reel ? publishReel(job.reel, job.caption) : job.story ? publishStories(job.images) : publish(job.images, job.caption, job.alt));

// Stories, one after another (each is its own post; stories take no caption).
async function publishStories(images) {
  const ids = [];
  for (const u of images) {
    const head = await fetch(u, { method: "HEAD" });
    if (!head.ok) throw new Error(`picture isn't online yet (${head.status}): ${u}`);
    const { id } = await api(`${USER}/media`, { image_url: u, media_type: "STORIES" });
    await ready(id);
    ids.push((await api(`${USER}/media_publish`, { creation_id: id })).id);
  }
  return ids.join(",");
}

async function renewToken(state) {
  if (FB_TOKEN) return;
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

  // Catching up first: anything left in the one-off queue goes out now, oldest first, a couple of
  // minutes apart. Stops at the first thing whose pictures aren't ready, to keep the order.
  const { queue = [] } = await readJSON(BACKFILL, {});
  // Items are keys ("brief:<date>", "poster:<image>") or one-off posts: { key, images, caption }
  // with images as paths under site/ (e.g. the pinned explainer).
  const left = queue.filter((k) => !state.posted[k.key || k]);
  if (left.length) {
    const showcase = await readJSON(join(DATA, "showcase.json"), []);
    for (const [n, item] of left.entries()) {
      const key = item.key || item;
      let job;
      if (item.key) {
        const files = item.images.map((f) => join(SITE, f));
        if (!files.every((f) => existsSync(f))) { console.log(`${key} isn't ready; trying again next hour.`); break; }
        job = { images: files.map(url), caption: item.caption, alt: item.alt, story: !!item.story };
      } else if (key.startsWith("brief:")) {
        const date = key.slice(6), brief = await readJSON(join(DATA, `${date}.json`), null);
        if (!brief || !briefImages(date).every((f) => existsSync(f))) { console.log(`${key} isn't ready; trying again next hour.`); break; }
        job = { images: briefImages(date).map(url), caption: briefCaption(brief, date !== today) };
      } else {
        const p = showcase.find((x) => `poster:${x.image}` === key), brief = p && await readJSON(join(DATA, `${p.date}.json`), null);
        if (!brief || !existsSync(posterMedia(p))) { console.log(`${key} isn't ready; trying again next hour.`); break; }
        job = posterJob(p, brief);
      }
      console.log(`${DRY ? "Would post" : "Posting"} ${key} (catching up):\n${job.reel || job.images.join("\n")}\n---\n${job.caption}\n---`);
      if (DRY) continue;
      try {
        const id = await send(job);
        state.posted[key] = { slot: "catch-up", at: new Date().toISOString(), id };
        await mkdir(join(STATE, ".."), { recursive: true }); await writeJSON(STATE, state);
        console.log(`Posted: ${id}`);
      } catch (e) { console.error(`Couldn't post ${key}: ${e.message}`); process.exitCode = 1; break; }
      if (n < left.length - 1) await new Promise((r) => setTimeout(r, 120e3));
    }
    if (!DRY) { await writeJSON(STATE, state); return; }
  }

  // What's due: the brief card in the morning; posters at their times.
  let job = null;
  const briefKey = `brief:${today}`, briefSlot = `${today} ${SLOTS.brief}`;
  if (due(SLOTS.brief) && !state.slots[briefSlot] && !state.posted[briefKey]) {
    const brief = await readJSON(join(DATA, "latest.json"), null);
    if (brief?.date === today && [...briefImages(today), ...briefStories(today)].every((f) => existsSync(f)))
      job = { key: briefKey, slot: briefSlot, images: briefImages(today).map(url), caption: briefCaption(brief), stories: briefStories(today).map(url) };
  }
  if (!job) {
    const waiting = (await pendingPosters(state, today)).filter((p) => existsSync(posterMedia(p)));
    for (const [time, needed] of SLOTS.posters) {
      const slot = `${today} ${time}`;
      if (!due(time) || state.slots[slot] || waiting.length < needed) continue;
      const p = waiting[0], brief = await readJSON(join(DATA, `${p.date}.json`), null);
      if (!brief) continue;
      job = { key: `poster:${p.image}`, slot, ...posterJob(p, brief) };
      break;
    }
  }

  if (job) {
    console.log(`${DRY ? "Would post" : "Posting"} ${job.key} for the ${job.slot} slot:\n${job.reel || job.images.join("\n")}\n---\n${job.caption}\n---`);
    if (!DRY) {
      try {
        const id = await send(job);
        // The brief goes on the grid as a carousel and into stories.
        if (job.stories) { try { state.posted[`stories:${today}`] = { at: new Date().toISOString(), id: await publishStories(job.stories) }; }
          catch (e) { console.error(`Couldn't post the stories: ${e.message}`); process.exitCode = 1; } }
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

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
