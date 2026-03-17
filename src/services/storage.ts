/** Sync storage for settings and statistics; used by popup, options, and service worker. */

import type { ExtensionSettings, StatisticsData } from '@/types/settings';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, DEFAULT_STATISTICS, STATISTICS_STORAGE_KEY } from '@/types/settings';

type StorageListener = (settings: ExtensionSettings) => void;
type StatisticsListener = (statistics: StatisticsData) => void;

class StorageService {
  private listeners: Set<StorageListener> = new Set();
  private statisticsListeners: Set<StatisticsListener> = new Set();
  private changeListenerInitialized: boolean = false;

  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
      const stored = result[SETTINGS_STORAGE_KEY];
      if (typeof stored === 'string') {
        return this.parseSettings(stored);
      }
      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.error('Error reading settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };

      await chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: JSON.stringify(updated) });
      this.notifyListeners(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(settings: ExtensionSettings): void {
    this.listeners.forEach((listener) => {
      try {
        listener(settings);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  private parseSettings(stored: string): ExtensionSettings {
    try {
      const parsed = JSON.parse(stored) as Partial<ExtensionSettings>;
      return {
        enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
        globalSettings: {
          duplicateAction: parsed.globalSettings?.duplicateAction ?? DEFAULT_SETTINGS.globalSettings.duplicateAction,
          ignoreParameters: parsed.globalSettings?.ignoreParameters ?? DEFAULT_SETTINGS.globalSettings.ignoreParameters,
        },
        exceptions: parsed.exceptions ?? DEFAULT_SETTINGS.exceptions,
        domainExceptions: parsed.domainExceptions ?? DEFAULT_SETTINGS.domainExceptions,
        siteRules: parsed.siteRules ?? DEFAULT_SETTINGS.siteRules,
      };
    } catch (error) {
      console.error('Error parsing settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /** Keeps UI in sync when settings change in another tab or device. */
  initializeChangeListener(): void {
    if (this.changeListenerInitialized) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      if (changes[SETTINGS_STORAGE_KEY]) {
        const newValue = changes[SETTINGS_STORAGE_KEY].newValue;
        if (typeof newValue === 'string') this.notifyListeners(this.parseSettings(newValue));
      }
      if (changes[STATISTICS_STORAGE_KEY]) {
        const newValue = changes[STATISTICS_STORAGE_KEY].newValue;
        if (typeof newValue === 'string') this.notifyStatisticsListeners(this.parseStatistics(newValue));
      }
    });

    this.changeListenerInitialized = true;
  }

  async getStatistics(): Promise<StatisticsData> {
    try {
      const result = await chrome.storage.sync.get(STATISTICS_STORAGE_KEY);
      const stored = result[STATISTICS_STORAGE_KEY];
      if (typeof stored === 'string') {
        return this.parseStatistics(stored);
      }
      return { ...DEFAULT_STATISTICS };
    } catch (error) {
      console.error('Error reading statistics:', error);
      return { ...DEFAULT_STATISTICS };
    }
  }

  async incrementTabsClosedCount(): Promise<void> {
    try {
      const current = await this.getStatistics();
      const updated: StatisticsData = {
        tabsClosedCount: current.tabsClosedCount + 1,
      };

      await chrome.storage.sync.set({ [STATISTICS_STORAGE_KEY]: JSON.stringify(updated) });
      this.notifyStatisticsListeners(updated);
    } catch (error) {
      console.error('Error incrementing tabs closed count:', error);
      throw error;
    }
  }

  subscribeStatistics(listener: StatisticsListener): () => void {
    this.statisticsListeners.add(listener);
    return (): void => {
      this.statisticsListeners.delete(listener);
    };
  }

  private notifyStatisticsListeners(statistics: StatisticsData): void {
    this.statisticsListeners.forEach((listener) => {
      try {
        listener(statistics);
      } catch (error) {
        console.error('Error notifying statistics listener:', error);
      }
    });
  }

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

export const storageService = new StorageService();
