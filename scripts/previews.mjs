// Short looping previews of moving posters, for the archive grid: three seconds, no sound,
// small enough to play straight away. Made once per video (needs ffmpeg).
// Set "previewAt": <seconds> on a showcase entry to choose where the snippet starts;
// otherwise it's taken from 40% of the way through. "previewLength": <seconds> sets its length (default 3): for a
// poster that loops, set previewAt 0 and previewLength to one loop, so the snippet loops seamlessly with no jump.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SITE = new URL("../site/", import.meta.url).pathname, FILE = join(SITE, "data", "showcase.json");
const showcase = JSON.parse(await readFile(FILE, "utf8"));
const todo = showcase.filter((x) => x.video && !(x.preview && existsSync(join(SITE, x.preview))));
const redo = process.argv.includes("--redo");   // remake existing previews (after changing previewAt/previewLength)
if (process.argv.includes("--check")) { console.log(todo.length); process.exit(0); }
let changed = false;
for (const x of showcase) {
  if (!x.video) continue;
  const out = x.video.replace(/\.[a-z0-9]+$/i, "-preview.mp4");
  if (!redo && x.preview === out && existsSync(join(SITE, out))) continue;
  const src = join(SITE, x.video);
  if (!existsSync(src)) { console.warn(`${x.video} is missing; skipping.`); continue; }
  const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).toString().trim() || 6;
  const len = x.previewLength ?? 3, at = Math.max(0, Math.min(x.previewAt ?? dur * 0.4, dur - len));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(at), "-t", String(len), "-i", src, "-an",
    "-vf", "scale=720:-2:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(SITE, out)]);
  x.preview = out; changed = true;
  console.log(`Preview for ${x.title}: ${out} (from ${at.toFixed(1)}s)`);
}
if (changed) await writeFile(FILE, JSON.stringify(showcase, null, 2) + "\n");
else console.log("No new previews.");
