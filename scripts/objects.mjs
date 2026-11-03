// Three 3D objects for the day's brief, rendered in Blender as transparent PNGs.
//
// Claude picks three objects that could stand for the story (a boulder, an anchor, a tanker)
// and a material for each (rusted metal, polished steel, worn stone). Models come from
// Poly Pizza (CC0 and CC-BY only; needs POLY_PIZZA_KEY) and Poly Haven (CC0), materials and
// studio lighting from Poly Haven (CC0). Claude looks at the candidates and picks the best;
// when nothing fits, a shape made in Blender stands in. One view of each is rendered.
//
//   ANTHROPIC_API_KEY  required
//   POLY_PIZZA_KEY     optional: without it, only Poly Haven models and made shapes
//   BLENDER_PYTHON     the Python that has the bpy package (default: python3)
//   FORCE=1            render again even if today's brief already has objects
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { imageBlock } from "./lib/images.mjs";

const MODEL = "claude-sonnet-5-5";
const SITE = new URL("../site/", import.meta.url).pathname;
const DATA = join(SITE, "data");
const WORK = "/tmp/daily-poster-objects";
const RENDER = new URL("./blender/render.py", import.meta.url).pathname;
const UA = { "user-agent": "daily-poster (github.com/nebzoku/daily-poster)" };
const SHAPES = ["rock", "sphere", "cube", "cylinder", "ring", "slab"];
const HDRIS = ["brown_photostudio_02", "ferndale_studio_03", "cyclorama_hard_light", "blocky_photo_studio"];
const OK_LICENCE = (l) => /^CC0/i.test(l || "") || /^CC[- ]BY(?![- ]?(SA|ND|NC))/i.test(l || "");

async function json(url, headers = {}) {
  const res = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}
async function download(url, file) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function callTool(tool, content, maxTokens = 2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, tools: [tool], tool_choice: { type: "auto" },
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
  const m = text.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  throw new Error(`Claude did not call ${tool.name}.`);
}
const list = (v) => (Array.isArray(v) ? v : typeof v === "string" ? (() => { try { return JSON.parse(v); } catch { return []; } })() : []);

const IDEAS = {
  name: "objects",
  description: "Three objects to render in 3D for the day's poster brief.",
  input_schema: {
    type: "object",
    properties: {
      objects: {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "The object, one or two words: 'boulder', 'anchor', 'oil tanker'." },
            searches: { type: "array", items: { type: "string" }, description: "Two or three one-word or two-word search terms for a 3D model library, most specific first." },
            material: { type: "string", description: "The surface, in a few words: 'rusted metal', 'polished steel', 'weathered concrete'." },
            materialWords: { type: "array", items: { type: "string" }, description: "Two to four single words to find that surface in a texture library: 'rust', 'metal', 'corroded'." },
            metal: { type: "boolean", description: "Whether the surface should read as metal." },
            fallback: { type: "string", enum: SHAPES, description: "The simple shape to use if no model fits." },
          },
          required: ["name", "searches", "material", "materialWords", "metal", "fallback"],
        },
      },
    },
    required: ["objects"],
  },
};

const PICK = {
  name: "pick",
  description: "The chosen model and surface for each object.",
  input_schema: {
    type: "object",
    properties: {
      picks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            model: { type: ["string", "null"], description: "A model label like M1-3, or null if none fits well." },
            texture: { type: "string", description: "A texture label like T1-2." },
          },
          required: ["model", "texture"],
        },
      },
    },
    required: ["picks"],
  },
};

async function polyPizza(term) {
  if (!process.env.POLY_PIZZA_KEY) return [];
  try {
    const r = await json(`https://api.poly.pizza/v1/search/${encodeURIComponent(term)}?limit=10&format=glb`, { "X-Auth-Token": process.env.POLY_PIZZA_KEY });
    return (r.results || []).filter((m) => m.Download && OK_LICENCE(m.Licence) && !m.Animated).map((m) => ({
      source: "Poly Pizza", id: m.ID, title: m.Title, licence: m.Licence,
      creator: m.Creator?.Username || "", creatorUrl: m.Creator?.PURL || "", url: `https://poly.pizza/m/${m.ID}`,
      thumb: m.Thumbnail, glb: m.Download,
    }));
  } catch (e) { console.warn(`Poly Pizza search "${term}": ${e.message}`); return []; }
}

const words = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
function score(asset, terms) {
  const hay = [asset.name, ...(asset.tags || []), ...(asset.categories || [])].join(" ").toLowerCase();
  return terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
}

async function main() {
  const latest = JSON.parse(await readFile(join(DATA, "latest.json"), "utf8"));
  const date = latest.date;
  const path = join(DATA, `${date}.json`);
  const brief = JSON.parse(await readFile(path, "utf8"));
  if (brief.objects?.length && !process.env.FORCE) { console.log("Objects already rendered for", date); return; }
  if (!process.env.ANTHROPIC_API_KEY) { console.warn("No ANTHROPIC_API_KEY; skipping objects."); return; }

  // 1. Ideas
  const s = brief.story;
  const ideas = list((await callTool(IDEAS, `You are choosing three objects for a 3D render kit that goes with today's poster brief.
Story: "${s.title}". ${s.summary}
Headlines: ${brief.headlines.join(" / ")}

Pick three distinct physical objects that a designer could use as bold, iconic imagery on a poster about this story: things in the story, or that stand for it. Prefer simple, recognisable objects with strong silhouettes (an anchor, a boulder, a ship, a key, a flag, a chair) over scenes, people, animals or anything abstract. Give each a material that suits the story and renders well, leaning towards metal and stone (rusted iron, brushed steel, weathered concrete, polished brass, worn marble). Don't pick anything that would trivialise or sensationalise the story.`)).objects).slice(0, 3);
  if (ideas.length < 3) throw new Error("Claude gave fewer than three objects.");
  console.log("Objects:", ideas.map((o) => `${o.name} (${o.material})`).join(", "));

  // 2. Candidates
  const phModels = await json("https://api.polyhaven.com/assets?t=models").catch(() => ({}));
  const phTextures = await json("https://api.polyhaven.com/assets?t=textures").catch(() => ({}));
  const phThumb = (id) => `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=256&height=256`;
  const groups = [];
  for (const idea of ideas) {
    const searches = list(idea.searches).slice(0, 3);
    const models = [];
    for (const t of searches) for (const m of await polyPizza(t)) if (!models.some((x) => x.id === m.id)) models.push(m);
    const terms = searches.flatMap(words);
    Object.entries(phModels).map(([id, a]) => ({ id, a, n: score({ ...a, name: a.name || id }, terms) })).filter((x) => x.n > 0)
      .sort((p, q) => q.n - p.n).slice(0, 3)
      .forEach(({ id, a }) => models.push({ source: "Poly Haven", id, title: a.name || id, licence: "CC0", creator: "", url: `https://polyhaven.com/a/${id}`, thumb: phThumb(id) }));
    const mWords = list(idea.materialWords).flatMap(words);
    const textures = Object.entries(phTextures).map(([id, a]) => ({ id, a, n: score({ ...a, name: a.name || id }, mWords) }))
      .filter((x) => x.n > 0).sort((p, q) => q.n - p.n).slice(0, 6)
      .map(({ id, a }) => ({ id, title: a.name || id, thumb: phThumb(id), url: `https://polyhaven.com/a/${id}` }));
    groups.push({ idea, models: models.slice(0, 8), textures });
  }

  // 3. Claude looks and picks
  const content = [{ type: "text", text: `For each of three objects you'll see candidate 3D MODELS (M) and candidate SURFACE TEXTURES (T). The model will be rendered on its own on a transparent background, with the texture wrapped over it, so judge the model by its shape and silhouette only (ignore its colours). Pick the model that best reads as the object, clean and well made; answer null if none clearly is the object. Pick the texture that best matches the material described.` }];
  for (const [j, g] of groups.entries()) {
    content.push({ type: "text", text: `\nOBJECT ${j + 1}: ${g.idea.name}, in ${g.idea.material}.` });
    g.models = (await Promise.all(g.models.map(async (m) => ({ ...m, block: await imageBlock(m.thumb) })))).filter((m) => m.block);
    g.textures = (await Promise.all(g.textures.map(async (t) => ({ ...t, block: await imageBlock(t.thumb) })))).filter((t) => t.block);
    g.models.forEach((m, k) => content.push({ type: "text", text: `[M${j + 1}-${k + 1}] ${m.title}` }, m.block));
    g.textures.forEach((t, k) => content.push({ type: "text", text: `[T${j + 1}-${k + 1}] ${t.title}` }, t.block));
  }
  let picks = [];
  try { picks = list((await callTool(PICK, content)).picks); } catch (e) { console.warn("Pick failed:", e.message); }
  const at = (label, kind, j, arr) => { const m = String(label || "").match(new RegExp(`^${kind}(\\d+)-(\\d+)$`)); return m && +m[1] === j + 1 ? arr[+m[2] - 1] : null; };

  // 4. Download what's needed
  await rm(WORK, { recursive: true, force: true }); await mkdir(WORK, { recursive: true });
  const dir = join(SITE, "media", date); await mkdir(dir, { recursive: true });
  const hdriId = HDRIS[(brief.issue || 0) % HDRIS.length];
  let hdri = null;
  try { hdri = await download((await json(`https://api.polyhaven.com/files/${hdriId}`)).hdri["1k"].hdr.url, join(WORK, `${hdriId}.hdr`)); }
  catch (e) { console.warn("No studio lighting:", e.message); }
  const jobs = [], out = [];
  for (const [j, g] of groups.entries()) {
    const p = picks[j] || {};
    const model = at(p.model, "M", j, g.models);
    const tex = at(p.texture, "T", j, g.textures) || g.textures[0] || null;
    let modelFile = null;
    if (model) {
      try {
        if (model.source === "Poly Pizza") modelFile = await download(model.glb, join(WORK, `m${j}.glb`));
        else {
          const f = (await json(`https://api.polyhaven.com/files/${model.id}`)).gltf["1k"].gltf;
          modelFile = await download(f.url, join(WORK, `m${j}`, `${model.id}.gltf`));
          for (const [rel, inc] of Object.entries(f.include || {})) await download(inc.url, join(WORK, `m${j}`, rel));
        }
      } catch (e) { console.warn(`Model for ${g.idea.name}: ${e.message}`); modelFile = null; }
    }
    let texture = null;
    if (tex) {
      try {
        const files = await json(`https://api.polyhaven.com/files/${tex.id}`);
        const get = async (key) => (files[key]?.["1k"]?.jpg ? download(files[key]["1k"].jpg.url, join(WORK, `t${j}-${key}.jpg`)) : null);
        texture = { diff: await get("Diffuse"), rough: await get("Rough"), arm: (g.idea.metal ? await get("arm") : null), metal: !!g.idea.metal };
        if (!texture.diff) texture = null;
      } catch (e) { console.warn(`Texture for ${g.idea.name}: ${e.message}`); }
    }
    const file = join(dir, `object-${j + 1}.png`);
    jobs.push({ model: modelFile, shape: SHAPES.includes(g.idea.fallback) ? g.idea.fallback : "rock", seed: (brief.issue || 1) + j, texture, out: file, turn: 20 + j * 35 });
    out.push({ name: g.idea.name, material: g.idea.material, model: modelFile ? model : null, texture: texture ? tex : null, file });
  }

  // 5. Render
  const jobFile = join(WORK, "job.json");
  await writeFile(jobFile, JSON.stringify({ hdri, out_size: +(process.env.OBJECT_SIZE || 1080), samples: +(process.env.OBJECT_SAMPLES || 128), objects: jobs }));
  const py = process.env.BLENDER_PYTHON || "python3";
  const r = spawnSync(py, [RENDER, jobFile], { stdio: "inherit", timeout: 25 * 60 * 1000 });
  if (r.status !== 0) throw new Error(`Blender exited with ${r.status}`);

  // 6. Record them in the brief
  brief.objects = [];
  for (const [j, o] of out.entries()) {
    if (!existsSync(o.file)) continue;
    const thumb = join(dir, `object-${j + 1}-thumb.png`);
    await sharp(o.file).resize({ width: 540 }).png({ compressionLevel: 9, palette: false }).toFile(thumb);
    brief.objects.push({
      name: o.name, material: o.material,
      image: `media/${date}/object-${j + 1}.png`, thumb: `media/${date}/object-${j + 1}-thumb.png`,
      model: o.model ? { title: o.model.title, source: o.model.source, url: o.model.url, licence: o.model.licence, creator: o.model.creator, creatorUrl: o.model.creatorUrl || "" } : null,
      texture: o.texture ? { title: o.texture.title, url: o.texture.url } : null,
    });
  }
  await writeFile(path, JSON.stringify(brief, null, 2) + "\n");
  if (latest.date === date) await writeFile(join(DATA, "latest.json"), JSON.stringify(brief, null, 2) + "\n");
  console.log(`Rendered ${brief.objects.length} objects for ${date}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
