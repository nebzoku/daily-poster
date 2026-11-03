// Curated Google Fonts pairings that work at poster scale.
// Each day Claude picks the one that best suits the story, and the designer
// must use it. Leading, tracking and case are left to the designer.

export const FONT_PAIRS = [
  { id: "big-shoulders", display: "Big Shoulders Display", text: "JetBrains Mono" },
  { id: "anton", display: "Anton", text: "IBM Plex Mono" },
  { id: "archivo", display: "Archivo Black", text: "Archivo" },
  { id: "bebas", display: "Bebas Neue", text: "Space Mono" },
  { id: "instrument", display: "Instrument Serif", text: "Inter Tight" },
  { id: "dm", display: "DM Serif Display", text: "DM Mono" },
  { id: "fraunces", display: "Fraunces", text: "Manrope" },
  { id: "syne", display: "Syne", text: "Space Grotesk" },
  { id: "unbounded", display: "Unbounded", text: "Geist Mono" },
  { id: "bricolage", display: "Bricolage Grotesque", text: "Geist" },
  { id: "oswald", display: "Oswald", text: "Source Serif 4" },
  { id: "abril", display: "Abril Fatface", text: "Karla" },
  { id: "caslon", display: "Libre Caslon Display", text: "Libre Franklin" },
  { id: "gloock", display: "Gloock", text: "Schibsted Grotesk" },
  { id: "familjen", display: "Familjen Grotesk", text: "Newsreader" },
  { id: "six-caps", display: "Six Caps", text: "Work Sans" },
  { id: "playfair", display: "Playfair Display", text: "Mulish" },
  { id: "bodoni", display: "Bodoni Moda", text: "Jost" },
  { id: "cormorant", display: "Cormorant Garamond", text: "Hanken Grotesk" },
  { id: "dela", display: "Dela Gothic One", text: "Red Hat Mono" },
  { id: "rubik-mono", display: "Rubik Mono One", text: "Rubik" },
  { id: "major-mono", display: "Major Mono Display", text: "Public Sans" },
  { id: "chivo", display: "Chivo", text: "Chivo Mono" },
  { id: "alfa", display: "Alfa Slab One", text: "Sora" },
  { id: "young-serif", display: "Young Serif", text: "Instrument Sans" },
  { id: "tenor", display: "Tenor Sans", text: "Spectral" },
  { id: "bowlby", display: "Bowlby One SC", text: "Overpass Mono" },
  { id: "darker", display: "Darker Grotesque", text: "Lora" },
  { id: "anybody", display: "Anybody", text: "Azeret Mono" },
  { id: "climate", display: "Climate Crisis", text: "Inter" },
  { id: "tilt", display: "Tilt Warp", text: "Atkinson Hyperlegible" },
  { id: "fjalla", display: "Fjalla One", text: "Crimson Pro" },
  { id: "zilla", display: "Zilla Slab", text: "IBM Plex Sans" },
  { id: "antonio", display: "Antonio", text: "PT Serif" },
  { id: "league-gothic", display: "League Gothic", text: "Sometype Mono" },
  { id: "poiret", display: "Poiret One", text: "Figtree" },
];

// No typeface may appear in two briefs within this many days.
export const TYPE_COOLDOWN_DAYS = 14;

// Pairings whose faces haven't been used recently. `recent` is a list of earlier briefs.
// If too few are left (it shouldn't happen with this list), relax to a week, then to anything.
export function availablePairs(recent, date, daysBetween) {
  const usedWithin = (days) => {
    const used = new Set();
    for (const b of recent) {
      if (!b || !b.type || b.date === date) continue;
      const age = daysBetween(b.date, date);
      if (age > 0 && age <= days) { used.add(b.type.display); used.add(b.type.text); }
    }
    return used;
  };
  for (const days of [TYPE_COOLDOWN_DAYS, 7, 0]) {
    const used = usedWithin(days);
    const ok = FONT_PAIRS.filter((f) => !used.has(f.display) && !used.has(f.text));
    if (ok.length >= 3) return ok;
  }
  return FONT_PAIRS;
}

export function fontPair(id) {
  return FONT_PAIRS.find((f) => f.id === id) || FONT_PAIRS[0];
}

const plus = (n) => n.replace(/ /g, "+");

// Stylesheet for the proof, and specimen pages so the designer can download them.
export function fontAssets(pair) {
  return {
    css: `https://fonts.googleapis.com/css2?family=${plus(pair.display)}&family=${plus(pair.text)}&display=swap`,
    displayUrl: `https://fonts.google.com/specimen/${plus(pair.display)}`,
    textUrl: `https://fonts.google.com/specimen/${plus(pair.text)}`,
  };
}
