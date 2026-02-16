import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Header,
  ExtensionStatus,
  GlobalSettings,
  CurrentDomainSettings,
  Loading,
  Footer,
} from '@/components';
import { storageService } from '@/services/storage';
import type { ExtensionSettings } from '@/types/settings';
import { getCurrentTabsCount } from '@/utils/statistics';
import '../styles/main.css';

/**
 * Modern popup component optimized for small screens
 */
const Popup: React.FC = (): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [currentTabsCount, setCurrentTabsCount] = useState<number>(0);
  const [tabsClosedCount, setTabsClosedCount] = useState<number>(0);

  useEffect(() => {
    // Initialize storage change listener to detect changes from service worker
    storageService.initializeChangeListener();

    // Load settings once at component mount
    const loadData = async (): Promise<void> => {
      const [loadedSettings, statistics, tabsCount] = await Promise.all([
        storageService.getSettings(),
        storageService.getStatistics(),
        getCurrentTabsCount(),
      ]);

      setSettings(loadedSettings);
      setTabsClosedCount(statistics.tabsClosedCount);
      setCurrentTabsCount(tabsCount);
      setIsLoading(false);
    };

    loadData();

    // Subscribe to storage changes for real-time updates
    const unsubscribeSettings = storageService.subscribe((updatedSettings) => {
      setSettings(updatedSettings);
    });

    // Subscribe to statistics changes for real-time updates
    const unsubscribeStatistics = storageService.subscribeStatistics((statistics) => {
      setTabsClosedCount(statistics.tabsClosedCount);
    });

    // Listen for tab changes to update current tabs count
    const handleTabCreated = async (): Promise<void> => {
      const count = await getCurrentTabsCount();
      setCurrentTabsCount(count);
    };

    const handleTabRemoved = async (): Promise<void> => {
      const count = await getCurrentTabsCount();
      setCurrentTabsCount(count);
    };

    chrome.tabs.onCreated.addListener(handleTabCreated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);

    return (): void => {
      unsubscribeSettings();
      unsubscribeStatistics();
      chrome.tabs.onCreated.removeListener(handleTabCreated);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
    };
  }, []);

  // Show loading state while settings are being loaded
  if (isLoading || !settings) {
    return <Loading title="Prevent Duplicate Tabs" subtitle="Extension settings" isPopup={true} />;
  }

  return (
    <div className="min-w-[480px] max-w-[520px] flex flex-col" style={{ backgroundColor: '#f7fafc' }}>
      <Header 
        title="Prevent Duplicate Tabs"
        subtitle="Extension settings"
        stats={{ currentTabsCount, tabsClosedCount }}
      />
      <main className="flex-1 overflow-y-auto">
      <div className="px-3 py-3 space-y-3">
        {/* Extension Status */}
        <ExtensionStatus initialEnabled={settings.enabled} />
        
        {/* Current Domain Settings - on top when a domain is open */}
        <CurrentDomainSettings initialSettings={settings} />
        
        {/* Global Settings */}
        <GlobalSettings initialGlobalSettings={settings.globalSettings} />
      </div>
      </main>
      <Footer />
    </div>
  );
};

// Initialize React app
const container: HTMLElement | null = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

