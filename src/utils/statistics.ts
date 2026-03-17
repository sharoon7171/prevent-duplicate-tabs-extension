export async function getCurrentTabsCount(): Promise<number> {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs.length;
  } catch (error) {
    console.error('Error getting tabs count:', error);
    return 0;
  }
}

