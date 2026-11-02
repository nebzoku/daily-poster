// Generates today's Daily Poster brief and writes it to site/data/.
//
//   ANTHROPIC_API_KEY   required: writes the headlines and picks the story
//   UNSPLASH_ACCESS_KEY optional: without it the brief uses museum images only
//   BRIEF_DATE          optional: YYYY-MM-DD, defaults to today in London
//   FORCE=1             optional: overwrite a brief that already exists
//   CLAUDE_MODEL        optional: defaults to claude-sonnet-5-5

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { wheelFor, paletteFor, issueNumber, ALWAYS } from "./lib/palette.mjs";
import { FONT_PAIRS, fontPair, fontAssets } from "./lib/fonts.mjs";
import { gatherCandidates, interleave } from "./lib/images.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "site", "data");
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const IMAGE_COUNT = 10;

const FEEDS = [
  ["BBC News", "https://feeds.bbci.co.uk/news/world/rss.xml"],
  ["BBC News", "https://feeds.bbci.co.uk/news/rss.xml"],
  ["BBC News", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"],
  ["The Guardian", "https://www.theguardian.com/world/rss"],
  ["The Guardian", "https://www.theguardian.com/uk-news/rss"],
  ["The Guardian", "https://www.theguardian.com/culture/rss"],
  ["The Guardian", "https://www.theguardian.com/science/rss"],
  ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"],
  ["NPR", "https://feeds.npr.org/1001/rss.xml"],
];

function londonDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d);
}

const strip = (s = "") =>
  String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function fetchFeed([source, url]) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "daily-poster/1.0" } });
    if (!res.ok) throw new Error(res.status);
    const xml = await res.text();
    const doc = new XMLParser({ ignoreAttributes: false }).parse(xml);
    const items = [].concat(doc?.rss?.channel?.item || []);
    return items.map((it) => ({
      source,
      title: strip(it.title),
      summary: strip(it.description).slice(0, 300),
      url: typeof it.link === "string" ? it.link : it.guid?.["#text"] || it.guid || "",
      published: it.pubDate ? new Date(it.pubDate).toISOString() : null,
    }));
  } catch (e) {
    console.warn(`Feed failed: ${url} (${e.message})`);
    return [];
  }
}

async function gatherStories(hours) {
  const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  const cutoff = Date.now() - hours * 3600 * 1000;
  const seen = new Set();
  return all
    .filter((s) => s.title && s.url && s.published && Date.parse(s.published) > cutoff)
    .filter((s) => {
      const k = s.title.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
    .slice(0, 70);
}

async function recentBriefs(days = 10) {
  if (!existsSync(DATA)) return [];
  const files = (await readdir(DATA)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(-days);
  return Promise.all(files.map(async (f) => JSON.parse(await readFile(join(DATA, f), "utf8"))));
}

const BRIEF_TOOL = {
  name: "write_brief",
  description: "Write today's poster design brief.",
  input_schema: {
    type: "object",
    properties: {
      storyIndex: { type: "integer", description: "Index of the chosen story in the list." },
      storySummary: {
        type: "string",
        description: "Two plain sentences, in your own words, saying what happened. No quotes from the article.",
      },
      headlines: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "Three headline options, each 3 to 6 words.",
      },
      sublines: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "Three sublines, each 8 to 18 words, giving the factual context the headline leaves out.",
      },
      imageQueries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "Three Unsplash photo search terms, 1 to 3 concrete words each.",
      },
      archiveQueries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "Three museum-collection search terms, 1 to 2 words each: objects, motifs or scenes likely to appear in prints, paintings, posters or archive photographs.",
      },
      fontPairId: { type: "string", enum: FONT_PAIRS.map((f) => f.id) },
      fontReason: { type: "string", description: "One sentence on why this pairing suits the story." },
    },
    required: ["storyIndex", "storySummary", "headlines", "sublines", "imageQueries", "archiveQueries", "fontPairId", "fontReason"],
  },
};

function briefPrompt(stories, recent, colour) {
  const list = stories
    .map((s, i) => `[${i}] ${s.source} · ${s.published}\n${s.title}\n${s.summary}`)
    .join("\n\n");
  const used = recent.map((b) => `- ${b.story.title}`).join("\n") || "- none yet";
  const pairs = FONT_PAIRS.map((f) => `${f.id}: ${f.display} + ${f.text}`).join("\n");
  return `You write a daily brief for a designer who makes one 9:16 poster a day from the news.

Pick ONE story from the list below. Choose something with real weight or a strong image in it: a turning point, a discovery, a strange or moving moment. Avoid celebrity gossip, sport results, routine politics and stories that repeat recent briefs. Treat tragedies with care; never make them glib.

Then write:
- Three headlines of 3 to 6 words. They should be evocative and feel at home set huge on a poster: compressed, rhythmic, a little poetic, with tension or a turn in them. No puns that trivialise, no clickbait, no colons. Make the three genuinely different in angle.
- Three sublines that give the facts plainly, so the poster still informs.
- Three Unsplash search terms for atmospheric photography. Unsplash has no news photos, so ask for textures, places, objects and light that evoke the story. Today's colour is ${colour}; lean towards imagery that would sit well with it.
- Three search terms for museum collections (the Art Institute of Chicago and The Met), to find public-domain prints, paintings, posters and archive photographs that echo the story. Think in motifs and objects a museum would hold: "procession", "ledger", "banner", "crowd", "map".
- One typeface pairing from this list, chosen to suit the story:
${pairs}

Recent briefs (do not repeat these stories):
${used}

Stories:
${list}`;
}

async function askClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      tools: [BRIEF_TOOL],
      tool_choice: { type: "tool", name: "write_brief" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const call = body.content.find((c) => c.type === "tool_use");
  if (!call) throw new Error("Claude did not return a brief.");
  return call.input;
}

const words = (s) => s.trim().split(/\s+/).length;

function validate(out, stories) {
  const problems = [];
  if (!stories[out.storyIndex]) problems.push("storyIndex is not in the list");
  out.headlines?.forEach((h, i) => {
    const n = words(h);
    if (n < 3 || n > 6) problems.push(`headline ${i + 1} is ${n} words: "${h}"`);
  });
  if (out.headlines?.length !== 3) problems.push("need exactly 3 headlines");
  if (out.sublines?.length !== 3) problems.push("need exactly 3 sublines");
  if (out.imageQueries?.length !== 3) problems.push("need exactly 3 image queries");
  if (out.archiveQueries?.length !== 3) problems.push("need exactly 3 archive queries");
  return problems;
}

// Claude looks at the candidates and picks the ten an art director would.
async function pickImages(story, colour, cands) {
  if (cands.length <= IMAGE_COUNT) return cands;
  const list = interleave(cands, 40); // mixed sources, so a cap never drops one entirely
  const content = [{
    type: "text",
    text: `You are art-directing the image strip for a daily poster brief. Today's story: "${story.title}". ${story.summary}
Today's colour is ${colour}.

Below are ${list.length} candidate images, numbered. Pick the ${IMAGE_COUNT} that are the most beautiful, striking and fitting for this story: strong composition, interesting light, texture or graphic quality, and a clear connection to the story's mood or subject. Mix modern photography with archive works (at least three of each if good ones exist). Skip near-duplicates, weak or blurry scans, images dominated by text, and anything that would trivialise the story. Order them so the sequence flows well as a strip.`,
  }];
  list.forEach((c, i) => {
    content.push({ type: "text", text: `[${i}] ${c.source} · ${c.title} · ${c.credit}` });
    content.push({ type: "image", source: { type: "url", url: c.thumb } });
  });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      tools: [{
        name: "pick_images",
        description: "Choose the images for the strip, in order.",
        input_schema: {
          type: "object",
          properties: { picks: { type: "array", items: { type: "integer" }, minItems: IMAGE_COUNT, maxItems: IMAGE_COUNT } },
          required: ["picks"],
        },
      }],
      tool_choice: { type: "tool", name: "pick_images" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const call = (await res.json()).content.find((c) => c.type === "tool_use");
  const picks = [...new Set((call?.input?.picks || []).filter((i) => list[i]))];
  if (picks.length < IMAGE_COUNT) {
    for (const c of interleave(list, list.length)) if (picks.length < IMAGE_COUNT && !picks.includes(list.indexOf(c))) picks.push(list.indexOf(c));
  }
  return picks.slice(0, IMAGE_COUNT).map((i) => list[i]);
}

async function chooseImages(brief, story, colour) {
  const cands = await gatherCandidates(brief.imageQueries, brief.archiveQueries);
  console.log(`Found ${cands.length} image candidates.`);
  if (!cands.length) return [];
  try {
    return await pickImages({ title: story.title, summary: brief.storySummary }, colour, cands);
  } catch (e) {
    console.warn("Image pick failed, mixing sources instead:", e.message);
    return interleave(cands, IMAGE_COUNT);
  }
}

async function writeIndex() {
  const files = (await readdir(DATA)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  const index = [];
  for (const f of files) {
    const b = JSON.parse(await readFile(join(DATA, f), "utf8"));
    const pal = b.palette || (b.palettes || []).find((p) => p.name === "Vivid") || {};
    index.push({
      date: b.date, issue: b.issue, colour: b.colour.name, headline: b.headlines[0],
      bg: pal.colours ? pal.colours[0] : null,
      thumb: b.images && b.images[0] ? b.images[0].thumb : null,
      display: b.type.display, css: b.type.css,
    });
  }
  await writeFile(join(DATA, "index.json"), JSON.stringify(index, null, 2) + "\n");
  if (files[0]) await writeFile(join(DATA, "latest.json"), await readFile(join(DATA, files[0]), "utf8"));
}

async function main() {
  const date = process.env.BRIEF_DATE || londonDate();
  const out = join(DATA, `${date}.json`);
  await mkdir(DATA, { recursive: true });

  if (existsSync(out) && !process.env.FORCE) {
    console.log(`Brief for ${date} already exists. Set FORCE=1 to remake it.`);
    await writeIndex();
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");

  // Look back 36 hours; widen to 72 on quiet news days.
  let stories = await gatherStories(36);
  if (stories.length < 15) stories = await gatherStories(72);
  if (!stories.length) throw new Error("No stories came back from the news feeds.");

  const wheel = wheelFor(date);
  const recent = await recentBriefs();
  let prompt = briefPrompt(stories, recent, wheel.name);
  let brief = await askClaude(prompt);
  let problems = validate(brief, stories);
  if (problems.length) {
    console.warn("Retrying once:", problems.join("; "));
    brief = await askClaude(`${prompt}\n\nYour last attempt had these problems, fix them: ${problems.join("; ")}`);
    problems = validate(brief, stories);
    if (problems.length) throw new Error("Brief failed checks: " + problems.join("; "));
  }

  const story = stories[brief.storyIndex];
  const pair = fontPair(brief.fontPairId);
  const result = {
    date,
    issue: issueNumber(date),
    generatedAt: new Date().toISOString(),
    colour: { name: wheel.name, yesterday: wheel.yesterday, tomorrow: wheel.tomorrow },
    story: {
      title: story.title,
      summary: brief.storySummary,
      source: story.source,
      url: story.url,
      published: story.published,
    },
    headlines: brief.headlines.map((s) => s.trim()),
    sublines: brief.sublines.map((s) => s.trim()),
    palette: paletteFor(date),
    always: ALWAYS,
    type: { ...pair, reason: brief.fontReason, ...fontAssets(pair) },
    grid: { format: "9:16", size: [1080, 1920], columns: 6, rows: 12, margin: 0.04, gutter: 0.02, basis: "short side" },
    images: (await chooseImages(brief, story, wheel.name)).map(({ query, ...im }) => im),
  };

  await writeFile(out, JSON.stringify(result, null, 2) + "\n");
  await writeIndex();
  console.log(`Wrote ${date}: "${result.headlines[0]}" (${story.source})`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
