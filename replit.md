# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Plant Species Scraper & Study App

### Scraper (`scraper/`)

A Node.js + Playwright scraper that downloads plant species data from:
- **Virginia Tech Dendrology** (syllabus.cfm — 402 species) 
- **USDA PLANTS database** (general tab data: symbol, group, duration, growth habit, native status)

**Setup:**
```bash
cd scraper
npm install
npx playwright install chromium
```

**Run (full scrape):**
```bash
node src/scraper.mjs
```

**Quick test:**
```bash
node src/test-scrape.mjs
```

**Output:** `Species_Database/` folder at workspace root containing:
- One subfolder per species (`Acer_rubrum/`, etc.)
- Images: `Acer_rubrum_1.jpg`, `Acer_rubrum_2.jpg`, etc.
- Map: `Acer_rubrum_map.jpg`
- Text data: `Acer_rubrum_data.txt`
- PDFs: `Acer_rubrum_fact_sheet.pdf`, `Acer_rubrum_plant_guide.pdf` (when available)
- Root: `species_data.json` (master data file used by web app)

The scraper is resumable — if interrupted, re-running picks up where it left off.

### Study Web App (`study-app/`)

A static HTML/CSS/JS app for GitHub Pages. Features:
- Browse and search 402 species
- Filter by tags: Deciduous, Conifer/Evergreen, Tree, Shrub, Native, Invasive, Planted/Introduced
- Image gallery with thumbnails per species
- Range/habitat maps
- USDA PLANTS data (symbol, group, duration, growth habit, native status)
- Full species descriptions
- PDF links (Fact Sheet, Plant Guide)
- Interactive flashcard quiz (identify species from images)

**To deploy on GitHub Pages:**
1. Copy `Species_Database/` and `study-app/` to your GitHub repo
2. Enable GitHub Pages (Settings → Pages)
3. Open `study-app/index.html` as the entry point

**Local testing:**
```bash
cd study-app && python3 -m http.server 8080
# Then open http://localhost:8080
```

The app reads data from `../Species_Database/species_data.json` relative to `study-app/`.
If deploying at the repo root, update the `DATA_URL` in `app.js` to `./Species_Database/species_data.json`.
