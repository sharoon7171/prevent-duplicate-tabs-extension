/**
 * Statistics utility functions
 * Provides helper functions for getting real-time statistics data
 */

/**
 * Get current number of open tabs
 * @returns Promise resolving to the count of open tabs
 */
export async function getCurrentTabsCount(): Promise<number> {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs.length;
  } catch (error) {
    console.error('Error getting tabs count:', error);
    return 0;
  }
}

