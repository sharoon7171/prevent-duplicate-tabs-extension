import React, { useState, useEffect } from 'react';
import type { GlobalSettingsProps } from '@/types/components';
import type { DuplicateAction } from '@/types/settings';
import { RadioGroup } from './RadioGroup';
import { Toggle } from './Toggle';
import { storageService } from '@/services/storage';

/**
 * Duplicate action options for the radio group
 */
const DUPLICATE_ACTION_OPTIONS = [
  { value: 'close-new-stay-current', label: 'Close new duplicate tab and stay on current tab' },
  { value: 'close-old-stay-current', label: 'Close old duplicate and stay on current tab' },
  { value: 'close-new-switch-existing', label: 'Close new duplicate tab and switch to existing tab' },
  { value: 'close-old-switch-new', label: 'Close old duplicate and switch to new tab' },
] as const;

/**
 * Modern global settings component with improved layout
 * Displays global extension settings with toggle switches
 *
 * @param props - GlobalSettings component properties
 * @returns React.JSX.Element
 */
export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  duplicateAction: propDuplicateAction,
  ignoreParameters: propIgnoreParameters,
  className = '',
  initialGlobalSettings,
}: GlobalSettingsProps): React.JSX.Element => {
  const [duplicateActionState, setDuplicateActionState] = useState<DuplicateAction>(
    initialGlobalSettings?.duplicateAction ?? propDuplicateAction ?? 'close-new-stay-current'
  );
  const [ignoreParametersState, setIgnoreParametersState] = useState<boolean>(
    initialGlobalSettings?.ignoreParameters ?? propIgnoreParameters ?? false
  );

  useEffect(() => {
    // Load initial settings if not provided
    if (initialGlobalSettings === undefined) {
      storageService.getSettings().then((settings) => {
        setDuplicateActionState(settings.globalSettings.duplicateAction);
        setIgnoreParametersState(settings.globalSettings.ignoreParameters);
      });
    }

    // Subscribe to storage changes
    const unsubscribe = storageService.subscribe((settings) => {
      setDuplicateActionState(settings.globalSettings.duplicateAction);
      setIgnoreParametersState(settings.globalSettings.ignoreParameters);
    });

    return (): void => {
      unsubscribe();
    };
  }, [initialGlobalSettings]);

  const handleDuplicateActionChange = async (value: string): Promise<void> => {
    const action = value as DuplicateAction;
    setDuplicateActionState(action);
    await storageService.updateSettings({
      globalSettings: {
        duplicateAction: action,
        ignoreParameters: ignoreParametersState,
      },
    });
  };

  const handleIgnoreParametersChange = async (checked: boolean): Promise<void> => {
    setIgnoreParametersState(checked);
    await storageService.updateSettings({
      globalSettings: {
        duplicateAction: duplicateActionState,
        ignoreParameters: checked,
      },
    });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 shadow-md p-3 sm:p-4 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-300 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Colorful accent stripe */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #3182ce 0%, #38a169 50%, #e53e3e 100%)',
          borderRadius: '12px 12px 0 0',
        }}
      />
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md border-2 border-blue-200">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-black">
          Global Settings
        </h2>
      </div>
      <div className="space-y-4 flex-1">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <RadioGroup
            label="When duplicate tab detected"
            value={duplicateActionState}
            options={DUPLICATE_ACTION_OPTIONS}
            onChange={handleDuplicateActionChange}
          />
          <p className="text-xs font-medium text-gray-700 ml-0 mt-2">
            Choose how to handle duplicate tabs
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Toggle
            label="Ignore URL parameters"
            checked={ignoreParametersState}
            onChange={handleIgnoreParametersChange}
            className="mb-1"
          />
          <p className="text-xs font-medium text-gray-700 ml-0">
            Match URLs without query parameters (?id=123, etc.)
          </p>
        </div>
      </div>
    </div>
  );
};
