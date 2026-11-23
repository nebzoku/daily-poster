# Portfolio finishes (benharwood.design) → poster print styles

From Ben, 24 Nov 2026. The code is `lab/portfolio-ink-worker.js` (the site's own worker, unchanged), wrapped as
`lab/pf.js` and used by `printHead()` in `lab/lib.js`.

- Paper on the site: light `#eeeeea`, dark `#111115`. Ink: light `#262626`, dark `#e4e4e0`. On posters, use the day's
  palette instead; the foils' black/white choice follows the background.
- Base: `f_angle 125, f_width .27, f_contrast .55, f_warp .45, f_scuff .35, f_tooth .3, m_shine .55, p_light 135,
  p_elev 38, p_texScale 1.1`. For a still image, light = 0.5.
- Every ink lays the paper's grain over the letters (`press(..., insideOnly: true)`). Edge specks are off.

| Style | What it is |
| --- | --- |
| letterpress, riso, screen, stamp | the Machine's presets, set calmer (about Wear 0.07, Ink spread 0.15) |
| inked-deboss | letterpress ink with a deboss over it |
| foil | domed gloss foil, black or white, on a light deboss |
| foil-flat | classic flat hot-foil, bitten in |
| foil-mirror | flat mirror, sharp reflections |
| foil-satin | graphite, brushed, soft sheen |
| foil-emboss | pushed up from behind, then foiled |
| foil-debossed | foil sunk deep into the sheet |
| foil-colour | bright foil in one colour (site stops: c×0.78, c×0.97, 30% to white, 90% to white) |
| varnish | spot gloss, the paper's own colour a shade richer |
| varnish-raised | thick raised UV |
| varnish-satin | soft-touch satin |
| varnish-ink | gloss varnish over solid ink |

Left out: blind emboss and deboss, silver foil, hand-drawn marks.
