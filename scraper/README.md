# Plant Species Scraper

## Setup

1. Install dependencies:
   ```bash
   cd scraper
   npm install
   npx playwright install chromium
   ```

2. Run the scraper:
   ```bash
   node src/scraper.mjs
   ```

## Output

Creates a `Species_Database/` folder in the project root with:
- One subfolder per species (e.g., `Acer_rubrum/`)
  - Images: `Acer_rubrum_1.jpg`, `Acer_rubrum_2.jpg`, etc.
  - Map: `Acer_rubrum_map.jpg`
  - Text data: `Acer_rubrum_data.txt`
  - PDFs: `Acer_rubrum_fact_sheet.pdf`, `Acer_rubrum_plant_guide.pdf` (if available)
- `species_data.json` at the root — used by the web app

## Deploying to GitHub Pages

1. Copy both `Species_Database/` and `study-app/` to your GitHub repo
2. Enable GitHub Pages (Settings → Pages → deploy from branch)
3. Open `study-app/index.html` in your browser — it reads `../Species_Database/species_data.json`

**Tip:** If your repo root is the GitHub Pages root, place `study-app/index.html` at the repo root  
and update the JSON path in `index.html` to `./Species_Database/species_data.json`.
