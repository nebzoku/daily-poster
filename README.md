# Daily Poster Brief

One 9:16 poster a day, briefed from the news.

Every morning a GitHub Action reads a handful of news feeds, asks Claude to pick a story with some weight to it, and publishes a brief:

- **Three headlines** of 3 to 6 words, written to be set big
- **Three sublines** with the facts, plus the story's date, time and source
- **Three palettes** built on the day's colour. The colour moves one step round a 12-step wheel each day (Blue, Teal, Jade, Green…), and black and white are always available
- **One typeface pairing** you have to use, chosen to suit the story. Size, leading, tracking and case are up to you
- **Three Unsplash images**, if you want one
- **A 6 × 12 grid** at 1080 × 1920, with a 4% margin and 2% gutter measured from the short side

The page has a live proof you can click through to try combinations.

## Make your own

You need a GitHub account, a Claude API key and (optionally) an Unsplash key. Setup takes about ten minutes.

1. **Copy this repo.** Click **Fork** (or **Use this template**) at the top of this page.
2. **Get a Claude API key.** Go to [console.anthropic.com](https://console.anthropic.com), add a little credit under **Billing** (each brief costs about a penny), then create a key under **API keys**.
3. **Get an Unsplash key.** Go to [unsplash.com/developers](https://unsplash.com/developers), click **Your apps** → **New application**, accept the terms, and copy the **Access Key**. It's free. Without it the brief just has no images.
4. **Add both keys to your repo.** In your repo go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `ANTHROPIC_API_KEY`
   - `UNSPLASH_ACCESS_KEY`
5. **Turn on the website.** Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
6. **Make the first brief.** Go to the **Actions** tab, choose **Daily brief**, then **Run workflow**. After a minute or two your page will be at `https://<your-username>.github.io/<repo-name>/`.

From then on it runs by itself at 05:30 UTC every day.

## Changing things

| To change… | Edit |
| --- | --- |
| The news sources | `FEEDS` in `scripts/generate.mjs` |
| How stories are picked and headlines written | `briefPrompt()` in `scripts/generate.mjs` |
| The colour wheel and palettes | `scripts/lib/palette.mjs` |
| The typeface pairings | `scripts/lib/fonts.mjs` |
| The time it runs | the `cron` line in `.github/workflows/daily.yml` |
| The look of the page | `site/style.css` |

To run it on your own computer: `npm install`, then `ANTHROPIC_API_KEY=… UNSPLASH_ACCESS_KEY=… npm run generate`, then `npm run serve`.

Briefs are kept in `site/data/`, one file per day, and every past day stays browsable from the archive.
