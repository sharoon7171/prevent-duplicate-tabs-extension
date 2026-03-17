import React, { useState, useEffect } from 'react';
import type { ExtensionStatusProps } from '@/types/components';
import { Toggle } from './Toggle';
import { storageService } from '@/services/storage';

export const ExtensionStatus: React.FC<ExtensionStatusProps> = ({
  enabled: propEnabled,
  initialEnabled,
  className = '',
}: ExtensionStatusProps): React.JSX.Element => {
  const [isEnabled, setIsEnabled] = useState<boolean>(initialEnabled ?? propEnabled ?? true);

  useEffect(() => {
    if (initialEnabled === undefined) {
      storageService.getSettings().then((settings) => {
        setIsEnabled(settings.enabled);
      });
    }

    const unsubscribe = storageService.subscribe((settings) => {
      setIsEnabled(settings.enabled);
    });

    return (): void => {
      unsubscribe();
    };
  }, [initialEnabled]);

  const handleToggle = async (checked: boolean): Promise<void> => {
    setIsEnabled(checked);
    await storageService.updateSettings({ enabled: checked });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-md p-3 sm:p-4 transition-all duration-300 flex flex-col hover:shadow-lg ${isEnabled ? 'border-emerald-200' : 'border-gray-200'} ${className}`}
      style={{
        background: isEnabled
          ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #3182ce 0%, #38a169 50%, #e53e3e 100%)',
          borderRadius: '12px 12px 0 0',
        }}
      />
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
    </div>
  );
};
