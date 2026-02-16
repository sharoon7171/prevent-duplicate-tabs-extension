/**
 * Extension settings types
 * Centralized type definitions for all extension settings
 */

import type { SiteRule } from './components';

/**
 * Duplicate action types
 * Defines how the extension handles duplicate tabs
 */
export type DuplicateAction =
  | 'close-new-stay-current'
  | 'close-old-stay-current'
  | 'close-new-switch-existing'
  | 'close-old-switch-new';

/**
 * Complete extension settings structure
 */
export interface ExtensionSettings {
  /** Whether the extension is enabled */
  enabled: boolean;
  /** Global settings */
  globalSettings: {
    /** Action to take when duplicate detected */
    duplicateAction: DuplicateAction;
    /** Ignore URL parameters when matching */
    ignoreParameters: boolean;
  };
  /** List of exception URLs (specific pages only) that allow duplicates */
  exceptions: string[];
  /** List of exception domains (whole domain) that allow duplicates */
  domainExceptions: string[];
  /** Site-specific rules that override global settings */
  siteRules: SiteRule[];
}

/**
 * Default extension settings
 */
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

/**
 * Storage key for extension settings
 */
export const SETTINGS_STORAGE_KEY = 'extensionSettings';

/**
 * Extension statistics data structure
 */
export interface StatisticsData {
  /** Total number of tabs closed by the extension */
  tabsClosedCount: number;
}

/**
 * Default statistics data
 */
export const DEFAULT_STATISTICS: StatisticsData = {
  tabsClosedCount: 0,
};

/**
 * Storage key for extension statistics
 */
export const STATISTICS_STORAGE_KEY = 'extensionStatistics';

