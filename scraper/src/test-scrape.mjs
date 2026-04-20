/**
 * Quick test — scrapes just 2 species to verify the scraper works
 * Run: node src/test-scrape.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('../Species_Database');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'species_data.json');

function delay(min = 2000, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeName(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function quickTest() {
  console.log('🧪 Quick test: scraping 2 species from VT Dendrology...\n');
  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  });

  const testUrls = [
    { name: 'Acer rubrum (red maple)', url: 'https://dendro.cnre.vt.edu/dendrology/syllabus/factsheet.cfm?ID=1' },
    { name: 'Pinus strobus (eastern white pine)', url: 'https://dendro.cnre.vt.edu/dendrology/syllabus/factsheet.cfm?ID=58' }
  ];

  const results = [];

  for (const species of testUrls) {
    console.log(`Testing: ${species.name}`);
    try {
      await page.goto(species.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await delay(1000, 2000);

      const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const allImgs = Array.from(document.querySelectorAll('img'))
          .filter(img => img.src && !img.src.includes('logo'))
          .map(img => ({ src: img.src, alt: img.alt }));
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(t => t.length > 20);

        return {
          title: h1?.textContent.trim() || '',
          imgCount: allImgs.length,
          firstImgSrc: allImgs[0]?.src || null,
          descSnippet: paragraphs[0]?.slice(0, 120) || '',
          url: window.location.href
        };
      });

      console.log(`  ✅ ${data.title || species.name}`);
      console.log(`     Images found: ${data.imgCount}`);
      console.log(`     Description snippet: ${data.descSnippet.slice(0, 80)}...`);
      results.push({ name: species.name, success: true, ...data });

    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
      results.push({ name: species.name, success: false, error: err.message });
    }

    await delay(2000, 3000);
  }

  await browser.close();

  console.log('\n📊 Test Summary:');
  console.log(`  Tested: ${results.length} species`);
  console.log(`  Success: ${results.filter(r => r.success).length}`);
  console.log(`  Failed: ${results.filter(r => !r.success).length}`);
  console.log('\n✅ Scraper is ready! Run: node src/scraper.mjs to scrape all species.');
}

quickTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
