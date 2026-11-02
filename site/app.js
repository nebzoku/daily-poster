// Daily Poster Brief: renders one day's brief from data/<date>.json.
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
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

  const state = { h: 0, s: 0, p: 0, bg: null, img: 0, grid: true };
  let brief, index;

  const pad = (n) => String(n).padStart(3, "0");
  const fmtDate = (iso, opts) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...opts }).format(new Date(iso));
  const longDate = (d) => fmtDate(d + "T12:00:00Z", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const shortDate = (d) => fmtDate(d + "T12:00:00Z", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".");
  const words = (s) => s.trim().split(/\s+/).length;

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function luminance(hex) {
    const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = rgb(hex).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const ink = (hex) => (luminance(hex) > 0.22 ? "#000000" : "#FFFFFF");
  const chroma = (hex) => { const c = rgb(hex); return Math.max(...c) - Math.min(...c); };
  const lead = (p) => p.colours.reduce((a, b) => (chroma(b) > chroma(a) ? b : a));

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 1400);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(`Copied ${text}`); }
    catch { toast(text); }
  }

  // ---------- rendering ----------

  function renderTop() {
    document.title = `No. ${pad(brief.issue)} · ${brief.headlines[0]} · Daily Poster Brief`;
    $("issue").textContent = `No. ${pad(brief.issue)}`;
    $("date").textContent = longDate(brief.date);
    const i = index.findIndex((x) => x.date === brief.date);
    const older = index[i + 1], newer = index[i - 1];
    const link = (a, item) => {
      if (item) { a.href = `?d=${item.date}`; a.removeAttribute("aria-disabled"); }
      else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); }
    };
    link($("prev"), older);
    link($("next"), newer);
  }

  function renderStory() {
    const s = brief.story;
    $("colour-name").textContent = `Today is ${brief.colour.name.toLowerCase()} · ${brief.colour.degrees}°`;
    $("story-title").textContent = s.title;
    $("story-summary").textContent = s.summary;
    const when = fmtDate(s.published, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    $("story-source").replaceChildren(
      `${s.source} · ${when} · `,
      el("a", { href: s.url, target: "_blank", rel: "noopener" }, "Read the story ↗")
    );
  }

  function renderOptions(id, list, key, meta) {
    $(id).replaceChildren(
      ...list.map((t, i) =>
        el("button", {
          type: "button", class: "opt", "aria-pressed": String(state[key] === i),
          onclick: () => { state[key] = i; renderOptions(id, list, key, meta); renderProof(); },
        }, el("span", { class: "txt" }, t), el("span", { class: "meta" }, meta(t, i)))
      )
    );
  }

  function renderColour() {
    const idx = WHEEL.findIndex(([n]) => n === brief.colour.name);
    $("wheel").replaceChildren(
      ...WHEEL.map(([n, h], i) => el("i", { class: i === idx ? "on" : "", title: n, style: `background: oklch(0.7 0.16 ${h})` }))
    );
    $("wheel-key").replaceChildren(
      `${brief.colour.yesterday} yesterday · `, el("b", {}, `${brief.colour.name} today`), ` · ${brief.colour.tomorrow} tomorrow`
    );
    $("palettes").replaceChildren(
      ...brief.palettes.map((p, pi) => {
        const chip = (hex, fixed) =>
          el("button", {
            type: "button", class: "sw" + (fixed ? " fixed" : ""), "aria-pressed": String(state.p === pi && state.bg === hex),
            "aria-label": `${hex}, use behind proof and copy`,
            onclick: () => { state.p = pi; state.bg = hex; renderColour(); renderProof(); copy(hex); },
          }, el("span", { class: "chip", style: `background:${hex}` }), el("span", { class: "hex" }, hex));
        return el("div", { class: "palette", "aria-current": String(state.p === pi) },
          el("button", {
            type: "button", onclick: () => { state.p = pi; state.bg = lead(p); renderColour(); renderProof(); },
          }, el("p", { class: "pname" }, p.name), el("p", { class: "pnote" }, p.note)),
          el("div", { class: "swatches" }, ...p.colours.map((c) => chip(c, false)), ...brief.always.map((c) => chip(c, true)))
        );
      })
    );
  }

  function renderType() {
    const t = brief.type;
    $("pair-css").href = t.css;
    const block = (family, role, url) =>
      el("div", { class: "spec-type" },
        el("span", { class: "aa", style: `font-family: "${family}"` }, "Aa"),
        el("p", { class: "tname" }, el("a", { href: url, target: "_blank", rel: "noopener" }, family)),
        el("p", { class: "trole" }, role)
      );
    $("pair").replaceChildren(block(t.display, "Headline", t.displayUrl), block(t.text, "Subline and details", t.textUrl));
    $("pair-reason").textContent = t.reason;
    const proof = $("proof");
    proof.style.setProperty("--p-display", `"${t.display}"`);
    proof.style.setProperty("--p-text", `"${t.text}"`);
  }

  function renderImages() {
    const imgs = brief.images || [];
    if (!imgs.length) {
      $("images").replaceChildren(el("p", { class: "note" }, "No images today."));
      state.img = -1;
      return;
    }
    $("images").replaceChildren(
      ...imgs.map((im, i) =>
        el("div", { class: "img-opt" + (state.img === i ? " on" : "") },
          el("button", {
            type: "button", class: "frame", "aria-pressed": String(state.img === i), "aria-label": `Use image ${i + 1}: ${im.alt}`,
            onclick: () => { state.img = i; renderImages(); renderProof(); },
          }, el("img", { src: im.thumb, alt: im.alt, loading: "lazy" })),
          el("p", { class: "credit" }, "Photo by ", el("a", { href: im.photographerUrl, target: "_blank", rel: "noopener" }, im.photographer),
            " on ", el("a", { href: im.page, target: "_blank", rel: "noopener" }, "Unsplash"))
        )
      ),
    );
    $("images").after(
      $("no-image") ||
        el("button", { type: "button", class: "no-image", id: "no-image", onclick: () => { state.img = state.img === -1 ? 0 : -1; renderImages(); renderProof(); } })
    );
    $("no-image").textContent = state.img === -1 ? "No image on the proof ●" : "Try the proof without an image";
    $("no-image").setAttribute("aria-pressed", String(state.img === -1));
  }

  function renderGrid() {
    const g = brief.grid;
    const [w, h] = g.size;
    const short = Math.min(w, h);
    const m = g.margin * short, gut = g.gutter * short;
    const col = (w - 2 * m - (g.columns - 1) * gut) / g.columns;
    const row = (h - 2 * m - (g.rows - 1) * gut) / g.rows;
    const px = (n) => `${+n.toFixed(1)} px`;
    const rows = [
      ["Format", `${g.format} · ${w} × ${h} px`],
      ["Columns", `${g.columns} at ${px(col)}`],
      ["Rows", `${g.rows} at ${px(row)}`],
      ["Margin", `${g.margin * 100}% of the short side · ${px(m)}`],
      ["Gutter", `${g.gutter * 100}% of the short side · ${px(gut)}`],
    ];
    $("grid-spec").replaceChildren(...rows.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
    $("pgrid").replaceChildren(...Array.from({ length: g.columns * g.rows }, () => el("i")));
  }

  function renderArchive() {
    $("archive-list").replaceChildren(
      ...index.map((x) =>
        el("li", {}, el("a", { href: `?d=${x.date}`, "aria-current": String(x.date === brief.date) },
          el("span", { class: "n" }, `No. ${pad(x.issue)}`),
          el("span", { class: "d" }, shortDate(x.date)),
          el("span", { class: "h" }, x.headline),
          el("span", { class: "c" }, x.colour)))
      )
    );
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
    const bg = state.bg || lead(brief.palettes[state.p]);
    proof.style.setProperty("--p-bg", bg);
    proof.style.setProperty("--p-fg", ink(bg));
    document.documentElement.style.setProperty("--accent", lead(brief.palettes[1] || brief.palettes[0]));

    const im = brief.images?.[state.img];
    $("pimg").replaceChildren(...(im ? [el("img", { src: im.src, alt: "" })] : []));
    proof.classList.toggle("no-image", !im);
    proof.classList.toggle("no-grid", !state.grid);

    $("phl-text").textContent = brief.headlines[state.h];
    $("psub").textContent = brief.sublines[state.s];
    const s = brief.story;
    $("pfoot").replaceChildren(
      el("span", {}, fmtDate(s.published, { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".")),
      el("span", {}, fmtDate(s.published, { hour: "2-digit", minute: "2-digit" })),
      el("span", {}, s.source)
    );
    fitHeadline();
  }

  // Keep one proof element and move it between the sticky column and the mobile slot.
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
    const d = new URLSearchParams(location.search).get("d");
    brief = window.__BRIEF__ || (await loadJSON(d ? `data/${d}.json` : "data/latest.json")) || (await loadJSON("data/latest.json"));
    index = window.__INDEX__ || (await loadJSON("data/index.json", [])) || [];
    if (!brief) {
      $("story-title").textContent = "No brief yet. The first one arrives tomorrow morning.";
      return;
    }
    state.bg = lead(brief.palettes[0]);
    renderTop(); renderStory();
    renderOptions("headlines", brief.headlines, "h", (t) => `${words(t)} words`);
    renderOptions("sublines", brief.sublines, "s", (t, i) => `0${i + 1}`);
    renderColour(); renderType(); renderImages(); renderGrid(); renderArchive();
    placeProof(); renderProof();

    $("grid-toggle").addEventListener("click", (e) => {
      state.grid = !state.grid;
      e.currentTarget.setAttribute("aria-pressed", String(state.grid));
      renderProof();
    });
    narrow.addEventListener("change", placeProof);
    new ResizeObserver(fitHeadline).observe($("proof"));
    document.fonts.load(`40px "${brief.type.display}"`).then(fitHeadline).catch(() => {});
    document.fonts.ready.then(fitHeadline);
  }

  init();
})();
