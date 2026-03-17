import React, { useState, useEffect } from 'react';
import { Toggle } from './Toggle';
import { storageService } from '@/services/storage';

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
      className={`relative overflow-hidden rounded-xl border shadow-card p-3 sm:p-4 transition-all duration-300 flex flex-col hover:shadow-lg bg-linear-to-br from-white to-slate-50 ${isEnabled ? 'border-emerald-200' : 'border-gray-200'} ${className}`}
    >
      <div className="gradient-bar rounded-t-xl" />
      <div className="flex items-center justify-between flex-1">
        <div className="flex-1">
          <h3 className="text-base font-black text-black mb-0.5">
            Extension Status
          </h3>
          <p className={`text-xs font-semibold ${isEnabled ? 'text-emerald-700' : 'text-gray-600'}`}>
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
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-sm font-semibold text-black">
            All windows
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
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
