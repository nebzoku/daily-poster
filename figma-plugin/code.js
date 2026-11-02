// Daily Poster: Figma plugin.
// Builds the day's 1080 × 1920 artboard: layout grids, the palette as colour
// styles, text in the day's typefaces, and the Unsplash images. Figma includes
// every Google Font, so the typefaces load without installing anything.

figma.showUI(__html__, { width: 320, height: 330 });

function hexToRgb(hex) {
  var n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function luminance(hex) {
  var c = hexToRgb(hex);
  function lin(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
function ink(hex) { return luminance(hex) > 0.22 ? "#000000" : "#FFFFFF"; }
function solid(hex) { return [{ type: "SOLID", color: hexToRgb(hex) }]; }
function pad(n) { return String(n).padStart(3, "0"); }

// Find a usable style for a family, preferring Regular.
async function resolveFont(family, available) {
  var styles = available.filter(function (f) { return f.fontName.family === family; }).map(function (f) { return f.fontName.style; });
  if (!styles.length) return null;
  var style = styles.indexOf("Regular") >= 0 ? "Regular" : styles[0];
  var font = { family: family, style: style };
  await figma.loadFontAsync(font);
  return font;
}

function text(chars, font, size, colour, width) {
  var t = figma.createText();
  t.fontName = font;
  t.fontSize = size;
  t.characters = chars;
  t.fills = solid(colour);
  if (width) { t.textAutoResize = "HEIGHT"; t.resize(width, t.height); }
  return t;
}

function stack(name, spacing) {
  var f = figma.createFrame();
  f.name = name;
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = spacing;
  f.fills = [];
  return f;
}
function row(name, spacing) {
  var f = stack(name, spacing);
  f.layoutMode = "HORIZONTAL";
  return f;
}

async function imageRect(url, w, h, name) {
  var r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  try {
    var img = await figma.createImageAsync(url);
    r.fills = [{ type: "IMAGE", imageHash: img.hash, scaleMode: "FILL" }];
  } catch (e) {
    r.fills = solid("#E5E5E5");
  }
  return r;
}

async function build(brief, strings) {
  var available = await figma.listAvailableFontsAsync();
  var ui = (await resolveFont("Inter", available)) || { family: "Roboto", style: "Regular" };
  await figma.loadFontAsync(ui);
  var display = (await resolveFont(brief.type.display, available)) || ui;
  var body = (await resolveFont(brief.type.text, available)) || ui;

  var palette = brief.palette || brief.palettes.filter(function (p) { return p.name === "Vivid"; })[0] || brief.palettes[0];
  var issue = "No. " + pad(brief.issue);

  // A page for the day
  var page = figma.createPage();
  page.name = "Daily Poster " + issue + " · " + brief.colour.name;
  await figma.setCurrentPageAsync(page);

  // Colour styles
  var colours = palette.colours.concat(brief.always);
  var styles = [];
  for (var i = 0; i < colours.length; i++) {
    var st = figma.createPaintStyle();
    var label = i < palette.colours.length ? brief.colour.name + " " + (i + 1) : (colours[i] === "#000000" ? "Black" : "White");
    st.name = "Daily Poster/" + issue + "/" + label;
    st.paints = solid(colours[i]);
    styles.push(st);
  }

  // Grid geometry
  var g = brief.grid, W = g.size[0], H = g.size[1];
  var short = Math.min(W, H), m = g.margin * short, gut = g.gutter * short;
  var col = (W - 2 * m - (g.columns - 1) * gut) / g.columns;
  var rowH = (H - 2 * m - (g.rows - 1) * gut) / g.rows;
  function y(r) { return m + (r - 1) * (rowH + gut); }
  function span(n, size) { return n * size + (n - 1) * gut; }

  // The artboard
  var bg = palette.colours[0], fg = ink(bg);
  var poster = figma.createFrame();
  poster.name = "Daily Poster " + issue;
  poster.resize(W, H);
  await poster.setFillStyleIdAsync(styles[0].id);
  poster.layoutGrids = [
    { pattern: "COLUMNS", alignment: "STRETCH", count: g.columns, gutterSize: gut, offset: m, visible: true, color: { r: 1, g: 0.23, b: 0.19, a: 0.1 } },
    { pattern: "ROWS", alignment: "STRETCH", count: g.rows, gutterSize: gut, offset: m, visible: true, color: { r: 0.1, g: 0.45, b: 1, a: 0.08 } },
  ];

  var hasImage = brief.images && brief.images.length;
  if (hasImage) {
    var im = brief.images[0];
    var hero = await imageRect(im.src, W - 2 * m, span(6, rowH), "Image · " + im.photographer + " on Unsplash");
    hero.x = m; hero.y = m;
    poster.appendChild(hero);
  }

  var hlTop = hasImage ? y(7) : y(2);
  var hlBottom = y(10) + rowH;
  var hl = text(brief.headlines[0], display, 180, fg, W - 2 * m);
  hl.name = "Headline";
  // shrink until it fits its rows (size, leading and tracking are the designer's to change)
  while (hl.height > hlBottom - hlTop && hl.fontSize > 24) hl.fontSize = hl.fontSize - 4;
  hl.x = m; hl.y = hlBottom - hl.height;
  poster.appendChild(hl);

  var sub = text(brief.sublines[0], body, 31, fg, span(4, col));
  sub.name = "Subline"; sub.x = m; sub.y = y(11);
  poster.appendChild(sub);

  var footY = y(12) + rowH;
  var parts = [["Date", strings.date], ["Time", strings.time], ["Source", brief.story.source]];
  var footTexts = parts.map(function (p) { var t = text(p[1], body, 25, fg); t.name = p[0]; return t; });
  footTexts[0].x = m;
  footTexts[1].x = W / 2 - footTexts[1].width / 2;
  footTexts[2].x = W - m - footTexts[2].width;
  footTexts.forEach(function (t) { t.y = footY - t.height; poster.appendChild(t); });
  var rule = figma.createRectangle();
  rule.name = "Rule"; rule.resize(W - 2 * m, 2); rule.fills = solid(fg);
  rule.x = m; rule.y = footY - footTexts[0].height - 20;
  poster.appendChild(rule);

  // Everything else from the brief, beside the artboard
  var side = stack("Brief · " + issue, 56);
  side.x = W + 160; side.y = 0;
  var dark = "#111111", grey = "#8A8A86";
  function heading(t) { var h = text(t, ui, 20, grey); h.name = t; return h; }
  function group(title, nodes, gap) {
    var s = stack(title, gap || 16);
    s.appendChild(heading(title));
    nodes.forEach(function (n) { s.appendChild(n); });
    side.appendChild(s);
  }

  group("Story", [
    text(brief.story.title, ui, 40, dark, 900),
    text(brief.story.summary, ui, 22, dark, 760),
    text(brief.story.source + " · " + strings.longDate + " · " + strings.time + "\n" + brief.story.url, ui, 18, grey, 900),
  ]);
  group("Headlines", brief.headlines.map(function (h) { return text(h, display, 64, dark, 1000); }), 20);
  group("Sublines", brief.sublines.map(function (s) { return text(s, body, 26, dark, 800); }));

  var sw = row("Swatches", 16);
  for (var k = 0; k < colours.length; k++) {
    var cell = stack(colours[k], 10);
    var chip = figma.createRectangle();
    chip.resize(120, 120);
    await chip.setFillStyleIdAsync(styles[k].id);
    chip.strokes = solid("#E6E6E3");
    chip.name = colours[k];
    cell.appendChild(chip);
    cell.appendChild(text(colours[k], body, 16, grey));
    sw.appendChild(cell);
  }
  group("Palette · " + brief.colour.name + " (black and white always allowed)", [sw]);

  group("Type · this pairing is required", [
    text(brief.type.display + " for the headline", display, 48, dark),
    text(brief.type.text + " for the subline and details", body, 24, dark),
    text(brief.type.reason, ui, 18, grey, 800),
  ]);

  if (hasImage) {
    var imgs = row("Images", 24);
    for (var j = 0; j < brief.images.length; j++) {
      var it = brief.images[j];
      var c = stack("Image " + (j + 1), 10);
      c.appendChild(await imageRect(it.src, 270, 480, "Photo by " + it.photographer + " on Unsplash"));
      c.appendChild(text("Photo by " + it.photographer + " on Unsplash", ui, 14, grey, 270));
      imgs.appendChild(c);
    }
    group("Images · optional, credit the photographer", [imgs]);
  }

  group("Share", [text("Post it with #dailyposter #dailyposter" + pad(brief.issue), ui, 22, dark)]);

  figma.viewport.scrollAndZoomIntoView([poster, side]);
  figma.currentPage.selection = [poster];
  var missing = [];
  if (display === ui) missing.push(brief.type.display);
  if (body === ui) missing.push(brief.type.text);
  figma.notify(missing.length ? "Built. Couldn't find " + missing.join(" and ") + " in Figma, so Inter is standing in." : "Daily Poster " + issue + " is ready.");
}

figma.ui.onmessage = async function (msg) {
  if (msg.type !== "build") return;
  try {
    await build(msg.brief, msg.strings);
    figma.closePlugin();
  } catch (e) {
    figma.ui.postMessage({ type: "error", text: "Something went wrong: " + (e && e.message ? e.message : e) });
  }
};
