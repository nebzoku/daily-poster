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

  // The 12 wheel steps and their lead colours (matches scripts/lib/palette.mjs).
  const WHEEL = [
    ["Red", "#F33446"], ["Orange", "#F1592A"], ["Yellow", "#F1CF43"], ["Lime", "#B5E643"],
    ["Green", "#4BF761"], ["Jade", "#4CF1B7"], ["Teal", "#4CEBEB"], ["Blue", "#2987F1"],
    ["Indigo", "#473CED"], ["Violet", "#8D2EEE"], ["Magenta", "#F43BEC"], ["Rose", "#F33496"],
  ];

  const state = { h: 0, s: 0 };
  let brief, index, palette, showcase = [];

  const pad = (n) => String(n).padStart(3, "0");
  const fmt = (iso, opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...opts }).format(new Date(iso));
  const noon = (d) => d + "T12:00:00Z";
  const dots = (s) => s.replace(/\//g, ".");
  const words = (s) => s.trim().split(/\s+/).length;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  // Links come from news feeds and image APIs, so only let ordinary web links through.
  const safe = (u) => (/^https?:\/\//i.test(String(u || "")) ? u : "#");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Split text into masked words, so each word can rise into view on its own.
  const maskWords = (text) => text.split(/(\s+)/).map((part, i) =>
    /^\s+$/.test(part) ? document.createTextNode(" ")
      : el("span", { class: "wm" }, el("span", { class: "w", style: `--i:${i / 2}` }, part)));

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function luminance(hex) {
    const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = rgb(hex).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const ink = (hex) => (luminance(hex) > 0.22 ? "#000000" : "#FFFFFF");

  let toastTimer;
  // A short message at the bottom of the screen. A loading one stays (grey, its text
  // pulsing) until the next message replaces it.
  function toast(msg, loading = false) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.toggle("loading", loading);
    t.classList.add("on");
    clearTimeout(toastTimer);
    if (!loading) toastTimer = setTimeout(() => t.classList.remove("on"), 1800);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg || `Copied ${text}`); }
    catch { toast("Couldn't copy here. Try the live site."); }
  }

  // ---------- grid geometry, in artboard pixels ----------
  function geometry() {
    const g = brief.grid;
    const [W, H] = g.size;
    const px = (v) => (v < 1 ? Math.round(v * Math.min(W, H)) : v);   // old briefs used fractions
    const m = px(g.margin), gut = px(g.gutter);
    const col = (W - 2 * m - (g.columns - 1) * gut) / g.columns;
    const row = (H - 2 * m - (g.rows - 1) * gut) / g.rows;
    return { W, H, m, gut, col, row, cols: g.columns, rows: g.rows,
      x: (c) => m + (c - 1) * (col + gut), y: (r) => m + (r - 1) * (row + gut) };
  }

  // ---------- info overlay: a black blind that drops from the top ----------
  function setupInfo() {
    const info = $("info");
    const title = $("intro-title");
    title.replaceChildren(...maskWords(title.textContent));
    let opener = null;
    let seen = false;
    try { seen = localStorage.getItem("dp-info-seen") === "1"; } catch {}
    $("info-open-2").classList.toggle("seen", seen);
    const open = (e) => {
      opener = e.currentTarget;
      info.inert = false;
      info.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(() => $("info-close").focus({ preventScroll: true }), 50);
      $("info-open-2").classList.add("seen");
      try { localStorage.setItem("dp-info-seen", "1"); } catch {}
    };
    const close = () => {
      info.classList.remove("open");
      info.inert = true;
      document.body.style.overflow = "";
      if (opener) opener.focus({ preventScroll: true });
    };
    $("info-open").addEventListener("click", open);
    $("info-open-2").addEventListener("click", open);
    $("info-close").addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && info.classList.contains("open")) close(); });
  }

  // ---------- hero: the day's headlines, cycling ----------
  function setupHero() {
    const day = fmt(noon(brief.date), { weekday: "short", day: "numeric", month: "short" });
    const isLatest = !index.length || index[0].date === brief.date;
    $("kicker-title").textContent = isLatest ? "Today's headlines" : "Headlines";
    $("kicker-meta").textContent = `No. ${pad(brief.issue)} · ${day} · ${brief.story.source}`;
    const spans = brief.headlines.map((t) => el("span", { class: "hl" }, ...maskWords(t)));
    $("hero-hl").replaceChildren(...spans);
    $("hero-hl").setAttribute("aria-label", brief.headlines.join(" / "));
    const buttons = brief.headlines.map((t, i) =>
      el("button", { type: "button", "aria-label": `Headline ${i + 1}: ${t}`, onclick: () => { show(i); restart(); } }, String(i + 1).padStart(2, "0")));
    $("hero-count").replaceChildren(...buttons);

    let current = -1, timer = null;
    // The outgoing headline's words lift out of their masks as the next rises in.
    function show(i) {
      if (i === current) return;
      const prev = spans[current];
      if (prev) {
        prev.classList.remove("on");
        prev.classList.add("out");
        setTimeout(() => {
          if (prev.classList.contains("on")) return;
          prev.classList.add("reset");
          prev.classList.remove("out");
          void prev.offsetWidth;
          prev.classList.remove("reset");
        }, 900);
      }
      current = i;
      spans[i].classList.remove("out", "reset");
      spans[i].classList.add("on");
      spans.forEach((s, j) => s.setAttribute("aria-hidden", "true"));
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    }
    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(() => show((current + 1) % spans.length), 3800);
    }
    const hero = $("hero-hl").closest(".hero");
    hero.addEventListener("mouseenter", () => clearInterval(timer));
    hero.addEventListener("mouseleave", restart);
    // First headline arrives once the page has settled.
    setTimeout(() => { show(0); restart(); }, reduced ? 0 : 450);
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
    $("story-source").replaceChildren(`${s.source} · ${when} · `, el("a", { href: safe(s.url), target: "_blank", rel: "noopener" }, `Read it on ${s.source} ↗`));
  }

  // Clicking a line copies it, and makes it your pick for the Figma artboard and caption.
  function renderOptions(id, list, key, meta) {
    $(id).replaceChildren(...list.map((t, i) =>
      el("button", {
        type: "button", class: "opt", "aria-pressed": String(state[key] === i), "aria-label": `Copy: ${t}`,
        onclick: () => { state[key] = i; renderOptions(id, list, key, meta); renderShare(); copy(t, "Copied"); },
      }, el("span", { class: "txt" }, t),
        el("span", { class: "meta" }, el("span", { class: "m-info" }, meta(t, i)), el("span", { class: "m-copy" }, "Copy")))
    ));
  }

  // The wheel runs in day order, past to future, with today in the middle at triple width.
  // The wheel steps backwards one place a day, so yesterday is the next colour along.
  function renderColour() {
    const t = WHEEL.findIndex(([n]) => n === brief.colour.name);
    const at = (k) => WHEEL[((t + k) % 12 + 12) % 12];
    const order = [5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6].map((k) => ({ k, c: at(k) }));
    $("wheel").replaceChildren(...order.map(({ k, c: [n, h] }) => el("i", { class: k === 0 ? "on" : "", title: n, style: `background: ${h}` })));
    $("wheel").setAttribute("aria-label", `The colour wheel: ${brief.colour.yesterday} yesterday, ${brief.colour.name} today, ${brief.colour.tomorrow} tomorrow`);
    const row = (label, [n, h], now) => el("span", { class: now ? "now" : "" }, el("i", { style: `background:${h}` }), `${label} · ${n}`);
    $("wheel-key").replaceChildren(row("Yesterday", at(1)), row("Today", at(0), true), row("Tomorrow", at(-1)));

    // Text on each band: the palette's darkest or lightest, whichever reads better.
    const [, light, , dark] = palette.colours;
    const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const band = (hex, label) => {
      const fg = hex === "#000000" ? "#FFFFFF" : hex === "#FFFFFF" ? "#000000" : contrast(hex, dark) >= contrast(hex, light) ? dark : light;
      return el("button", { type: "button", "aria-label": `Copy ${hex}`, style: `background:${hex};color:${fg}`, onclick: () => copy(hex) },
        el("span", {}, hex), el("span", {}, el("span", { class: "num" }, label), el("span", { class: "act" }, "Copy")));
    };
    $("swatches").replaceChildren(
      ...palette.colours.map((c, i) => band(c, String(i + 1).padStart(2, "0"))),
      ...brief.always.map((c) => band(c, "Always")));
  }

  function renderType() {
    const t = brief.type;
    $("pair-css").href = t.css;
    document.documentElement.style.setProperty("--p-display", `"${t.display}"`);
    const block = (family, role, url) => el("div", { class: "spec-type" },
      el("span", { class: "aa", style: `font-family: "${family}"` }, "Aa"),
      el("p", { class: "tname" }, el("a", { href: url, target: "_blank", rel: "noopener" }, family)),
      el("p", { class: "trole" }, role));
    $("pair").replaceChildren(block(t.display, "Typeface 01", t.displayUrl), block(t.text, "Typeface 02", t.textUrl));
    $("font-links").replaceChildren(
      "Built into Figma. For other apps, get ",
      el("a", { href: t.displayUrl, target: "_blank", rel: "noopener" }, t.display), " and ",
      el("a", { href: t.textUrl, target: "_blank", rel: "noopener" }, t.text), ".");
  }

  // The day's images and textures as one strip that loops across the page. Textures are
  // spread evenly between the images. The set is drawn twice so the loop is seamless;
  // the copy is hidden from screen readers and keyboards.
  function stripItems() {
    const imgs = (brief.images || []).map((im, i) => ({ ...im, kind: "image", label: String(i + 1).padStart(2, "0") }));
    const tex = (brief.textures || []).map((t, i) => ({ ...t, kind: "texture", label: `T${i + 1}` }));
    const objs = (brief.objects || []).map((o, i) => ({ ...o, kind: "object", label: `3D${i + 1}`,
      alt: `${o.name} in ${o.material}, rendered in 3D` }));
    const out = [...imgs];
    // Textures, then the 3D objects, are spread evenly through the images.
    for (const extra of [tex, objs]) {
      const n = out.length;
      extra.forEach((t, k) => out.splice(Math.round(((k + 1) * (n + extra.length)) / (extra.length + 1)) - 1, 0, t));
    }
    return out;
  }
  function renderImages() {
    const items = stripItems();
    if (!items.length) { $("images").replaceChildren(el("p", { class: "note" }, "No images today.")); return; }
    let imgN = 0, texN = 0, objN = 0;
    const variant = items.map((it) => (it.kind === "texture" ? `t${texN++ % 3}` : it.kind === "object" ? `o${objN++ % 3}` : `v${imgN++ % 7}`));
    // 3D objects link to their full-size PNG, which downloads.
    const link = (it) => it.kind === "object"
      ? { href: it.image, download: `daily-poster-${pad(brief.issue)}-${it.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png` }
      : { href: safe(it.page), target: "_blank", rel: "noopener" };
    const label = (it) => it.kind === "object" ? `${it.name}, 3D render. Download the PNG` : `${it.alt}. ${it.kind === "texture" ? "Texture" : it.credit}, ${it.source}`;
    const shot = (it, i, copy) => el("figure", { class: `shot ${variant[i]}${it.kind === "texture" ? " is-texture" : ""}${it.kind === "object" ? " is-object" : ""}`, ...(copy ? { "aria-hidden": "true" } : {}) },
      el("a", { class: "frame", ...link(it),
        ...(copy ? { tabindex: "-1" } : { "aria-label": label(it) }) },
        el("img", { src: it.thumb, alt: copy ? "" : it.alt, loading: copy ? "lazy" : "eager", draggable: "false",
          onerror: (e) => e.target.parentElement.classList.add("missing") })),
      el("figcaption", { class: "mono" },
        el("span", {}, `[${it.label}]`),
        // Poly Haven textures are named; Unsplash ones carry the photographer, who needs crediting.
        // 3D objects credit the model's maker when there is one.
        el("span", { class: "who" }, it.kind === "object" ? (it.model?.creator ? `${it.name} by ${it.model.creator}` : it.name)
          : it.kind === "texture" && it.source === "Poly Haven" ? it.title : (it.credit || it.photographer)),
        el("span", { class: "src" }, it.kind === "object" ? "3D" : it.kind === "texture" ? "Texture" : it.source === "Art Institute of Chicago" ? "AIC" : it.source || "Unsplash")));
    const track = el("div", { class: "track", style: `--drift: ${items.length * 8}s` },
      ...items.map((it, i) => shot(it, i, false)), ...items.map((it, i) => shot(it, i, true)));
    $("images").replaceChildren(track);
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
    mark(0, top, G.m, top, "A", G.m < 80 ? -40 : G.m / 2, top - 34);   // a slim margin puts its letter outside, clear of C
    mark(G.m, top, G.m + G.col, top, "C", G.m + G.col / 2, top - 34);
    if (G.gut) mark(G.m + G.col, top, G.m + G.col + G.gut, top, "B", G.m + G.col + G.gut / 2 + 6, top - 34);
    mark(-50, G.m, -50, G.m + G.row, "D", -100, G.m + G.row / 2 + 15);
    $("grid-fig").replaceChildren(svg);

    const px = (n) => `${+n.toFixed(1)} px`;
    const g = brief.grid;
    const rows = [
      ["", "Artboard", `${g.format} · ${G.W} × ${G.H} px`],
      ["", "Grid", `${G.cols} columns × ${G.rows} rows`],
      ["A", "Margin", px(G.m)],
      ...(G.gut ? [["B", "Gutter", px(G.gut)]] : [["", "Gutter", "None"]]),
      ["C", "Column", px(G.col)],
      ["D", "Row", px(G.row)],
    ];
    const n = (v) => +v.toFixed(1);
    $("figma-grid").replaceChildren(
      el("span", {}, `Columns · Count ${G.cols} · Stretch · Margin ${n(G.m)} · Gutter ${n(G.gut)}`),
      el("span", {}, `Rows · Count ${G.rows} · Stretch · Margin ${n(G.m)} · Gutter ${n(G.gut)}`));
    $("grid-spec").replaceChildren(...rows.flatMap(([k, t, v]) => [el("dt", {}, el("b", {}, k), t), el("dd", {}, v)]));
  }

  // ---------- hero images: the day's pictures around the headline ----------
  // Each sits in a slot clear of the headline, rises in once it has loaded, and drifts out
  // sideways as the page scrolls, stopping with its centre on the edge of the screen.
  const SLOTS = [
    { x: 6, y: 13, w: 11 }, { x: 25, y: 3, w: 7, far: 1 }, { x: 76, y: 8, w: 10 }, { x: 88, y: 37, w: 8, far: 1 },
    { x: 79, y: 64, w: 12 }, { x: 60, y: 83, w: 7, far: 1 }, { x: 13, y: 68, w: 12 }, { x: 2, y: 42, w: 8, far: 1 },
  ];
  const SLOTS_SMALL = [{ x: 5, y: 2, w: 21 }, { x: 74, y: 3, w: 22 }, { x: 72, y: 80, w: 22 }, { x: 6, y: 82, w: 20 }];
  function setupHeroImages() {
    const box = $("hero-imgs"), hero = box && box.closest(".hero");
    const imgs = (brief.images || []).filter((im) => im.thumb);
    if (!box || !imgs.length) return;
    const small = matchMedia("(max-width: 960px)").matches;
    const slots = small ? SLOTS_SMALL : SLOTS;
    // Always one of the day's 3D renders, top right, among the photos, on the same grey
    // ground it has in the strip. Its PNG has room around the object, so it's a little larger.
    const objs = brief.objects || [];
    if (objs.length) {
      const o = objs[(brief.issue || 0) % objs.length];
      imgs.splice(small ? 1 : 2, 0, { thumb: o.thumb, object: true });
    }
    const figs = slots.slice(0, imgs.length).map((sl, i) => {
      const im = imgs[i];
      const w = im.object ? sl.w * (small ? 1.15 : 1.25) : sl.w;
      const fig = el("figure", { class: `hi${im.object ? " is-obj" : ""}`, style: `left:${sl.x - (w - sl.w) / 4}%;top:${sl.y}%;width:${w}vw` },
        el("div", { class: "hi-in" }, el("img", { src: im.thumb, alt: "", decoding: "async",
          onload: () => setTimeout(() => { fig.classList.add("in"); measure(); }, (reduced ? 0 : 500) + i * 140),
          onerror: () => fig.remove() })));
      fig.speed = 0.8 + ((i * 37) % 21) / 100;   // a little variety in how far each travels
      return fig;
    });
    box.replaceChildren(...figs);
    if (reduced) return;

    let geo = [];
    function measure() {
      const W = hero.clientWidth, H = hero.clientHeight, vw = document.documentElement.clientWidth;
      geo = figs.map((f) => {
        const cx = f.offsetLeft + f.offsetWidth / 2, cy = f.offsetTop + f.offsetHeight / 2;
        // Out to the nearer side, until the centre meets the edge of the screen, so half stays
        // in view. A small vertical drift away from the middle adds a little depth.
        const right = cx > W / 2;
        const dx = (right ? vw - cx : -cx) * f.speed;
        const dy = ((cy - H / 2) / (H / 2)) * 40;
        return { f, dx, dy };
      });
      update();
    }
    function update() {
      const H = hero.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, scrollY / (H * 0.85)));
      for (const g of geo) g.f.style.transform = `translate3d(${(g.dx * p).toFixed(1)}px, ${(g.dy * p).toFixed(1)}px, 0)`;
    }
    let ticking = false;
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
    addEventListener("resize", measure);
    measure();
  }

  // ---------- archive: designed posters, picked by hand (data/showcase.json) ----------
  const filt = { date: "", headline: "", colour: "", type: "" };
  let posters = [];
  const posterTitle = (x) => x.title;   // several posters can share a headline; no need to mark which came first

  // Each poster picks up its day's colour and typefaces from the index.
  function preparePosters() {
    posters = [...showcase]
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.issue || 0) - (a.issue || 0))
      .map((x) => {
        const day = index.find((d) => d.date === x.date) || {};
        return { ...x, colour: day.colour || "", hex: day.bg || "",
          type: day.display ? (day.text ? `${day.display} + ${day.text}` : day.display) : "" };
      });
  }

  function renderFilters() {
    const uniq = (key) => [...new Set(posters.map((x) => x[key]).filter(Boolean))];
    const dayLabel = (d) => { const x = posters.find((p) => p.date === d); return `No. ${pad(x.issue)} · ${fmt(noon(d), { day: "numeric", month: "short" })}`; };
    const groups = [
      ["date", "All days", uniq("date"), dayLabel],
      ["headline", "All headlines", uniq("title"), (t) => t],
      ["colour", "All colours", uniq("colour"), (t) => t],
      ["type", "All typefaces", uniq("type"), (t) => t],
    ];
    const selects = groups.map(([key, all, opts, label]) => {
      const sel = el("select", { "aria-label": all.replace("All ", "Filter by "), class: filt[key] ? "on" : "",
        onchange: (e) => { filt[key] = e.target.value; renderFilters(); renderArchive(); } },
        el("option", { value: "" }, all), ...opts.map((o) => el("option", { value: o }, label(o))));
      sel.value = filt[key];
      return el("label", {}, sel);
    });
    const active = Object.values(filt).some(Boolean);
    const clear = el("button", { type: "button", class: "clear", onclick: () => { for (const k in filt) filt[k] = ""; renderFilters(); renderArchive(); } }, "Clear");
    clear.hidden = !active;
    $("filters").replaceChildren(...selects, el("span", { class: "count", id: "archive-count" }), clear);
  }

  const shown = () => posters.filter((x) =>
    (!filt.date || x.date === filt.date) && (!filt.headline || x.title === filt.headline) &&
    (!filt.colour || x.colour === filt.colour) && (!filt.type || x.type === filt.type));

  // Moving posters play a short silent snippet in the grid while they're on screen.
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const snips = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) { if (!v.src) v.src = v.dataset.src; v.muted = true; v.play().catch(() => {}); } else v.pause();
  }), { rootMargin: "200px" }) : null;
  function renderArchive() {
    $("archive").hidden = !posters.length;
    const list = shown();
    $("archive-count").textContent = `${list.length} poster${list.length === 1 ? "" : "s"}`;
    $("archive-empty").hidden = !!list.length;
    $("archive-list").replaceChildren(...list.map((x, i) =>
      el("li", { style: `--i:${i % 4}` }, el("button", { type: "button", "aria-current": String(x.date === brief.date),
        "aria-label": `View ${posterTitle(x)} by ${x.designer}`, onclick: (e) => openLightbox(list, i, e.currentTarget) },
        el("div", { class: "poster" }, x.preview && !still
          ? el("video", { class: "snip", "data-src": x.preview, poster: x.image, muted: "", loop: "", playsinline: "", preload: "none", "aria-label": `${posterTitle(x)}, by ${x.designer}` })
          : el("img", { src: x.image, alt: `${posterTitle(x)}, by ${x.designer}`, loading: "lazy" }),
          x.video ? el("span", { class: "tag-video" }, "Video") : null),
        el("p", { class: "cap" }, el("span", {}, `[${pad(x.issue)}] ${posterTitle(x)}`), el("span", {}, x.designer))))));
    $("archive-list").querySelectorAll("video.snip").forEach((v) => (snips ? snips.observe(v) : (v.src = v.dataset.src)));
  }

  // ---------- lightbox: one poster at a time; arrows, swipe and Escape ----------
  const lb = { list: [], i: 0, opener: null };
  function openLightbox(list, i, opener) {
    Object.assign(lb, { list, i, opener });
    const box = $("lightbox");
    box.inert = false;
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    showPoster(i);
    setTimeout(() => $("lb-close").focus({ preventScroll: true }), 50);
  }
  function closeLightbox() {
    const box = $("lightbox"), vid = $("lb-vid");
    vid.pause(); vid.removeAttribute("src"); vid.load();
    box.classList.remove("open");
    box.inert = true;
    document.body.style.overflow = "";
    if (lb.opener) lb.opener.focus({ preventScroll: true });
  }
  function showPoster(i) {
    lb.i = (i + lb.list.length) % lb.list.length;
    const x = lb.list[lb.i], img = $("lb-img"), vid = $("lb-vid");
    img.classList.remove("on"); vid.classList.remove("on");
    vid.pause();
    // A moving poster plays in place of the picture, with its sound.
    if (x.video) {
      img.hidden = true; vid.hidden = false; vid.poster = x.image; vid.src = x.video;
      vid.setAttribute("aria-label", `${posterTitle(x)}, by ${x.designer}`);
      vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
      requestAnimationFrame(() => vid.classList.add("on"));
    } else { vid.hidden = true; vid.removeAttribute("src"); img.hidden = false; }
    const next = new Image();
    if (!x.video) next.onload = next.onerror = () => { img.src = x.image; img.alt = `${posterTitle(x)}, by ${x.designer}`; requestAnimationFrame(() => img.classList.add("on")); };
    next.src = x.image;
    // Fetch the neighbours too, so flicking through is instant.
    for (const d of [1, -1]) { const n = lb.list[(lb.i + d + lb.list.length) % lb.list.length]; if (n) new Image().src = n.image; }
    const one = lb.list.length < 2;
    $("lb-prev").disabled = one; $("lb-next").disabled = one;
    $("lb-cap").replaceChildren(
      el("span", {}, `[${pad(x.issue)}] ${posterTitle(x)} · ${x.designer}`),
      el("span", { class: "meta" },
        x.colour ? el("span", {}, el("i", { class: "sw", style: `background:${x.hex}` }), x.colour) : null,
        x.type ? el("span", {}, x.type) : null,
        one ? null : el("span", {}, `${lb.i + 1} / ${lb.list.length}`),
        el("a", { href: `?d=${x.date}` }, "Open the brief →")));
  }
  function setupLightbox() {
    $("lb-close").addEventListener("click", closeLightbox);
    $("lb-prev").addEventListener("click", () => showPoster(lb.i - 1));
    $("lb-next").addEventListener("click", () => showPoster(lb.i + 1));
    $("lightbox").addEventListener("click", (e) => { if (e.target.classList.contains("lb-stage") || e.target === e.currentTarget) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!$("lightbox").classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft" && lb.list.length > 1) showPoster(lb.i - 1);
      else if (e.key === "ArrowRight" && lb.list.length > 1) showPoster(lb.i + 1);
    });
    let x0 = null;
    $("lightbox").addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    $("lightbox").addEventListener("touchend", (e) => {
      if (x0 == null || lb.list.length < 2) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) showPoster(lb.i + (dx < 0 ? 1 : -1));
    });
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
      `@dailyposter.design ${dayTag()}`,
    ].join("\n");
  }
  function renderShare() {
    $("day-tag").textContent = dayTag();
    $("caption").textContent = caption();
    const tag = (t) => `https://www.instagram.com/explore/tags/${t}/`;
    $("share-links").replaceChildren(
      el("a", { href: tag(`dailyposter${pad(brief.issue)}`), target: "_blank", rel: "noopener" }, "See today's posters ↗"),
      el("a", { href: "https://www.instagram.com/dailyposter.design/", target: "_blank", rel: "noopener" }, "Follow @dailyposter.design ↗"));
  }

  // ---------- Instagram mockups: the poster centred on a plain background, as we post them ----------
  // 4:5, Instagram's tallest feed size. The poster fills the height with 44 px above and below.
  const MOCK = (() => { const W = 1080, H = 1350, h = H - 88, w = Math.round(h / 1.41481); return { W, H, slot: { x: Math.round((W - w) / 2), y: 44, w, h } }; })();
  function mockups() {
    return [
      { key: "tint", name: `${brief.colour.name} tint`, bg: palette.colours[1], fg: "#111111" },
      { key: "dark", name: `${brief.colour.name} dark`, bg: palette.colours[3], fg: "#FFFFFF" },
      { key: "black", name: "Black", bg: "#000000", fg: "#FFFFFF" },
      { key: "white", name: "White", bg: "#FFFFFF", fg: "#111111" },
    ];
  }

  // One mockup as SVG. Used on the page and in the Figma paste.
  function mockupSVG(m, poster) {
    const { W, H, slot } = MOCK;
    const inside = poster
      ? `<image id="Poster" href="${poster}" x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" preserveAspectRatio="xMidYMin slice"/>`
      : `<rect id="Poster goes here" x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="${m.fg}" fill-opacity="0.08"/>`;
    return `<rect id="Background" width="${W}" height="${H}" fill="${m.bg}"/>
${inside}`;
  }

  const state2 = { poster: null };
  function renderMockups() {
    $("mocks").replaceChildren(...mockups().map((m) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MOCK.W} ${MOCK.H}" role="img" aria-label="Instagram mockup on ${esc(m.name)}">${mockupSVG(m, state2.poster)}</svg>`;
      const fig = el("figure", { class: "mock" });
      fig.innerHTML = svg;
      fig.append(el("figcaption", { class: "mono" }, el("span", {}, m.name),
        el("button", { type: "button", onclick: () => downloadMockup(m) }, "Download ↓")));
      return fig;
    }));
  }

  // Draws a mockup at full size and saves it as a PNG.
  async function downloadMockup(m) {
    const { W, H, slot } = MOCK;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = m.bg; ctx.fillRect(0, 0, W, H);
    if (state2.poster) {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = state2.poster; });
      const s = Math.max(slot.w / img.width, slot.h / img.height);
      const sw = slot.w / s, sh = slot.h / s;
      ctx.drawImage(img, (img.width - sw) / 2, 0, sw, sh, slot.x, slot.y, slot.w, slot.h);
    } else {
      ctx.globalAlpha = 0.08; ctx.fillStyle = m.fg; ctx.fillRect(slot.x, slot.y, slot.w, slot.h); ctx.globalAlpha = 1;
    }
    c.toBlob((b) => {
      const a = el("a", { href: URL.createObjectURL(b), download: `daily-poster-${pad(brief.issue)}-${m.key}.png` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  }

  function setupPosterInput() {
    const take = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      if (state2.poster) URL.revokeObjectURL(state2.poster);
      state2.poster = URL.createObjectURL(file);
      renderMockups();
      $("poster-clear").hidden = false;
    };
    $("poster-file").addEventListener("change", (e) => take(e.target.files[0]));
    $("poster-clear").addEventListener("click", () => {
      if (state2.poster) URL.revokeObjectURL(state2.poster);
      state2.poster = null; $("poster-file").value = ""; $("poster-clear").hidden = true; renderMockups();
    });
    const zone = $("mocks");
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drop"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drop"));
    zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("drop"); take(e.dataTransfer.files[0]); });
  }

  // ---------- Figma: every piece of the brief, side by side, as SVG that pastes in as layers ----------
  // Each piece gets its own frame (Figma turns nested <svg> elements into frames): the blank
  // artboard, the four mockups, the type, the colours, the images and the textures. Nothing is
  // placed on the artboard. (A paste can't carry a layout grid, so the page lists its settings.)
  function textWidth(text, font, size) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${size}px "${font}"`;
    return Math.ceil(ctx.measureText(text).width);
  }

  // Images go into the paste at 2160 px wide (2x). Unsplash resizes on request; the others
  // use the 2160 px copies kept on this site.
  const figmaSrc = (it) => ((it.source || "Unsplash") === "Unsplash" && it.src ? it.src.replace(/([?&])w=\d+/, "$1w=2160") : it.src || it.thumb);
  // Images go into the paste as data, since Figma won't fetch links inside pasted SVG.
  let assets = null;
  function prepAssets() {
    const load = (src) => fetch(src, { mode: "cors" }).then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => new Promise((ok) => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }))
      .then((href) => new Promise((ok) => { const i = new Image(); i.onload = () => ok({ href, w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => ok(null); i.src = href; }))
      .catch(() => null);
    // Copies kept on this site (see scripts/media.mjs) come first; they always load.
    assets ??= Promise.all([...(brief.images || []), ...(brief.textures || []), ...(brief.objects || []).map((o) => ({ local: o.image }))].map((it) =>
      (it.local ? load(it.local) : Promise.resolve(null)).then((got) => got || load(figmaSrc(it)))));
    return assets;
  }

  async function figmaSVG() {
    const G = geometry(), t = brief.type, GAP = 160, ink = "#111111";
    const frames = [];
    // A frame: a nested <svg> with its own size and a transparent background.
    const frame = (name, x, y, w, h, body) =>
      frames.push(`<svg id="${esc(name)}" x="${x}" y="${y}" width="${Math.ceil(w)}" height="${Math.ceil(h)}" viewBox="0 0 ${Math.ceil(w)} ${Math.ceil(h)}">\n${body}\n</svg>`);

    // Row 1: the blank artboard, then the four mockups.
    // Names don't end in a number: Figma counts up a trailing number each time you paste
    // (No. 034 becomes No. 35, 36…), so the issue goes first.
    frame(`No. ${pad(brief.issue)} · Daily Poster`, 0, 0, G.W, G.H, `<rect id="Background" width="${G.W}" height="${G.H}" fill="#FFFFFF"/>`);
    let x = G.W + GAP;
    for (const m of mockups()) {
      frame(`Mockup · ${m.name}`, x, 0, MOCK.W, MOCK.H, mockupSVG(m, null));
      x += MOCK.W + 80;
    }
    let width = x - 80;
    let y = Math.max(G.H, MOCK.H) + GAP;

    // Row 2: the type. All three headlines and all three sublines, each its own text box,
    // so you can pick from the lot.
    const hlSize = 140, subSize = 40, lineGap = 40;
    const hls = brief.headlines, subs = brief.sublines || [];
    const typeW = Math.max(...hls.map((h) => textWidth(h, t.display, hlSize)), ...subs.map((s) => textWidth(s, t.text, subSize)));
    let ty = 0;
    const lines = [];
    hls.forEach((h, i) => { lines.push(`<text id="0${i + 1} Headline" fill="${ink}" font-family="${esc(t.display)}" font-size="${hlSize}" x="0" y="${(ty + hlSize * 0.9).toFixed(1)}">${esc(h)}</text>`); ty += hlSize * 1.2 + lineGap; });
    ty += 40;
    subs.forEach((s, i) => { lines.push(`<text id="0${i + 1} Subline" fill="${ink}" font-family="${esc(t.text)}" font-size="${subSize}" x="0" y="${(ty + subSize * 0.95).toFixed(1)}">${esc(s)}</text>`); ty += subSize * 1.3 + lineGap; });
    // The labels most posters carry, each its own text box in the subline face. Layer names don't
    // end in a number (Figma would count it up on every paste).
    const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }).format(new Date(brief.date + "T12:00:00Z")).replace(",", "");
    const labels = [["Daily Poster", "Daily Poster"], ["Issue", `No. ${pad(brief.issue)}`], ["Date", day], ["Source", brief.story.source]].filter(([, v]) => v);
    ty += 40;
    labels.forEach(([name, v]) => { lines.push(`<text id="Label · ${name}" fill="${ink}" font-family="${esc(t.text)}" font-size="${subSize}" x="0" y="${(ty + subSize * 0.95).toFixed(1)}">${esc(v)}</text>`); ty += subSize * 1.3 + lineGap; });
    const typeH = ty - lineGap;
    frame("Type", 0, y, typeW, typeH, lines.join("\n"));
    width = Math.max(width, typeW);
    y += typeH + GAP;

    // Row 3: the colours.
    const colours = palette.colours.concat(brief.always);
    frame("Colours", 0, y, colours.length * 184 - 24, 160, colours.map((hex, i) =>
      `<rect id="${hex}" x="${i * 184}" y="0" width="160" height="160" fill="${hex}"${hex === "#FFFFFF" ? ' stroke="#E6E6E3"' : ""}/>`).join("\n"));
    y += 160 + GAP;

    // Rows 4 and 5: the images at their own proportions, then the textures.
    const got = await prepAssets();
    const nImg = (brief.images || []).length;
    const place = (list, offset, h, square, name, label) => {
      if (!list.length) return;
      let ix = 0;
      const body = list.map((it, k) => {
        const a = got[offset + k];
        const w = square ? h : Math.round(a ? (h * a.w) / a.h : h * 0.75);
        const id = esc([`${label} ${k + 1}`, it.title, it.credit || it.photographer, it.source || "Unsplash"].filter(Boolean).join(" · "));
        const out = a
          ? `<image id="${id}" href="${a.href}" x="${ix}" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect id="${id}" x="${ix}" y="0" width="${w}" height="${h}" fill="#E5E5E5"/>`;
        ix += w + 40;
        return out;
      }).join("\n");
      frame(name, 0, y, ix - 40, h, body);
      width = Math.max(width, ix - 40);
      y += h + GAP;
    };
    place(brief.images || [], 0, 600, false, "Images", "Image");
    place(brief.textures || [], nImg, 400, true, "Textures", "Texture");
    const objs = (brief.objects || []).map((o) => ({ title: o.name, credit: o.model?.creator, source: o.model ? o.model.source : "3D" }));
    place(objs, nImg + (brief.textures || []).length, 600, true, "3D objects", "Object");
    y -= GAP;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(y)}" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(y)}">
${frames.join("\n")}
</svg>`;
  }

  async function copyFigma() {
    toast("Copying for Figma…", true);
    const blob = figmaSVG().then((s) => new Blob([s], { type: "text/plain" }));
    const done = () => toast("Copied");
    try {
      // Hand the clipboard a promise, so the copy still counts as part of the click.
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      done();
    } catch {
      try { await navigator.clipboard.writeText(await (await blob).text()); done(); }
      catch { toast("Couldn't copy here. Try the live site."); }
    }
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
    showcase = window.__SHOWCASE__ || (await loadJSON("data/showcase.json", [])) || [];
    if (!brief) { $("hero-hl").textContent = "The first brief arrives tomorrow morning."; document.documentElement.classList.add("ready"); return; }
    palette = brief.palette || brief.palettes?.find((p) => p.name === "Vivid") || brief.palettes?.[0];
    document.documentElement.style.setProperty("--accent", palette.colours[0]);

    renderType(); setupHero(); renderTop(); renderStory();
    renderOptions("headlines", brief.headlines, "h", (t, i) => `0${i + 1}`);
    renderOptions("sublines", brief.sublines, "s", (t, i) => `0${i + 1}`);
    renderColour(); renderImages(); renderGrid(); renderShare();
    preparePosters(); renderFilters(); renderArchive(); setupLightbox(); setupHeroImages();
    renderMockups();
    setupPosterInput();
    (window.requestIdleCallback || setTimeout)(() => prepAssets());

    // Sections reveal as they scroll into view.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    document.querySelectorAll(".sec, .archive").forEach((n) => io.observe(n));
    // The footer is the last thing on the page and short, so on a tall screen it never gets above
    // the bottom 12% that the observer above ignores. It shows as soon as any of it is on screen.
    const foot = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); foot.unobserve(e.target); }
    }, { threshold: 0 });
    document.querySelectorAll(".foot").forEach((n) => foot.observe(n));
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("ready")));

    $("copy-figma").addEventListener("click", copyFigma);
    $("copy-figma-top").addEventListener("click", copyFigma);
    $("copy-caption").addEventListener("click", () => copy(caption(), "Caption copied"));
  }

  init();
})();
