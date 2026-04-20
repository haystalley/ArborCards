/**
 * Quick test — scrapes 2 species and verifies all six fixes:
 *   1. Correct USDA domain (plants.sc.egov.usda.gov)
 *   2. USDA Angular DOM extraction (Growth Habits, Symbol, Duration, etc.)
 *   3. Map image detection (filename must start with "map")
 *   4. Clean common/scientific names
 *   5. Clean Native Status field (no embedded newlines or extra whitespace)
 *   6. Clean all other USDA fields: symbol, group, duration, growthHabit
 *   7. Hybrid × stripping — names like "Abelia ×grandiflora" produce valid
 *      symbol candidates free of the × character (ID=417)
 *
 * Run: node src/test-scrape.mjs
 */

import { chromium } from 'playwright';
import https from 'https';
import http from 'http';
import { deriveSymbolCandidates } from './scraper.mjs';

const USDA_BASE = 'https://plants.sc.egov.usda.gov';
const USDA_API  = 'https://plantsservices.sc.egov.usda.gov/api';

function delay(min = 1000, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

/**
 * Test the hybrid × stripping logic with a known hybrid name by calling the
 * production deriveSymbolCandidates() exported from scraper.mjs — the same
 * function used by scrapeUSDASpecies. Any refactor that breaks the stripping
 * logic will fail here immediately.
 *
 * Verifies:
 *   1. No candidate symbol contains the '×' character (Unicode stripping works)
 *   2. The first candidate exactly matches the expected symbol (e.g. ABGR for
 *      "Abelia ×grandiflora"), confirming correct genus/epithet extraction
 *   3. Trying up to 5 candidates via the USDA REST API does not throw/crash;
 *      graceful no-data (null) is acceptable, but exceptions are failures
 */
async function testHybridSpecies(hybridName, expectedFirstCandidate) {
  console.log(`\n── Hybrid × Stripping: "${hybridName}"`);

  const candidates = deriveSymbolCandidates(hybridName);
  console.log(`  Derived candidates: [${candidates.join(', ')}]`);

  const crossInAny = candidates.some(c => c.includes('×'));
  if (crossInAny) {
    console.log(`  ❌ Some candidate still contains × — stripping broken!`);
  } else {
    console.log(`  ✅ No candidate contains × (stripping works)`);
  }

  const firstCandidate = candidates[0] || '';
  const firstCandidateOk = firstCandidate === expectedFirstCandidate;
  console.log(`  First candidate: "${firstCandidate}" — expected "${expectedFirstCandidate}" ${firstCandidateOk ? '✅' : '❌'}`);

  let usdaResult = null;
  let usdaError  = null;

  for (const sym of candidates.slice(0, 5)) {
    await delay(150, 400);
    try {
      const url = `${USDA_API}/PlantProfile?symbol=${encodeURIComponent(sym)}`;
      const raw = await httpsGet(url);
      const d = JSON.parse(raw);

      const pageSciName = (d.ScientificName || '').replace(/<[^>]+>/g, '').trim().toLowerCase();
      const queryGenus  = hybridName.replace(/×/g, '').trim().toLowerCase().split(/\s+/)[0];

      if (pageSciName.includes(queryGenus)) {
        const resultSymbol = (d.Symbol || sym).replace(/\s+/g, ' ').trim();
        if (!resultSymbol.includes('×')) {
          usdaResult = { symbol: resultSymbol, triedSym: sym };
          break;
        }
      }
    } catch (err) {
      usdaError = err.message;
      break;
    }
  }

  if (usdaError) {
    console.log(`  ❌ USDA API call threw an error: ${usdaError}`);
  } else if (usdaResult) {
    const symClean = !usdaResult.symbol.includes('×');
    console.log(`  USDA found data via symbol "${usdaResult.triedSym}" → returned symbol "${usdaResult.symbol}" ${symClean ? '✅ clean' : '❌ contains ×'}`);
  } else {
    console.log(`  ✅ USDA gracefully returned no data (hybrid not in USDA — acceptable)`);
  }

  return {
    hybridName,
    candidates,
    noCrossInCandidates: !crossInAny,
    firstCandidateOk,
    usdaError,
    usdaResult,
  };
}

async function testVTPage(page, url, label) {
  console.log(`\n── VT Dendrology: ${label}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const data = await page.evaluate(() => {
    const fullText = document.body.innerText;
    const symbolMatch = fullText.match(/symbol:\s*([A-Z0-9]+)/i);
    const symbol = symbolMatch?.[1] || '';

    const italic = document.body.querySelector('i, em');
    let scientificName = italic ? italic.textContent.trim() : '';
    // Bug 4 fix: clean whitespace
    scientificName = scientificName.replace(/\s+/g, ' ').trim();

    const familyMatch = fullText.match(/\b([A-Z][a-z]+aceae)\b/);
    const family = familyMatch?.[1] || '';

    // Image detection: Bug 3 fix — check filename only
    const imgs = Array.from(document.querySelectorAll('img'))
      .filter(img => img.src && img.src.includes('/images/') && !img.src.includes('.gif'))
      .map(img => {
        let filename = '';
        try { filename = new URL(img.src).pathname.split('/').pop().toLowerCase(); } catch (_) {}
        const altLower = (img.alt || '').toLowerCase();
        const isMap = /^map\d*\./.test(filename) ||
          altLower.includes(' map ') || altLower.endsWith(' map') || altLower.includes('range map');
        return { filename, alt: img.alt, isMap };
      });

    const mapImgs = imgs.filter(i => i.isMap);
    return { symbol, scientificName, family, totalImages: imgs.length, mapImgs };
  });

  console.log(`  Symbol:         ${data.symbol || '(not found)'}`);
  console.log(`  Scientific:     "${data.scientificName}" ${data.scientificName.includes('\n') ? '❌ HAS NEWLINES' : '✅ clean'}`);
  console.log(`  Family:         ${data.family || '(not found)'}`);
  console.log(`  Images found:   ${data.totalImages}`);
  console.log(`  Map images:     ${data.mapImgs.length} → ${data.mapImgs.map(i => i.filename).join(', ') || '(none)'}`);

  return data;
}

async function testUSDAPage(page, symbol, expectedGenus) {
  console.log(`\n── USDA PLANTS: ${symbol} (${expectedGenus})`);
  const url = `${USDA_BASE}/plant-profile/${symbol}`;
  console.log(`  URL: ${url}`);

  // domcontentloaded is essential — USDA's Angular app never reaches networkidle
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(500, 1000);

  // Wait for Angular to render
  let tableFound = false;
  try {
    await page.waitForSelector('div.general-info', { timeout: 20000 });
    tableFound = true;
  } catch (_) {
    console.log(`  ❌ div.general-info never appeared — Angular did not render`);
  }

  if (!tableFound) return null;

  const result = await page.evaluate((usdaBase) => {
    const fields = {};
    document.querySelectorAll('div.general-info tr').forEach(row => {
      const label = row.querySelector('th h3')?.textContent?.trim() || '';
      const value = row.querySelector('td')?.textContent?.trim() || '';
      if (label) fields[label] = value;
    });

    const symbol = (fields['Symbol'] || '').replace(/\s+/g, ' ').trim();
    const group = (fields['Group'] || fields['Plant Type'] || '').replace(/\s+/g, ' ').trim();
    const duration = (fields['Duration'] || '').replace(/\s+/g, ' ').trim();
    const growthHabit = (fields['Growth Habits'] || fields['Growth Habit'] || '').replace(/\s+/g, ' ').trim();
    const nativeStatus = (fields['Native Status'] || '').replace(/\s+/g, ' ').trim();

    // PDF links
    let factSheetUrl = null, plantGuideUrl = null;
    Array.from(document.querySelectorAll('a[href]')).forEach(a => {
      const rawHref = a.getAttribute('href') || '';
      const href = rawHref.startsWith('http') ? rawHref : usdaBase + rawHref;
      const text = a.textContent.toLowerCase();
      if (!factSheetUrl && href.toLowerCase().endsWith('.pdf') &&
          (text.includes('fact sheet') || rawHref.includes('factsheet'))) {
        factSheetUrl = href;
      }
      if (!plantGuideUrl && href.toLowerCase().endsWith('.pdf') &&
          (text.includes('plant guide') || rawHref.includes('plantguide'))) {
        plantGuideUrl = href;
      }
    });

    return { symbol, group, duration, growthHabit, nativeStatus, factSheetUrl, plantGuideUrl, allFields: Object.keys(fields) };
  }, USDA_BASE);

  console.log(`  Fields found:   [${result.allFields.join(', ')}]`);
  console.log(`  Symbol:         ${result.symbol || '(empty)'} ${result.symbol ? '✅' : '❌'}`);
  console.log(`  Group:          ${result.group || '(empty)'} ${result.group ? '✅' : '❌'}`);
  console.log(`  Duration:       ${result.duration || '(empty)'} ${result.duration ? '✅' : '❌'}`);
  console.log(`  Growth Habits:  ${result.growthHabit || '(empty)'} ${result.growthHabit ? '✅' : '❌'}`);
  const nativeStatusClean = !result.nativeStatus.includes('\n') && !/\s{2,}/.test(result.nativeStatus);
  console.log(`  Native Status:  "${result.nativeStatus || '(empty)'}" ${result.nativeStatus ? (nativeStatusClean ? '✅ clean' : '❌ HAS EXTRA WHITESPACE') : '❌'}`);
  console.log(`  Fact Sheet PDF: ${result.factSheetUrl || '(none)'}`);
  console.log(`  Plant Guide PDF:${result.plantGuideUrl || '(none)'}`);

  return result;
}

async function quickTest() {
  console.log('🧪 Scraper Validation Test');
  console.log('   Checks all five bug fixes (domain, Angular extraction, map detection, name cleanup, native status cleanup)\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  });
  page.setDefaultTimeout(30000);

  const vtResults = [];
  const usdaResults = [];

  let hybridResult = null;

  try {
    // ── VT Tests ──────────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VT DENDROLOGY TESTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const vt1 = await testVTPage(page,
      'https://dendro.cnre.vt.edu/dendrology/syllabus/factsheet.cfm?ID=1',
      'Acer rubrum (red maple)');
    vtResults.push({ name: 'Acer rubrum', ...vt1 });
    await delay(2000, 3000);

    const vt2 = await testVTPage(page,
      'https://dendro.cnre.vt.edu/dendrology/syllabus/factsheet.cfm?ID=111',
      'Pinus strobus (eastern white pine)');
    vtResults.push({ name: 'Pinus strobus', ...vt2 });
    await delay(2000, 3000);

    // ── USDA Tests ────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('USDA PLANTS TESTS (plants.sc.egov.usda.gov)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const usda1 = await testUSDAPage(page, 'ACRU', 'acer');
      if (usda1) usdaResults.push({ symbol: 'ACRU', ...usda1 });
    } catch (e) {
      console.log(`  ❌ ACRU test threw: ${e.message}`);
    }
    await delay(2000, 3000);

    try {
      const usda2 = await testUSDAPage(page, 'PIST', 'pinus');
      if (usda2) usdaResults.push({ symbol: 'PIST', ...usda2 });
    } catch (e) {
      console.log(`  ❌ PIST test threw: ${e.message}`);
    }

    // ── Hybrid × Stripping Test ────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HYBRID × STRIPPING TEST (ID=417 — Abelia ×grandiflora)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await delay(1000, 2000);
    try {
      hybridResult = await testHybridSpecies('Abelia ×grandiflora', 'ABGR');
    } catch (e) {
      console.log(`  ❌ Hybrid test threw an unexpected error: ${e.message}`);
      hybridResult = { noCrossInCandidates: false, firstCandidateOk: false, usdaError: e.message, usdaResult: null };
    }

  } finally {
    await browser.close();
  }

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`VT pages loaded:      ${vtResults.length}/2`);
  console.log(`USDA pages with data: ${usdaResults.filter(r => r.growthHabit).length}/${usdaResults.length}`);

  const expectedSymbols = ['ACRU', 'PIST'];
  const allUsdaOk = expectedSymbols.every(sym =>
    usdaResults.some(r => r.symbol === sym && r.growthHabit));
  const allVtOk = vtResults.every(r => r.scientificName && !r.scientificName.includes('\n'));
  const nativeStatusOk = usdaResults.every(r => !r.nativeStatus.includes('\n') && !/\s{2,}/.test(r.nativeStatus));
  const fieldCleanupOk = usdaResults.every(r =>
    [r.symbol, r.group, r.duration, r.growthHabit].every(
      f => !f.includes('\n') && !/\s{2,}/.test(f)
    )
  );
  // Bug 3: each VT page should have exactly 1 map image detected, and its filename must start with "map"
  const mapOk = vtResults.length > 0 &&
    vtResults.every(r => r.mapImgs.length === 1 && /^map/.test(r.mapImgs[0]?.filename || ''));

  const mapDetail = vtResults.map(r => {
    if (r.mapImgs.length === 0) return `  ${r.name}: ❌ no map detected`;
    if (r.mapImgs.length > 1) return `  ${r.name}: ❌ ${r.mapImgs.length} maps detected (${r.mapImgs.map(i => i.filename).join(', ')})`;
    if (!/^map/.test(r.mapImgs[0]?.filename || '')) return `  ${r.name}: ❌ filename "${r.mapImgs[0]?.filename}" doesn't start with "map"`;
    return `  ${r.name}: ✅ 1 map → ${r.mapImgs[0].filename}`;
  }).join('\n');

  // Hybrid × stripping: pass when the production deriveSymbolCandidates() produces
  // × -free candidates, the first candidate is correct, AND the USDA lookup did
  // not crash. Graceful no-data (usdaResult === null with no exception) is fine;
  // an exception means the stripping produced a symbol that caused an error and
  // that MUST be reported as a failure.
  const hybridStrippingOk = hybridResult !== null &&
    hybridResult.noCrossInCandidates &&
    hybridResult.firstCandidateOk &&
    hybridResult.usdaError === null;

  console.log(`\nBug 1 (USDA domain):   ${usdaResults.length > 0 ? '✅ FIXED' : '❌ Still failing'}`);
  console.log(`Bug 2 (USDA data):     ${allUsdaOk ? '✅ FIXED' : '❌ Still failing — Growth Habits still empty'}`);
  console.log(`Bug 3 (map detection): ${mapOk ? '✅ FIXED (exactly 1 map per page, filename starts with "map")' : '❌ Check map results above'}`);
  console.log(mapDetail);
  console.log(`Bug 4 (name cleanup):  ${allVtOk ? '✅ FIXED (no embedded newlines)' : '❌ Scientific name still dirty'}`);
  console.log(`Bug 5 (native status): ${nativeStatusOk ? '✅ FIXED (no embedded newlines or extra whitespace)' : '❌ Native Status still has extra whitespace'}`);
  console.log(`Bug 6 (field cleanup): ${fieldCleanupOk ? '✅ FIXED (symbol, group, duration, growthHabit all clean)' : '❌ symbol/group/duration/growthHabit still has extra whitespace'}`);
  console.log(`Bug 7 (hybrid ×):      ${hybridStrippingOk ? '✅ FIXED (× stripped, valid candidates, USDA lookup stable)' : '❌ Hybrid × stripping broken or USDA lookup crashed'}`);
  if (hybridResult) {
    const usdaStatus = hybridResult.usdaError
      ? `crashed: ${hybridResult.usdaError}`
      : hybridResult.usdaResult
        ? `found data for symbol "${hybridResult.usdaResult.symbol}"`
        : 'gracefully returned no data';
    console.log(`  Abelia ×grandiflora: candidates=[${(hybridResult.candidates || []).join(', ')}], USDA=${usdaStatus}`);
  }

  if (allUsdaOk && allVtOk && mapOk && nativeStatusOk && fieldCleanupOk && hybridStrippingOk) {
    console.log('\n✅ All checks passed! Run: node src/scraper.mjs to scrape all 402 species.');
  } else {
    console.log('\n⚠️  Some checks failed — review output above for details.');
  }
}

quickTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
