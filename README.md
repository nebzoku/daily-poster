# Daily Poster

Design a poster, every day.

Daily Poster is a free design brief that lands every morning. It takes one story from the day's news and turns it into a brief for an A-size poster. In a world of AI and automation, the chance to design something just because you can is getting rarer, so the brief gives you just enough guardrails to explore and nothing to overthink before you start. Make your poster, share it with #dailyposter, and see what everyone else did with the same brief.

Every morning a GitHub Action reads a handful of news feeds, asks Claude to pick a story with some weight to it, and publishes a brief:

- **Three headlines** of 3 to 6 words, written to be set big
- **Three sublines** with the facts, plus the story's date, time and source
- **The day's palette.** Everyone uses the same one. The colour moves one step round a 12-step wheel each day (Blue, Teal, Jade, Green…), and black and white are always allowed
- **One typeface pairing** you have to use, chosen to suit the story. Size, leading, tracking and case are up to you
- **Ten images**, if you want one: photos from Unsplash and public-domain works from the Art Institute of Chicago and The Met, picked by Claude looking at the candidates
- **Four textures** for type or backgrounds, from [Poly Haven](https://polyhaven.com) (CC0) and Unsplash, mixed in with the images
- **An 8 × 8 grid** on a 1080 × 1528 px artboard (A-series proportions, so it prints cleanly at A4, A3 and up): 16 px margin, no gutters, 131 px columns, 187 px rows. The grid is optional

The page has a one-click copy of everything into Figma, Instagram mockups and a ready-made Instagram caption.

## The rules

1. A-size portrait, at 1080 × 1528 px.
2. Use one of the headlines, or write your own from the same story.
3. Use the day's palette, plus black and white. Blend modes and opacity are fair game.
4. Use the typeface pairing. Size, leading, tracking and case are up to you.
5. The 8 × 8 grid is there if you want it. Use it, break it or ignore it.
6. Include the date, time and source of the story.
7. Imagery is optional. If you use a photo, credit the photographer.

Share it on Instagram with **#dailyposter** and the day's tag, for example **#dailyposter031**, so every poster from the same brief sits together.

## Figma

**Copy for Figma** on the site copies everything to paste into Figma with ⌘V, each piece in its own frame: a blank artboard, your chosen headline and subline in the day's typefaces, the colours, the images, the textures and the three Instagram mockups. A paste can't carry a layout grid, so the site lists the grid settings to add.

## Run your own

You need a GitHub account, a Claude API key and (optionally) an Unsplash key. Setup takes about ten minutes.

1. **Copy this repo.** Click **Fork** at the top of this page.
2. **Get a Claude API key.** Go to [console.anthropic.com](https://console.anthropic.com), add a little credit under **Billing** (each brief costs about a penny), then create a key under **API keys**.
3. **Get an Unsplash key.** Go to [unsplash.com/developers](https://unsplash.com/developers), click **Your apps** → **New application**, accept the terms, and copy the **Access Key**. It's free. Without it the brief uses museum images only. The museum collections need no key.
4. **Add both keys to your repo.** Go to **Settings → Secrets and variables → Actions → New repository secret** and add `ANTHROPIC_API_KEY` and `UNSPLASH_ACCESS_KEY`.
5. **Turn on the website.** Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
6. **Make the first brief.** Go to the **Actions** tab, choose **Daily brief**, then **Run workflow**. After a minute or two your page will be at `https://<your-username>.github.io/<repo-name>/`.

From then on it runs by itself at 05:30 UTC every day.

## Changing things

| To change… | Edit |
| --- | --- |
| The news sources | `FEEDS` in `scripts/generate.mjs` |
| How stories are picked and headlines written | `briefPrompt()` in `scripts/generate.mjs` |
| The colour wheel and palette | `scripts/lib/palette.mjs` |
| The typeface pairings | `scripts/lib/fonts.mjs` |
| The image sources | `scripts/lib/images.mjs` |
| The time it runs | the `cron` line in `.github/workflows/daily.yml` |
| The look of the page | `site/style.css` |

To run it on your own computer: `npm install`, then `ANTHROPIC_API_KEY=… UNSPLASH_ACCESS_KEY=… npm run generate`, then `npm run serve`.

Briefs are kept in `site/data/`, one file per day, and every past day stays browsable from the archive.
