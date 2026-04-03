#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const MARKETING_VIEWPORT = { width: 1280, height: 800 };
const CAPTURE_VIEWPORT = { width: 1280, height: 800 };
const SCROLL_STABILIZE_MS = 420;
const BEFORE_CAPTURE_MS = 300;
const MOCK_ACTIVE_TAB_URL = 'https://example.com/products/featured?ref=docs';
const MOCK_TAB_COUNT = 28;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const extPath = path.resolve(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

const DEMO_SETTINGS = {
  enabled: true,
  globalSettings: {
    duplicateAction: 'close-new-stay-current',
    ignoreParameters: false,
    duplicateScope: 'all-windows',
  },
  exceptions: [
    'https://github.com',
    'https://stackoverflow.com/questions/123',
    'https://docs.google.com/document/d/abc',
  ],
  domainExceptions: ['youtube.com', 'twitter.com'],
  siteRules: [
    { domain: 'youtube.com', duplicateAction: 'close-old-switch-new', ignoreParameters: true },
    { domain: 'twitter.com', duplicateAction: 'close-new-stay-current', ignoreParameters: false },
    { domain: 'reddit.com', duplicateAction: 'close-new-switch-existing', ignoreParameters: true },
  ],
};
const DEMO_STATS = { tabsClosedCount: 2847 };

const panel1Path = path.join(docsDir, '_options-panel-1.png');
const panel2Path = path.join(docsDir, '_options-panel-2.png');
const mockupPath = path.join(docsDir, '_options-mockup.html');
const outPath1 = path.join(docsDir, 'screenshot-options-1.png');
const outPath2 = path.join(docsDir, 'screenshot-options-2.png');

if (!fs.existsSync(extPath)) {
  console.error('Run npm run build first. dist/ not found.');
  process.exit(1);
}
fs.mkdirSync(docsDir, { recursive: true });

const userDataDir = path.join(os.tmpdir(), `pde-options-banner-${Date.now()}`);

async function injectDemoStorage(page) {
  await page.evaluate(
    async ({ settings, stats }) => {
      await chrome.storage.sync.set({
        extensionSettings: JSON.stringify(settings),
        extensionStatistics: JSON.stringify(stats),
      });
      await chrome.storage.local.set({
        extensionReviewPrompt: JSON.stringify({
          firstSeenAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
          dismissed: true,
          snoozeUntil: null,
        }),
      });
    },
    { settings: DEMO_SETTINGS, stats: DEMO_STATS }
  );
}

async function applyCaptureScrollbarVisibility(page) {
  await page.addStyleTag({
    content:
      'main{scrollbar-gutter:stable;}main::-webkit-scrollbar{width:11px;}main::-webkit-scrollbar-track{background:#e2e8f0;border-radius:6px;}main::-webkit-scrollbar-thumb{background:#64748b;border-radius:6px;border:2px solid #e2e8f0;}',
  });
}

async function scrollMainLikeHuman(page, main, targetTop) {
  await main.evaluate((el, y) => {
    el.scrollTo({ top: y, behavior: 'smooth' });
  }, targetTop);
  await page
    .waitForFunction(
      (y) => {
        const el = document.querySelector('main');
        if (!el) return false;
        return Math.abs(el.scrollTop - y) <= 2;
      },
      targetTop,
      { timeout: 9000 }
    )
    .catch(async () => {
      await main.evaluate((el, y) => {
        el.scrollTop = y;
      }, targetTop);
    });
  await page.waitForTimeout(SCROLL_STABILIZE_MS + Math.floor(Math.random() * 100));
}

async function getExtId(context) {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  return sw.url().split('/')[2];
}

async function captureTwoOptionPanels() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`],
  });
  await context.addInitScript(
    ({ mockUrl, tabCount }) => {
      if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
        return;
      }
      const orig = chrome.tabs.query.bind(chrome.tabs);
      const mockTabs = Array.from({ length: tabCount }, (_, i) => ({ id: i + 1, url: 'https://example.com/' }));
      chrome.tabs.query = function (queryInfo, callback) {
        const q = queryInfo || {};
        if (q.active === true && q.currentWindow === true) {
          const tabs = [{ url: mockUrl }];
          if (typeof callback === 'function') {
            Promise.resolve().then(() => {
              callback(tabs);
            });
            return;
          }
          return Promise.resolve(tabs);
        }
        if (Object.keys(q).length === 0) {
          if (typeof callback === 'function') {
            Promise.resolve().then(() => {
              callback(mockTabs);
            });
            return;
          }
          return Promise.resolve(mockTabs);
        }
        return orig(q, callback);
      };
    },
    { mockUrl: MOCK_ACTIVE_TAB_URL, tabCount: MOCK_TAB_COUNT }
  );
  const extId = await getExtId(context);
  const page = await context.newPage();
  await page.setViewportSize(CAPTURE_VIEWPORT);
  await page.goto(`chrome-extension://${extId}/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
  await injectDemoStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);
  await applyCaptureScrollbarVisibility(page);

  const main = page.locator('main');
  await main.waitFor({ state: 'visible' });
  const metrics = await main.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }));
  const maxScroll = Math.max(0, metrics.scrollHeight - metrics.clientHeight);

  await scrollMainLikeHuman(page, main, 0);
  await page.waitForTimeout(BEFORE_CAPTURE_MS + Math.floor(Math.random() * 100));
  await page.screenshot({
    path: panel1Path,
    clip: { x: 0, y: 0, width: CAPTURE_VIEWPORT.width, height: CAPTURE_VIEWPORT.height },
  });

  if (maxScroll <= 0) {
    fs.copyFileSync(panel1Path, panel2Path);
  } else {
    await scrollMainLikeHuman(page, main, maxScroll);
    await page.waitForTimeout(BEFORE_CAPTURE_MS + Math.floor(Math.random() * 100));
    await page.screenshot({
      path: panel2Path,
      clip: { x: 0, y: 0, width: CAPTURE_VIEWPORT.width, height: CAPTURE_VIEWPORT.height },
    });
  }

  await page.close();
  await context.close();
  return {
    captureSize: { width: CAPTURE_VIEWPORT.width, height: CAPTURE_VIEWPORT.height },
    paths: [panel1Path, panel2Path],
  };
}

function writeOptionsBannerHtml(basename, captureSize) {
  const framePadX = 48 * 2;
  const framePadYTop = 36;
  const framePadYBottom = 40;
  const maxShotW = MARKETING_VIEWPORT.width - framePadX;
  const maxShotH = MARKETING_VIEWPORT.height - framePadYTop - framePadYBottom;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Options marketing banner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
    #frame {
      width: 1280px; height: 800px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${framePadYTop}px 48px ${framePadYBottom}px;
      background-color: #070b14;
      background-image:
        repeating-linear-gradient(105deg, rgba(148,163,184,0.045) 0px, rgba(148,163,184,0.045) 1px, transparent 1px, transparent 11px),
        repeating-linear-gradient(-15deg, rgba(15,23,42,0.55) 0px, transparent 0px, transparent 5px, rgba(30,41,59,0.35) 5px, rgba(30,41,59,0.35) 6px, transparent 6px, transparent 14px),
        radial-gradient(ellipse 120% 90% at 20% 10%, rgba(56,189,248,0.07) 0%, transparent 45%),
        radial-gradient(ellipse 90% 70% at 88% 72%, rgba(99,102,241,0.08) 0%, transparent 48%),
        linear-gradient(165deg, #0a0f1c 0%, #121a2e 42%, #0d1628 100%);
      overflow: hidden;
    }
    .noise-svg {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 0; opacity: 0.72; mix-blend-mode: overlay;
    }
    .grain-svg {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 1; opacity: 0.28; mix-blend-mode: soft-light;
    }
    .vignette {
      position: absolute; inset: 0; pointer-events: none; z-index: 1;
      background: radial-gradient(ellipse 88% 78% at 50% 42%, transparent 35%, rgba(4,6,14,0.65) 100%);
    }
    .halftone {
      position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0.22;
      mix-blend-mode: soft-light;
      background-image: radial-gradient(rgba(226,232,240,0.55) 0.45px, transparent 0.55px);
      background-size: 4px 4px;
    }
    .banner-single {
      position: relative; z-index: 3;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 100%; max-width: ${maxShotW}px;
    }
    .shot {
      border-radius: 14px; overflow: hidden; max-width: ${maxShotW}px; width: 100%;
      display: flex; justify-content: center; align-items: center;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.1),
        0 4px 12px rgba(0,0,0,0.2),
        0 24px 48px rgba(0,0,0,0.35);
    }
    .shot img {
      display: block; width: 100%; max-width: ${maxShotW}px; height: auto; max-height: ${maxShotH}px;
      object-fit: contain; object-position: center center; vertical-align: top;
    }
  </style>
</head>
<body>
  <div id="frame">
    <div class="halftone" aria-hidden="true"></div>
    <svg class="noise-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="coarseNoise" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="4" seed="42" stitchTiles="stitch" result="t"/>
          <feColorMatrix in="t" type="matrix" values="0.5 0 0 0 0  0 0.52 0 0 0  0 0 0.58 0 0  0 0 0 0.45 0"/>
        </filter>
      </defs>
      <rect width="1280" height="800" filter="url(#coarseNoise)" opacity="1"/>
    </svg>
    <svg class="grain-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="fineGrain" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="3" seed="17" stitchTiles="stitch" result="g"/>
          <feColorMatrix in="g" type="saturate" values="0"/>
        </filter>
      </defs>
      <rect width="1280" height="800" filter="url(#fineGrain)" opacity="0.9"/>
    </svg>
    <div class="vignette" aria-hidden="true"></div>
    <div class="banner-single">
      <div class="shot">
        <img src="${basename}" width="${captureSize.width}" height="${captureSize.height}" alt="Extension options page">
      </div>
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(mockupPath, html, 'utf8');
}

async function captureBannerPng(outPath) {
  const context = await chromium.launchPersistentContext(path.join(os.tmpdir(), `pw-options-mockup-${Date.now()}`), {
    channel: 'chromium',
    headless: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.setViewportSize(MARKETING_VIEWPORT);
  await page.goto(pathToFileURL(mockupPath).href, { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width: MARKETING_VIEWPORT.width, height: MARKETING_VIEWPORT.height },
  });
  await context.close();
}

function cleanupTemps() {
  [panel1Path, panel2Path, mockupPath].forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

function cleanupOnError() {
  if (!fs.existsSync(docsDir)) return;
  ['_options-panel-1.png', '_options-panel-2.png', '_options-mockup.html'].forEach((f) => {
    const p = path.join(docsDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

async function main() {
  console.log('Capturing options at', CAPTURE_VIEWPORT.width, '×', CAPTURE_VIEWPORT.height, '(top + bottom scroll)...');
  const { captureSize, paths } = await captureTwoOptionPanels();
  console.log('Building banner', path.basename(outPath1), '...');
  writeOptionsBannerHtml(path.basename(paths[0]), captureSize);
  await captureBannerPng(outPath1);
  console.log('Building banner', path.basename(outPath2), '...');
  writeOptionsBannerHtml(path.basename(paths[1]), captureSize);
  await captureBannerPng(outPath2);
  cleanupTemps();
  console.log('Saved', outPath1);
  console.log('Saved', outPath2);
}

main().catch((err) => {
  cleanupOnError();
  throw err;
});
