#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const MARKETING_VIEWPORT = { width: 1280, height: 800 };
const SCROLL_STABILIZE_MS = 420;
const BEFORE_CAPTURE_MS = 320;
const MOCK_ACTIVE_TAB_URL = 'https://example.com/products/featured?ref=docs';
const MOCK_TAB_COUNT = 28;
const CHROME_WEB_STORE_ITEM_URL =
  'https://chromewebstore.google.com/detail/prevent-duplicate-tabs/jjnoehggdfcblljkkeijmooameiaiani';
const BANNER_EXTENSION_NAME = 'Prevent Duplicate Tabs';
const BANNER_CTA_DESCRIPTION =
  'Per-site rules, exceptions, and global defaults — right from the toolbar.';
const BANNER_CTA_BUTTON = 'Get it on the Chrome Web Store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const extPath = path.resolve(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

const DEMO_SETTINGS = {
  enabled: true,
  globalSettings: { duplicateAction: 'close-new-switch-existing', ignoreParameters: true, duplicateScope: 'all-windows' },
  exceptions: [MOCK_ACTIVE_TAB_URL],
  domainExceptions: ['example.com'],
  siteRules: [
    {
      domain: 'example.com',
      duplicateAction: 'close-old-stay-current',
      ignoreParameters: false,
    },
  ],
};
const DEMO_STATS = { tabsClosedCount: 2847 };

const popupPanel1Path = path.join(docsDir, '_popup-panel-1.png');
const popupPanel2Path = path.join(docsDir, '_popup-panel-2.png');
const mockupPath = path.join(docsDir, '_popup-mockup.html');
const outPath = path.join(docsDir, 'screenshot-popup.png');

if (!fs.existsSync(extPath)) {
  console.error('Run npm run build first. dist/ not found.');
  process.exit(1);
}
fs.mkdirSync(docsDir, { recursive: true });

const userDataDir = path.join(os.tmpdir(), `pde-popup-mockup-${Date.now()}`);

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

async function syncViewportToPopupDoc(page) {
  const dims = await page.evaluate(() => {
    const el = document.documentElement;
    return {
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
  });
  const w = Math.max(1, Math.ceil(dims.w));
  const h = Math.max(1, Math.ceil(dims.h));
  await page.setViewportSize({ width: w, height: h });
  return { width: w, height: h };
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
      { timeout: 8000 }
    )
    .catch(async () => {
      await main.evaluate((el, y) => {
        el.scrollTop = y;
      }, targetTop);
    });
  await page.waitForTimeout(SCROLL_STABILIZE_MS + Math.floor(Math.random() * 120));
}

async function scrollMainInstant(page, main, targetTop) {
  await main.evaluate((el, y) => {
    el.scrollTop = y;
  }, targetTop);
  await page.waitForTimeout(120);
}

async function scrollMainToFitCurrentDomainCard(page, main) {
  await page.evaluate(() => {
    const m = document.querySelector('main');
    if (!m) return;
    const inner = m.querySelector(':scope > div');
    if (!inner) return;
    const h = [...m.querySelectorAll('h2')].find((el) => el.textContent.trim() === 'Current Domain');
    if (!h) return;
    let card = h;
    while (card.parentElement && card.parentElement !== inner) {
      card = card.parentElement;
    }
    if (!card || card.parentElement !== inner) return;
    const pad = 10;
    const stepScroll = () => {
      const mr = m.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const ch = mr.height;
      if (cr.height > ch - 2 * pad) {
        const wantTop = cr.top - mr.top + m.scrollTop - pad;
        m.scrollTop = Math.max(0, Math.min(wantTop, m.scrollHeight - ch));
        return false;
      }
      if (cr.bottom > mr.bottom - pad) {
        m.scrollTop += cr.bottom - mr.bottom + pad;
        return true;
      }
      if (cr.top < mr.top + pad) {
        m.scrollTop += cr.top - mr.top - pad;
        return true;
      }
      return false;
    };
    for (let i = 0; i < 24; i += 1) {
      if (!stepScroll()) break;
    }
    const maxTop = Math.max(0, m.scrollHeight - m.clientHeight);
    m.scrollTop = Math.max(0, Math.min(m.scrollTop, maxTop));
  });
  await page.waitForTimeout(180);
}

async function getExtId(context) {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  return sw.url().split('/')[2];
}

async function captureTwoPopupPanels() {
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
  await page.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
  await syncViewportToPopupDoc(page);
  await injectDemoStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);
  const captureSize = await syncViewportToPopupDoc(page);
  await applyCaptureScrollbarVisibility(page);

  const main = page.locator('main');
  await main.waitFor({ state: 'visible' });
  const metrics = await main.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }));
  const maxScroll = Math.max(0, metrics.scrollHeight - metrics.clientHeight);

  await scrollMainInstant(page, main, 0);
  await scrollMainToFitCurrentDomainCard(page, main);
  await page.waitForTimeout(BEFORE_CAPTURE_MS + Math.floor(Math.random() * 80));
  await page.screenshot({ path: popupPanel1Path });

  if (maxScroll <= 0) {
    fs.copyFileSync(popupPanel1Path, popupPanel2Path);
  } else {
    await scrollMainLikeHuman(page, main, maxScroll);
    await page.waitForTimeout(BEFORE_CAPTURE_MS + Math.floor(Math.random() * 120));
    await page.screenshot({ path: popupPanel2Path });
  }

  await page.close();
  await context.close();
  return { captureSize, paths: [popupPanel1Path, popupPanel2Path] };
}

function writeMockupHtml(basenames, captureSize) {
  const framePadX = 40 * 2;
  const flexGap = 12;
  const gapsBetweenThree = flexGap * 2;
  const separatorW = 24;
  const innerRow =
    MARKETING_VIEWPORT.width - framePadX - gapsBetweenThree - separatorW;
  const perShotMaxW = Math.max(280, Math.floor(innerRow / 2));
  const perShotMaxH = 560;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Marketing mockup</title>
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
      padding: 20px 40px 48px;
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
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.72;
      mix-blend-mode: overlay;
    }
    .grain-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.28;
      mix-blend-mode: soft-light;
    }
    .vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      background: radial-gradient(ellipse 88% 78% at 50% 42%, transparent 35%, rgba(4,6,14,0.65) 100%);
    }
    .halftone {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.22;
      mix-blend-mode: soft-light;
      background-image: radial-gradient(rgba(226,232,240,0.55) 0.45px, transparent 0.55px);
      background-size: 4px 4px;
    }
    .banner-stack {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      width: 100%;
      max-width: ${MARKETING_VIEWPORT.width - framePadX}px;
      margin-left: auto;
      margin-right: auto;
      box-sizing: border-box;
    }
    .cta {
      text-align: center;
      max-width: 720px;
    }
    .cta-name {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: #f8fafc;
    }
    .cta-desc {
      margin-top: 12px;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.5;
      color: rgba(203,213,225,0.93);
    }
    .cta-pill {
      margin-top: 18px;
      display: inline-block;
      padding: 12px 24px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: #fff;
      text-decoration: none;
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%);
      box-shadow: 0 2px 10px rgba(37,99,235,0.45), 0 0 0 1px rgba(255,255,255,0.12);
    }
    .shots-row {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: center;
      flex-wrap: nowrap;
      gap: ${flexGap}px;
      padding: 6px 0 0;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .shot {
      flex: 0 1 auto;
      border-radius: 14px;
      overflow: hidden;
      max-width: ${perShotMaxW}px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.1),
        0 4px 12px rgba(0,0,0,0.2),
        0 24px 48px rgba(0,0,0,0.35);
    }
    .shot img {
      display: block;
      width: 100%;
      max-width: ${perShotMaxW}px;
      height: auto;
      max-height: ${perShotMaxH}px;
      object-fit: contain;
      object-position: bottom center;
      vertical-align: top;
    }
    .shot-label {
      display: block;
      margin-top: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(226,232,240,0.85);
      text-align: center;
    }
    .shot-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: ${perShotMaxW}px;
      max-width: ${perShotMaxW}px;
      flex: 0 0 ${perShotMaxW}px;
      min-width: 0;
    }
    .shots-separator {
      flex: 0 0 ${separatorW}px;
      width: ${separatorW}px;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 40px;
    }
    .shots-separator-line {
      width: 3px;
      height: 352px;
      border-radius: 3px;
      flex-shrink: 0;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(148,163,184,0.35) 15%,
        rgba(203,213,225,0.55) 50%,
        rgba(148,163,184,0.35) 85%,
        transparent 100%
      );
      box-shadow: 0 0 12px rgba(148,163,184,0.15);
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
    <div class="banner-stack">
      <div class="cta">
        <h2 class="cta-name">${BANNER_EXTENSION_NAME}</h2>
        <p class="cta-desc">${BANNER_CTA_DESCRIPTION}</p>
        <a class="cta-pill" href="${CHROME_WEB_STORE_ITEM_URL}">${BANNER_CTA_BUTTON}</a>
      </div>
      <div class="shots-row">
        <div class="shot-wrap">
          <div class="shot">
            <img src="${basenames[0]}" width="${captureSize.width}" height="${captureSize.height}" alt="Popup — top of list (domain settings)">
          </div>
          <span class="shot-label">Domain rules and status</span>
        </div>
        <div class="shots-separator" aria-hidden="true">
          <div class="shots-separator-line"></div>
        </div>
        <div class="shot-wrap">
          <div class="shot">
            <img src="${basenames[1]}" width="${captureSize.width}" height="${captureSize.height}" alt="Popup — scrolled (global settings)">
          </div>
          <span class="shot-label">Global settings</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(mockupPath, html, 'utf8');
}

async function captureMockup() {
  const context = await chromium.launchPersistentContext(path.join(os.tmpdir(), `pw-mockup-${Date.now()}`), {
    channel: 'chromium',
    headless: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.setViewportSize(MARKETING_VIEWPORT);
  await page.goto(pathToFileURL(mockupPath).href, { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width: MARKETING_VIEWPORT.width, height: MARKETING_VIEWPORT.height },
  });
  await context.close();
}

function cleanupTemps() {
  [popupPanel1Path, popupPanel2Path, mockupPath].forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

function cleanupScreenshotTempArtifacts() {
  if (!fs.existsSync(docsDir)) return;
  fs.readdirSync(docsDir)
    .filter(
      (f) =>
        f === '_popup-capture.png' ||
        f === '_popup-panel-1.png' ||
        f === '_popup-panel-2.png' ||
        /^_popup-content-\d+\.png$/.test(f)
    )
    .forEach((f) => fs.unlinkSync(path.join(docsDir, f)));
  if (fs.existsSync(mockupPath)) fs.unlinkSync(mockupPath);
}

async function main() {
  console.log('Capturing two 800×600-style panels (top + scrolled bottom)...');
  const { captureSize, paths } = await captureTwoPopupPanels();
  console.log('Each panel', captureSize.width, '×', captureSize.height);
  console.log('Building banner (two panels side by side)...');
  writeMockupHtml(paths.map((p) => path.basename(p)), captureSize);
  console.log('Capturing mockup...');
  await captureMockup();
  cleanupTemps();
  console.log('Screenshot saved to', outPath);
}

main().catch((err) => {
  cleanupScreenshotTempArtifacts();
  throw err;
});
