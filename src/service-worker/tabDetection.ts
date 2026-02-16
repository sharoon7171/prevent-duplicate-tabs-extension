/**
 * Tab detection and prevention service
 * Monitors browser tabs and prevents duplicates based on extension settings
 */

import type { ExtensionSettings, DuplicateAction } from '@/types/settings';
import { storageService } from '@/services/storage';
import { normalizeUrl, isUrlAllowedForDuplicateCheck, extractDomain } from '@/utils/urlNormalization';

/**
 * Tab detection service class
 * Handles duplicate tab detection and prevention
 */
class TabDetectionService {
  private isInitialized: boolean = false;
  private currentSettings: ExtensionSettings | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private processingTabs: Set<number> = new Set(); // Track tabs being processed to avoid race conditions

  /**
   * Initialize the tab detection service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load initial settings
    this.currentSettings = await storageService.getSettings();

    // Subscribe to settings changes
    this.unsubscribeSettings = storageService.subscribe((settings) => {
      this.currentSettings = settings;
    });

    // Initialize storage change listener for service worker context
    storageService.initializeChangeListener();

    // Set up tab event listeners
    chrome.tabs.onCreated.addListener((tab) => {
      this.handleTabCreated(tab.id).catch((error) => {
        console.error('Error handling tab creation:', error);
      });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Only process when URL changes or tab becomes complete
      if (changeInfo.url || (changeInfo.status === 'complete' && tab.url)) {
        this.handleTabUpdated(tabId, tab).catch((error) => {
          console.error('Error handling tab update:', error);
        });
      }
    });

    this.isInitialized = true;
  }

  /**
   * Handle tab creation event
   */
  private async handleTabCreated(tabId: number | undefined): Promise<void> {
    if (tabId === undefined) {
      return;
    }

    // Get tab details
    try {
      const tab = await chrome.tabs.get(tabId);
      await this.processTab(tab, tabId);
    } catch (error) {
      // Tab might have been closed or can't be accessed
      if (chrome.runtime.lastError) {
        // Silently ignore - tab was likely closed quickly
        return;
      }
      console.error('Error getting tab:', error);
    }
  }

  /**
   * Handle tab update event
   */
  private async handleTabUpdated(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    await this.processTab(tab, tabId);
  }

  /**
   * Process a tab for duplicate detection
   */
  private async processTab(tab: chrome.tabs.Tab, tabId: number): Promise<void> {
    // Check if extension is enabled
    if (!this.currentSettings?.enabled) {
      return;
    }

    // Check if tab is already being processed
    if (this.processingTabs.has(tabId)) {
      return;
    }

    // Skip if tab doesn't have a URL or is invalid
    if (!tab.url) {
      return;
    }

    // Check exceptions FIRST - highest priority (before site-specific rules and other checks)
    if (isUrlAllowedForDuplicateCheck(tab.url, this.currentSettings.exceptions, this.currentSettings.domainExceptions)) {
      return;
    }

    // Extract domain to check for site-specific rules
    const domain = extractDomain(tab.url);
    
    // Find site-specific rule for this domain, if any
    const siteRule = domain
      ? this.currentSettings.siteRules.find((rule) => rule.domain === domain)
      : undefined;

    // Use site-specific settings if available, otherwise use global settings
    const ignoreParameters = siteRule?.ignoreParameters ?? this.currentSettings.globalSettings.ignoreParameters;
    const duplicateAction = siteRule?.duplicateAction ?? this.currentSettings.globalSettings.duplicateAction;

    // Skip if URL is not accessible (chrome://, extension pages, etc.)
    const normalizedUrl = normalizeUrl(tab.url, ignoreParameters);
    if (!normalizedUrl) {
      return;
    }

    // Mark tab as being processed
    this.processingTabs.add(tabId);

    try {
      // Find duplicate tabs
      const duplicateTabs = await this.findDuplicateTabs(tab.url, tabId, ignoreParameters);

      if (duplicateTabs.length > 0) {
        const existingTab = duplicateTabs[0];
        if (existingTab) {
          // Handle duplicate based on action
          await this.handleDuplicate(
            tabId,
            existingTab,
            duplicateAction
          );
        }
      }
    } finally {
      // Remove from processing set
      this.processingTabs.delete(tabId);
    }
  }

  /**
   * Find duplicate tabs based on normalized URL
   */
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
        // Exclude the current tab
        if (tab.id === excludeTabId) {
          return false;
        }

        // Skip tabs without URLs
        if (!tab.url) {
          return false;
        }

        // Compare normalized URLs
        const tabNormalizedUrl = normalizeUrl(tab.url, ignoreParameters);
        return tabNormalizedUrl === normalizedUrl;
      });
    } catch (error) {
      console.error('Error finding duplicate tabs:', error);
      return [];
    }
  }

  /**
   * Handle duplicate tab based on action type
   */
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
          // Close new tab, keep current tab active
          await chrome.tabs.remove(newTabId);
          await storageService.incrementTabsClosedCount();
          break;

        case 'close-old-stay-current': {
          // Close old duplicate, keep current tab active
          // Get current active tab
          const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTabId = currentTabs[0]?.id;

          await chrome.tabs.remove(existingTabId);
          await storageService.incrementTabsClosedCount();

          // If we closed the current tab, switch to the new one
          if (currentTabId === existingTabId && newTabId) {
            await chrome.tabs.update(newTabId, { active: true });
          }
          break;
        }

        case 'close-new-switch-existing':
          // Close new tab, switch to existing duplicate
          await chrome.tabs.remove(newTabId);
          await storageService.incrementTabsClosedCount();
          await chrome.tabs.update(existingTabId, { active: true });
          break;

        case 'close-old-switch-new':
          // Close old duplicate, switch to new tab
          await chrome.tabs.remove(existingTabId);
          await storageService.incrementTabsClosedCount();
          await chrome.tabs.update(newTabId, { active: true });
          break;

        default:
          console.warn('Unknown duplicate action:', action);
      }
    } catch (error) {
      // Handle errors gracefully - tab might have been closed already
      if (chrome.runtime.lastError) {
        // Silently ignore - tab was likely closed quickly
        return;
      }
      console.error('Error handling duplicate:', error);
    }
  }

  /**
   * Cleanup and stop listening
   */
  cleanup(): void {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    this.processingTabs.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const tabDetectionService = new TabDetectionService();

