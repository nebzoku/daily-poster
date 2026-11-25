// Scans of real handwriting for the day, to doodle over the posters with (Ben, 25 Nov 2026: "take relevant excerpts
// from publicly available imagery and scans of real handwriting, the more calligraphic the better, bonus points if
// it's relevant to the poster"). Public-domain (CC0) letters, manuscripts, copybooks and calligraphy from The Met and
// the Art Institute of Chicago, searched with words from today's story first, then generally.
// Saves site/media/<date>/hand-01.jpg … (2160 px wide) and hand.json with titles, credits and links.
// Queries can be set by hand: one per line in requests/handwriting.txt (empty = automatic).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { met, artic } from "./lib/images.mjs";

const SITE = new URL("../site/", import.meta.url).pathname, ROOT = new URL("../", import.meta.url).pathname;
const brief = JSON.parse(await readFile(join(SITE, "data", "latest.json"), "utf8"));
const date = brief.date, dir = join(SITE, "media", date), WANT = 6;
const manual = existsSync(join(ROOT, "requests", "handwriting.txt")) ? (await readFile(join(ROOT, "requests", "handwriting.txt"), "utf8")).split("\n").map((s) => s.trim()).filter(Boolean) : [];
const words = (brief.story?.theme || "").split(/\s+/).filter((w) => w.length > 3 && !["and", "with", "from"].includes(w));
const queries = manual.length ? manual : [
  ...words.slice(0, 2).map((w) => `${w} letter manuscript`),
  "calligraphy", "autograph letter", "penmanship copybook", "writing book", "manuscript letter", "calligraphic",
];
const HANDY = /letter|manuscript|calligraph|copybook|penmanship|writing|script|autograph|inscription|alphabet|specimen|journal|diary|notebook|poem|leaf from/i;
const seen = new Set(), picks = [];
for (const q of queries) {
  if (picks.length >= WANT) break;
  for (const src of [met, artic]) {
    let got = [];
    try { got = await src(q, 8); } catch (e) { console.warn(`${src.name} "${q}": ${e.message}`); }
    for (const c of got) {
      if (picks.length >= WANT || seen.has(c.id)) continue;
      seen.add(c.id);
      if (!manual.length && !HANDY.test(`${c.title} ${c.alt}`)) continue;
      picks.push(c);
    }
  }
}
await mkdir(dir, { recursive: true });
const out = [];
for (const [i, c] of picks.entries()) {
  const name = `hand-${String(i + 1).padStart(2, "0")}.jpg`;
  try {
    const res = await fetch(c.src, { headers: { "user-agent": "daily-poster/1.0 (+https://github.com/nebzoku/daily-poster)" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(String(res.status));
    await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 2160, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(dir, name));
    out.push({ file: `media/${date}/${name}`, title: c.title, credit: c.credit, source: c.source, licence: c.licence, page: c.page, query: c.query });
    console.log(`Saved ${name}: ${c.title} (${c.source})`);
  } catch (e) { console.warn(`Couldn't save ${c.title}: ${e.message}`); }
}
await writeFile(join(dir, "hand.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} handwriting scans for ${date}`);
