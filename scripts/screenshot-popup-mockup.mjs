#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const VIEWPORT = { width: 1280, height: 800 };
const POPUP_SIZE = { width: 800, height: 600 };

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
      background: linear-gradient(165deg, #eef2f7 0%, #e2e8f0 45%, #f8fafc 100%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vector-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
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
    <svg class="vector-bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="blobA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.45"/>
          <stop offset="55%" stop-color="#a5b4fc" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#c4b5fd" stop-opacity="0.12"/>
        </linearGradient>
        <linearGradient id="blobB" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.1"/>
        </linearGradient>
        <linearGradient id="arcGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
          <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.12"/>
        </linearGradient>
      </defs>
      <path fill="url(#blobA)" d="M920 40c160 60 240 200 200 360s-200 280-380 260-300-180-260-340 120-340 440-280z"/>
      <path fill="url(#blobB)" d="M-60 480c140-100 320-80 400 40s20 260-120 320-340-20-400-160 40-200 120-200z"/>
      <g fill="none" stroke="url(#arcGrad)" stroke-width="1.25" stroke-linecap="round" opacity="0.9">
        <path d="M80 620 Q 320 520 560 600 T 1040 560"/>
        <path d="M120 680 Q 400 600 680 660 T 1180 620"/>
      </g>
      <g fill="#64748b" opacity="0.12">
        <rect x="72" y="96" width="168" height="112" rx="14" ry="14"/>
        <rect x="92" y="116" width="128" height="8" rx="4" ry="4"/>
        <rect x="92" y="132" width="96" height="6" rx="3" ry="3"/>
        <rect x="92" y="148" width="112" height="6" rx="3" ry="3"/>
      </g>
      <g fill="#64748b" opacity="0.1" transform="translate(980 520) rotate(-8)">
        <rect x="0" y="0" width="200" height="130" rx="12" ry="12"/>
        <rect x="16" y="18" width="100" height="7" rx="3.5" ry="3.5"/>
        <rect x="16" y="36" width="168" height="5" rx="2.5" ry="2.5"/>
        <rect x="16" y="50" width="140" height="5" rx="2.5" ry="2.5"/>
      </g>
      <g fill="#0ea5e9" opacity="0.14">
        <circle cx="1080" cy="140" r="6"/>
        <circle cx="1110" cy="168" r="4"/>
        <circle cx="1048" cy="172" r="3.5"/>
        <circle cx="200" cy="640" r="5"/>
        <circle cx="232" cy="668" r="3"/>
        <circle cx="176" cy="672" r="4"/>
      </g>
      <path fill="none" stroke="#6366f1" stroke-width="1" stroke-dasharray="6 14" opacity="0.15" d="M640 40 L640 760"/>
    </svg>
    <div class="popup-wrap">
      <img src="${popupImg}" width="800" alt="Extension popup">
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
