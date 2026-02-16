/**
 * Background sync service
 * Real-time bidirectional synchronization between chrome.storage.local and chrome.storage.sync
 * Prevents sync loops by tracking sync source
 */

import type { ExtensionSettings } from '@/types/settings';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/types/settings';

/**
 * Flag to prevent sync loops
 * Tracks which storage area initiated the sync
 */
let isSyncing = false;
let syncSource: 'local' | 'sync' | null = null;

/**
 * Parse settings from stored JSON string
 */
function parseSettings(stored: string | undefined): ExtensionSettings {
  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const parsed = JSON.parse(stored) as Partial<ExtensionSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
      globalSettings: {
        ...DEFAULT_SETTINGS.globalSettings,
        ...parsed.globalSettings,
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

/**
 * Sync from local to sync storage
 */
async function syncLocalToSync(): Promise<void> {
  if (isSyncing && syncSource === 'local') {
    return; // Prevent loop
  }

  try {
    isSyncing = true;
    syncSource = 'local';

    const localData = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    const localValue = localData[SETTINGS_STORAGE_KEY];

    if (localValue) {
      await chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: localValue });
    }
  } catch (error) {
    console.error('Error syncing local to sync:', error);
  } finally {
    isSyncing = false;
    syncSource = null;
  }
}

/**
 * Sync from sync to local storage
 */
async function syncSyncToLocal(): Promise<void> {
  if (isSyncing && syncSource === 'sync') {
    return; // Prevent loop
  }

  try {
    isSyncing = true;
    syncSource = 'sync';

    const syncData = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
    const syncValue = syncData[SETTINGS_STORAGE_KEY];

    if (syncValue) {
      await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: syncValue });
    }
  } catch (error) {
    console.error('Error syncing sync to local:', error);
  } finally {
    isSyncing = false;
    syncSource = null;
  }
}

/**
 * Perform initial sync on startup
 * Loads from chrome.sync first (most recent), then merges with localStorage
 */
async function performInitialSync(): Promise<void> {
  try {
    const [localData, syncData] = await Promise.all([
      chrome.storage.local.get(SETTINGS_STORAGE_KEY),
      chrome.storage.sync.get(SETTINGS_STORAGE_KEY),
    ]);

    const localValue = localData[SETTINGS_STORAGE_KEY];
    const syncValue = syncData[SETTINGS_STORAGE_KEY];

    if (syncValue) {
      // Sync storage has data - prefer it (most recent/authoritative)
      if (localValue !== syncValue) {
        await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: syncValue });
      }
    } else if (localValue) {
      // Only local has data - sync to cloud
      await chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: localValue });
    }
  } catch (error) {
    console.error('Error performing initial sync:', error);
  }
}

/**
 * Initialize real-time bidirectional sync
 * Sets up listeners for both chrome.storage.local and chrome.storage.sync changes
 */
export function initializeSync(): void {
  // Perform initial sync on startup
  performInitialSync().catch((error) => {
    console.error('Error in initial sync:', error);
  });

  // Listen for chrome.storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (isSyncing) {
      return; // Skip if we're already syncing to prevent loops
    }

    // Only handle changes to our settings key
    if (!changes[SETTINGS_STORAGE_KEY]) {
      return;
    }

    if (areaName === 'local') {
      // Local storage changed - sync to chrome.sync
      syncLocalToSync().catch((error) => {
        console.error('Error syncing local to sync:', error);
      });
    } else if (areaName === 'sync') {
      // Sync storage changed - update local storage
      syncSyncToLocal().catch((error) => {
        console.error('Error syncing sync to local:', error);
      });
    }
  });
}

