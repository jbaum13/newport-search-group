# Newport Search Group — Website

A premium, AI-forward marketing site for an **agentic staffing company**. Built as a
**zero-dependency static site** generated from a single content source, so the same
copy drives both the live website and a paste-ready Wix document.

> **Human Relationships. Agentic Execution.**

## What's here

| Path | What it is |
|------|------------|
| `src/content.js` | **Single source of truth** — all page copy, navigation, footer, SEO. Edit copy here. |
| `src/styles.css` | Design system (navy / steel / electric-blue, Inter, responsive). |
| `src/main.js` | Light client JS — mobile nav, contact-form intent prefill. |
| `src/assets/` | Logo assets: `logo.png` (color, transparent — light bg), `logo-white.png` (white wordmark — dark bg), `favicon.png` (wave), plus `logo-real.png` (original source). |
| `build.js` | Static-site generator + Wix exporter (no dependencies). |
| `dist/` | Generated website (19 pages + sitemap + robots). |
| `WIX-CONTENT.md` | Paste-ready copy & setup guide for the Wix Editor. |
| `REVIEW.md` | Critique of the original site map + recommendations. |
| `_archive-velo-execsearch/` | **Archived.** A previous, unrelated build — a Velo/Wix package for a *traditional Newport Beach executive-search* brand. Superseded by this agentic build; kept for reference only. |

## Build & preview

```bash
node build.js          # generate dist/
node build.js --wix    # also regenerate WIX-CONTENT.md

# preview locally
python3 -m http.server 8000 --directory dist
# open http://localhost:8000
```

No `npm install` — plain Node (built/tested on Node 24).

## Editing content

All copy lives in `src/content.js`. Each page is an array of typed sections
(`hero`, `cards`, `split`, `list`, `stats`, `cta`, `form`, …). Change the data,
re-run `node build.js --wix`, and **both** the website and the Wix doc update —
they never drift apart.

## Pages (19)

Home · About · Agentic Platform · Staffing Solutions (Overview, Direct Hire,
Contract Staffing, RPO, Executive Search) · Staffing Industry · Industries
(Overview + 6 sectors) · Jobs · Resources · Contact.

## Two ways to ship

1. **As a real site** — deploy `dist/` to any static host (Netlify, Vercel,
   Cloudflare Pages, S3). Pretty URLs work out of the box. Before launch, wire the
   contact form (`build.js` `form()` / `src/main.js`) to your CRM or email, and
   connect the Jobs search to your ATS.
2. **In Wix** — follow `WIX-CONTENT.md`: theme colors, fonts, menu structure,
   per-page SEO, and every section's copy ready to paste.

See `REVIEW.md` for what to add next (proof / case studies, lead routing, a real
job feed, content for Resources).
