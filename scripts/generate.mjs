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
import { wheelFor, paletteFor, issueNumber, ALWAYS, daysBetween } from "./lib/palette.mjs";
import { FONT_PAIRS, fontPair, fontAssets, availablePairs, TYPE_COOLDOWN_DAYS } from "./lib/fonts.mjs";
import { gatherCandidates, gatherTextures, polyhavenFile, interleave, imageBlock } from "./lib/images.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "site", "data");
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const IMAGE_COUNT = 10;
const TEXTURE_COUNT = 4;

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

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? " ");
const strip = (s = "") =>
  decode(decode(String(s)).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

async function fetchFeed([source, url]) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "daily-poster/1.0" } });
    if (!res.ok) throw new Error(res.status);
    const xml = await res.text();
    const doc = new XMLParser({ ignoreAttributes: false, processEntities: false, htmlEntities: false }).parse(xml);
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

async function recentBriefs(days = 20) {
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
      textureQueries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "Three material words for textures a designer could lay over type or a background, 1 to 2 words each, e.g. \"paper\", \"rough plaster\", \"linen\", \"rust\".",
      },
      fontPairId: { type: "string", description: "The id of one pairing from the list you were given." },
      fontReason: { type: "string", description: "One sentence on why this pairing suits the story." },
    },
    required: ["storyIndex", "storySummary", "headlines", "sublines", "imageQueries", "archiveQueries", "textureQueries", "fontPairId", "fontReason"],
  },
};

function briefPrompt(stories, recent, colour, pairsOk) {
  const list = stories
    .map((s, i) => `[${i}] ${s.source} · ${s.published}\n${s.title}\n${s.summary}`)
    .join("\n\n");
  const used = recent.map((b) => `- ${b.story.title}`).join("\n") || "- none yet";
  const pairs = pairsOk.map((f) => `${f.id}: ${f.display} + ${f.text}`).join("\n");
  return `You write a daily brief for a designer who makes one A-size poster a day from the news.

Pick ONE story from the list below. Choose something with real weight or a strong image in it: a turning point, a discovery, a strange or moving moment. Avoid celebrity gossip, sport results, routine politics and stories that repeat recent briefs. Treat tragedies with care; never make them glib.

Then write:
- Three headlines of 3 to 6 words. Count the words before you answer; seven is too many. They should be evocative and feel at home set huge on a poster: compressed, rhythmic, a little poetic, with tension or a turn in them. No puns that trivialise, no clickbait, no colons. Make the three genuinely different in angle.
- Three sublines that give the facts plainly, so the poster still informs.
- Three Unsplash search terms for atmospheric photography. Unsplash has no news photos, so ask for textures, places, objects and light that evoke the story. Today's colour is ${colour}; lean towards imagery that would sit well with it.
- Three search terms for museum collections (the Art Institute of Chicago and The Met), to find public-domain prints, paintings, posters and archive photographs that echo the story. Think in motifs and objects a museum would hold: "procession", "ledger", "banner", "crowd", "map".
- Three material words for textures that suit the story and could be laid over type or a background: paper, plaster, fabric, metal, stone and so on.
- One typeface pairing from this list, chosen to suit the story. Only these are available today, because no typeface repeats within ${TYPE_COOLDOWN_DAYS} days:
${pairs}

Recent briefs (do not repeat these stories):
${used}

Stories:
${list}`;
}

async function askClaude(prompt) {
  return callTool(BRIEF_TOOL, prompt, 4000);
}

const words = (s) => s.trim().split(/\s+/).length;

// Models occasionally return a list as a JSON string or as lines of text. Accept any of them.
const LIST_FIELDS = ["headlines", "sublines", "imageQueries", "archiveQueries", "textureQueries"];
function normalise(out) {
  for (const k of LIST_FIELDS) {
    let v = out[k];
    if (typeof v === "string") {
      try { v = JSON.parse(v); } catch { v = v.split(/\n|\s*;\s*/); }
    }
    out[k] = Array.isArray(v) ? v.map((x) => String(x).replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^"|"$/g, "").trim()).filter(Boolean) : [];
  }
  out.storyIndex = Number(out.storyIndex);
  return out;
}

function validate(out, stories, pairsOk = FONT_PAIRS) {
  const problems = [];
  if (!pairsOk.some((f) => f.id === out.fontPairId)) problems.push(`fontPairId "${out.fontPairId}" is not one of the pairings available today`);
  if (!stories[out.storyIndex]) problems.push("storyIndex is not in the list");
  out.headlines?.forEach((h, i) => {
    const n = words(h);
    if (n < 3 || n > 6) problems.push(`headline ${i + 1} is ${n} words: "${h}"`);
  });
  if (out.headlines?.length !== 3) problems.push("need exactly 3 headlines");
  if (out.sublines?.length !== 3) problems.push("need exactly 3 sublines");
  if (out.imageQueries?.length !== 3) problems.push("need exactly 3 image queries");
  if (out.archiveQueries?.length !== 3) problems.push("need exactly 3 archive queries");
  if (out.textureQueries?.length !== 3) problems.push("need exactly 3 texture queries");
  return problems;
}

// Call Claude with one tool and ask it to use it. Some models don't accept a forced
// tool_choice, so we ask in the prompt, and fall back to reading JSON from the text.
async function callTool(tool, content, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      tools: [tool],
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: typeof content === "string"
        ? `${content}\n\nReply only by calling the ${tool.name} tool.`
        : [...content, { type: "text", text: `Reply only by calling the ${tool.name} tool.` }] }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const call = body.content.find((c) => c.type === "tool_use" && c.name === tool.name);
  if (call) return call.input;
  const text = body.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const json = text.match(/\{[\s\S]*\}/);
  if (json) try { return JSON.parse(json[0]); } catch {}
  throw new Error(`Claude did not call ${tool.name}.`);
}

// Claude looks at the candidates and picks what an art director would.
function pickContent(story, colour, list, texList) {
  const content = [{
    type: "text",
    text: `You are art-directing the images for a daily poster brief. Today's story: "${story.title}". ${story.summary}
Today's colour is ${colour}.

First, ${list.length} candidate IMAGES, numbered I0, I1… Pick the ${IMAGE_COUNT} that are the most beautiful, striking and fitting for this story: strong composition, interesting light, texture or graphic quality, and a clear connection to the story's mood or subject. Mix modern photography with archive works (at least three of each if good ones exist). Skip near-duplicates, weak or blurry scans, images dominated by text, and anything that would trivialise the story. Order them so the sequence flows well as a strip.

Then ${texList.length} candidate TEXTURES, numbered T0, T1… Pick the ${Math.min(TEXTURE_COUNT, texList.length)} most useful for laying over type or a poster background: flat, evenly lit, rich in grain or surface detail, and in keeping with the story. Prefer a varied set (for example one paper, one fabric, one mineral).`,
  }];
  list.forEach((c, i) => {
    content.push({ type: "text", text: `[I${i}] ${c.source} · ${c.title} · ${c.credit}` });
    content.push(c.block);
  });
  texList.forEach((c, i) => {
    content.push({ type: "text", text: `[T${i}] ${c.source} · ${c.title}` });
    content.push(c.block);
  });
  return content;
}

async function pickImages(story, colour, cands, texCands) {
  // Download every thumbnail here and send the image data itself, skipping any that fail,
  // so one broken link can't sink the whole pick.
  const withBlocks = async (cs) => (await Promise.all(cs.map(async (c) => ({ ...c, block: await imageBlock(c.thumb) })))).filter((c) => c.block);
  const list = await withBlocks(interleave(cands, 36));   // mixed sources, so a cap never drops one entirely
  const texList = await withBlocks(interleave(texCands, 14));
  console.log(`Showing Claude ${list.length} images and ${texList.length} textures.`);
  if (!list.length) throw new Error("No candidate images could be downloaded.");
  const input = await callTool({
    name: "pick_images",
    description: "Choose the images and textures, in order, by their numbers (without the I or T).",
    input_schema: {
      type: "object",
      properties: {
        images: { type: "array", items: { type: "integer" } },
        textures: { type: "array", items: { type: "integer" } },
      },
      required: ["images", "textures"],
    },
  }, pickContent(story, colour, list, texList), 2000);
  const fill = (picks, from, n) => {
    const out = [...new Set((picks || []).filter((i) => from[i]))];
    for (let i = 0; out.length < Math.min(n, from.length) && i < from.length; i++) if (!out.includes(i)) out.push(i);
    return out.slice(0, n).map((i) => from[i]);
  };
  return { images: fill(input.images, list, IMAGE_COUNT), textures: fill(input.textures, texList, TEXTURE_COUNT) };
}

async function chooseImages(brief, story, colour) {
  const [cands, texCands] = await Promise.all([
    gatherCandidates(brief.imageQueries, brief.archiveQueries),
    gatherTextures(brief.textureQueries || []),
  ]);
  console.log(`Found ${cands.length} image and ${texCands.length} texture candidates.`);
  let picked;
  try {
    picked = await pickImages({ title: story.title, summary: brief.storySummary }, colour, cands, texCands);
  } catch (e) {
    console.warn("Image pick failed, mixing sources instead:", e.message);
    picked = { images: interleave(cands, IMAGE_COUNT), textures: interleave(texCands, TEXTURE_COUNT) };
  }
  for (const t of picked.textures) if (t.polyId) t.src = await polyhavenFile(t);
  const clean = ({ query, polyId, block, ...rest }) => rest;
  return { images: picked.images.map(clean), textures: picked.textures.map(clean) };
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
  const pairsOk = availablePairs(recent, date, daysBetween);
  console.log(`${pairsOk.length} of ${FONT_PAIRS.length} typeface pairings available today.`);
  let prompt = briefPrompt(stories, recent, wheel.name, pairsOk);
  let brief, problems = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ask = problems.length ? `${prompt}\n\nYour last attempt had these problems, fix them: ${problems.join("; ")}` : prompt;
    brief = normalise(await askClaude(ask));
    problems = validate(brief, stories, pairsOk);
    if (!problems.length) break;
    console.warn(`Attempt ${attempt} had problems: ${problems.join("; ")}`);
  }
  if (problems.length) throw new Error("Brief failed checks: " + problems.join("; "));

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
    grid: { format: "A-size", size: [1080, 1528], columns: 6, rows: 8, margin: 16, gutter: 32, column: 148, row: 159, unit: "px" },
    ...(await chooseImages(brief, story, wheel.name)),
  };

  await writeFile(out, JSON.stringify(result, null, 2) + "\n");
  await writeIndex();
  console.log(`Wrote ${date}: "${result.headlines[0]}" (${story.source})`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
