import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Header,
  ExtensionStatus,
  GlobalSettings,
  CurrentDomainSettings,
  Exceptions,
  SiteSpecificRules,
  Loading,
  Footer,
} from '@/components';
import { storageService } from '@/services/storage';
import type { ExtensionSettings } from '@/types/settings';
import { getCurrentTabsCount } from '@/utils/statistics';
import '../styles/main.css';

const Options: React.FC = (): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [currentTabsCount, setCurrentTabsCount] = useState<number>(0);
  const [tabsClosedCount, setTabsClosedCount] = useState<number>(0);

  useEffect(() => {
    storageService.initializeChangeListener();

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

    const unsubscribeSettings = storageService.subscribe((updatedSettings) => {
      setSettings(updatedSettings);
    });

    const unsubscribeStatistics = storageService.subscribeStatistics((statistics) => {
      setTabsClosedCount(statistics.tabsClosedCount);
    });

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

  if (isLoading || !settings) {
    return <Loading title="Prevent Duplicate Tabs" subtitle="Extension configuration" isPopup={false} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header 
        title="Prevent Duplicate Tabs"
        subtitle="Extension configuration"
        stats={{ currentTabsCount, tabsClosedCount }}
      />
      <main className="flex-1">
      <div className="max-w-6xl mx-auto px-3 py-5 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5 lg:items-stretch">
          <div className="flex flex-col space-y-4 lg:h-full">
            <CurrentDomainSettings initialSettings={settings} />
            <ExtensionStatus initialEnabled={settings.enabled} />
            <div className="flex-1">
              <GlobalSettings initialGlobalSettings={settings.globalSettings} />
            </div>
          </div>

          <div className="flex flex-col lg:h-full">
            <Exceptions initialExceptions={settings.exceptions} />
          </div>
        </div>

        <div className="mb-5">
          <SiteSpecificRules initialSiteRules={settings.siteRules} />
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
};

const container: HTMLElement | null = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}

