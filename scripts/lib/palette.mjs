// The colour wheel. Twelve steps, 30° apart, moving one step a day.
// 3 October 2026 was Blue, the next day Teal, then Jade, and so on round the wheel.

export const EPOCH = "2026-10-03";

// Steps in wheel order. `deg` is the familiar colour-wheel angle; `h` is the
// matching OKLCH hue, which is what the palettes are actually built in (so the
// steps look evenly spaced to the eye rather than to the maths).
export const WHEEL = [
  { name: "Red", deg: 0, h: 27 },
  { name: "Orange", deg: 30, h: 55 },
  { name: "Yellow", deg: 60, h: 95 },
  { name: "Lime", deg: 90, h: 125 },
  { name: "Green", deg: 120, h: 145 },
  { name: "Jade", deg: 150, h: 165 },
  { name: "Teal", deg: 180, h: 195 },
  { name: "Blue", deg: 210, h: 250 },
  { name: "Indigo", deg: 240, h: 275 },
  { name: "Violet", deg: 270, h: 300 },
  { name: "Magenta", deg: 300, h: 330 },
  { name: "Rose", deg: 330, h: 5 },
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

// Three palettes for the day. Black and white are always available on top.
export function palettesFor(date) {
  const { h } = wheelFor(date);
  const opp = (h + 180) % 360;
  const near = (h + 30) % 360;
  return [
    {
      name: "Tonal",
      note: "One hue, light to dark.",
      colours: [oklch(0.96, 0.03, h), oklch(0.82, 0.09, h), oklch(0.6, 0.16, h), oklch(0.3, 0.09, h)],
    },
    {
      name: "Vivid",
      note: "Full-strength hue with a tinted grey.",
      colours: [oklch(0.66, 0.26, h), oklch(0.9, 0.06, h), oklch(0.55, 0.02, h), oklch(0.22, 0.05, h)],
    },
    {
      name: "Contrast",
      note: "The hue, its neighbour and its opposite.",
      colours: [oklch(0.62, 0.2, h), oklch(0.85, 0.11, near), oklch(0.7, 0.16, opp), oklch(0.27, 0.06, h)],
    },
  ];
}

export const ALWAYS = ["#000000", "#FFFFFF"];
