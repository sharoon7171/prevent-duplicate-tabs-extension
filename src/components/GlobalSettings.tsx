import React, { useState, useEffect } from 'react';
import type { DuplicateAction } from '@/types/settings';
import { RadioGroup } from './RadioGroup';
import { Toggle } from './Toggle';
import { storageService } from '@/services/storage';
import { gradientBarClass } from '@/ui-classes/gradient-bar';

interface GlobalSettingsProps {
  duplicateAction?: DuplicateAction;
  ignoreParameters?: boolean;
  className?: string;
  initialGlobalSettings?: {
    duplicateAction: DuplicateAction;
    ignoreParameters: boolean;
  };
}

const DUPLICATE_ACTION_OPTIONS = [
  { value: 'close-new-stay-current', label: 'Close new duplicate tab and stay on current tab' },
  { value: 'close-old-stay-current', label: 'Close old duplicate and stay on current tab' },
  { value: 'close-new-switch-existing', label: 'Close new duplicate tab and switch to existing tab' },
  { value: 'close-old-switch-new', label: 'Close old duplicate and switch to new tab' },
] as const;

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
    if (initialGlobalSettings === undefined) {
      storageService.getSettings().then((settings) => {
        setDuplicateActionState(settings.globalSettings.duplicateAction);
        setIgnoreParametersState(settings.globalSettings.ignoreParameters);
      });
    }

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
    const current = await storageService.getSettings();
    await storageService.updateSettings({
      globalSettings: {
        ...current.globalSettings,
        duplicateAction: action,
        ignoreParameters: ignoreParametersState,
      },
    });
  };

  const handleIgnoreParametersChange = async (checked: boolean): Promise<void> => {
    setIgnoreParametersState(checked);
    const current = await storageService.getSettings();
    await storageService.updateSettings({
      globalSettings: {
        ...current.globalSettings,
        duplicateAction: duplicateActionState,
        ignoreParameters: checked,
      },
    });
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-white to-slate-50 p-2.5 shadow-card transition-all duration-300 hover:border-gray-300 hover:shadow-lg sm:p-3 ${className}`}
    >
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-blue-200 bg-white shadow-md">
          <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-black leading-tight text-black sm:text-xl">
          Global Settings
        </h2>
      </div>
      <div className="space-y-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
          <RadioGroup
            label="When duplicate tab detected"
            value={duplicateActionState}
            options={DUPLICATE_ACTION_OPTIONS}
            onChange={handleDuplicateActionChange}
          />
          <p className="ml-0 mt-1.5 text-sm font-medium leading-snug text-gray-600">
            Choose how to handle duplicate tabs
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50">
          <Toggle
            label="Ignore URL parameters"
            description="Match URLs without query parameters (?id=123, etc.)"
            checked={ignoreParametersState}
            onChange={handleIgnoreParametersChange}
            interactiveRow
            className="w-full p-2.5"
          />
        </div>
      </div>
    </div>
  );
};
