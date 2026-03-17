import type { SiteRule } from './components';

export type DuplicateAction =
  | 'close-new-stay-current'
  | 'close-old-stay-current'
  | 'close-new-switch-existing'
  | 'close-old-switch-new';

export interface ExtensionSettings {
  enabled: boolean;
  globalSettings: {
    duplicateAction: DuplicateAction;
    ignoreParameters: boolean;
  };
  /** Page-level exceptions (exact URL); domainExceptions are whole-domain. */
  exceptions: string[];
  domainExceptions: string[];
  siteRules: SiteRule[];
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  globalSettings: {
    duplicateAction: 'close-new-stay-current',
    ignoreParameters: false,
  },
  exceptions: [],
  domainExceptions: [],
  siteRules: [],
};

export const SETTINGS_STORAGE_KEY = 'extensionSettings';

export interface StatisticsData {
  tabsClosedCount: number;
}

export const DEFAULT_STATISTICS: StatisticsData = {
  tabsClosedCount: 0,
};

export const STATISTICS_STORAGE_KEY = 'extensionStatistics';

