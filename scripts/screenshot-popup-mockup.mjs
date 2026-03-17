#!/usr/bin/env node
/**
 * Capture real popup UI and composite into a 1280×800 professional marketing image.
 * Run: node scripts/screenshot-popup-mockup.mjs  (requires dist/ and playwright)
 * Output: docs/screenshot-popup.png (exactly 1280×800)
 */
import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const VIEWPORT = { width: 1280, height: 800 };
const POPUP_SIZE = { width: 520, height: 700 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const extPath = path.resolve(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

const DEMO_SETTINGS = {
  enabled: true,
  globalSettings: { duplicateAction: 'close-new-stay-current', ignoreParameters: false, duplicateScope: 'all-windows' },
  exceptions: [],
  domainExceptions: [],
  siteRules: [],
};
const DEMO_STATS = { tabsClosedCount: 2847 };

if (!fs.existsSync(extPath)) {
  console.error('Run npm run build first. dist/ not found.');
  process.exit(1);
}
fs.mkdirSync(docsDir, { recursive: true });

const userDataDir = path.join(os.tmpdir(), `pde-popup-mockup-${Date.now()}`);
const popupContentPath = path.join(docsDir, '_popup-content.png');
const mockupPath = path.join(docsDir, '_popup-mockup.html');
const outPath = path.join(docsDir, 'screenshot-popup.png');

async function getExtId(context) {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  return sw.url().split('/')[2];
}

async function capturePopupContent() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`],
  });
  const extId = await getExtId(context);
  const page = await context.newPage();
  await page.setViewportSize(POPUP_SIZE);
  await page.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(
    async ({ settings, stats }) => {
      await chrome.storage.sync.set({
        extensionSettings: JSON.stringify(settings),
        extensionStatistics: JSON.stringify(stats),
      });
    },
    { settings: DEMO_SETTINGS, stats: DEMO_STATS }
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: popupContentPath });
  await context.close();
}

function writeMockupHtml() {
  const popupImg = path.basename(popupContentPath);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Marketing mockup</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
    #frame {
      width: 1280px; height: 800px;
      background: linear-gradient(165deg, #f0f4f8 0%, #e2e8f0 40%, #f8fafc 100%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #frame::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 50% at 70% 50%, rgba(49, 130, 206, 0.06) 0%, transparent 60%);
      pointer-events: none;
    }
    .popup-wrap {
      position: relative;
      z-index: 2;
      border-radius: 12px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.04),
        0 2px 4px rgba(0,0,0,0.04),
        0 8px 24px rgba(0,0,0,0.08),
        0 24px 48px rgba(0,0,0,0.06);
    }
    .popup-wrap img { display: block; vertical-align: top; }
    .tagline {
      position: absolute;
      bottom: 48px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      font-size: 15px;
      font-weight: 500;
      color: #64748b;
      letter-spacing: 0.01em;
    }
  </style>
</head>
<body>
  <div id="frame">
    <div class="popup-wrap">
      <img src="${popupImg}" width="520" alt="Extension popup">
    </div>
    <p class="tagline">Settings at a glance — one click from the toolbar</p>
  </div>
</body>
</html>`;
  fs.writeFileSync(mockupPath, html, 'utf8');
}

async function captureMockup() {
  const context = await chromium.launchPersistentContext(path.join(os.tmpdir(), 'pw-mockup-' + Date.now()), {
    channel: 'chromium',
    headless: true,
  });
  const page = await context.newPage();
  await page.setViewportSize(VIEWPORT);
  await page.goto(pathToFileURL(mockupPath).href, { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath });
  await context.close();
}

async function main() {
  console.log('Capturing real popup UI...');
  await capturePopupContent();
  console.log('Building 1280×800 marketing image...');
  writeMockupHtml();
  console.log('Capturing mockup at 1280×800...');
  await captureMockup();
  fs.unlinkSync(popupContentPath);
  fs.unlinkSync(mockupPath);
  console.log('Screenshot saved to', outPath);
}

main().catch((err) => {
  if (fs.existsSync(popupContentPath)) fs.unlinkSync(popupContentPath);
  if (fs.existsSync(mockupPath)) fs.unlinkSync(mockupPath);
  throw err;
});
