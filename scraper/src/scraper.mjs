/**
 * Plant Species Scraper
 * Sources: Virginia Tech Dendrology (syllabus.cfm) + USDA PLANTS database
 * Output: Species_Database/ folder + species_data.json
 *
 * Run: node src/scraper.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const OUTPUT_DIR = path.resolve('../Species_Database');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'species_data.json');

// ─── Utilities ───────────────────────────────────────────────────
function delay(min = 2000, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeName(name) {
  return name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      reject(new Error(`Invalid URL: ${url}`));
      return;
    }
    const proto = url.startsWith('https') ? https : http;
    const file = createWriteStream(destPath);

    const doRequest = (reqUrl, redirectCount = 0) => {
      if (redirectCount > 5) { reject(new Error('Too many redirects')); return; }
      proto.get(reqUrl, { timeout: 20000 }, response => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          file.close();
          const loc = response.headers.location;
          if (!loc) { reject(new Error('Redirect with no Location')); return; }
          const redirect = loc.startsWith('http') ? loc : new URL(loc, reqUrl).href;
          const p2 = redirect.startsWith('https') ? https : http;
          file.destroy();
          downloadFile(redirect, destPath).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          reject(new Error(`HTTP ${response.statusCode} for ${reqUrl}`));
          return;
        }
        pipeline(response, file).then(resolve).catch(err => {
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          reject(err);
        });
      }).on('error', err => {
        if (fs.existsSync(destPath)) try { fs.unlinkSync(destPath); } catch (_) {}
        reject(err);
      });
    };
    doRequest(url);
  });
}

// ─── VT Dendrology: Species List ────────────────────────────────
async function scrapeVTSpeciesList(page) {
  console.log('📋 Fetching VT Dendrology species list from syllabus.cfm...');
  await page.goto('https://dendro.cnre.vt.edu/dendrology/syllabus.cfm', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const species = await page.evaluate(() => {
    const seen = new Set();
    const results = [];

    // Links follow pattern: factsheet.cfm?ID=N (repeated 3 times per species: family, scientific, common)
    // We collect unique IDs and pair scientific name with URL
    const idGroups = {};
    Array.from(document.querySelectorAll('a[href*="factsheet.cfm?ID="]')).forEach(a => {
      const match = a.href.match(/ID=(\d+)/);
      if (!match) return;
      const id = match[1];
      if (!idGroups[id]) idGroups[id] = { url: a.href, texts: [] };
      const t = a.textContent.trim();
      if (t && t.length > 1) idGroups[id].texts.push(t);
    });

    Object.entries(idGroups).forEach(([id, group]) => {
      // Texts order: Family, Scientific Name, Common Name
      const scientific = group.texts.find(t => /^[A-Z][a-z]+ [a-z]/.test(t)) || '';
      const common = group.texts.find(t => t !== scientific && !/aceae$|ceae$/.test(t)) || scientific;
      if (scientific) {
        results.push({ id, scientific, common, url: group.url });
      }
    });

    return results;
  });

  console.log(`  Found ${species.length} species on VT Dendrology`);
  return species;
}

// ─── VT Dendrology: Species Page ─────────────────────────────────
async function scrapeVTSpeciesPage(page, species) {
  const { id, scientific, common, url } = species;
  console.log(`  🌿 Scraping VT [ID=${id}]: ${scientific} (${common})`);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const data = await page.evaluate(() => {
    const body = document.body;

    // First line of real content contains: "common name  Family  Scientific Name L. symbol: XXXX"
    const fullText = body.innerText;

    // Extract structured fields from text block at top
    const symbolMatch = fullText.match(/symbol:\s*([A-Z0-9]+)/i);
    const symbol = symbolMatch?.[1] || '';

    // Scientific name: look for italicized binomials
    let scientificName = '';
    const italic = body.querySelector('i, em');
    if (italic) scientificName = italic.textContent.trim();

    // Family: word ending in -aceae or -ceae
    const familyMatch = fullText.match(/\b([A-Z][a-z]+aceae)\b/);
    const family = familyMatch?.[1] || '';

    // Common name: first part of first content line before the family name
    let commonName = '';
    const firstLine = fullText.split('\n').find(l => l.trim().length > 5 && !l.includes('Dendrology'));
    if (firstLine) {
      commonName = firstLine.trim().split(/\s{2,}/)[0].trim();
    }

    // Description: collect the key sections (Leaf, Flower, Fruit, Twig, Bark, etc.)
    const descBlocks = [];
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
    const descKeywords = ['Leaf:', 'Flower:', 'Fruit:', 'Twig:', 'Bark:', 'Form:', 'Uses:', 'Habitat:', 'Wood:', 'Distinguishing'];
    let inDesc = false;
    for (const line of lines) {
      if (descKeywords.some(k => line.startsWith(k))) { inDesc = true; }
      if (inDesc && line.length > 10) descBlocks.push(line);
      if (inDesc && line.length < 3) inDesc = false;
    }
    const description = descBlocks.join('\n');

    // Tags
    const textLower = fullText.toLowerCase();
    const tags = [];
    if (textLower.includes('deciduous')) tags.push('Deciduous');
    if (textLower.includes('conifer') || textLower.includes('cone') || textLower.includes('needle') || textLower.includes('evergreen')) {
      if (!tags.includes('Deciduous')) tags.push('Conifer/Evergreen');
    }
    if (!tags.length) tags.push('Deciduous'); // default for broadleaf
    if (textLower.includes(' shrub') || textLower.includes('thicket')) tags.push('Shrub');
    else tags.push('Tree');
    if (textLower.includes(' native')) tags.push('Native');
    if (textLower.includes('invasive')) tags.push('Invasive');
    if (textLower.includes('introduced') || textLower.includes('planted')) tags.push('Planted/Introduced');

    // Images: filter out icons/navigation images, keep species photos
    const imgs = Array.from(document.querySelectorAll('img'))
      .filter(img => {
        const src = img.src || '';
        return src.includes('/images/') && !src.includes('icon') && !src.includes('logo') && !src.includes('.gif');
      })
      .map(img => {
        const src = img.src;
        const alt = img.alt || '';
        const isMap = alt.toLowerCase().includes('map') || alt.toLowerCase().includes('range') ||
          src.toLowerCase().includes('map') || src.toLowerCase().includes('range');
        return { src, alt, isMap };
      });

    // Also look for a range/map image specifically
    let mapSrc = null;
    const mapImg = document.querySelector('img[alt*="range" i], img[alt*="map" i], img[src*="range"], img[src*="map"]');
    if (mapImg) mapSrc = mapImg.src;

    return { commonName, scientificName, family, symbol, description, tags: [...new Set(tags)], images: imgs, mapSrc };
  });

  return {
    folderName: safeName(scientific.split(' ').slice(0, 2).join('_')),
    data: {
      ...data,
      commonName: data.commonName || common,
      scientificName: data.scientificName || scientific,
      vtId: id
    }
  };
}

// ─── USDA PLANTS: Species Data ───────────────────────────────────
async function scrapeUSDASpecies(page, scientificName) {
  console.log(`  🌱 USDA: searching for ${scientificName}...`);
  const nameParts = scientificName.trim().split(/\s+/);

  // Generate candidate symbols to try
  const genus = nameParts[0] || '';
  const epithet = nameParts[1] || '';
  const candidates = [
    (genus.slice(0, 2) + epithet.slice(0, 2)).toUpperCase(),
    (genus.slice(0, 2) + epithet.slice(0, 3)).toUpperCase(),
    (genus.slice(0, 4)).toUpperCase(),
    (genus.slice(0, 3) + epithet.slice(0, 1)).toUpperCase()
  ];

  for (const sym of [...new Set(candidates)]) {
    if (!sym || sym.length < 2) continue;
    try {
      const profileUrl = `https://plants.usda.gov/home/plantProfile?symbol=${sym}`;
      await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await delay(1500, 2500);

      const result = await page.evaluate((sciName) => {
        const body = document.body.innerText;

        // Check if this is actually the right species
        const nameParts = sciName.toLowerCase().split(' ');
        if (!body.toLowerCase().includes(nameParts[0])) return null;

        // Extract data fields
        const getField = (pattern) => {
          const m = body.match(pattern);
          return m?.[1]?.trim() || '';
        };

        const symbol = getField(/Symbol:\s*([A-Z0-9]+)/);
        const group = getField(/Group:\s*([^\n]+)/);
        const duration = getField(/Duration:\s*([^\n]+)/);
        const growthHabit = getField(/Growth Habit:\s*([^\n]+)/);
        const nativeStatus = getField(/Native Status:\s*([^\n]+)/);

        // PDFs
        let factSheetUrl = null, plantGuideUrl = null;
        Array.from(document.querySelectorAll('a[href]')).forEach(a => {
          const href = a.href || '';
          const text = a.textContent.toLowerCase();
          if (!factSheetUrl && (text.includes('fact sheet') || href.includes('fact_sheet')) && href.endsWith('.pdf')) {
            factSheetUrl = href;
          }
          if (!plantGuideUrl && (text.includes('plant guide') || href.includes('plant_guide')) && href.endsWith('.pdf')) {
            plantGuideUrl = href;
          }
        });

        // Map image from the General tab
        let mapImageUrl = null;
        const mapImg = document.querySelector(
          'img[src*="map"], img[alt*="map" i], img[alt*="range" i], img[src*="distribution"]'
        );
        if (mapImg) mapImageUrl = mapImg.src;

        return { symbol, group, duration, growthHabit, nativeStatus, factSheetUrl, plantGuideUrl, mapImageUrl };
      }, scientificName);

      if (result && (result.symbol || result.group)) {
        console.log(`    ✓ USDA found: symbol=${result.symbol}, habit=${result.growthHabit}`);
        return result;
      }
    } catch (e) {
      // try next candidate
    }
    await delay(1000, 2000);
  }

  // If symbol approach fails, try search
  try {
    const searchUrl = `https://plants.usda.gov/home/search?term=${encodeURIComponent(scientificName)}&columns=Symbol,Scientific_Name,Common_Name`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await delay(2000, 3000);

    const firstResult = await page.evaluate(() => {
      const link = document.querySelector('a[href*="plantProfile"]');
      return link?.href || null;
    });

    if (firstResult) {
      await page.goto(firstResult, { waitUntil: 'networkidle', timeout: 20000 });
      await delay(1500, 2500);
      const result = await page.evaluate(() => {
        const body = document.body.innerText;
        const getField = (p) => body.match(p)?.[1]?.trim() || '';
        return {
          symbol: getField(/Symbol:\s*([A-Z0-9]+)/),
          group: getField(/Group:\s*([^\n]+)/),
          duration: getField(/Duration:\s*([^\n]+)/),
          growthHabit: getField(/Growth Habit:\s*([^\n]+)/),
          nativeStatus: getField(/Native Status:\s*([^\n]+)/),
          factSheetUrl: null,
          plantGuideUrl: null,
          mapImageUrl: null
        };
      });
      if (result.symbol) return result;
    }
  } catch (e) {
    // search fallback failed
  }

  console.log(`    ⚠️  No USDA data found for ${scientificName}`);
  return null;
}

// ─── File Saving ─────────────────────────────────────────────────
async function saveSpeciesFiles(folderName, vtData, usdaData) {
  const speciesDir = path.join(OUTPUT_DIR, folderName);
  ensureDir(speciesDir);

  const savedImages = [];
  let mapFileName = null;
  let imgCount = 1;

  for (const img of vtData.images || []) {
    if (!img.src || img.src.startsWith('data:')) continue;

    let urlObj;
    try { urlObj = new URL(img.src); } catch { continue; }

    const ext = path.extname(urlObj.pathname) || '.jpg';
    let fileName;

    if (img.isMap && !mapFileName) {
      fileName = `${folderName}_map${ext}`;
      mapFileName = fileName;
    } else {
      fileName = `${folderName}_${imgCount}${ext}`;
      imgCount++;
    }

    const destPath = path.join(speciesDir, fileName);
    if (fs.existsSync(destPath)) {
      savedImages.push({ fileName, alt: img.alt, isMap: !!img.isMap });
      continue;
    }

    try {
      await downloadFile(img.src, destPath);
      savedImages.push({ fileName, alt: img.alt, isMap: !!img.isMap });
      console.log(`    💾 ${fileName}`);
    } catch (err) {
      console.warn(`    ⚠️  Skip image: ${err.message}`);
    }
    await delay(300, 800);
  }

  // USDA map if VT didn't have one
  if (usdaData?.mapImageUrl && !mapFileName) {
    try {
      const urlObj = new URL(usdaData.mapImageUrl);
      const ext = path.extname(urlObj.pathname) || '.jpg';
      const fileName = `${folderName}_map${ext}`;
      const destPath = path.join(speciesDir, fileName);
      if (!fs.existsSync(destPath)) await downloadFile(usdaData.mapImageUrl, destPath);
      mapFileName = fileName;
      savedImages.push({ fileName, alt: 'USDA Native Status Map', isMap: true });
      console.log(`    🗺️  ${fileName}`);
    } catch (e) {
      console.warn(`    ⚠️  USDA map failed: ${e.message}`);
    }
  }

  // PDFs
  const pdfs = [];
  for (const [pdfUrl, label] of [
    [usdaData?.factSheetUrl, 'fact_sheet'],
    [usdaData?.plantGuideUrl, 'plant_guide']
  ]) {
    if (!pdfUrl) continue;
    const fileName = `${folderName}_${label}.pdf`;
    const destPath = path.join(speciesDir, fileName);
    if (!fs.existsSync(destPath)) {
      try {
        await downloadFile(pdfUrl, destPath);
        pdfs.push(fileName);
        console.log(`    📄 ${fileName}`);
      } catch (e) {
        console.warn(`    ⚠️  PDF failed: ${e.message}`);
      }
    } else {
      pdfs.push(fileName);
    }
  }

  // Text data file
  const tags = vtData.tags || [];
  const usda = usdaData || {};
  const textContent = [
    `=== ${vtData.commonName || folderName} ===`,
    `Scientific Name: ${vtData.scientificName || ''}`,
    `Common Name:     ${vtData.commonName || ''}`,
    `Family:          ${vtData.family || ''}`,
    `USDA Symbol:     ${vtData.symbol || usda.symbol || ''}`,
    '',
    '--- TAGS ---',
    tags.join(', '),
    '',
    '--- USDA GENERAL DATA ---',
    `Symbol:       ${usda.symbol || 'N/A'}`,
    `Group:        ${usda.group || 'N/A'}`,
    `Duration:     ${usda.duration || 'N/A'}`,
    `Growth Habit: ${usda.growthHabit || 'N/A'}`,
    `Native Status:${usda.nativeStatus || 'N/A'}`,
    '',
    '--- DESCRIPTION ---',
    vtData.description || '',
    '',
    '--- IMAGE DESCRIPTIONS ---',
    ...savedImages.map(img => `${img.fileName}: ${img.alt || '(no alt text)'}`),
    '',
    '--- FILES IN THIS FOLDER ---',
    ...savedImages.map(i => i.fileName),
    ...pdfs
  ].join('\n');

  fs.writeFileSync(path.join(speciesDir, `${folderName}_data.txt`), textContent, 'utf8');

  return { savedImages, mapFileName, pdfs };
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  ensureDir(OUTPUT_DIR);

  // Load existing data to resume if interrupted
  let allSpeciesData = [];
  if (fs.existsSync(JSON_OUTPUT)) {
    try {
      allSpeciesData = JSON.parse(fs.readFileSync(JSON_OUTPUT, 'utf8'));
      console.log(`📂 Resuming from existing JSON (${allSpeciesData.length} species already scraped)`);
    } catch { allSpeciesData = []; }
  }
  const alreadyScraped = new Set(allSpeciesData.map(s => s.id));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  try {
    const vtPage = await browser.newPage();
    vtPage.setDefaultTimeout(30000);
    await vtPage.setExtraHTTPHeaders(headers);

    const usdaPage = await browser.newPage();
    usdaPage.setDefaultTimeout(30000);
    await usdaPage.setExtraHTTPHeaders(headers);

    // Get species list
    let speciesList = await scrapeVTSpeciesList(vtPage);
    await delay(2000, 3000);

    if (speciesList.length === 0) {
      console.error('Could not load species list from VT Dendrology. Exiting.');
      process.exit(1);
    }

    // Skip already scraped (resume capability)
    const toScrape = speciesList.filter(s => {
      const id = safeName(s.scientific.split(' ').slice(0, 2).join('_'));
      return !alreadyScraped.has(id);
    });

    console.log(`\n🌳 Processing ${toScrape.length} species (${alreadyScraped.size} already done)...\n`);

    for (let i = 0; i < toScrape.length; i++) {
      const species = toScrape[i];
      console.log(`\n[${i + 1}/${toScrape.length}] ${species.scientific} — ${species.common}`);

      try {
        // 1. Scrape VT page
        const { folderName, data: vtData } = await scrapeVTSpeciesPage(vtPage, species);
        await delay(2000, 4000);

        // 2. Scrape USDA
        const usdaData = await scrapeUSDASpecies(usdaPage, vtData.scientificName || species.scientific);
        await delay(2000, 5000);

        // 3. Save files
        const { savedImages, mapFileName, pdfs } = await saveSpeciesFiles(folderName, vtData, usdaData);

        // 4. Add to JSON
        const entry = {
          id: folderName,
          commonName: vtData.commonName || species.common,
          scientificName: vtData.scientificName || species.scientific,
          family: vtData.family || '',
          tags: vtData.tags || [],
          description: vtData.description || '',
          usda: {
            symbol: usdaData?.symbol || vtData.symbol || '',
            group: usdaData?.group || '',
            duration: usdaData?.duration || '',
            growthHabit: usdaData?.growthHabit || '',
            nativeStatus: usdaData?.nativeStatus || ''
          },
          images: savedImages.map(img => ({
            file: `${folderName}/${img.fileName}`,
            alt: img.alt,
            isMap: img.isMap
          })),
          mapImage: mapFileName ? `${folderName}/${mapFileName}` : null,
          pdfs: pdfs.map(p => `${folderName}/${p}`),
          sourceUrl: species.url,
          folder: folderName
        };

        allSpeciesData.push(entry);
        // Incremental save after each species
        fs.writeFileSync(JSON_OUTPUT, JSON.stringify(allSpeciesData, null, 2), 'utf8');
        console.log(`  ✅ Done: ${species.scientific}`);

      } catch (err) {
        console.error(`  ❌ Failed: ${species.scientific} — ${err.message}`);
      }

      // Polite delay between species requests
      if (i < toScrape.length - 1) {
        const waitMs = Math.floor(Math.random() * 3000) + 2000;
        console.log(`  ⏳ Waiting ${(waitMs / 1000).toFixed(1)}s...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(allSpeciesData, null, 2), 'utf8');
  console.log(`\n🎉 Scraping complete!`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`📊 Total species: ${allSpeciesData.length}`);
  console.log(`📄 JSON: ${JSON_OUTPUT}`);
  console.log('\n─────────────────────────────────────────────');
  console.log('Next step: Copy Species_Database/ and study-app/ to your GitHub repo.');
  console.log('Enable GitHub Pages → your study app will be live!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
