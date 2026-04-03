import React, { useState, useEffect } from 'react';
import { Toggle } from './Toggle';
import { storageService } from '@/services/storage';
import { gradientBarClass } from '@/ui-classes/gradient-bar';
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
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-linear-to-br from-white to-slate-50 p-2.5 shadow-card transition-all duration-300 hover:shadow-lg sm:p-3 ${isEnabled ? 'border-emerald-200' : 'border-gray-200'} ${className}`}
    >
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <div className="flex items-center justify-between flex-1">
        <div className="flex-1">
          <h3 className="mb-0.5 text-lg font-black leading-tight text-black sm:text-xl">
            Extension Status
          </h3>
          <p className={`text-sm font-semibold leading-snug ${isEnabled ? 'text-emerald-700' : 'text-gray-600'}`}>
            {isEnabled ? 'Active and monitoring tabs' : 'Disabled'}
          </p>
        </div>
        <Toggle
          label=""
          checked={isEnabled}
          onChange={handleToggle}
          className="ml-3"
        />
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-base font-bold text-gray-900">
            All windows
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-gray-600">
            When off, only the current window is checked
          </p>
        </div>
        <Toggle
          label=""
          checked={checkAllWindows}
          onChange={handleScopeToggle}
          className="shrink-0"
        />
      </div>
    </div>
  );
};
