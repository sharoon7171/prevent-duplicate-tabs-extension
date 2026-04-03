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
  ReviewPrompt,
} from '@/components';
import { storageService } from '@/services/storage';
import type { ExtensionSettings } from '@/types/settings';
import { getCurrentTabsCount } from '@/utils/statistics';
import '../styles/register-poppins';
import '../styles/index.css';

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
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-white">
      <Header 
        title="Prevent Duplicate Tabs"
        subtitle="Extension configuration"
        stats={{ currentTabsCount, tabsClosedCount }}
      />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:px-4">
          <ReviewPrompt variant="options" enabled={settings.enabled} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-3">
              <CurrentDomainSettings initialSettings={settings} />
              <ExtensionStatus initialEnabled={settings.enabled} />
              <GlobalSettings initialGlobalSettings={settings.globalSettings} />
            </div>
            <div className="flex flex-col">
              <Exceptions initialExceptions={settings.exceptions} />
            </div>
          </div>
          <SiteSpecificRules initialSiteRules={settings.siteRules} />
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

