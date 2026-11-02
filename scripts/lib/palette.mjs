// The colour wheel. Twelve steps, moving one step a day.
// 3 October 2026 was Blue, the next day Teal, then Jade, and so on round the wheel.

export const EPOCH = "2026-10-03";

// Steps in wheel order. `main` is the day's lead colour: the most vivid version
// of that hue a screen can show, calibrated to Orange (#F1592A) so every step
// feels equally bright. `h` is the OKLCH hue the rest of the palette is built on.
export const WHEEL = [
  { name: "Red", h: 22, main: "#F33446" },
  { name: "Orange", h: 37, main: "#F1592A" },
  { name: "Yellow", h: 95, main: "#F1CF43" },
  { name: "Lime", h: 125, main: "#B5E643" },
  { name: "Green", h: 145, main: "#4BF761" },
  { name: "Jade", h: 165, main: "#4CF1B7" },
  { name: "Teal", h: 195, main: "#4CEBEB" },
  { name: "Blue", h: 255, main: "#2987F1" },
  { name: "Indigo", h: 275, main: "#473CED" },
  { name: "Violet", h: 300, main: "#8D2EEE" },
  { name: "Magenta", h: 330, main: "#F43BEC" },
  { name: "Rose", h: 355, main: "#F33496" },
];

const EPOCH_INDEX = 7; // Blue

export function daysBetween(a, b) {
  const t = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((t(b) - t(a)) / 86400000);
}

export function issueNumber(date) {
  return daysBetween(EPOCH, date) + 1;
}

// Moving Blue → Teal → Jade means stepping backwards through WHEEL.
export function wheelIndex(date) {
  const n = daysBetween(EPOCH, date);
  return (((EPOCH_INDEX - n) % 12) + 12) % 12;
}

export function wheelFor(date) {
  const i = wheelIndex(date);
  const prev = (i + 1) % 12;
  const next = (i + 11) % 12;
  return { index: i, ...WHEEL[i], tomorrow: WHEEL[next].name, yesterday: WHEEL[prev].name };
}

// ---- OKLCH → sRGB hex, with chroma reduced until the colour fits in sRGB ----

function oklchToLinear(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

function gammaEncode(v) {
  v = Math.min(1, Math.max(0, v));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

export function oklch(L, C, H) {
  let c = C;
  let rgb = oklchToLinear(L, c, H);
  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.002);
    rgb = oklchToLinear(L, c, H);
  }
  return (
    "#" +
    rgb
      .map((v) => Math.round(gammaEncode(v) * 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

// The day's palette. Everyone uses the same one: Vivid, built on the day's hue.
// Black and white are always available on top.
export function paletteFor(date) {
  const { h, main } = wheelFor(date);
  return {
    name: "Vivid",
    colours: [main, oklch(0.92, 0.06, h), oklch(0.55, 0.02, h), oklch(0.24, 0.07, h)],
  };
}

export const ALWAYS = ["#000000", "#FFFFFF"];
