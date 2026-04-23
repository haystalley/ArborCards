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

### Dendrology Study App (`artifacts/dendro-study/`)

A React + Vite flashcard study app at preview path `/`. Features:
- 3D-flip flashcards (front: name/family/tags; back: images + text sections + USDA metadata)
- Settings drawer with per-field visibility toggles (blank-preserving)
- Six preset study decks: VT Syllabus, Invasives, Deciduous, Conifers, Natives, Shrubs
- By-family deck grid (auto-generated from species data)
- Interactive map view (Leaflet + CartoDB DarkMatter tiles) — click any state to build a deck from species found there (All / Natives / Invasives / by family)
- 1,130 species loaded from `public/data/species_data.json`

**Data schema** (defined in `src/data/types.ts`):
```typescript
SpeciesImage: { file: string; alt: string; isMap: boolean; }
SpeciesData:  { id, commonName, scientificName, family, tags, description,
                usda: { symbol, group, duration, growthHabit, nativeStatus },
                images: SpeciesImage[], mapImage, pdfs, sourceUrl, folder, sections? }
```
Images use relative paths like `Acer_rubrum/Acer_rubrum_leaf.jpg` (resolved against base URL at runtime).

**Deploy to GitHub Pages (repo: `ArborCards`)**

CI/CD is wired via `.github/workflows/deploy.yml` — every push to `main` triggers an automatic deploy.

One-time setup steps (do once in GitHub):
1. **Repo Settings → Pages → Source**: set to **GitHub Actions** (not "Deploy from branch")
2. That's it — `GITHUB_TOKEN` is automatically provided to the workflow

Build command (for manual local build):
```bash
PORT=3000 BASE_PATH=/ArborCards/ NODE_ENV=production \
  pnpm --filter @workspace/dendro-study build
# Output: artifacts/dendro-study/dist/public/
```

Live URL after deploy: `https://haystalley.github.io/ArborCards/`
