# Daily Poster for Figma

Builds the day's poster file in one click:

- A new page with a **1080 × 1528 frame** (A-size proportions)
- **Layout grids**: 6 columns and 8 rows, with a 72 px margin and a 24 px gutter (columns 136 px, rows 152 px)
- The day's **palette as colour styles**, plus black and white, with the background already applied
- The **headline, subline, date, time and source** as separate layers in the day's typefaces, stacked top-left for you to arrange. Figma includes every Google Font, so there's nothing to install.
- All ten **images** (from Unsplash, the Art Institute of Chicago and The Met) beside the artboard with credits, ready to drag in
- The day's four **textures** from Poly Haven and Unsplash, at full size
- Everything else from the brief beside the artboard: the story, all three headlines and sublines, the swatches and the hashtags

Size, leading, tracking and case are left for you to change.

## Install it (Figma desktop app)

1. Download this repo: **Code → Download ZIP** on the repo page, then unzip it.
2. In Figma, open any design file, then go to **Menu → Plugins → Development → Import plugin from manifest…**
3. Pick `figma-plugin/manifest.json` from the folder you unzipped.
4. Run it from **Plugins → Development → Daily Poster** and click **Build the poster**.

Leave the day blank for today's brief, or type a date like `2026-11-02` to build an older one.

If you run your own copy of Daily Poster, change the **Site** field to your GitHub Pages address, and add that address to `allowedDomains` in `manifest.json`.

## Publishing it

To let anyone install it with one click, publish it to the Figma Community: **Plugins → Development → Daily Poster → Publish**. Figma gives it a real ID, which replaces `daily-poster-dev` in `manifest.json`.
