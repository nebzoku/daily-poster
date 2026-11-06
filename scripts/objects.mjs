// Three 3D objects for the day's brief, rendered in Blender as transparent PNGs.
// Models: Sketchfab (CC0 and CC BY, needs SKETCHFAB_TOKEN) and Poly Haven (CC0).
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
//   OBJECT_REQUEST     one object on request (e.g. "beaver"), saved as media/<date>/extra-<name>.png
//                      and left out of the brief
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
// Thumbnails for Claude to look at. Some hosts serve them without an image content type
// (or as WebP), so read the bytes with sharp and send a small PNG either way.
async function thumbBlock(url) {
  try {
    const res = await fetch(url, { headers: headersFor(url), signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer())).resize(256, 256, { fit: "inside" }).png().toBuffer();
    return { type: "image", source: { type: "base64", media_type: "image/png", data: png.toString("base64") } };
  } catch { return null; }
}

const MODEL = "claude-sonnet-5-5";
const SITE = new URL("../site/", import.meta.url).pathname;
const DATA = join(SITE, "data");
const WORK = "/tmp/daily-poster-objects";
const RENDER = new URL("./blender/render.py", import.meta.url).pathname;
const UA = { "user-agent": "daily-poster (github.com/nebzoku/daily-poster)" };
// Requests to Poly Pizza's file host carry our API key, in case downloads need it.
const headersFor = (url) => (/poly\.pizza/.test(url) && process.env.POLY_PIZZA_KEY ? { ...UA, "X-Auth-Token": process.env.POLY_PIZZA_KEY } : UA);
const SHAPES = ["rock", "sphere", "cube", "cylinder", "ring", "slab"];
const HDRIS = ["brown_photostudio_02", "ferndale_studio_03", "cyclorama_hard_light", "blocky_photo_studio"];
const OK_LICENCE = (l) => /^CC0/i.test(l || "") || /^CC[- ]BY(?![- ]?(SA|ND|NC))/i.test(l || "");

async function json(url, headers = {}) {
  const res = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}
async function download(url, file) {
  const res = await fetch(url, { headers: headersFor(url), signal: AbortSignal.timeout(60000) });
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
            texture: { type: "string", description: "A texture label like T1-2, or \"own\" to keep the chosen model's own surface when its picture already shows the material described." },
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
    const r = await json(`https://api.poly.pizza/v1/search/${encodeURIComponent(term)}?limit=12`, { "X-Auth-Token": process.env.POLY_PIZZA_KEY });
    const all = r.results || [];
    const ok = all.filter((m) => m.Download && OK_LICENCE(m.Licence) && !m.Animated);
    console.log(`Poly Pizza "${term}": ${all.length} found, ${ok.length} usable${all[0] ? ` (e.g. ${all[0].Title}, ${all[0].Licence})` : ""}`);
    return ok.map((m) => ({
      source: "Poly Pizza", id: m.ID, title: m.Title, licence: m.Licence,
      creator: m.Creator?.Username || "", creatorUrl: m.Creator?.PURL || "", url: `https://poly.pizza/m/${m.ID}`,
      thumb: m.Thumbnail, glb: m.Download, about: [m.Description, (m.Tags || []).join(" ")].filter(Boolean).join(" ").slice(0, 160),
    }));
  } catch (e) { console.warn(`Poly Pizza search "${term}": ${e.message}`); return []; }
}

// Sketchfab: a large library; we only use models its makers mark as downloadable under
// CC0 or CC BY (credited). Searching is public; downloading needs SKETCHFAB_TOKEN.
const SKETCHFAB_OK = (l) => /^(cc0|by)$/i.test(l?.slug || "") || /^CC0|^CC Attribution$/i.test(l?.label || "");
async function sketchfab(term) {
  if (!process.env.SKETCHFAB_TOKEN) return [];
  try {
    const r = await json(`https://api.sketchfab.com/v3/search?type=models&downloadable=true&count=24&q=${encodeURIComponent(term)}`);
    const all = r.results || [];
    const ok = all.filter((m) => SKETCHFAB_OK(m.license) && (m.faceCount || 0) < 400000);
    console.log(`Sketchfab "${term}": ${all.length} found, ${ok.length} usable`);
    return ok.slice(0, 8).map((m) => {
      const imgs = (m.thumbnails?.images || []).slice().sort((a, b) => a.width - b.width);
      const thumb = (imgs.find((i) => i.width >= 200) || imgs[imgs.length - 1] || {}).url;
      return { source: "Sketchfab", id: m.uid, title: m.name, licence: m.license?.label || "",
        creator: m.user?.displayName || m.user?.username || "", creatorUrl: m.user?.profileUrl || "",
        url: m.viewerUrl || `https://sketchfab.com/3d-models/${m.uid}`, thumb };
    }).filter((m) => m.thumb);
  } catch (e) { console.warn(`Sketchfab search "${term}": ${e.message}`); return []; }
}
async function sketchfabFile(uid, file) {
  const r = await json(`https://api.sketchfab.com/v3/models/${uid}/download`, { authorization: `Token ${process.env.SKETCHFAB_TOKEN}` });
  if (!r.glb?.url) throw new Error("no GLB offered");
  return download(r.glb.url, file);
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
  const want = (process.env.OBJECT_REQUEST || "").trim();
  const n = want ? 1 : 3;
  if (brief.objects?.length && !process.env.FORCE && !want) { console.log("Objects already rendered for", date); return; }
  if (!process.env.ANTHROPIC_API_KEY) { console.warn("No ANTHROPIC_API_KEY; skipping objects."); return; }

  // 1. Ideas, avoiding objects from the last few days
  const s = brief.story;
  const { readdir } = await import("node:fs/promises");
  const earlier = (await readdir(DATA)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f < `${date}.json`).sort().slice(-5);
  const usedObjects = [];
  for (const f of earlier) { try { for (const o of JSON.parse(await readFile(join(DATA, f), "utf8")).objects || []) usedObjects.push(o.name); } catch {} }
  const ideas = list((await callTool(IDEAS, want ? `A designer working on today's poster brief has asked for one 3D object: "${want}". Return exactly that one object, with search terms for finding a model of it. If it's an animal or a natural thing, give it its natural material (fur, bark, feathers) rather than metal or stone, so its own surface is kept.
Story: "${brief.story.title}". ${brief.story.summary}` : `You are choosing three objects for a 3D render kit that goes with today's poster brief.
Story: "${s.title}". ${s.summary}
Headlines: ${brief.headlines.join(" / ")}

Pick three distinct physical objects that a designer could use as bold, iconic imagery on a poster about this story: things in the story, or that stand for it. Prefer simple, recognisable objects with strong silhouettes (an anchor, a boulder, a ship, a key, a flag, a chair) over scenes, people, animals or anything abstract. Give each a material that suits the story and renders well, leaning towards metal and stone (rusted iron, brushed steel, weathered concrete, polished brass, worn marble). Don't pick anything that would trivialise or sensationalise the story.${usedObjects.length ? `
These were used in the last few days, so pick different objects: ${[...new Set(usedObjects)].join(", ")}.` : ""}`)).objects).slice(0, n);
  if (ideas.length < n) throw new Error(`Claude gave fewer than ${n} objects.`);
  console.log("Objects:", ideas.map((o) => `${o.name} (${o.material})`).join(", "));

  // 2. Candidates
  const phModels = await json("https://api.polyhaven.com/assets?t=models").catch(() => ({}));
  const phTextures = await json("https://api.polyhaven.com/assets?t=textures").catch(() => ({}));
  const phThumb = (id) => `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=256&height=256`;
  const groups = [];
  for (const idea of ideas) {
    const searches = list(idea.searches).slice(0, 3);
    const models = [];
    for (const t of searches) for (const m of await sketchfab(t)) if (!models.some((x) => x.id === m.id)) models.push(m);
    // Poly Pizza's file host refuses downloads from GitHub's servers, so it's off unless that changes.
    if (process.env.POLY_PIZZA_DOWNLOADS) for (const t of searches) for (const m of await polyPizza(t)) if (!models.some((x) => x.id === m.id)) models.push(m);
    const terms = searches.flatMap(words);
    Object.entries(phModels).map(([id, a]) => ({ id, a, n: score({ ...a, name: a.name || id }, terms) })).filter((x) => x.n > 0)
      .sort((p, q) => q.n - p.n).slice(0, 3)
      .forEach(({ id, a }) => models.push({ source: "Poly Haven", id, title: a.name || id, licence: "CC0", creator: "", url: `https://polyhaven.com/a/${id}`, thumb: phThumb(id) }));
    const mWords = list(idea.materialWords).flatMap(words);
    const textures = Object.entries(phTextures).map(([id, a]) => ({ id, a, n: score({ ...a, name: a.name || id }, mWords) }))
      .filter((x) => x.n > 0).sort((p, q) => q.n - p.n).slice(0, 6)
      .map(({ id, a }) => ({ id, title: a.name || id, thumb: phThumb(id), url: `https://polyhaven.com/a/${id}` }));
    groups.push({ idea, models: models.slice(0, 10), textures });
  }

  // 3. Claude looks and picks
  const content = [{ type: "text", text: `For each of three objects you'll see candidate 3D MODELS (M) and candidate SURFACE TEXTURES (T). The model will be rendered on its own on a transparent background, with the texture wrapped over it, so judge the model by its shape and silhouette only (ignore its colours). Pick the model that best reads as the object, clean and well made; answer null if none clearly is the object. It must be the object on its own: never a scene, environment, room, diorama, game level or a group of things, even if the object is in it. Some models come without a picture; judge those by their title and tags, and only pick one if it's clearly the object. Pick the texture that best matches the material described; if the chosen model's own surface already looks right for it (a real satellite's foil and panels, say), answer "own" to keep it. Only pick a texture that genuinely suits the material: never wood for stone or crystal, for example.` }];
  for (const [j, g] of groups.entries()) {
    content.push({ type: "text", text: `\nOBJECT ${j + 1}: ${g.idea.name}, in ${g.idea.material}.` });
    // Poly Pizza's file host refuses thumbnail requests from here, so those models go by their title and tags.
    g.models = (await Promise.all(g.models.map(async (m) => ({ ...m, block: await thumbBlock(m.thumb) })))).filter((m) => m.block || m.source === "Poly Pizza");
    g.textures = (await Promise.all(g.textures.map(async (t) => ({ ...t, block: await thumbBlock(t.thumb) })))).filter((t) => t.block);
    g.models.forEach((m, k) => content.push({ type: "text", text: `[M${j + 1}-${k + 1}] ${m.title}${m.about ? ` — ${m.about}` : ""}${m.block ? "" : " (no picture)"}` }, ...(m.block ? [m.block] : [])));
    g.textures.forEach((t, k) => content.push({ type: "text", text: `[T${j + 1}-${k + 1}] ${t.title}` }, t.block));
  }
  let picks = [];
  try { picks = list((await callTool(PICK, content)).picks); } catch (e) { console.warn("Pick failed:", e.message); }
  groups.forEach((g, j) => console.log(`${g.idea.name}: ${g.models.length} models, ${g.textures.length} textures; picked model ${picks[j]?.model ?? "none"}, texture ${picks[j]?.texture ?? "none"}`));
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
    const keep = p.texture === "own" && !!model;
    const tex = keep ? null : at(p.texture, "T", j, g.textures) || g.textures[0] || null;
    let modelFile = null;
    if (model) {
      try {
        if (model.source === "Sketchfab") modelFile = await sketchfabFile(model.id, join(WORK, `m${j}.glb`));
        else if (model.source === "Poly Pizza") modelFile = await download(model.glb, join(WORK, `m${j}.glb`));
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
    const slug = want.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const file = join(dir, want ? `extra-${slug}.png` : `object-${j + 1}.png`);
    jobs.push({ keep: keep && !!modelFile, model: modelFile, shape: SHAPES.includes(g.idea.fallback) ? g.idea.fallback : "rock", seed: (brief.issue || 1) + j, texture, out: file, turn: 20 + j * 35 });
    out.push({ name: g.idea.name, material: g.idea.material, model: modelFile ? model : null, texture: texture ? tex : null, file });
  }

  // 5. Render
  const jobFile = join(WORK, "job.json");
  await writeFile(jobFile, JSON.stringify({ hdri, out_size: +(process.env.OBJECT_SIZE || 2160), samples: +(process.env.OBJECT_SAMPLES || 96), objects: jobs }));
  const py = process.env.BLENDER_PYTHON || "python3";
  const r = spawnSync(py, [RENDER, jobFile], { stdio: "inherit", timeout: 25 * 60 * 1000 });
  if (r.status !== 0) throw new Error(`Blender exited with ${r.status}`);

  if (want) { for (const o of out) console.log(existsSync(o.file) ? `Rendered ${o.file.slice(SITE.length + 1)} (${o.model ? `${o.model.title}, ${o.model.source}, ${o.model.licence}${o.model.creator ? `, by ${o.model.creator}` : ""}` : "no model found; made shape"})` : "Nothing rendered."); return; }

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
