// Photographic references for the illustrated posters (Ben, 26 Nov 2026: "get photographic references to comp
// together and then illustrate from, especially for people and objects ... a separate private pull specially for
// illustrating"). Not part of the public brief: saved under experiments/claude-posters/refs/<date>/ (not site/), with
// refs.json listing titles, credits, links and the query each came from. The posters never show these photos; they
// are traced, comped and drawn over.
// What to look for: Claude reads today's story and asks for the people (poses, gestures, hands), the key objects and
// the places, several from dramatic camera angles (very high, very low, fish-eye). Without an API key it falls back to
// simple queries. The brief's own Unsplash photos come first. Queries can be set by hand: one per line in
// requests/illo-refs.txt.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { unsplash, met } from "./lib/images.mjs";

const ROOT = new URL("../", import.meta.url).pathname, SITE = join(ROOT, "site");
// node scripts/illo-refs.mjs [date]: today's brief by default, or an earlier one (site/data/<date>.json)
const arg = process.argv[2];
const brief = JSON.parse(await readFile(join(SITE, "data", arg ? `${arg}.json` : "latest.json"), "utf8"));
const date = brief.date, dir = join(ROOT, "experiments", "claude-posters", "refs", date), PER = 3, MAX = 18;
// hand-set queries: requests/illo-refs/<date>.txt for that day, else requests/illo-refs.txt (today only)
const manualFile = existsSync(join(ROOT, "requests", "illo-refs", `${date}.txt`)) ? join(ROOT, "requests", "illo-refs", `${date}.txt`) : arg ? "" : join(ROOT, "requests", "illo-refs.txt");
const manual = manualFile && existsSync(manualFile) ? (await readFile(manualFile, "utf8")).split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#")) : [];

async function askClaude() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const tool = { name: "references", description: "Photo search queries for an illustrator's reference board.",
    input_schema: { type: "object", properties: { queries: { type: "array", items: { type: "string" }, minItems: 6, maxItems: 8 } }, required: ["queries"] } };
  const prompt = `An illustrator is drawing a poster about today's story: "${brief.story.title}". ${brief.story.summary}
Objects in the brief: ${(brief.objects || []).map((o) => o.name).join(", ") || "none"}.
Write 6 to 8 short stock-photo search queries (2 to 5 words each) for a reference board to draw from: the people in the
story (their poses, gestures and hands, e.g. "pillion passenger arm raised"), the key objects, and the places, several
of them from dramatic camera angles ("aerial view", "top down", "low angle", "worm's eye", "fisheye"). Concrete,
photographable things only, no abstract ideas, no named people.`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5", max_tokens: 600, tools: [tool], tool_choice: { type: "auto" },
        messages: [{ role: "user", content: `${prompt}\n\nReply only by calling the references tool.` }] }) });
    if (!res.ok) { console.warn(`Claude API ${res.status}`); return null; }
    const call = (await res.json()).content.find((c) => c.type === "tool_use");
    return call?.input?.queries || null;
  } catch (e) { console.warn(`Claude API: ${e.message}`); return null; }
}

const words = (brief.story?.theme || "").split(/\s+/).filter((w) => w.length > 3 && !["and", "with", "from"].includes(w));
const queries = manual.length ? manual : (await askClaude()) || [
  ...(brief.objects || []).map((o) => `${o.name} close up`), ...words.slice(0, 2).map((w) => `${w} aerial view`), "people street low angle",
];
console.log("Queries:", queries.join(" | "));

// the brief's own photos first (they were picked for the story), then the searches
const picks = (brief.images || []).filter((im) => im.src && im.source === "Unsplash").map((im) => ({ ...im, query: "brief" }));
const seen = new Set(picks.map((p) => p.id));
for (const q of queries) {
  let got = [];
  try { got = await unsplash(q, PER); } catch (e) { console.warn(`unsplash "${q}": ${e.message}`); }
  if (!got.length) try { got = await met(q, PER); } catch (e) { console.warn(`met "${q}": ${e.message}`); }
  for (const c of got) if (!seen.has(c.id) && picks.length < MAX) { seen.add(c.id); picks.push({ ...c, query: q }); }
}
await mkdir(dir, { recursive: true });
const out = [];
for (const [i, c] of picks.entries()) {
  const name = `ref-${String(i + 1).padStart(2, "0")}.jpg`;
  try {
    const res = await fetch(c.src, { headers: { "user-agent": "daily-poster/1.0 (+https://github.com/nebzoku/daily-poster)" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(String(res.status));
    await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(dir, name));
    out.push({ file: name, title: c.title, credit: c.credit, source: c.source, licence: c.licence, page: c.page, query: c.query });
    console.log(`Saved ${name}: ${c.title} (${c.query})`);
  } catch (e) { console.warn(`Couldn't save ${c.title}: ${e.message}`); }
}
await writeFile(join(dir, "refs.json"), JSON.stringify({ date, queries, refs: out }, null, 2) + "\n");
console.log(`${out.length} illustration references for ${date}`);
