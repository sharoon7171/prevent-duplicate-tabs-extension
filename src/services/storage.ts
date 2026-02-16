/**
 * Storage service for extension settings
 * Provides unified API for localStorage operations
 * Works in both UI pages (popup/options) and service worker contexts
 */

import type { ExtensionSettings, DuplicateAction, StatisticsData } from '@/types/settings';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, DEFAULT_STATISTICS, STATISTICS_STORAGE_KEY } from '@/types/settings';

type StorageListener = (settings: ExtensionSettings) => void;
type StatisticsListener = (statistics: StatisticsData) => void;

/**
 * Storage service class
 * Uses chrome.storage.local for instant updates and sync compatibility
 */
class StorageService {
  private listeners: Set<StorageListener> = new Set();
  private statisticsListeners: Set<StatisticsListener> = new Set();
  private changeListenerInitialized: boolean = false;

  /**
   * Get current settings from storage
   */
  async getSettings(): Promise<ExtensionSettings> {
    try {
      // Use chrome.storage.local in both contexts for sync compatibility
      const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
      const stored = result[SETTINGS_STORAGE_KEY];
      if (stored) {
        return this.parseSettings(stored);
      }
      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.error('Error reading settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Update settings in storage
   */
  async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };

      // Use chrome.storage.local in both contexts for instant updates and sync compatibility
      await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: JSON.stringify(updated) });

      // Notify listeners immediately for instant UI updates
      this.notifyListeners(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifyListeners(settings: ExtensionSettings): void {
    this.listeners.forEach((listener) => {
      try {
        listener(settings);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  /**
   * Migrate old settings format to new format
   * Handles migration from switchToOriginal boolean to duplicateAction enum
   */
  private migrateSettings(parsed: Partial<ExtensionSettings> & { globalSettings?: { switchToOriginal?: boolean } }): ExtensionSettings {
    let duplicateAction: DuplicateAction = DEFAULT_SETTINGS.globalSettings.duplicateAction;

    // Migrate from old boolean format
    if (parsed.globalSettings?.switchToOriginal !== undefined) {
      duplicateAction = parsed.globalSettings.switchToOriginal
        ? 'close-new-switch-existing'
        : 'close-new-stay-current';
    } else if (parsed.globalSettings?.duplicateAction) {
      duplicateAction = parsed.globalSettings.duplicateAction;
    }

    return {
      enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
      globalSettings: {
        duplicateAction,
        ignoreParameters: parsed.globalSettings?.ignoreParameters ?? DEFAULT_SETTINGS.globalSettings.ignoreParameters,
      },
      exceptions: parsed.exceptions ?? DEFAULT_SETTINGS.exceptions,
      domainExceptions: parsed.domainExceptions ?? DEFAULT_SETTINGS.domainExceptions,
      siteRules: (parsed.siteRules ?? DEFAULT_SETTINGS.siteRules).map((rule) => {
        // Migrate site rules from old format
        if ('switchToOriginal' in rule && typeof rule.switchToOriginal === 'boolean') {
          return {
            domain: rule.domain,
            duplicateAction: rule.switchToOriginal
              ? 'close-new-switch-existing'
              : 'close-new-stay-current',
            ignoreParameters: rule.ignoreParameters ?? false,
          };
        }
        return rule;
      }),
    };
  }

  /**
   * Parse settings from stored JSON string
   */
  private parseSettings(stored: string): ExtensionSettings {
    try {
      const parsed = JSON.parse(stored) as Partial<ExtensionSettings> & { globalSettings?: { switchToOriginal?: boolean } };
      return this.migrateSettings(parsed);
    } catch (error) {
      console.error('Error parsing settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Initialize storage change listener
   * This allows real-time updates when storage changes from other contexts
   * Should be called once in UI pages to detect changes from service worker
   */
  initializeChangeListener(): void {
    if (this.changeListenerInitialized) {
      return;
    }

    // Listen for chrome.storage.local changes (works in both UI and service worker)
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        // Handle settings changes
        if (changes[SETTINGS_STORAGE_KEY]) {
        const newValue = changes[SETTINGS_STORAGE_KEY].newValue;
        if (newValue) {
          const settings = this.parseSettings(newValue);
          this.notifyListeners(settings);
          }
        }
        // Handle statistics changes
        if (changes[STATISTICS_STORAGE_KEY]) {
          const newValue = changes[STATISTICS_STORAGE_KEY].newValue;
          if (newValue) {
            const statistics = this.parseStatistics(newValue);
            this.notifyStatisticsListeners(statistics);
          }
        }
      }
    });

    this.changeListenerInitialized = true;
  }

  /**
   * Get current statistics from storage
   */
  async getStatistics(): Promise<StatisticsData> {
    try {
      const result = await chrome.storage.local.get(STATISTICS_STORAGE_KEY);
      const stored = result[STATISTICS_STORAGE_KEY];
      if (stored) {
        return this.parseStatistics(stored);
      }
      return { ...DEFAULT_STATISTICS };
    } catch (error) {
      console.error('Error reading statistics:', error);
      return { ...DEFAULT_STATISTICS };
    }
  }

  /**
   * Increment tabs closed count
   */
  async incrementTabsClosedCount(): Promise<void> {
    try {
      const current = await this.getStatistics();
      const updated: StatisticsData = {
        tabsClosedCount: current.tabsClosedCount + 1,
      };

      await chrome.storage.local.set({ [STATISTICS_STORAGE_KEY]: JSON.stringify(updated) });

      // Notify statistics listeners immediately for instant UI updates
      this.notifyStatisticsListeners(updated);
    } catch (error) {
      console.error('Error incrementing tabs closed count:', error);
      throw error;
    }
  }

  /**
   * Subscribe to statistics changes
   */
  subscribeStatistics(listener: StatisticsListener): () => void {
    this.statisticsListeners.add(listener);

    // Return unsubscribe function
    return (): void => {
      this.statisticsListeners.delete(listener);
    };
  }

  /**
   * Notify all statistics listeners of changes
   */
  private notifyStatisticsListeners(statistics: StatisticsData): void {
    this.statisticsListeners.forEach((listener) => {
      try {
        listener(statistics);
      } catch (error) {
        console.error('Error notifying statistics listener:', error);
      }
    });
  }

  /**
   * Parse statistics from stored JSON string
   */
  private parseStatistics(stored: string): StatisticsData {
    try {
      const parsed = JSON.parse(stored) as Partial<StatisticsData>;
      return {
        tabsClosedCount: parsed.tabsClosedCount ?? DEFAULT_STATISTICS.tabsClosedCount,
      };
    } catch (error) {
      console.error('Error parsing statistics:', error);
      return { ...DEFAULT_STATISTICS };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
