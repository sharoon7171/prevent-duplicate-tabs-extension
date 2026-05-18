import { tabDetectionService } from './tabDetection';

const MENU_ID = 'open-tab-allow-duplicate';
const MENU_TITLE = 'Open in new tab (allow duplicate)';

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function createContextMenu(): void {
  chrome.contextMenus.create(
    {
      id: MENU_ID,
      title: MENU_TITLE,
      contexts: ['link'],
    },
    () => {
      void chrome.runtime.lastError;
    }
  );
}

export function initializeContextMenu(): void {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
      createContextMenu();
    });
  });

  createContextMenu();

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== MENU_ID) {
      return;
    }
    if (!info.linkUrl || !isHttpUrl(info.linkUrl)) {
      return;
    }
    void tabDetectionService.openTabAllowingDuplicate(info.linkUrl);
  });
}
