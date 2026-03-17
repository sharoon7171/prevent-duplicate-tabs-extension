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
      this.handleTabCreated(tab.id).catch((error) => {
        console.error('Error handling tab creation:', error);
      });
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

    const normalizedUrl = normalizeUrl(tab.url, ignoreParameters);
    if (!normalizedUrl) {
      return;
    }

    this.processingTabs.add(tabId);

    try {
      const duplicateTabs = await this.findDuplicateTabs(tab.url, tabId, ignoreParameters);

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
    ignoreParameters: boolean
  ): Promise<chrome.tabs.Tab[]> {
    try {
      const allTabs = await chrome.tabs.query({});
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

    try {
      switch (action) {
        case 'close-new-stay-current':
          await chrome.tabs.remove(newTabId);
          await storageService.incrementTabsClosedCount();
          break;

        case 'close-old-stay-current': {
          const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTabId = currentTabs[0]?.id;

          await chrome.tabs.remove(existingTabId);
          await storageService.incrementTabsClosedCount();

          if (currentTabId === existingTabId && newTabId) {
            await chrome.tabs.update(newTabId, { active: true });
          }
          break;
        }

        case 'close-new-switch-existing':
          await chrome.tabs.remove(newTabId);
          await storageService.incrementTabsClosedCount();
          await chrome.tabs.update(existingTabId, { active: true });
          break;

        case 'close-old-switch-new':
          await chrome.tabs.remove(existingTabId);
          await storageService.incrementTabsClosedCount();
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
    this.isInitialized = false;
  }
}

export const tabDetectionService = new TabDetectionService();

