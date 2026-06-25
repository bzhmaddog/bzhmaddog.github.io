#!/usr/bin/env node
// Generates resume/resume.pdf as a single continuous page (no page breaks).
const puppeteer = require('puppeteer');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, 'index.html');
const PDF_FILE  = path.resolve(__dirname, 'resume.pdf');

// A4 width in px at 96dpi (1mm = 3.7795px)
const A4_WIDTH_PX = 794;
const MM_PER_PX   = 25.4 / 96;
const MARGIN_H_MM = 10;
const MARGIN_V_MM = 15;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Use A4 width so layout matches the styled output
  await page.setViewport({ width: A4_WIDTH_PX, height: 1123, deviceScaleFactor: 1 });
  await page.goto('file://' + HTML_FILE, { waitUntil: 'networkidle0' });

  // Measure full content height after layout
  const contentHeightPx = await page.evaluate(() => document.documentElement.scrollHeight);
  const pageHeightMm = Math.ceil(contentHeightPx * MM_PER_PX) + MARGIN_V_MM * 2 + 5; // +5mm safety

  await page.pdf({
    path: PDF_FILE,
    width:  '210mm',
    height: pageHeightMm + 'mm',
    margin: { top: MARGIN_V_MM + 'mm', right: MARGIN_H_MM + 'mm', bottom: MARGIN_V_MM + 'mm', left: MARGIN_H_MM + 'mm' },
    printBackground: true,
  });

  await browser.close();
  console.log(`Done! Single-page PDF → ${PDF_FILE}  (page height: ${pageHeightMm}mm)`);
})();
