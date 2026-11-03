// Daily Poster: Figma plugin.
// Lays out the day's pieces side by side: a blank A-size artboard with a real layout grid,
// the three Instagram mockups, the headlines and sublines in the day's typefaces, the palette
// (also saved as colour styles), the images and the textures. Nothing is placed on the
// artboard. Figma includes every Google Font, so the typefaces load without installing anything.

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

// An image at a fixed height, keeping its own proportions.
async function imageRect(url, h, name) {
  var r = figma.createRectangle();
  r.name = name;
  try {
    var img = await figma.createImageAsync(url);
    var size = await img.getSizeAsync();
    r.resize(Math.round(h * size.width / size.height), h);
    r.fills = [{ type: "IMAGE", imageHash: img.hash, scaleMode: "FILL" }];
  } catch (e) {
    r.resize(Math.round(h * 0.75), h);
    r.fills = solid("#E5E5E5");
  }
  return r;
}

// Places a node at x, y on the page and returns it.
function place(node, x, y) { node.x = x; node.y = y; return node; }

// One Instagram mockup (template A): the poster slot centred with a label on each side.
async function mockup(def, brief, mono, accentStyle) {
  var W = 1080, H = 1440, bx = 32.5, by = 24, size = 16, d = 10;   // poster fills the height: 48 px above and below, 65 px at the sides
  var f = figma.createFrame();
  f.name = "Mockup · " + def.name;
  f.resize(W, H);
  f.fills = solid(def.bg);
  f.clipsContent = true;

  var slot = figma.createRectangle();
  slot.name = "Poster goes here";
  slot.resize(950, 1344);
  slot.fills = [{ type: "SOLID", color: hexToRgb(def.fg), opacity: 0.08 }];
  f.appendChild(place(slot, 65, 48));

  function label(chars, name) {
    var t = figma.createText();
    t.fontName = mono;
    t.fontSize = size;
    t.characters = chars.toUpperCase();
    t.letterSpacing = { unit: "PERCENT", value: 6 };
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.fills = solid(def.fg);
    t.name = name;
    f.appendChild(t);
    return t;
  }

  // Top: a dot in the day's colour, then the name, centred together.
  var top = label("Daily Poster", "Daily Poster");
  var dot = figma.createEllipse();
  dot.name = "Dot";
  dot.resize(d, d);
  await dot.setFillStyleIdAsync(accentStyle.id);
  f.appendChild(dot);
  var x0 = W / 2 - (d * 2 + top.width) / 2;
  place(dot, x0, by - d / 2);
  place(top, x0 + d * 2, by - top.height / 2);

  // Bottom: the source, centred.
  var bottom = label(brief.story.source, "Source");
  place(bottom, W / 2 - bottom.width / 2, H - by - bottom.height / 2);

  // Left reads upwards, right reads downwards; both centred top to bottom.
  var parts = brief.date.split("-");
  var left = label("No. " + pad(brief.issue), "Number");
  left.rotation = 90;
  place(left, bx - left.height / 2, H / 2 + left.width / 2);
  var right = label(parts[2] + "." + parts[1] + "." + parts[0].slice(2), "Date");
  right.rotation = -90;
  place(right, W - bx + right.height / 2, H / 2 - right.width / 2);
  return f;
}

async function build(brief) {
  var available = await figma.listAvailableFontsAsync();
  var ui = (await resolveFont("Inter", available)) || { family: "Roboto", style: "Regular" };
  await figma.loadFontAsync(ui);
  var display = (await resolveFont(brief.type.display, available)) || ui;
  var body = (await resolveFont(brief.type.text, available)) || ui;
  var mono = (await resolveFont("Geist Mono", available)) || (await resolveFont("Roboto Mono", available)) || ui;

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
  var short = Math.min(W, H);
  function px(v) { return v < 1 ? Math.round(v * short) : v; }  // old briefs used fractions
  var m = px(g.margin), gut = px(g.gutter);

  // Everything sits side by side, loose, for the designer to use. Nothing is placed on the artboard.
  var GAP = 160, dark = "#111111", made = [];

  // Row 1: the blank artboard with a real layout grid, then the three mockups.
  var poster = figma.createFrame();
  poster.name = "Daily Poster " + issue;
  poster.resize(W, H);
  poster.fills = solid("#FFFFFF");
  poster.layoutGrids = [
    { pattern: "COLUMNS", alignment: "STRETCH", count: g.columns, gutterSize: gut, offset: m, visible: true, color: { r: 1, g: 0.23, b: 0.19, a: 0.1 } },
    { pattern: "ROWS", alignment: "STRETCH", count: g.rows, gutterSize: gut, offset: m, visible: true, color: { r: 0.1, g: 0.45, b: 1, a: 0.08 } },
  ];
  made.push(place(poster, 0, 0));

  var defs = [
    { name: brief.colour.name + " dark", bg: palette.colours[3], fg: "#FFFFFF" },
    { name: "Black", bg: "#000000", fg: "#FFFFFF" },
    { name: "White", bg: "#FFFFFF", fg: "#111111" },
  ];
  var x = W + GAP;
  for (var d = 0; d < defs.length; d++) {
    made.push(place(await mockup(defs[d], brief, mono, styles[0]), x, 0));
    x += 1080 + 80;
  }
  var y = Math.max(H, 1440) + GAP;

  // Row 2: the three headlines in the display face, then the three sublines in the text face.
  for (var h = 0; h < brief.headlines.length; h++) {
    var hl = text(brief.headlines[h], display, 140, dark);
    hl.name = "Headline " + (h + 1);
    made.push(place(hl, 0, y));
    y += hl.height + 40;
  }
  y += 60;
  for (var s = 0; s < brief.sublines.length; s++) {
    var sub = text(brief.sublines[s], body, 40, dark, 1100);
    sub.name = "Subline " + (s + 1);
    made.push(place(sub, 0, y));
    y += sub.height + 32;
  }
  y += 100;

  // Row 3: the palette.
  for (var k = 0; k < colours.length; k++) {
    var chip = figma.createRectangle();
    chip.resize(160, 160);
    await chip.setFillStyleIdAsync(styles[k].id);
    if (colours[k] === "#FFFFFF") chip.strokes = solid("#E6E6E3");
    chip.name = colours[k];
    made.push(place(chip, k * 184, y));
  }
  y += 160 + GAP;

  // Row 4: the images at their own proportions. Row 5: the textures.
  if (brief.images && brief.images.length) {
    var ix = 0;
    for (var j = 0; j < brief.images.length; j++) {
      var it = brief.images[j];
      var who = it.credit || it.photographer;
      var where = it.source || "Unsplash";
      var r = await imageRect(it.src, 600, "Image " + (j + 1) + " · " + who + " · " + where + (it.licence === "CC0" ? " · public domain" : ""));
      made.push(place(r, ix, y));
      ix += r.width + 40;
    }
    y += 600 + 80;
  }
  if (brief.textures && brief.textures.length) {
    for (var q = 0; q < brief.textures.length; q++) {
      var tx = brief.textures[q];
      var sq = figma.createRectangle();
      sq.name = "Texture " + (q + 1) + " · " + tx.title + " · " + (tx.credit ? tx.credit + " · " : "") + tx.source;
      sq.resize(400, 400);
      try {
        var timg = await figma.createImageAsync(tx.src || tx.thumb);
        sq.fills = [{ type: "IMAGE", imageHash: timg.hash, scaleMode: "FILL" }];
      } catch (e) { sq.fills = solid("#E5E5E5"); }
      made.push(place(sq, q * 440, y));
    }
  }

  figma.viewport.scrollAndZoomIntoView(made);
  figma.currentPage.selection = [poster];
  var missing = [];
  if (display === ui) missing.push(brief.type.display);
  if (body === ui) missing.push(brief.type.text);
  figma.notify(missing.length ? "Built. Couldn't find " + missing.join(" and ") + " in Figma, so Inter is standing in." : "Daily Poster " + issue + " is ready.");
}

figma.ui.onmessage = async function (msg) {
  if (msg.type !== "build") return;
  try {
    await build(msg.brief);
    figma.closePlugin();
  } catch (e) {
    figma.ui.postMessage({ type: "error", text: "Something went wrong: " + (e && e.message ? e.message : e) });
  }
};
