/**
 * Plant Species Scraper
 * Sources: Virginia Tech Dendrology (data_results.cfm — full 1,136-species database) + USDA PLANTS database
 * Output: Species_Database/ folder + species_data.json
 *
 * Run: node src/scraper.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
// Fetch HTML via HTTP POST — returns a Promise<string>
function httpPost(urlStr, postBody) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const bodyBuf = Buffer.from(postBody, 'utf8');
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': bodyBuf.length,
        'User-Agent': 'Mozilla/5.0 (compatible; dendro-scraper/1.0)'
      },
      timeout: 30000
    };
    const req = https.request(opts, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} from POST to ${urlStr}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('latin1')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('POST timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

async function scrapeVTSpeciesList() {
  console.log('📋 Fetching full VT Dendrology species list from data_results.cfm...');

  // A blank POST returns all 1,136 species — no browser / Playwright needed.
  const postBody = 'family=Select+a+Family&genus=&species=&commonname=&symbol=&growthhabit=Select+Growth+Habit';
  const html = await httpPost(
    'https://dendro.cnre.vt.edu/dendrology/data_results.cfm',
    postBody
  );

  // Each entry in the server-rendered response looks like:
  //   <a href="syllabus/factsheet.cfm?ID=417"><em>Abelia xgrandiflora</em> - glossy abelia</a>
  const VT_BASE = 'https://dendro.cnre.vt.edu/dendrology/';
  const entryRe = /href="(syllabus\/factsheet\.cfm\?ID=(\d+))"[^>]*><em>([^<]+)<\/em>\s*-\s*([^<]+)<\/a>/gi;
  const species = [];
  let m;
  while ((m = entryRe.exec(html)) !== null) {
    const [, relHref, id, scientific, common] = m;
    species.push({
      id,
      scientific: scientific.trim(),
      common: common.trim(),
      url: VT_BASE + relHref
    });
  }

  // Sanity check — if the upstream page structure changes we fail loud rather than
  // silently scraping a partial list.  The database has had ~1,136 entries for years;
  // fewer than 1,000 almost certainly means the HTML format changed.
  if (species.length < 1000) {
    throw new Error(
      `Expected at least 1,000 species from VT data_results.cfm but only got ${species.length}. ` +
      'The page structure may have changed. Check the regex in scrapeVTSpeciesList.'
    );
  }

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
        // Only flag as map if the filename itself starts with "map" (VT names them map1.jpg, map2.jpg, etc.)
        // Avoid matching images that merely have "map" somewhere in the folder path
        let filename = '';
        try { filename = new URL(src).pathname.split('/').pop().toLowerCase(); } catch (_) {}
        const altLower = alt.toLowerCase();
        // VT alt text is always "{common name} {type} image", so "map image" at the end
        // is the most precise signal. Filename check catches map.jpg / map1.jpg directly.
        const isMap = /^map\d*\./.test(filename) ||
          altLower.endsWith('map image') ||
          altLower.endsWith(' map') || altLower.includes('range map');
        return { src, alt, isMap };
      });

    // Also look for a range/map image specifically — uses same predicate as isMap above
    let mapSrc = null;
    const allImgs = Array.from(document.querySelectorAll('img'));
    const mapImg = allImgs.find(img => {
      let filename = '';
      try { filename = new URL(img.src).pathname.split('/').pop().toLowerCase(); } catch (_) {}
      const altLower = (img.alt || '').toLowerCase();
      return /^map\d*\./.test(filename) ||
        altLower.endsWith('map image') ||
        altLower.endsWith(' map') || altLower.includes('range map');
    });
    if (mapImg) mapSrc = mapImg.src;

    return { commonName, scientificName, family, symbol, description, tags: [...new Set(tags)], images: imgs, mapSrc };
  });

  // Clean up scientific name (italic element may contain embedded newlines/spaces)
  const cleanScientific = (data.scientificName || scientific).replace(/\s+/g, ' ').trim();

  // Derive folder name from the factsheet scientific name (reliable) rather than
  // the syllabus link text (often missing for species where only the common name
  // links to factsheet.cfm). Fall back to vtid_N if we still have nothing.
  const folderName = cleanScientific
    ? safeName(cleanScientific.split(' ').slice(0, 2).join('_'))
    : `vtid_${id}`;

  return {
    folderName,
    data: {
      ...data,
      // Common name: syllabus value is already correct; page extraction gets the whole first line
      commonName: common || data.commonName,
      scientificName: cleanScientific,
      vtId: id
    }
  };
}

// ─── USDA PLANTS: Species Data ───────────────────────────────────
const USDA_BASE = 'https://plants.sc.egov.usda.gov';
const USDA_API  = 'https://plantsservices.sc.egov.usda.gov/api';

// Lightweight HTTPS GET that returns the response body as a string
function httpsGet(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: timeoutMs }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

// Fetch structured USDA data for a symbol via the plantsservices REST API.
// Returns the normalised data object or null if symbol is wrong/not found.
async function fetchUSDADataFromAPI(symbol, sciName) {
  if (!symbol) return null;
  try {
    const url = `${USDA_API}/PlantProfile?symbol=${encodeURIComponent(symbol)}`;
    const raw = await httpsGet(url);
    const d = JSON.parse(raw);

    // Verify the API returned the right genus
    const pageSciName = (d.ScientificName || '').replace(/<[^>]+>/g, '').trim().toLowerCase();
    const queryGenus = sciName.toLowerCase().split(' ')[0];
    if (!pageSciName.includes(queryGenus)) return null;

    // Build a single-line native status string: "CAN (N) | L48 (N)"
    const nativeStatuses = Array.isArray(d.NativeStatuses) ? d.NativeStatuses : [];
    const nativeStatus = nativeStatuses
      .map(ns => `${ns.Region} (${ns.Status})`)
      .join(' | ');

    const duration    = (d.Durations    || []).join(', ');
    const growthHabit = (d.GrowthHabits || []).join(', ');

    // PDF URLs (relative paths become absolute)
    const toAbsolute = rel => rel ? (rel.startsWith('http') ? rel : USDA_BASE + rel) : null;
    const factSheetUrl  = toAbsolute((d.FactSheetUrls  || [])[0] || null);
    const plantGuideUrl = toAbsolute((d.PlantGuideUrls || [])[0] || null);

    return {
      symbol:      (d.Symbol || symbol).replace(/\s+/g, ' ').trim(),
      group:       (d.Group  || '').replace(/\s+/g, ' ').trim(),
      duration:    duration.replace(/\s+/g, ' ').trim(),
      growthHabit: growthHabit.replace(/\s+/g, ' ').trim(),
      nativeStatus,
      factSheetUrl,
      plantGuideUrl,
      mapImageUrl: null
    };
  } catch (_) {
    return null;
  }
}

/**
 * Derive USDA symbol candidates from a scientific name, normalising both the
 * Unicode hybrid marker (×) and the ASCII leading-x form (e.g. xgrandiflora).
 * Exported so test-scrape.mjs can exercise this exact logic rather than
 * duplicating it.
 *
 * Examples:
 *   "Abelia ×grandiflora"  →  ["ABGR", "ABEL", "ABEG", "ABGR2", ...]
 *   "Abelia xgrandiflora"  →  ["ABGR", "ABEL", "ABEG", "ABGR2", ...]
 *   "Acer rubrum"          →  ["ACRU", "ACER", "ACRU2", ...]
 */
export function deriveSymbolCandidates(scientificName) {
  const nameParts = scientificName
    .replace(/×/g, '')
    .split(/\s+/)
    .filter(p => p.length > 0)
    .map(p => p.replace(/^x([a-z])/, '$1'))
    .filter(p => p !== 'x' && p.length > 0);
  const genus   = nameParts[0] || '';
  const epithet = nameParts[1] || '';
  const baseCandidates = [
    (genus.slice(0, 2) + epithet.slice(0, 2)).toUpperCase(),
    (genus.slice(0, 4)).toUpperCase(),
    (genus.slice(0, 3) + epithet.slice(0, 1)).toUpperCase(),
  ];
  const candidates = [...baseCandidates];
  for (const base of baseCandidates) {
    for (let n = 2; n <= 7; n++) candidates.push(base + n);
  }
  return [...new Set(candidates)].filter(s => s && s.length >= 2);
}

// Try the symbol extracted from the VT page first, then fall back to guessing.
// `page` is still accepted so the browser-based map-image path can be preserved
// in saveSpeciesFiles, but we no longer hit the USDA Angular app for core data.
async function scrapeUSDASpecies(page, scientificName, vtSymbol = '') {
  console.log(`  🌱 USDA: fetching data for ${scientificName}...`);

  // 1. VT page already knows the correct symbol — try it first via API
  if (vtSymbol) {
    const result = await fetchUSDADataFromAPI(vtSymbol, scientificName);
    if (result) {
      console.log(`    ✓ USDA API (VT symbol ${vtSymbol}): ns="${result.nativeStatus}"`);
      return result;
    }
  }

  // 2. Generate candidate symbols and try each via the fast REST API.
  // Normalise hybrid markers so names like "Abelia xgrandiflora" or "Abelia ×grandiflora"
  // produce the correct symbol candidates (ABGR).
  const candidates = deriveSymbolCandidates(scientificName);

  for (const sym of candidates) {
    if (!sym || sym.length < 2 || sym === vtSymbol) continue;
    await delay(150, 400);
    const result = await fetchUSDADataFromAPI(sym, scientificName);
    if (result) {
      console.log(`    ✓ USDA API (guessed ${sym}): ns="${result.nativeStatus}"`);
      return result;
    }
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
  const usedDescriptors = {}; // track per-descriptor count to avoid duplicate filenames

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
      // Extract descriptor from VT alt text: "{common name} {descriptor} image"
      // e.g. "red maple bark image" → "bark", "red maple leaf image" → "leaf"
      const altMatch = (img.alt || '').match(/\b(\w+)\s+image$/i);
      const descriptor = altMatch ? altMatch[1].toLowerCase() : null;

      if (descriptor && descriptor !== 'map') {
        // Use descriptor-based name; append count only if the same descriptor appears twice
        usedDescriptors[descriptor] = (usedDescriptors[descriptor] || 0) + 1;
        const suffix = usedDescriptors[descriptor] > 1 ? usedDescriptors[descriptor] : '';
        fileName = `${folderName}_${descriptor}${suffix}${ext}`;
      } else {
        // No recognisable descriptor — fall back to sequential number
        fileName = `${folderName}_${imgCount}${ext}`;
        imgCount++;
      }
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
    let speciesList = await scrapeVTSpeciesList();
    await delay(2000, 3000);

    if (speciesList.length === 0) {
      console.error('Could not load species list from VT Dendrology. Exiting.');
      process.exit(1);
    }

    // Skip already scraped (resume capability).
    // A species is only skipped if it's in the JSON AND its folder still exists on disk.
    // If the folder was deleted, it will be re-scraped regardless of the JSON entry.
    const toScrape = speciesList.filter(s => {
      const candidate = s.scientific
        ? safeName(s.scientific.split(' ').slice(0, 2).join('_'))
        : '';
      if (!candidate || !alreadyScraped.has(candidate)) return true;
      // Entry is in JSON — only skip if the folder is still present
      return !fs.existsSync(path.join(OUTPUT_DIR, candidate));
    });

    console.log(`\n🌳 Processing ${toScrape.length} species (${alreadyScraped.size} already done)...\n`);

    for (let i = 0; i < toScrape.length; i++) {
      const species = toScrape[i];
      console.log(`\n[${i + 1}/${toScrape.length}] ${species.scientific} — ${species.common}`);

      try {
        // 1. Scrape VT page
        const { folderName, data: vtData } = await scrapeVTSpeciesPage(vtPage, species);
        await delay(2000, 4000);

        // 2. Scrape USDA — pass the VT symbol so the API can find the right profile on first try
        const usdaData = await scrapeUSDASpecies(usdaPage, vtData.scientificName || species.scientific, vtData.symbol || '');
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

// Only run when executed directly (node src/scraper.mjs), not when imported.
const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
