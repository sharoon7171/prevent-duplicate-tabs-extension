import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Header,
  ExtensionStatus,
  GlobalSettings,
  CurrentDomainSettings,
  Loading,
  Footer,
  ReviewPrompt,
} from '@/components';
import { storageService } from '@/services/storage';
import type { ExtensionSettings } from '@/types/settings';
import { getCurrentTabsCount } from '@/utils/statistics';
import '../styles/register-poppins';
import '../styles/index.css';

const Popup: React.FC = (): React.JSX.Element => {
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
    return <Loading title="Prevent Duplicate Tabs" subtitle="Extension settings" isPopup={true} />;
  }

  return (
    <div className="h-full min-h-0 min-w-[480px] max-w-[520px] flex flex-col overflow-hidden bg-slate-50">
      <Header 
        title="Prevent Duplicate Tabs"
        subtitle="Extension settings"
        stats={{ currentTabsCount, tabsClosedCount }}
      />
      <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        <div className="px-3 py-3 space-y-3 flex-1 min-h-0">
          <ReviewPrompt
            variant="popup"
            enabled={settings.enabled}
            tabsClosedCount={tabsClosedCount}
          />
          <ExtensionStatus initialEnabled={settings.enabled} />
          <CurrentDomainSettings initialSettings={settings} />
          <GlobalSettings initialGlobalSettings={settings.globalSettings} />
        </div>
      </main>
      <Footer variant="popup" />
    </div>
  );
};

const container: HTMLElement | null = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

