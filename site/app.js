// Daily Poster: renders one day's brief from data/<date>.json.
(() => {
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, ...kids) => {
    const svg = ["svg", "g", "rect", "line", "text"].includes(tag);
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

  const state = { h: 0, s: 0 };
  let brief, index, palette;

  const pad = (n) => String(n).padStart(3, "0");
  const fmt = (iso, opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...opts }).format(new Date(iso));
  const noon = (d) => d + "T12:00:00Z";
  const dots = (s) => s.replace(/\//g, ".");
  const words = (s) => s.trim().split(/\s+/).length;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    return { W, H, m, gut, col, row, cols: g.columns, rows: g.rows,
      x: (c) => m + (c - 1) * (col + gut), y: (r) => m + (r - 1) * (row + gut) };
  }

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

  // ---------- hero: the day's headlines, cycling ----------
  function setupHero() {
    const day = fmt(noon(brief.date), { weekday: "short", day: "numeric", month: "short" });
    $("kicker").replaceChildren(el("i", { class: "dot", "aria-hidden": "true" }),
      `No. ${pad(brief.issue)} · ${day} · ${brief.colour.name} · ${brief.story.source}`);
    const spans = brief.headlines.map((t) => el("span", {}, t));
    $("hero-hl").replaceChildren(...spans);
    const buttons = brief.headlines.map((t, i) =>
      el("button", { type: "button", "aria-label": `Headline ${i + 1}: ${t}`, onclick: () => { show(i); restart(); } }, String(i + 1).padStart(2, "0")));
    $("hero-count").replaceChildren(...buttons);

    let current = 0, timer = null;
    function show(i) {
      current = i;
      spans.forEach((s, j) => { s.classList.toggle("on", j === i); s.setAttribute("aria-hidden", String(j !== i)); });
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    }
    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(() => show((current + 1) % spans.length), 3200);
    }
    const hero = $("hero-hl").closest(".hero");
    hero.addEventListener("mouseenter", () => clearInterval(timer));
    hero.addEventListener("mouseleave", restart);
    show(0);
    restart();
  }

  // ---------- the brief ----------
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
    $("story-title").textContent = s.title;
    $("story-summary").textContent = s.summary;
    const when = fmt(s.published, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    $("story-source").replaceChildren(`${s.source} · ${when} · `, el("a", { href: s.url, target: "_blank", rel: "noopener" }, `Read it on ${s.source} ↗`));
  }

  function renderOptions(id, list, key, meta) {
    $(id).replaceChildren(...list.map((t, i) =>
      el("button", {
        type: "button", class: "opt", "aria-pressed": String(state[key] === i),
        onclick: () => { state[key] = i; renderOptions(id, list, key, meta); renderShare(); },
      }, el("span", { class: "txt" }, t), el("span", { class: "meta" }, meta(t, i)))
    ));
  }

  function renderColour() {
    const idx = WHEEL.findIndex(([n]) => n === brief.colour.name);
    $("wheel").replaceChildren(...WHEEL.map(([n, h], i) =>
      el("i", { class: i === idx ? "on" : "", title: n, style: `background: oklch(0.7 0.16 ${h})` })));
    $("wheel-key").replaceChildren(`${brief.colour.yesterday} yesterday · `, el("b", {}, `${brief.colour.name} today`), ` · ${brief.colour.tomorrow} tomorrow`);
    const chip = (hex, fixed) => el("button", {
      type: "button", class: "sw" + (fixed ? " fixed" : ""), "aria-label": `Copy ${hex}`, onclick: () => copy(hex),
    }, el("span", { class: "chip", style: `background:${hex}` }), el("span", { class: "hex" }, hex));
    $("swatches").replaceChildren(...palette.colours.map((c) => chip(c, false)), ...brief.always.map((c) => chip(c, true)));
  }

  function renderType() {
    const t = brief.type;
    $("pair-css").href = t.css;
    document.documentElement.style.setProperty("--p-display", `"${t.display}"`);
    const block = (family, role, url) => el("div", { class: "spec-type" },
      el("span", { class: "aa", style: `font-family: "${family}"` }, "Aa"),
      el("p", { class: "tname" }, el("a", { href: url, target: "_blank", rel: "noopener" }, family)),
      el("p", { class: "trole" }, role));
    $("pair").replaceChildren(block(t.display, "Headline", t.displayUrl), block(t.text, "Subline and details", t.textUrl));
    $("pair-reason").textContent = t.reason;
    $("font-links").replaceChildren(
      "Built into Figma. For other apps, download ",
      el("a", { href: t.displayUrl, target: "_blank", rel: "noopener" }, t.display), " and ",
      el("a", { href: t.textUrl, target: "_blank", rel: "noopener" }, t.text), " from Google Fonts.");
  }

  // The day's photos on an uneven grid, like a studio index page.
  function renderImages() {
    const imgs = brief.images || [];
    if (!imgs.length) { $("images").replaceChildren(el("p", { class: "note" }, "No images today.")); return; }
    $("images").replaceChildren(...imgs.slice(0, 3).map((im, i) =>
      el("figure", { class: `g${i + 1}` },
        el("a", { class: "frame", href: im.page, target: "_blank", rel: "noopener", "aria-label": `${im.alt}. Photo by ${im.photographer} on Unsplash` },
          el("img", { src: i === 0 ? im.src : im.thumb, alt: im.alt, loading: "lazy",
            onerror: (e) => e.target.parentElement.classList.add("missing") })),
        el("figcaption", { class: "mono" },
          el("span", {}, `[${String.fromCharCode(65 + i)}]`),
          el("span", {}, el("a", { href: im.photographerUrl, target: "_blank", rel: "noopener" }, im.photographer))))));
  }

  // The bare grid on the artboard, with dimension marks. No suggested layout.
  function renderGrid() {
    const G = geometry();
    const accent = palette.colours[0];
    const svg = el("svg", { viewBox: `-150 -150 ${G.W + 190} ${G.H + 190}`, role: "img" });
    svg.append(el("rect", { x: 0, y: 0, width: G.W, height: G.H, fill: "#fff", stroke: "#111", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    for (let c = 1; c <= G.cols; c++)
      for (let r = 1; r <= G.rows; r++)
        svg.append(el("rect", { x: G.x(c), y: G.y(r), width: G.col, height: G.row, fill: accent, "fill-opacity": 0.1, stroke: accent, "stroke-opacity": 0.5, "stroke-width": 0.75, "vector-effect": "non-scaling-stroke" }));
    const mark = (x1, y1, x2, y2, label, lx, ly) => {
      const ln = (a) => el("line", { ...a, "vector-effect": "non-scaling-stroke" });
      const g = el("g", { stroke: "#111", "stroke-width": 1 });
      g.append(ln({ x1, y1, x2, y2 }));
      const tick = (x, y) => (x1 === x2 ? ln({ x1: x - 14, y1: y, x2: x + 14, y2: y }) : ln({ x1: x, y1: y - 14, x2: x, y2: y + 14 }));
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
  }

  // The archive as a wall of each day's colour, photo and headline.
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
    const s = brief.story;
    return [
      `Daily Poster No. ${pad(brief.issue)}`,
      brief.headlines[state.h],
      "",
      `Story: ${s.source}, ${fmt(s.published, { day: "numeric", month: "long", year: "numeric" })}`,
      `Type: ${brief.type.display} + ${brief.type.text}`,
      "",
      `#dailyposter ${dayTag()}`,
    ].join("\n");
  }
  function renderShare() {
    $("day-tag").textContent = dayTag();
    $("caption").textContent = caption();
    const tag = (t) => `https://www.instagram.com/explore/tags/${t}/`;
    $("share-links").replaceChildren(
      el("a", { href: tag(`dailyposter${pad(brief.issue)}`), target: "_blank", rel: "noopener" }, "See today's posters ↗"),
      el("a", { href: tag("dailyposter"), target: "_blank", rel: "noopener" }, "See them all ↗"));
  }

  // ---------- Figma: an artboard with the grid and the pieces, as SVG that pastes in as layers ----------
  function wrap(text, font, size, width) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${size}px "${font}"`;
    const lines = [];
    let line = "";
    for (const w of text.split(/\s+/)) {
      const test = line ? line + " " + w : w;
      if (line && ctx.measureText(test).width > width) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function figmaSVG() {
    const G = geometry();
    const bg = palette.colours[0], fg = ink(bg);
    const t = brief.type, s = brief.story;
    const width = G.W - 2 * G.m;
    const hl = 140, sub = 34, det = 26;
    const tspans = (lines, size, y0, lh) => lines.map((l, i) => `<tspan x="${G.m}" y="${(y0 + i * size * lh).toFixed(1)}">${esc(l)}</tspan>`).join("");
    // The pieces are stacked top-left, for you to arrange.
    const hlLines = wrap(brief.headlines[state.h], t.display, hl, width);
    let y = G.m + hl * 0.85;
    const hlSVG = `<text id="Headline" fill="${fg}" font-family="${esc(t.display)}" font-size="${hl}">${tspans(hlLines, hl, y, 1.05)}</text>`;
    y += (hlLines.length - 1) * hl * 1.05 + 70;
    const subLines = wrap(brief.sublines[state.s], t.text, sub, width * 0.65);
    const subSVG = `<text id="Subline" fill="${fg}" font-family="${esc(t.text)}" font-size="${sub}">${tspans(subLines, sub, y, 1.35)}</text>`;
    y += (subLines.length - 1) * sub * 1.35 + 60;
    const details = `${dots(fmt(s.published, { day: "2-digit", month: "2-digit", year: "2-digit" }))}  ${fmt(s.published, { hour: "2-digit", minute: "2-digit" })}  ${s.source}`;
    const detSVG = `<text id="Date, time and source" fill="${fg}" font-family="${esc(t.text)}" font-size="${det}" x="${G.m}" y="${y.toFixed(1)}">${esc(details)}</text>`;
    const cells = [];
    for (let c = 1; c <= G.cols; c++) for (let r = 1; r <= G.rows; r++)
      cells.push(`<rect x="${G.x(c).toFixed(1)}" y="${G.y(r).toFixed(1)}" width="${G.col.toFixed(1)}" height="${G.row.toFixed(1)}" fill="#FF3B30" fill-opacity="0.1"/>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${G.W}" height="${G.H}" viewBox="0 0 ${G.W} ${G.H}">
<title>Daily Poster No. ${pad(brief.issue)}</title>
<rect id="Background" width="${G.W}" height="${G.H}" fill="${bg}"/>
${hlSVG}
${subSVG}
${detSVG}
<g id="Grid (hide before export)">${cells.join("")}</g>
</svg>`;
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
    if (!brief) { $("hero-hl").textContent = "The first brief arrives tomorrow morning."; return; }
    palette = brief.palette || brief.palettes?.find((p) => p.name === "Vivid") || brief.palettes?.[0];
    document.documentElement.style.setProperty("--accent", palette.colours[0]);

    renderType(); setupHero(); renderTop(); renderStory();
    renderOptions("headlines", brief.headlines, "h", (t) => `${words(t)} words`);
    renderOptions("sublines", brief.sublines, "s", (t, i) => `0${i + 1}`);
    renderColour(); renderImages(); renderGrid(); renderArchive(); renderShare();

    $("copy-figma").addEventListener("click", () => copy(figmaSVG(), "Copied. Paste into Figma with ⌘V"));
    $("copy-caption").addEventListener("click", () => copy(caption(), "Caption copied"));
  }

  init();
})();
