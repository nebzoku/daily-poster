// The illustration machine (Ben, 26 Nov 2026: recreate his Weavy "Illustration Machine" flow in the daily repo).
// Weavy's steps, and what does them here:
//   1. Style Guide Maker: four reference images in a 2×2 grid → our own illustrations that worked
//      (experiments/claude-posters/lab/illo-guide/*.jpg), composed into one guide image with sharp.
//   2. Style Describer: a vision model writes a style description, tags and hex colours → written once, in words, in
//      experiments/claude-posters/illo-style.md (so no other artist's pictures are stored or sent).
//   3. Illustration Machine: an LLM writes N image prompts from a subject + the style → Claude reads today's brief and
//      writes N scene prompts: subject from the story, a dramatic camera angle each, the day's palette and highlight,
//      and where the headline will sit (kept as plain colour), plus the hands/faces rule.
//   4. GPT Image / Nano Banana with the style guide as the reference image → OpenAI (OPENAI_API_KEY, gpt-image) or
//      Google (GEMINI_API_KEY, Gemini image, "Nano Banana"), whichever key is set.
//   5. Recraft Vectorizer → the lab's scampArt() redraws each scamp in the day's palette with our worn ink and paper.
// Saves experiments/claude-posters/scamps/<date>/scamp-NN.png and scamps.json (prompts, angles, headline zones).
// Usage: node scripts/illo-gen.mjs [date] [count]
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url).pathname, SITE = join(ROOT, "site"), CP = join(ROOT, "experiments", "claude-posters");
const date = process.argv[2] && /^\d{4}-/.test(process.argv[2]) ? process.argv[2] : null;
const COUNT = +(process.argv[3] || process.env.ILLO_COUNT || 4);
const brief = JSON.parse(await readFile(join(SITE, "data", date ? `${date}.json` : "latest.json"), "utf8"));
const out = join(CP, "scamps", brief.date);
const OPENAI = process.env.OPENAI_API_KEY, GEMINI = process.env.GEMINI_API_KEY;
if (!OPENAI && !GEMINI) { console.log("No OPENAI_API_KEY or GEMINI_API_KEY: nothing to generate with. Add one as a repo secret."); process.exit(0); }

// 1. the style guide image
const gdir = join(CP, "lab", "illo-guide"), files = (await readdir(gdir)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort().slice(0, 4);
const tiles = await Promise.all(files.map((f) => sharp(join(gdir, f)).resize(512, 512, { fit: "cover" }).toBuffer()));
const guide = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: "#ffffff" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % 2) * 512, top: Math.floor(i / 2) * 512 }))).png().toBuffer();
await mkdir(out, { recursive: true }); await writeFile(join(out, "style-guide.png"), guide);

// 2. the style description
const style = await readFile(join(CP, "illo-style.md"), "utf8");

// 3. the prompts, from Claude
const palette = [...brief.palette.colours, ...(brief.always || [])], hl = brief.highlight || brief.pop;
const tool = { name: "scenes", description: "Image prompts for illustrated posters.", input_schema: { type: "object", required: ["scenes"], properties: { scenes: { type: "array", minItems: COUNT, maxItems: COUNT, items: { type: "object", required: ["headline", "angle", "headlineZone", "prompt"], properties: {
  headline: { type: "string", description: "which of the brief's headlines this scene is for" },
  angle: { type: "string", description: "the camera move, e.g. worm's-eye, high angle, fish-eye street, lone object in sky, interior one-point" },
  headlineZone: { type: "string", enum: ["top", "bottom", "top-and-bottom", "left", "right"], description: "where the headline will sit; that area must be plain colour" },
  prompt: { type: "string", description: "the full image prompt, 120-220 words" } } } } } } };
const ask = `You are art-directing illustrated posters for today's Daily Poster brief.
Story: "${brief.story.title}". ${brief.story.summary}
Headlines: ${brief.headlines.join(" | ")}
Palette (use only these, plus tints and shades of them): ${palette.join(", ")}. Highlight colour, for ONE small focal element only: ${hl ? hl.hex : "none"}.
The style, which every prompt must restate in its own words:
${style}

Write ${COUNT} different scenes. Each: a subject anyone connects to the story in a second (people, the key object, the place),
a DIFFERENT dramatic camera angle (very low looking up, very high looking down, fish-eye, a lone object in a big sky, a
one-point interior, a cutaway), portrait format 1:1.41, the named headline zone kept as flat plain colour with no detail,
the palette by hex, the highlight on one named small element, black ink line. If hands or faces appear, ask for correct
anatomy: five fingers, natural knuckles, full-length thumb. No text, letters, logos or signatures in the image. Never
name an artist. Start each prompt by saying it follows the attached style guide image (style only, not its subjects).`;
const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
  headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
  body: JSON.stringify({ model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5", max_tokens: 4000, tools: [tool], tool_choice: { type: "auto" },
    messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/png", data: guide.toString("base64") } }, { type: "text", text: `${ask}\n\nReply only by calling the scenes tool.` }] }] }) });
if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
const scenes = (await res.json()).content.find((c) => c.type === "tool_use")?.input?.scenes;
if (!scenes?.length) throw new Error("No scenes came back.");

// 4. the images
async function openai(prompt) {
  const fd = new FormData();
  fd.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"); fd.append("prompt", prompt); fd.append("size", "1024x1536"); fd.append("n", "1");
  fd.append("image[]", new Blob([guide], { type: "image/png" }), "style-guide.png");
  const r = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { authorization: `Bearer ${OPENAI}` }, body: fd });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return Buffer.from((await r.json()).data[0].b64_json, "base64");
}
async function gemini(prompt) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": GEMINI },
    body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "image/png", data: guide.toString("base64") } }, { text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "2:3" } } }) });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const part = (await r.json()).candidates?.[0]?.content?.parts?.find((p) => p.inline_data || p.inlineData);
  if (!part) throw new Error("Gemini returned no image");
  return Buffer.from((part.inline_data || part.inlineData).data, "base64");
}
const made = [];
for (const [i, s] of scenes.entries()) {
  const name = `scamp-${String(i + 1).padStart(2, "0")}.png`;
  try {
    const buf = OPENAI ? await openai(s.prompt) : await gemini(s.prompt);
    await sharp(buf).png().toFile(join(out, name));
    made.push({ file: name, ...s, model: OPENAI ? "openai" : "gemini" }); console.log(`Saved ${name}: ${s.angle} · ${s.headline}`);
  } catch (e) { console.warn(`Scene ${i + 1} failed: ${e.message}`); made.push({ file: null, ...s, error: e.message }); }
}
await writeFile(join(out, "scamps.json"), JSON.stringify({ date: brief.date, palette, highlight: hl || null, scenes: made }, null, 2) + "\n");
console.log(`${made.filter((m) => m.file).length} scamps for ${brief.date}`);
