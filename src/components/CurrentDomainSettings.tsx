import React, { useState, useEffect } from 'react';
import { Toggle } from './Toggle';
import { RadioGroup } from './RadioGroup';
import { Button } from './Button';
import { storageService } from '@/services/storage';
import type { ExtensionSettings, DuplicateAction } from '@/types/settings';
import { normalizeException, isPageInExceptions, isDomainInExceptions } from '@/utils/urlNormalization';
import { gradientBarClass } from '@/ui-classes/gradient-bar';

interface CurrentDomainSettingsProps {
  className?: string;
  initialSettings?: ExtensionSettings;
}

const DUPLICATE_ACTION_OPTIONS = [
  { value: 'close-new-stay-current', label: 'Close new duplicate tab and stay on current tab' },
  { value: 'close-old-stay-current', label: 'Close old duplicate and stay on current tab' },
  { value: 'close-new-switch-existing', label: 'Close new duplicate tab and switch to existing tab' },
  { value: 'close-old-switch-new', label: 'Close old duplicate and switch to new tab' },
] as const;

export const CurrentDomainSettings: React.FC<CurrentDomainSettingsProps> = ({
  initialSettings,
  className = '',
}: CurrentDomainSettingsProps): React.JSX.Element | null => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(initialSettings ?? null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialSettings === undefined) {
      storageService.getSettings().then((loadedSettings) => {
        setSettings(loadedSettings);
      });
    }

    const unsubscribe = storageService.subscribe((updatedSettings) => {
      setSettings(updatedSettings);
    });

    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = tabs[0].url;
          const urlObj = new URL(url);

          if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            setCurrentUrl(url);
            setCurrentDomain(urlObj.hostname);
          } else {
            setCurrentUrl(null);
            setCurrentDomain(null);
          }
        } catch (error) {
          setCurrentUrl(null);
          setCurrentDomain(null);
        }
      } else {
        setCurrentUrl(null);
        setCurrentDomain(null);
      }
      setIsLoading(false);
    }).catch(() => {
      setCurrentUrl(null);
      setCurrentDomain(null);
      setIsLoading(false);
    });

    return (): void => {
      unsubscribe();
    };
  }, [initialSettings]);

  if (isLoading || !settings || !currentUrl || !currentDomain) {
    return null;
  }

  const isPageInExceptionsList = currentUrl ? isPageInExceptions(currentUrl, settings.exceptions) : false;
  const isDomainInExceptionsList = currentDomain ? isDomainInExceptions(currentDomain, settings.domainExceptions) : false;
  const currentSiteRule = settings.siteRules.find((rule) => rule.domain === currentDomain);
  const hasSiteRule = currentSiteRule !== undefined;

  const currentDuplicateAction: DuplicateAction = currentSiteRule?.duplicateAction ?? settings.globalSettings.duplicateAction;
  const currentIgnoreParameters: boolean = currentSiteRule?.ignoreParameters ?? settings.globalSettings.ignoreParameters;

  const handleUrlExceptionToggle = async (checked: boolean): Promise<void> => {
    if (!settings || !currentUrl) return;

    const normalizedUrl = normalizeException(currentUrl);

    const updatedExceptions = checked
      ? [...settings.exceptions, normalizedUrl].filter((item, index, arr) => arr.indexOf(item) === index)
      : settings.exceptions.filter((item) => {
          const normalizedItem = normalizeException(item);
          return normalizedItem !== normalizedUrl && item !== currentUrl;
        });

    await storageService.updateSettings({ exceptions: updatedExceptions });
  };

  const handleDomainExceptionToggle = async (checked: boolean): Promise<void> => {
    if (!settings || !currentDomain) return;

    const normalizedDomain = normalizeException(currentDomain);

    const updatedDomainExceptions = checked
      ? [...settings.domainExceptions, normalizedDomain].filter((item, index, arr) => arr.indexOf(item) === index)
      : settings.domainExceptions.filter((item) => {
          const normalizedItem = normalizeException(item);
          return normalizedItem !== normalizedDomain && item !== currentDomain;
        });

    await storageService.updateSettings({ domainExceptions: updatedDomainExceptions });
  };

  const handleCreateOrUpdateSiteRule = async (updates: { duplicateAction?: DuplicateAction; ignoreParameters?: boolean }): Promise<void> => {
    if (!settings || !currentDomain) return;

    const existingRule = settings.siteRules.find((rule) => rule.domain === currentDomain);
    const currentDuplicateAction = existingRule?.duplicateAction ?? settings.globalSettings.duplicateAction;
    const currentIgnoreParameters = existingRule?.ignoreParameters ?? settings.globalSettings.ignoreParameters;

    if (existingRule) {
      const updatedRules = settings.siteRules.map((rule) =>
        rule.domain === currentDomain ? { ...rule, ...updates } : rule
      );
      await storageService.updateSettings({ siteRules: updatedRules });
    } else {
      const newRule = {
        domain: currentDomain,
        duplicateAction: updates.duplicateAction ?? currentDuplicateAction,
        ignoreParameters: updates.ignoreParameters ?? currentIgnoreParameters,
      };
      await storageService.updateSettings({ siteRules: [...settings.siteRules, newRule] });
    }
  };

  const handleRemoveSiteRule = async (): Promise<void> => {
    if (!settings) return;

    const updatedRules = settings.siteRules.filter((rule) => rule.domain !== currentDomain);
    await storageService.updateSettings({ siteRules: updatedRules });
  };

  return (
    <div 
      className={`relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-white to-slate-50 p-2.5 shadow-card transition-all duration-300 hover:border-gray-300 hover:shadow-lg sm:p-3 ${className}`}
    >
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-blue-200 bg-white shadow-md">
          <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black leading-tight text-black sm:text-xl">
            Current Domain
          </h2>
          <p className="mt-0.5 truncate text-sm font-semibold text-gray-600" title={currentUrl}>
            {currentDomain}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-2">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 sm:text-xs">
            Exceptions
          </h3>
          <div className="rounded-lg border-2 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50">
            <Toggle
              label="Allow duplicates for this page"
              description="Allow duplicate tabs for this specific page"
              checked={isPageInExceptionsList}
              onChange={handleUrlExceptionToggle}
              interactiveRow
              className="w-full p-2.5"
            />
          </div>
          <div className="rounded-lg border-2 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50">
            <Toggle
              label="Allow duplicates for this domain"
              description={`Allow duplicate tabs for all pages on ${currentDomain}`}
              checked={isDomainInExceptionsList}
              onChange={handleDomainExceptionToggle}
              interactiveRow
              className="w-full p-2.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 sm:text-xs">
              Site-Specific Rules
            </h3>
            {hasSiteRule && (
              <Button variant="ghost" color="danger" onClick={handleRemoveSiteRule} className="text-xs px-2 py-1">
                Remove Rule
              </Button>
            )}
          </div>
          
          
          <div className="space-y-1.5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
              <RadioGroup
                label="When duplicate tab detected"
                value={currentDuplicateAction}
                options={DUPLICATE_ACTION_OPTIONS}
                onChange={(value): void => {
                  handleCreateOrUpdateSiteRule({ duplicateAction: value as DuplicateAction }).catch((error) => {
                    console.error('Error updating site rule:', error);
                  });
                }}
              />
              <p className="ml-0 mt-1.5 text-sm font-medium leading-snug text-gray-600">
                Choose how to handle duplicate tabs for this domain
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50">
              <Toggle
                label="Ignore URL parameters"
                description="Match URLs without query parameters (?id=123, etc.)"
                checked={currentIgnoreParameters}
                onChange={(checked): void => {
                  handleCreateOrUpdateSiteRule({ ignoreParameters: checked }).catch((error) => {
                    console.error('Error updating site rule:', error);
                  });
                }}
                interactiveRow
                className="w-full p-2.5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
