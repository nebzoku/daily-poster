// Daily Poster: renders one day's brief from data/<date>.json.
(() => {
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, ...kids) => {
    const svg = ["svg", "g", "rect", "line", "text", "path"].includes(tag);
    const n = svg ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.setAttribute("class", v);
      else if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const k of kids) if (k != null) n.append(k);
    return n;
  };

  // OKLCH hues of the 12 wheel steps (matches scripts/lib/palette.mjs).
  const WHEEL = [
    ["Red", 27], ["Orange", 55], ["Yellow", 95], ["Lime", 125], ["Green", 145], ["Jade", 165],
    ["Teal", 195], ["Blue", 250], ["Indigo", 275], ["Violet", 300], ["Magenta", 330], ["Rose", 5],
  ];

  const state = { h: 0, s: 0, bg: null, img: 0, grid: true };
  let brief, index, palette;

  const pad = (n) => String(n).padStart(3, "0");
  const fmt = (iso, opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...opts }).format(new Date(iso));
  const noon = (d) => d + "T12:00:00Z";
  const dots = (s) => s.replace(/\//g, ".");
  const words = (s) => s.trim().split(/\s+/).length;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function luminance(hex) {
    const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = rgb(hex).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const ink = (hex) => (luminance(hex) > 0.22 ? "#000000" : "#FFFFFF");

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 1800);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg || `Copied ${text}`); }
    catch { toast("Couldn't copy here. Try the live site."); }
  }

  // ---------- grid geometry, in 1080 × 1920 px ----------
  function geometry() {
    const g = brief.grid;
    const [W, H] = g.size;
    const short = Math.min(W, H);
    const m = g.margin * short, gut = g.gutter * short;
    const col = (W - 2 * m - (g.columns - 1) * gut) / g.columns;
    const row = (H - 2 * m - (g.rows - 1) * gut) / g.rows;
    const x = (c) => m + (c - 1) * (col + gut);               // left of column c
    const y = (r) => m + (r - 1) * (row + gut);               // top of row r
    const span = (a, b, size) => (b - a + 1) * size + (b - a) * gut;
    return { W, H, m, gut, col, row, cols: g.columns, rows: g.rows, x, y,
      area: (c1, c2, r1, r2) => ({ x: x(c1), y: y(r1), w: span(c1, c2, col), h: span(r1, r2, row) }) };
  }
  // The suggested layout, shared by the proof, the diagram and the Figma copy.
  const ZONES = [
    { name: "Image", c: [1, 6], r: [1, 6], o: 0.12 },
    { name: "Headline", c: [1, 6], r: [7, 10], o: 0.3 },
    { name: "Subline", c: [1, 4], r: [11, 11], o: 0.2 },
    { name: "Date · time · source", c: [1, 6], r: [12, 12], o: 0.12 },
  ];

  // ---------- info overlay ----------
  function setupInfo() {
    const info = $("info");
    let opener = null;
    const open = (e) => { opener = e.currentTarget; info.hidden = false; document.body.style.overflow = "hidden"; $("info-close").focus(); };
    const close = () => { info.hidden = true; document.body.style.overflow = ""; if (opener) opener.focus(); };
    $("info-open").addEventListener("click", open);
    $("info-open-2").addEventListener("click", open);
    $("info-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !info.hidden) close(); });
  }

  // ---------- rendering ----------
  function renderTop() {
    document.title = `No. ${pad(brief.issue)} · ${brief.headlines[0]} · Daily Poster`;
    $("issue").textContent = `No. ${pad(brief.issue)}`;
    const i = index.findIndex((x) => x.date === brief.date);
    const link = (a, item) => {
      if (item) { a.href = `?d=${item.date}`; a.removeAttribute("aria-disabled"); }
      else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); }
    };
    link($("prev"), index[i + 1]);
    link($("next"), index[i - 1]);
  }

  function renderStory() {
    const s = brief.story;
    const day = fmt(noon(brief.date), { weekday: "short", day: "numeric", month: "short" });
    $("kicker").replaceChildren(el("i", { class: "dot", "aria-hidden": "true" }),
      `No. ${pad(brief.issue)} · ${day} · ${brief.colour.name} · ${s.source}`);
    $("story-title").textContent = s.title;
    $("story-link").href = s.url;
    $("story-summary").textContent = s.summary;
    const when = fmt(s.published, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    $("story-source").replaceChildren(`${s.source} · ${when} · `, el("a", { href: s.url, target: "_blank", rel: "noopener" }, "Read the story ↗"));
  }

  function renderOptions(id, list, key, meta) {
    $(id).replaceChildren(...list.map((t, i) =>
      el("button", {
        type: "button", class: "opt", "aria-pressed": String(state[key] === i),
        onclick: () => { state[key] = i; renderOptions(id, list, key, meta); renderProof(); renderShare(); },
      }, el("span", { class: "txt" }, t), el("span", { class: "meta" }, meta(t, i)))
    ));
  }

  function renderColour() {
    const idx = WHEEL.findIndex(([n]) => n === brief.colour.name);
    $("wheel").replaceChildren(...WHEEL.map(([n, h], i) =>
      el("i", { class: i === idx ? "on" : "", title: n, style: `background: oklch(0.7 0.16 ${h})` })));
    $("wheel-key").replaceChildren(`${brief.colour.yesterday} yesterday · `, el("b", {}, `${brief.colour.name} today`), ` · ${brief.colour.tomorrow} tomorrow`);
    const chip = (hex, fixed) => el("button", {
      type: "button", class: "sw" + (fixed ? " fixed" : ""), "aria-pressed": String(state.bg === hex),
      "aria-label": `${hex}: try behind the proof and copy`,
      onclick: () => { state.bg = hex; renderColour(); renderProof(); copy(hex); },
    }, el("span", { class: "chip", style: `background:${hex}` }), el("span", { class: "hex" }, hex));
    $("swatches").replaceChildren(...palette.colours.map((c) => chip(c, false)), ...brief.always.map((c) => chip(c, true)));
  }

  function renderType() {
    const t = brief.type;
    $("pair-css").href = t.css;
    const block = (family, role, url) => el("div", { class: "spec-type" },
      el("span", { class: "aa", style: `font-family: "${family}"` }, "Aa"),
      el("p", { class: "tname" }, el("a", { href: url, target: "_blank", rel: "noopener" }, family)),
      el("p", { class: "trole" }, role));
    $("pair").replaceChildren(block(t.display, "Headline", t.displayUrl), block(t.text, "Subline and details", t.textUrl));
    $("pair-reason").textContent = t.reason;
    $("proof").style.setProperty("--p-display", `"${t.display}"`);
    $("proof").style.setProperty("--p-text", `"${t.text}"`);
    $("font-links").replaceChildren(
      "Built into Figma. For other apps, download ",
      el("a", { href: t.displayUrl, target: "_blank", rel: "noopener" }, t.display), " and ",
      el("a", { href: t.textUrl, target: "_blank", rel: "noopener" }, t.text), " from Google Fonts.");
  }

  function renderImages() {
    const imgs = brief.images || [];
    if (!imgs.length) { $("images").replaceChildren(el("p", { class: "note" }, "No images today.")); state.img = -1; return; }
    $("images").replaceChildren(...imgs.map((im, i) =>
      el("div", { class: "img-opt" + (state.img === i ? " on" : "") },
        el("button", {
          type: "button", class: "frame", "aria-pressed": String(state.img === i), "aria-label": `Use image ${i + 1}: ${im.alt}`,
          onclick: () => { state.img = i; renderImages(); renderProof(); renderShare(); },
        }, el("img", { src: im.thumb, alt: im.alt, loading: "lazy", onerror: (e) => e.target.parentElement.classList.add("missing") })),
        el("p", { class: "credit" }, "Photo by ", el("a", { href: im.photographerUrl, target: "_blank", rel: "noopener" }, im.photographer),
          " on ", el("a", { href: im.page, target: "_blank", rel: "noopener" }, "Unsplash")))));
    const none = $("no-image") || el("button", { type: "button", class: "no-image", id: "no-image",
      onclick: () => { state.img = state.img === -1 ? 0 : -1; renderImages(); renderProof(); renderShare(); } });
    $("images").after(none);
    none.textContent = state.img === -1 ? "No image on the proof ●" : "Try the proof without an image";
    none.setAttribute("aria-pressed", String(state.img === -1));
  }

  // The grid drawn on the artboard, with the suggested layout and dimension marks.
  function renderGrid() {
    const G = geometry();
    const accent = palette.colours[0];
    const svg = el("svg", { viewBox: `-150 -150 ${G.W + 190} ${G.H + 190}`, role: "img" });
    svg.append(el("rect", { x: 0, y: 0, width: G.W, height: G.H, fill: "#fff", stroke: "#111", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    for (const z of ZONES) {
      const a = G.area(z.c[0], z.c[1], z.r[0], z.r[1]);
      svg.append(el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, fill: accent, "fill-opacity": z.o }));
      svg.append(el("text", { x: a.x + 18, y: a.y + 54, "font-size": 40, fill: "#111", "font-family": "Geist, sans-serif" }, z.name));
    }
    for (let c = 1; c <= G.cols; c++)
      for (let r = 1; r <= G.rows; r++)
        svg.append(el("rect", { x: G.x(c), y: G.y(r), width: G.col, height: G.row, fill: "none", stroke: accent, "stroke-opacity": 0.55, "stroke-width": 0.75, "vector-effect": "non-scaling-stroke" }));

    // dimension marks: A margin, C column, B gutter along the top; D row down the left
    const mark = (x1, y1, x2, y2, label, lx, ly) => {
      const g = el("g", { stroke: "#111", "stroke-width": 1, "vector-effect": "non-scaling-stroke" });
      g.append(el("line", { x1, y1, x2, y2, "vector-effect": "non-scaling-stroke" }));
      const tick = (x, y) => (x1 === x2
        ? el("line", { x1: x - 14, y1: y, x2: x + 14, y2: y, "vector-effect": "non-scaling-stroke" })
        : el("line", { x1: x, y1: y - 14, x2: x, y2: y + 14, "vector-effect": "non-scaling-stroke" }));
      g.append(tick(x1, y1), tick(x2, y2));
      svg.append(g, el("text", { x: lx, y: ly, "font-size": 44, "text-anchor": "middle", fill: accent, "font-family": "Geist Mono, monospace" }, label));
    };
    const top = -50;
    mark(0, top, G.m, top, "A", G.m / 2, top - 34);
    mark(G.m, top, G.m + G.col, top, "C", G.m + G.col / 2, top - 34);
    mark(G.m + G.col, top, G.m + G.col + G.gut, top, "B", G.m + G.col + G.gut / 2 + 6, top - 34);
    mark(-50, G.m, -50, G.m + G.row, "D", -100, G.m + G.row / 2 + 15);
    $("grid-fig").replaceChildren(svg);

    const px = (n) => `${+n.toFixed(1)} px`;
    const g = brief.grid;
    const rows = [
      ["", "Artboard", `${g.format} · ${G.W} × ${G.H} px`],
      ["", "Grid", `${G.cols} columns × ${G.rows} rows`],
      ["A", "Margin", `${g.margin * 100}% · ${px(G.m)}`],
      ["B", "Gutter", `${g.gutter * 100}% · ${px(G.gut)}`],
      ["C", "Column", px(G.col)],
      ["D", "Row", px(G.row)],
    ];
    $("grid-spec").replaceChildren(...rows.flatMap(([k, t, v]) => [el("dt", {}, el("b", {}, k), t), el("dd", {}, v)]));
    $("pgrid").replaceChildren(...Array.from({ length: G.cols * G.rows }, () => el("i")));
  }

  // The archive as a wall of each day's proof.
  function renderArchive() {
    const css = new Set();
    $("archive-list").replaceChildren(...index.map((x) => {
      if (x.css) css.add(x.css);
      const bg = x.bg || "#EEEEEC";
      return el("li", {}, el("a", { href: `?d=${x.date}`, "aria-current": String(x.date === brief.date) },
        el("div", { class: "mini", style: `background:${bg};color:${ink(bg)}` },
          el("div", { class: "mini-in" },
            x.thumb ? el("img", { src: x.thumb, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }) : el("span"),
            el("span", { class: "mini-hl", style: x.display ? `font-family:"${x.display}"` : "" }, x.headline))),
        el("p", { class: "cap" }, el("span", {}, `[${pad(x.issue)}]`), el("span", {}, x.headline))));
    }));
    for (const href of css) if (!document.querySelector(`link[href="${href}"]`)) document.head.append(el("link", { rel: "stylesheet", href }));
  }

  // ---------- share ----------
  const dayTag = () => `#dailyposter${pad(brief.issue)}`;
  function caption() {
    const s = brief.story, im = brief.images?.[state.img];
    return [
      `Daily Poster No. ${pad(brief.issue)}`,
      brief.headlines[state.h],
      "",
      `Story: ${s.source}, ${fmt(s.published, { day: "numeric", month: "long", year: "numeric" })}`,
      `Type: ${brief.type.display} + ${brief.type.text}`,
      im ? `Photo: ${im.photographer} on Unsplash` : null,
      "",
      `#dailyposter ${dayTag()}`,
    ].filter((l) => l !== null).join("\n");
  }
  function renderShare() {
    $("day-tag").textContent = dayTag();
    $("caption").textContent = caption();
    const tag = (t) => `https://www.instagram.com/explore/tags/${t}/`;
    $("share-links").replaceChildren(
      el("a", { href: tag(`dailyposter${pad(brief.issue)}`), target: "_blank", rel: "noopener" }, `See today's posters ↗`),
      el("a", { href: tag("dailyposter"), target: "_blank", rel: "noopener" }, "See them all ↗"));
  }

  // ---------- Figma: copy the artboard as SVG, which pastes into Figma as layers ----------
  function headlineLines(text, size, width) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${size}px "${brief.type.display}"`;
    const lines = [];
    let line = "";
    for (const w of text.split(/\s+/)) {
      const test = line ? line + " " + w : w;
      if (line && ctx.measureText(test).width > width) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function figmaSVG() {
    const G = geometry();
    const bg = state.bg, fg = ink(bg);
    const t = brief.type, s = brief.story, im = brief.images?.[state.img];
    const proofW = $("proof").clientWidth || 300;
    const scale = G.W / proofW;
    const hlSize = Math.round(parseFloat($("phl-text").style.fontSize || "40") * scale);
    const hl = brief.headlines[state.h];
    const hArea = G.area(1, 6, im ? 7 : 2, 10);
    const lines = headlineLines(hl, hlSize, hArea.w);
    const lh = hlSize * 1.15;
    const firstBase = hArea.y + hArea.h - (lines.length - 1) * lh - hlSize * 0.2;
    const sub = G.area(1, 4, 11, 11), foot = G.area(1, 6, 12, 12);
    const fsSub = 31, fsFoot = 25;
    const subLines = (() => {
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.font = `${fsSub}px "${t.text}"`;
      const out = []; let line = "";
      for (const w of brief.sublines[state.s].split(/\s+/)) {
        const test = line ? line + " " + w : w;
        if (line && ctx.measureText(test).width > sub.w) { out.push(line); line = w; } else line = test;
      }
      if (line) out.push(line);
      return out;
    })();
    const cells = [];
    for (let c = 1; c <= G.cols; c++) for (let r = 1; r <= G.rows; r++)
      cells.push(`<rect x="${G.x(c).toFixed(1)}" y="${G.y(r).toFixed(1)}" width="${G.col.toFixed(1)}" height="${G.row.toFixed(1)}" fill="#FF3B30" fill-opacity="0.1"/>`);
    const date = dots(fmt(s.published, { day: "2-digit", month: "2-digit", year: "2-digit" }));
    const time = fmt(s.published, { hour: "2-digit", minute: "2-digit" });
    const img = im ? G.area(1, 6, 1, 6) : null;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${G.W}" height="${G.H}" viewBox="0 0 ${G.W} ${G.H}">
<title>Daily Poster No. ${pad(brief.issue)}</title>
<rect id="Background" width="${G.W}" height="${G.H}" fill="${bg}"/>
${img ? `<rect id="Image: ${esc(im.photographer)} on Unsplash" x="${img.x}" y="${img.y}" width="${img.w.toFixed(1)}" height="${img.h.toFixed(1)}" fill="${fg}" fill-opacity="0.12"/>` : ""}
<text id="Headline" fill="${fg}" font-family="${esc(t.display)}" font-size="${hlSize}">${lines.map((l, i) => `<tspan x="${G.m}" y="${(firstBase + i * lh).toFixed(1)}">${esc(l)}</tspan>`).join("")}</text>
<text id="Subline" fill="${fg}" font-family="${esc(t.text)}" font-size="${fsSub}">${subLines.map((l, i) => `<tspan x="${sub.x}" y="${(sub.y + fsSub + i * fsSub * 1.35).toFixed(1)}">${esc(l)}</tspan>`).join("")}</text>
<rect id="Rule" x="${foot.x}" y="${(foot.y + foot.h - fsFoot - 24).toFixed(1)}" width="${foot.w.toFixed(1)}" height="2" fill="${fg}"/>
<text id="Date" fill="${fg}" font-family="${esc(t.text)}" font-size="${fsFoot}" x="${foot.x}" y="${(foot.y + foot.h).toFixed(1)}">${date}</text>
<text id="Time" fill="${fg}" font-family="${esc(t.text)}" font-size="${fsFoot}" x="${G.W / 2}" y="${(foot.y + foot.h).toFixed(1)}" text-anchor="middle">${time}</text>
<text id="Source" fill="${fg}" font-family="${esc(t.text)}" font-size="${fsFoot}" x="${G.W - G.m}" y="${(foot.y + foot.h).toFixed(1)}" text-anchor="end">${esc(s.source)}</text>
<g id="Grid (hide before export)">${cells.join("")}</g>
</svg>`;
  }

  // ---------- proof ----------
  function fitHeadline() {
    const box = $("phl"), span = $("phl-text");
    if (!box.clientHeight) return;
    let lo = 8, hi = box.clientWidth * 0.6;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      span.style.fontSize = mid + "px";
      const fits = span.scrollWidth <= box.clientWidth + 0.5 && span.offsetHeight <= box.clientHeight + 0.5;
      fits ? (lo = mid) : (hi = mid);
    }
    span.style.fontSize = lo + "px";
  }

  function renderProof() {
    const proof = $("proof");
    const bg = state.bg;
    proof.style.setProperty("--p-bg", bg);
    proof.style.setProperty("--p-fg", ink(bg));
    const im = brief.images?.[state.img];
    $("pimg").replaceChildren(...(im ? [el("img", { src: im.src, alt: "" })] : []));
    proof.classList.toggle("no-image", !im);
    proof.classList.toggle("no-grid", !state.grid);
    $("phl-text").textContent = brief.headlines[state.h];
    $("psub").textContent = brief.sublines[state.s];
    const s = brief.story;
    $("pfoot").replaceChildren(
      el("span", {}, dots(fmt(s.published, { day: "2-digit", month: "2-digit", year: "2-digit" }))),
      el("span", {}, fmt(s.published, { hour: "2-digit", minute: "2-digit" })),
      el("span", {}, s.source));
    fitHeadline();
  }

  const narrow = matchMedia("(max-width: 960px)");
  function placeProof() {
    (narrow.matches ? $("proof-slot-mobile") : $("proof-slot-desktop")).append($("proof-wrap"));
    fitHeadline();
  }

  async function loadJSON(path, fallback) {
    try { const r = await fetch(path, { cache: "no-cache" }); if (!r.ok) throw 0; return await r.json(); }
    catch { return fallback; }
  }

  async function init() {
    setupInfo();
    const d = new URLSearchParams(location.search).get("d");
    brief = window.__BRIEF__ || (await loadJSON(d ? `data/${d}.json` : "data/latest.json")) || (await loadJSON("data/latest.json"));
    index = window.__INDEX__ || (await loadJSON("data/index.json", [])) || [];
    if (!brief) { $("story-title").textContent = "No poster brief yet. The first one arrives tomorrow morning."; return; }
    palette = brief.palette || brief.palettes?.find((p) => p.name === "Vivid") || brief.palettes?.[0];
    state.bg = palette.colours[0];
    document.documentElement.style.setProperty("--accent", palette.colours[0]);

    renderTop(); renderStory();
    renderOptions("headlines", brief.headlines, "h", (t) => `${words(t)} words`);
    renderOptions("sublines", brief.sublines, "s", (t, i) => `0${i + 1}`);
    renderColour(); renderType(); renderImages(); renderGrid(); renderArchive(); renderShare();
    placeProof(); renderProof();

    $("grid-toggle").addEventListener("click", (e) => {
      state.grid = !state.grid;
      e.currentTarget.setAttribute("aria-pressed", String(state.grid));
      renderProof();
    });
    $("copy-figma").addEventListener("click", () => copy(figmaSVG(), "Copied. Paste into Figma with ⌘V"));
    $("copy-caption").addEventListener("click", () => copy(caption(), "Caption copied"));
    narrow.addEventListener("change", placeProof);
    new ResizeObserver(fitHeadline).observe($("proof"));
    document.fonts.load(`40px "${brief.type.display}"`).then(fitHeadline).catch(() => {});
    document.fonts.ready.then(fitHeadline);
  }

  init();
})();
