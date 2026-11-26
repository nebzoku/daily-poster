// The illustration machine (Ben, 26 Nov 2026: recreate his Weavy "Illustration Machine" flow in the daily repo).
// Weavy's steps, and what does them here:
//   1. Style Guide Maker: four reference images in a 2×2 grid → Ben's reference illustrations (other artists' work, so
//      kept ENCRYPTED in experiments/claude-posters/illo-refs/refs.tar.enc and unpacked by the workflow with the
//      ILLO_REFS_KEY secret into ILLO_REFS_DIR; never committed as images). A different selection each run. Without
//      the key, our own illustrations that worked (lab/illo-guide/) stand in. Ben, 26 Nov: once we have enough of our
//      own that we're happy with, they replace his references.
//   2. Style Describer: a vision model writes a style description, tags and hex colours → written once, in words, in
//      experiments/claude-posters/illo-style.md (so no other artist's pictures are stored or sent).
//   3. Illustration Machine: an LLM writes N image prompts from a subject + the style → Claude reads today's brief and
//      writes N scene prompts: subject from the story, a dramatic camera angle each, the day's palette and highlight,
//      and where the headline will sit (kept as plain colour), plus the hands/faces rule.
//   4. GPT Image / Nano Banana with the style guide as the reference image → Google Nano Banana 2.1
//      (GEMINI_API_KEY, model gemini-nano-banana-2.1 through the Interactions API; up to 14 reference images, so the
//      references go in individually as well as the grid), or OpenAI (OPENAI_API_KEY) if that's the key set.
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

// 1. the style guide: Ben's references when unlocked, else our own; a different pick each date (seeded)
const RD = process.env.ILLO_REFS_DIR, useRefs = RD && existsSync(RD);
const gdir = useRefs ? RD : join(CP, "lab", "illo-guide");
const all = (await readdir(gdir)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
let sd = [...brief.date].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
const rnd = () => ((sd = (sd * 1103515245 + 12345) >>> 0) / 4294967296);
// Ben's references (8, shuffled by date) plus the illustrations of ours he has kept (lab/illo-guide, up to 6): the
// reference images can go in 14 at a time. As more of ours are kept they take over; then the references go.
const ours = (await readdir(join(CP, "lab", "illo-guide"))).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const pick = useRefs ? [...all].sort(() => rnd() - 0.5).slice(0, 8) : all.slice(0, 4);
const oursPick = useRefs ? [...ours].sort(() => rnd() - 0.5).slice(0, 6) : [];
const files = pick.slice(0, 4);
console.log(`Style guide from ${useRefs ? "Ben's references" : "our own illustrations"}: ${pick.join(", ")}`);
const refImgs = await Promise.all([...pick.map((f) => join(gdir, f)), ...oursPick.map((f) => join(CP, "lab", "illo-guide", f))]
  .map((f) => sharp(f).resize(768, 768, { fit: "inside" }).jpeg({ quality: 85 }).toBuffer()));
if (oursPick.length) console.log(`Plus ours: ${oursPick.join(", ")}`);
const tiles = await Promise.all(files.map((f) => sharp(join(gdir, f)).resize(512, 512, { fit: "cover" }).toBuffer()));
const guide = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: "#ffffff" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % 2) * 512, top: Math.floor(i / 2) * 512 }))).png().toBuffer();
await mkdir(out, { recursive: true });
if (!useRefs) await writeFile(join(out, "style-guide.png"), guide);   // Ben's references are never written to the repo

// 2. the style description
const style = await readFile(join(CP, "illo-style.md"), "utf8");

// 3. the prompts, from Claude
const palette = [...brief.palette.colours, ...(brief.always || [])], hl = brief.highlight || brief.pop;
const tool = { name: "scenes", description: "Image prompts for illustrated posters.", input_schema: { type: "object", required: ["scenes"], properties: { scenes: { type: "array", minItems: COUNT, maxItems: COUNT, items: { type: "object", required: ["headline", "angle", "headlineZone", "highlightElement", "prompt"], properties: {
  headline: { type: "string", description: "which of the brief's headlines this scene is for" },
  angle: { type: "string", description: "the camera move, e.g. worm's-eye, high angle, fish-eye street, lone object in sky, interior one-point" },
  headlineZone: { type: "string", enum: ["top", "bottom", "top-and-bottom", "left", "right"], description: "where the headline will sit; that area must be plain colour" },
  highlightElement: { type: "string", description: "the ONE small focal element painted in the highlight colour (a ball, a hat, a sign, a lamp, a door)" },
  prompt: { type: "string", description: "the full image prompt, 120-220 words" } } } } } } };
const ask = `You are art-directing illustrated posters for today's Daily Poster brief.
Story: "${brief.story.title}". ${brief.story.summary}
Headlines: ${brief.headlines.join(" | ")}
Palette (use only these, plus tints and shades of them): ${palette.join(", ")}.
Highlight colour: ${hl ? `${hl.name} ${hl.hex}` : "none"}. EVERY scene must use it, on exactly one small focal element (the thing the eye should land on), and nowhere else.
The style, which every prompt must restate in its own words:
${style}

Write ${COUNT} different scenes. Each: a subject anyone connects to the story in a second (people, the key object, the place),
a DIFFERENT dramatic camera angle (very low looking up, very high looking down, fish-eye, a lone object in a big sky, a
one-point interior, a cutaway), portrait format 1:1.41, the named headline zone kept as flat plain colour with no detail,
the palette by hex, black ink line, and the highlight stated plainly in the prompt as: "The <element> is solid ${hl ? hl.name.toLowerCase() : ""} (${hl ? hl.hex : ""}), the only ${hl ? hl.name.toLowerCase() : ""} thing in the whole image; it is the focal point." If hands or faces appear, ask for correct
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
// the first image found anywhere in a response (the Interactions API's shape varies by SDK version)
function findImage(o) {
  if (!o || typeof o !== "object") return null;
  const mt = o.mime_type || o.mimeType;
  if (typeof o.data === "string" && o.data.length > 1000 && (!mt || /^image\//.test(mt))) return o.data;
  for (const v of Object.values(o)) { const r = findImage(v); if (r) return r; }
  return null;
}
async function gemini(prompt) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1";
  const refs = refImgs.map((b) => ({ type: "image", mime_type: "image/jpeg", data: b.toString("base64") }));
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", { method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": GEMINI },
    body: JSON.stringify({ model, input: [...refs, { type: "text", text: `${prompt}\n\nThe attached images are style references only: match their line, colour treatment and rendering, never their subjects, characters or compositions.` }],
      response_format: { type: "image", aspect_ratio: "2:3", image_size: process.env.GEMINI_IMAGE_SIZE || "2K" } }) });
  const body = await r.text();
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${body.slice(0, 400)}`);
  const data = findImage(JSON.parse(body));
  if (!data) throw new Error(`Gemini returned no image: ${body.slice(0, 400)}`);
  return Buffer.from(data, "base64");
}
const made = [];
for (const [i, s] of scenes.entries()) {
  const name = `scamp-${String(i + 1).padStart(2, "0")}.png`;
  try {
    const buf = GEMINI ? await gemini(s.prompt) : await openai(s.prompt);
    await sharp(buf).png().toFile(join(out, name));
    made.push({ file: name, ...s, model: OPENAI && !GEMINI ? "openai" : process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1", style: useRefs ? "refs" : "own" }); console.log(`Saved ${name}: ${s.angle} · ${s.headline}`);
  } catch (e) { console.warn(`Scene ${i + 1} failed: ${e.message}`); made.push({ file: null, ...s, error: e.message }); }
}
await writeFile(join(out, "scamps.json"), JSON.stringify({ date: brief.date, palette, highlight: hl || null, scenes: made }, null, 2) + "\n");
console.log(`${made.filter((m) => m.file).length} scamps for ${brief.date}`);
