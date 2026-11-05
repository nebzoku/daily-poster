// Keeps 2160 px copies of the day's museum and texture images on the site itself (2x, so
// they're sharp enough to design with in Figma).
// Some image hosts (The Met, for one) don't let other sites' pages fetch their files,
// so "Copy for Figma" would paste grey boxes in their place. Copies served from this
// site always work. Unsplash allows it and asks to be linked directly, so it's skipped.
// Copies older than KEEP_DAYS are deleted to keep the repo small.
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SITE = new URL("../site/", import.meta.url).pathname;
const DATA = join(SITE, "data");
const MEDIA = join(SITE, "media");
const KEEP_DAYS = 30;
const WIDTH = 2160;

async function copy(url, file) {
  const res = await fetch(url, { headers: { "user-agent": "daily-poster (github.com/nebzoku/daily-poster)" } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).rotate().resize({ width: WIDTH, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(file);
}

async function localise(date) {
  const path = join(DATA, `${date}.json`);
  const brief = JSON.parse(await readFile(path, "utf8"));
  const dir = join(MEDIA, date);
  let changed = false;
  for (const [key, prefix] of [["images", "image"], ["textures", "texture"]]) {
    for (const [i, it] of (brief[key] || []).entries()) {
      if ((it.source || "Unsplash") === "Unsplash") continue;
      const name = `${prefix}-${String(i + 1).padStart(2, "0")}-${WIDTH}.jpg`;
      const rel = `media/${date}/${name}`;
      if (it.local === rel && existsSync(join(SITE, rel))) continue;
      try {
        await mkdir(dir, { recursive: true });
        await copy(it.src || it.thumb, join(dir, name));
        it.local = rel;
        changed = true;
        console.log(`Saved ${rel} (${it.source})`);
      } catch (e) {
        console.warn(`Couldn't copy ${prefix} ${i + 1}: ${e.message}`);
      }
    }
  }
  // Tidy away copies this brief no longer points to (an older size, say).
  if (existsSync(dir)) {
    const keep = new Set([...(brief.images || []), ...(brief.textures || [])].map((it) => it.local).filter(Boolean));
    for (const o of brief.objects || []) { keep.add(o.image); keep.add(o.thumb); }   // the 3D renders (scripts/objects.mjs)
    for (const f of await readdir(dir)) if (!keep.has(`media/${date}/${f}`)) await rm(join(dir, f));
  }
  if (changed) {
    await writeFile(path, JSON.stringify(brief, null, 2) + "\n");
    // Keep latest.json in step if this is the newest brief.
    const latest = JSON.parse(await readFile(join(DATA, "latest.json"), "utf8"));
    if (latest.date === date) await writeFile(join(DATA, "latest.json"), JSON.stringify(brief, null, 2) + "\n");
  }
}

const files = (await readdir(DATA)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
for (const f of files) {
  const date = f.slice(0, 10);
  if (date >= cutoff) await localise(date);
}
// Drop copies past the cutoff, and their links.
if (existsSync(MEDIA)) {
  for (const d of await readdir(MEDIA)) {
    if (d >= cutoff) continue;
    await rm(join(MEDIA, d), { recursive: true, force: true });
    const path = join(DATA, `${d}.json`);
    if (existsSync(path)) {
      const b = JSON.parse(await readFile(path, "utf8"));
      for (const it of [...(b.images || []), ...(b.textures || [])]) delete it.local;
      await writeFile(path, JSON.stringify(b, null, 2) + "\n");
    }
    console.log(`Removed media/${d}`);
  }
}
