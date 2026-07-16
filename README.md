# Prabin Ayer — Portfolio

Personal portfolio site for Prabin Ayer. Static multi-page HTML site, no build step or framework — just open any page in a browser or serve the folder as-is (e.g. via GitHub Pages). Shares its design system (colors, type, reveal-on-scroll, card components) with the ZULU / JD Esports Arena site, extracted into `assets/css/site.css` and `assets/js/site.js` so it isn't duplicated on every page.

## Pages

| Page | Content |
|---|---|
| `index.html` | Overview / landing page |
| `computing.html` | Computing Science projects — real repos only (JD Esports Arena, ZULU AI, SafeStep, CPU/GPU Benchmark, jd-stock) |
| `hospitality.html` | Hospitality experience and work history |
| `skills.html` | Technical & professional skills — Computing Science and Hospitality |
| `gallery.html` | Visual index of real projects and hospitality highlights |
| `contact.html` | Contact details and message form |

## Photos

Every image slot degrades gracefully to a clean icon placeholder (see `imgFallback()` in `assets/js/site.js`) if a file is missing, so the site never shows a broken-image icon.

| File | Used on | Status |
|---|---|---|
| `assets/img/portrait.jpg` | `index.html` hero | ✅ real photo |
| `assets/img/hospitality-hero.webp` | `hospitality.html` header background | ✅ real photo |
| `assets/img/jd-arena.jpg` | `gallery.html` — JD Esports Arena card | ✅ real (live site banner) |
| `assets/img/zulu-ai.jpg` | `gallery.html` — ZULU AI card | ✅ real (live screenshot of the chat UI) |
| `assets/img/safestep.jpg` | `gallery.html` — SafeStep card | ✅ real (live screenshot of the game) |
| `assets/img/mixology.webp` | `gallery.html` — Mixology card | ✅ real photo |
| `assets/img/fine-dining.webp` | `gallery.html` — Fine Dining card | ✅ real photo |
| `assets/img/sky-garden.jpg` | `gallery.html` — Sky Garden Events card | ⬜ placeholder — needs a real photo |

## Running locally

No dependencies — open `index.html` directly, or serve the folder with any static file server.
