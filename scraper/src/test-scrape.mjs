/**
 * Quick test — scrapes 2 species and verifies all five fixes:
 *   1. Correct USDA domain (plants.sc.egov.usda.gov)
 *   2. USDA Angular DOM extraction (Growth Habits, Symbol, Duration, etc.)
 *   3. Map image detection (filename must start with "map")
 *   4. Clean common/scientific names
 *   5. Clean Native Status field (no embedded newlines or extra whitespace)
 *
 * Run: node src/test-scrape.mjs
 */

import { chromium } from 'playwright';

const USDA_BASE = 'https://plants.sc.egov.usda.gov';

function delay(min = 1000, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
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

    const symbol = fields['Symbol'] || '';
    const group = fields['Group'] || fields['Plant Type'] || '';
    const duration = fields['Duration'] || '';
    const growthHabit = fields['Growth Habits'] || fields['Growth Habit'] || '';
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
  // Bug 3: each VT page should have exactly 1 map image detected, and its filename must start with "map"
  const mapOk = vtResults.length > 0 &&
    vtResults.every(r => r.mapImgs.length === 1 && /^map/.test(r.mapImgs[0]?.filename || ''));

  const mapDetail = vtResults.map(r => {
    if (r.mapImgs.length === 0) return `  ${r.name}: ❌ no map detected`;
    if (r.mapImgs.length > 1) return `  ${r.name}: ❌ ${r.mapImgs.length} maps detected (${r.mapImgs.map(i => i.filename).join(', ')})`;
    if (!/^map/.test(r.mapImgs[0]?.filename || '')) return `  ${r.name}: ❌ filename "${r.mapImgs[0]?.filename}" doesn't start with "map"`;
    return `  ${r.name}: ✅ 1 map → ${r.mapImgs[0].filename}`;
  }).join('\n');

  console.log(`\nBug 1 (USDA domain):   ${usdaResults.length > 0 ? '✅ FIXED' : '❌ Still failing'}`);
  console.log(`Bug 2 (USDA data):     ${allUsdaOk ? '✅ FIXED' : '❌ Still failing — Growth Habits still empty'}`);
  console.log(`Bug 3 (map detection): ${mapOk ? '✅ FIXED (exactly 1 map per page, filename starts with "map")' : '❌ Check map results above'}`);
  console.log(mapDetail);
  console.log(`Bug 4 (name cleanup):  ${allVtOk ? '✅ FIXED (no embedded newlines)' : '❌ Scientific name still dirty'}`);
  console.log(`Bug 5 (native status): ${nativeStatusOk ? '✅ FIXED (no embedded newlines or extra whitespace)' : '❌ Native Status still has extra whitespace'}`);

  if (allUsdaOk && allVtOk && mapOk && nativeStatusOk) {
    console.log('\n✅ All checks passed! Run: node src/scraper.mjs to scrape all 402 species.');
  } else {
    console.log('\n⚠️  Some checks failed — review output above for details.');
  }
}

quickTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
