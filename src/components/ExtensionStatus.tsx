import React, { useState, useEffect } from 'react';

import { Toggle } from './Toggle';
import { storageService } from '@/services/storage';
import { gradientBarClass } from '@/ui-classes/gradient-bar';
import { cardShell, cardShellTopRadius } from '@/ui-classes/layout';
import { textBody, textBodyBold, textCaption, textCardTitle } from '@/ui-classes/typography';
import type { DuplicateScope } from '@/types/settings';

interface ExtensionStatusProps {
  enabled?: boolean;
  className?: string;
  initialEnabled?: boolean;
}

export const ExtensionStatus: React.FC<ExtensionStatusProps> = ({
  enabled: propEnabled,
  initialEnabled,
  className = '',
}: ExtensionStatusProps): React.JSX.Element => {
  const [isEnabled, setIsEnabled] = useState<boolean>(initialEnabled ?? propEnabled ?? true);
  const [checkAllWindows, setCheckAllWindows] = useState<boolean>(true);

  useEffect(() => {
    storageService.getSettings().then((settings) => {
      setCheckAllWindows(settings.globalSettings.duplicateScope === 'all-windows');
      if (initialEnabled === undefined) setIsEnabled(settings.enabled);
    });

    const unsubscribe = storageService.subscribe((settings) => {
      setIsEnabled(settings.enabled);
      setCheckAllWindows(settings.globalSettings.duplicateScope === 'all-windows');
    });

    return (): void => {
      unsubscribe();
    };
  }, [initialEnabled]);

  const handleToggle = async (checked: boolean): Promise<void> => {
    setIsEnabled(checked);
    await storageService.updateSettings({ enabled: checked });
  };

  const handleScopeToggle = async (checked: boolean): Promise<void> => {
    const scope: DuplicateScope = checked ? 'all-windows' : 'current-window';
    setCheckAllWindows(checked);
    const current = await storageService.getSettings();
    await storageService.updateSettings({
      globalSettings: {
        ...current.globalSettings,
        duplicateScope: scope,
      },
    });
  };

  return (
    <div
      className={`${cardShell} hover:shadow-lg ${isEnabled ? 'border-emerald-200' : ''} ${className}`}
    >
      <div className={`${gradientBarClass} ${cardShellTopRadius}`} />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex-1">
          <h3 className={`mb-0.5 ${textCardTitle}`}>Extension Status</h3>
          <p className={`${textCaption} ${isEnabled ? 'text-emerald-700' : ''}`}>
            {isEnabled ? 'Active and monitoring tabs' : 'Disabled'}
          </p>
        </div>
        <Toggle label="" checked={isEnabled} onChange={handleToggle} className="ml-2" />
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-gray-200 pt-1.5">
        <div className="min-w-0 flex-1 pr-2">
          <p className={textBodyBold}>All windows</p>
          <p className={`mt-0.5 ${textBody}`}>When off, only the current window is checked</p>
        </div>
        <Toggle label="" checked={checkAllWindows} onChange={handleScopeToggle} className="shrink-0" />
      </div>
    </div>
  );
};
