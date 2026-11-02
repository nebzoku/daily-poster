// Image sources for the brief. Each returns candidates in one shape:
// { id, source, licence, title, credit, creditUrl, page, alt, thumb, src }
// thumb is small (for Claude to look at and for the page); src is large.

const UTM = "utm_source=daily_poster&utm_medium=referral";
const UA = { "user-agent": "daily-poster/1.0 (+https://github.com/nebzoku/daily-poster)" };

async function json(url, headers = {}) {
  const res = await fetch(url, { headers: { ...UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// Unsplash: modern photography. Needs UNSPLASH_ACCESS_KEY.
export async function unsplash(query, n = 6) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${n + 4}&content_filter=high`;
  const { results } = await json(url, { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" });
  return results.filter((p) => !p.premium && !p.plus).slice(0, n).map((p) => ({
    id: `unsplash:${p.id}`,
    source: "Unsplash",
    licence: "Unsplash License",
    title: p.alt_description || p.description || query,
    credit: p.user.name,
    creditUrl: `${p.user.links.html}?${UTM}`,
    page: `${p.links.html}?${UTM}`,
    alt: p.alt_description || p.description || query,
    thumb: `${p.urls.raw}&w=480&q=70&fm=jpg`,
    src: `${p.urls.raw}&w=1600&q=80&fm=jpg`,
    query,
  }));
}

// Art Institute of Chicago: public-domain works, CC0. No key needed.
export async function artic(query, n = 6) {
  const fields = "id,title,artist_title,artist_display,date_display,image_id,thumbnail,is_public_domain";
  const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&query[term][is_public_domain]=true&limit=${n + 4}&fields=${fields}`;
  const { data, config } = await json(url, { "AIC-User-Agent": UA["user-agent"] });
  const iiif = (config && config.iiif_url) || "https://www.artic.edu/iiif/2";
  return data.filter((a) => a.image_id && a.is_public_domain).slice(0, n).map((a) => ({
    id: `artic:${a.id}`,
    source: "Art Institute of Chicago",
    licence: "CC0",
    title: `${a.title}${a.date_display ? `, ${a.date_display}` : ""}`,
    credit: a.artist_title || "Unknown artist",
    creditUrl: `https://www.artic.edu/artworks/${a.id}`,
    page: `https://www.artic.edu/artworks/${a.id}`,
    alt: (a.thumbnail && a.thumbnail.alt_text) || a.title,
    thumb: `${iiif}/${a.image_id}/full/400,/0/default.jpg`,
    src: `${iiif}/${a.image_id}/full/1686,/0/default.jpg`,
    query,
  }));
}

// The Met: public-domain works, CC0. No key needed. Search returns IDs, so each object is a second call.
export async function met(query, n = 6) {
  const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(query)}`;
  const { objectIDs } = await json(url);
  const out = [];
  for (const id of (objectIDs || []).slice(0, n * 3)) {
    if (out.length >= n) break;
    try {
      const o = await json(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
      if (!o.isPublicDomain || !o.primaryImageSmall) continue;
      out.push({
        id: `met:${id}`,
        source: "The Met",
        licence: "CC0",
        title: `${o.title}${o.objectDate ? `, ${o.objectDate}` : ""}`,
        credit: o.artistDisplayName || o.culture || "Unknown artist",
        creditUrl: o.objectURL,
        page: o.objectURL,
        alt: o.title,
        thumb: o.primaryImageSmall,
        src: o.primaryImage || o.primaryImageSmall,
        query,
      });
    } catch {}
  }
  return out;
}

// ---------- textures ----------

// Poly Haven: CC0 material textures. No key; the API asks for a "Powered by Poly Haven" credit.
let polyCache = null;
export async function polyhaven(query, n = 5) {
  polyCache ||= await json("https://api.polyhaven.com/assets?t=textures");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = Object.entries(polyCache).map(([id, a]) => {
    const hay = [a.name, ...(a.categories || []), ...(a.tags || [])].join(" ").toLowerCase();
    return [id, a, words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0)];
  }).filter((x) => x[2] > 0).sort((a, b) => b[2] - a[2] || (b[1].download_count || 0) - (a[1].download_count || 0));
  return scored.slice(0, n).map(([id, a]) => ({
    id: `polyhaven:${id}`,
    source: "Poly Haven",
    licence: "CC0",
    title: a.name,
    credit: (a.authors && Object.keys(a.authors).join(", ")) || "Poly Haven",
    creditUrl: `https://polyhaven.com/a/${id}`,
    page: `https://polyhaven.com/a/${id}`,
    alt: `${a.name} texture`,
    thumb: `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=480&height=480`,
    src: null,     // filled in for the textures that get picked
    polyId: id,
    query,
  }));
}

// The flat 2K colour map for a picked Poly Haven texture.
export async function polyhavenFile(t) {
  try {
    const f = await json(`https://api.polyhaven.com/files/${t.polyId}`);
    const d = f.Diffuse || f.diffuse || f.Color || {};
    const res = d["2k"] || d["1k"] || Object.values(d)[0];
    const file = res && (res.jpg || res.png);
    return file ? file.url : t.thumb;
  } catch {
    return t.thumb;
  }
}

export async function gatherTextures(queries) {
  const jobs = [
    ...queries.map((q) => polyhaven(q, 5)),
    ...queries.map((q) => unsplash(`${q} texture`, 3)),
  ];
  const settled = await Promise.allSettled(jobs);
  const seen = new Set();
  const all = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") { console.warn("Texture source failed:", s.reason && s.reason.message); continue; }
    for (const c of s.value) if (!seen.has(c.id)) { seen.add(c.id); all.push(c); }
  }
  return all;
}

// Gather candidates from every source, tolerating any one of them failing.
export async function gatherCandidates(photoQueries, archiveQueries) {
  const jobs = [
    ...photoQueries.map((q) => unsplash(q, 6)),
    ...archiveQueries.map((q) => artic(q, 5)),
    ...archiveQueries.map((q) => met(q, 4)),
  ];
  const settled = await Promise.allSettled(jobs);
  const seen = new Set();
  const all = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") { console.warn("Image source failed:", s.reason && s.reason.message); continue; }
    for (const c of s.value) if (!seen.has(c.id)) { seen.add(c.id); all.push(c); }
  }
  return all;
}

// Without Claude's pick, interleave the sources so the strip still mixes photos and archive.
export function interleave(cands, n) {
  const by = {};
  for (const c of cands) (by[c.source] ||= []).push(c);
  const lists = Object.values(by);
  const out = [];
  for (let i = 0; out.length < n && lists.some((l) => l[i]); i++)
    for (const l of lists) if (l[i] && out.length < n) out.push(l[i]);
  return out;
}
