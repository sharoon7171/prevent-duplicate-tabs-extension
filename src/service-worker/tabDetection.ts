/** Detects duplicate tabs and applies extension settings (exceptions, site rules, actions). */

import type { ExtensionSettings, DuplicateAction } from '@/types/settings';
import { storageService } from '@/services/storage';
import { normalizeUrl, isUrlAllowedForDuplicateCheck, extractDomain } from '@/utils/urlNormalization';

class TabDetectionService {
  private isInitialized: boolean = false;
  private currentSettings: ExtensionSettings | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  /** Tabs currently in process to avoid re-entrancy/races. */
  private processingTabs: Set<number> = new Set();
  private bypassTabIds: Set<number> = new Set();
  private bypassCreateCount = 0;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.currentSettings = await storageService.getSettings();
    this.unsubscribeSettings = storageService.subscribe((settings) => {
      this.currentSettings = settings;
    });
    storageService.initializeChangeListener();

    chrome.tabs.onCreated.addListener((tab) => {
      this.applyBypassForNewTab(tab.id);
      this.handleTabCreated(tab.id).catch((error) => {
        console.error('Error handling tab creation:', error);
      });
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.bypassTabIds.delete(tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url || (changeInfo.status === 'complete' && tab.url)) {
        this.handleTabUpdated(tabId, tab).catch((error) => {
          console.error('Error handling tab update:', error);
        });
      }
    });

    this.isInitialized = true;
  }

  async openTabAllowingDuplicate(url: string): Promise<void> {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return;
      }
    } catch {
      return;
    }

    this.bypassCreateCount += 1;
    await chrome.tabs.create({ url, active: true });
  }

  private applyBypassForNewTab(tabId: number | undefined): void {
    if (tabId === undefined || this.bypassCreateCount <= 0) {
      return;
    }
    this.bypassCreateCount -= 1;
    this.bypassTabIds.add(tabId);
  }

  private isBypassTab(tabId: number | undefined): boolean {
    return tabId !== undefined && this.bypassTabIds.has(tabId);
  }

  private async handleTabCreated(tabId: number | undefined): Promise<void> {
    if (tabId === undefined) {
      return;
    }

    try {
      const tab = await chrome.tabs.get(tabId);
      await this.processTab(tab, tabId);
    } catch (error) {
      if (chrome.runtime.lastError) {
        return;
      }
      console.error('Error getting tab:', error);
    }
  }

  private async handleTabUpdated(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    await this.processTab(tab, tabId);
  }

  private async processTab(tab: chrome.tabs.Tab, tabId: number): Promise<void> {
    if (this.isBypassTab(tabId)) {
      return;
    }
    if (!this.currentSettings?.enabled) {
      return;
    }
    if (this.processingTabs.has(tabId)) {
      return;
    }
    if (!tab.url) {
      return;
    }

    // Exceptions override site rules and global settings.
    if (isUrlAllowedForDuplicateCheck(tab.url, this.currentSettings.exceptions, this.currentSettings.domainExceptions)) {
      return;
    }

    const domain = extractDomain(tab.url);
    const siteRule = domain
      ? this.currentSettings.siteRules.find((rule) => rule.domain === domain)
      : undefined;

    const ignoreParameters = siteRule?.ignoreParameters ?? this.currentSettings.globalSettings.ignoreParameters;
    const duplicateAction = siteRule?.duplicateAction ?? this.currentSettings.globalSettings.duplicateAction;
    const duplicateScope = this.currentSettings.globalSettings.duplicateScope;
    const scopeWindowId = duplicateScope === 'current-window' && tab.windowId !== undefined ? tab.windowId : undefined;

    const normalizedUrl = normalizeUrl(tab.url, ignoreParameters);
    if (!normalizedUrl) {
      return;
    }

    this.processingTabs.add(tabId);

    try {
      const duplicateTabs = await this.findDuplicateTabs(tab.url, tabId, ignoreParameters, scopeWindowId);

      if (duplicateTabs.length > 0) {
        const existingTab = duplicateTabs[0];
        if (existingTab) {
          await this.handleDuplicate(
            tabId,
            existingTab,
            duplicateAction
          );
        }
      }
    } finally {
      this.processingTabs.delete(tabId);
    }
  }

  private async findDuplicateTabs(
    url: string,
    excludeTabId: number,
    ignoreParameters: boolean,
    scopeWindowId?: number
  ): Promise<chrome.tabs.Tab[]> {
    try {
      const queryOptions = scopeWindowId !== undefined ? { windowId: scopeWindowId } : {};
      const allTabs = await chrome.tabs.query(queryOptions);
      const normalizedUrl = normalizeUrl(url, ignoreParameters);

      if (!normalizedUrl) {
        return [];
      }

      return allTabs.filter((tab) => {
        if (tab.id === excludeTabId) {
          return false;
        }
        if (!tab.url) {
          return false;
        }
        const tabNormalizedUrl = normalizeUrl(tab.url, ignoreParameters);
        return tabNormalizedUrl === normalizedUrl;
      });
    } catch (error) {
      console.error('Error finding duplicate tabs:', error);
      return [];
    }
  }

  private async handleDuplicate(
    newTabId: number,
    existingTab: chrome.tabs.Tab,
    action: DuplicateAction
  ): Promise<void> {
    const existingTabId = existingTab.id;
    if (existingTabId === undefined) {
      return;
    }

    const closeTabAndMaybeWindow = async (tabId: number): Promise<void> => {
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      const windowId = tab?.windowId;
      await chrome.tabs.remove(tabId);
      await storageService.incrementTabsClosedCount();
      if (windowId !== undefined) {
        const remaining = await chrome.tabs.query({ windowId });
        if (remaining.length === 0) {
          await chrome.windows.remove(windowId).catch(() => {});
        }
      }
    };

    try {
      switch (action) {
        case 'close-new-stay-current':
          await closeTabAndMaybeWindow(newTabId);
          break;

        case 'close-old-stay-current': {
          const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTabId = currentTabs[0]?.id;

          await closeTabAndMaybeWindow(existingTabId);

          if (currentTabId === existingTabId && newTabId) {
            await chrome.tabs.update(newTabId, { active: true });
          }
          break;
        }

        case 'close-new-switch-existing':
          await closeTabAndMaybeWindow(newTabId);
          if (existingTab.windowId !== undefined) {
            await chrome.windows.update(existingTab.windowId, { focused: true }).catch(() => {});
          }
          await chrome.tabs.update(existingTabId, { active: true });
          break;

        case 'close-old-switch-new':
          await closeTabAndMaybeWindow(existingTabId);
          const newTab = await chrome.tabs.get(newTabId).catch(() => null);
          if (newTab?.windowId !== undefined) {
            await chrome.windows.update(newTab.windowId, { focused: true }).catch(() => {});
          }
          await chrome.tabs.update(newTabId, { active: true });
          break;

        default:
          console.warn('Unknown duplicate action:', action);
      }
    } catch (error) {
      if (chrome.runtime.lastError) {
        return;
      }
      console.error('Error handling duplicate:', error);
    }
  }

  cleanup(): void {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    this.processingTabs.clear();
    this.bypassTabIds.clear();
    this.bypassCreateCount = 0;
    this.isInitialized = false;
  }
}

export const tabDetectionService = new TabDetectionService();

