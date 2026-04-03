#!/usr/bin/env node
/**
 * Capture extension options page in exact 1280×800 chunks (demo data injected).
 * Run: npm run screenshot
 * Output: docs/screenshot-options.png, screenshot-options-2.png, ... (each 1280×800)
 */
import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const VIEWPORT = { width: 1280, height: 800 };

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

if (!fs.existsSync(extPath)) {
  console.error('Run npm run build first. dist/ not found.');
  process.exit(1);
}
fs.mkdirSync(docsDir, { recursive: true });

const userDataDir = path.join(os.tmpdir(), `pde-screenshot-${Date.now()}`);

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
          dismissed: false,
          snoozeUntil: null,
        }),
      });
    },
    { settings: DEMO_SETTINGS, stats: DEMO_STATS }
  );
}

async function getExtId(context) {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  return sw.url().split('/')[2];
}

async function captureAll() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
    ],
  });
  const extId = await getExtId(context);
  const page = await context.newPage();
  await page.setViewportSize(VIEWPORT);
  await page.goto(`chrome-extension://${extId}/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);
  await injectDemoStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);

  const outputs = [];

  const totalHeight = await page.evaluate(() => Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  ));
  const chunkHeight = VIEWPORT.height;
  const count = Math.ceil(totalHeight / chunkHeight);

  for (let i = 0; i < count; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * chunkHeight);
    await page.waitForTimeout(300);
    const name = i === 0 ? 'screenshot-options.png' : `screenshot-options-${i + 1}.png`;
    const outPath = path.join(docsDir, name);
    await page.screenshot({ path: outPath });
    outputs.push(outPath);
  }

  await page.close();
  await context.close();
  return outputs;
}

console.log('Capturing options page in 1280×800 chunks...');
const outputs = await captureAll();
outputs.forEach((p) => console.log('Screenshot saved to', p));
