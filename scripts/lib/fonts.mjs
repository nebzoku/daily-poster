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
  { id: "bricolage", display: "Bricolage Grotesque", text: "Geist Mono" },
  { id: "oswald", display: "Oswald", text: "Source Serif 4" },
  { id: "abril", display: "Abril Fatface", text: "Karla" },
  { id: "caslon", display: "Libre Caslon Display", text: "Libre Franklin" },
  { id: "gloock", display: "Gloock", text: "Schibsted Grotesk" },
  { id: "familjen", display: "Familjen Grotesk", text: "Newsreader" },
  { id: "six-caps", display: "Six Caps", text: "Work Sans" },
];

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
