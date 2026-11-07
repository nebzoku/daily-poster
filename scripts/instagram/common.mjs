// Shared bits for the Instagram account: what's due, when, and what's been posted.
//
// The rhythm (UK time):
//   08:00         today's brief, as a carousel on the grid and as nine stories
//   13:00, 19:00  posters made from earlier briefs, oldest first
//   10:30         a third poster, only when three or more are waiting
// Every poster goes out from the day after its brief, so the feed runs one day behind the site.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const ROOT = new URL("../../", import.meta.url).pathname;
export const SITE = join(ROOT, "site");
export const DATA = join(SITE, "data");
export const IG_DIR = join(SITE, "media", "ig");
export const STATE = join(ROOT, "instagram", "state.json");
export const BACKFILL = join(ROOT, "instagram", "backfill.json");   // one-off catch-up queue
export const SITE_URL = (process.env.SITE_URL || "https://dailyposter.design").replace(/\/$/, "");

export const SLOTS = { brief: "08:00", posters: [["13:00", 1], ["19:00", 1], ["10:30", 3]] }; // [time, posters needed waiting]
export const WINDOW_MS = 3 * 3600e3;   // a slot can still be filled up to three hours late

export const readJSON = async (p, fallback) => (existsSync(p) ? JSON.parse(await readFile(p, "utf8")) : fallback);
export const writeJSON = (p, v) => writeFile(p, JSON.stringify(v, null, 2) + "\n");

// Dates in London.
export const londonDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d);
export function addDays(date, n) { const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
// The UTC instant of a London wall-clock time on a given day (handles summer time).
export function londonToUtc(date, time) {
  const [y, m, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return new Date(guess - (shown - guess));
}

export const stem = (path) => path.split("/").pop().replace(/\.[a-z]+$/i, "");
export const posterImage = (x) => join(IG_DIR, `${stem(x.image)}.jpg`);
// A moving poster goes out as a Reel: the poster on black at 9:16, with its sound (made by hand,
// site/media/ig/<name>.mp4). Without that file it waits.
export const posterReel = (x) => (x.video ? join(IG_DIR, `${stem(x.image)}.mp4`) : null);
export const posterMedia = (x) => posterReel(x) || posterImage(x);
// Today's brief is a three-picture carousel, one headline each.
export const briefImages = (date) => [1, 2, 3].map((n) => join(IG_DIR, `brief-${date}-${n}.jpg`));
// The morning brief also goes out as nine stories (9:16): each headline then its subline, then the palette, the typefaces and how to take part.
export const briefStories = (date) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => join(IG_DIR, `brief-${date}-story-${n}.jpg`));
export const url = (abs) => `${SITE_URL}/${abs.slice(SITE.length + 1)}`;

export async function loadState() {
  const s = await readJSON(STATE, {});
  s.posted ??= {}; s.slots ??= {};
  return s;
}

// Posters from the archive that are due to go out: made from a brief on or after the day
// before posting began, not yet posted, oldest brief first (archive order within a day).
export async function pendingPosters(state, today = londonDate()) {
  const showcase = await readJSON(join(DATA, "showcase.json"), []);
  const first = state.start ? addDays(state.start, -1) : today;
  return showcase
    .map((x, i) => ({ ...x, order: i }))
    .filter((x) => x.date >= first && x.date < today && !state.posted[`poster:${x.image}`])
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
}

