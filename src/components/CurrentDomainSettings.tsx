import React, { useState, useEffect } from 'react';
import type { CurrentDomainSettingsProps } from '@/types/components';
import { Toggle } from './Toggle';
import { RadioGroup } from './RadioGroup';
import { storageService } from '@/services/storage';
import type { ExtensionSettings, DuplicateAction } from '@/types/settings';
import { normalizeException, isPageInExceptions, isDomainInExceptions } from '@/utils/urlNormalization';

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
      className={`relative overflow-hidden rounded-xl border border-gray-200 shadow-md p-3 sm:p-4 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-300 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
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
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md border-2 border-blue-200">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-black">
            Current Domain
          </h2>
          <p className="text-xs font-semibold text-gray-600 mt-0.5 truncate" title={currentUrl}>
            {currentDomain}
          </p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Exceptions
          </h3>
          <div className="p-3 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
            <Toggle
              label="Allow duplicates for this page"
              checked={isPageInExceptionsList}
              onChange={handleUrlExceptionToggle}
              className="mb-1"
            />
            <p className="text-xs font-medium text-gray-700 ml-0">
              Allow duplicate tabs for this specific page
            </p>
          </div>
          <div className="p-3 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
            <Toggle
              label="Allow duplicates for this domain"
              checked={isDomainInExceptionsList}
              onChange={handleDomainExceptionToggle}
              className="mb-1"
            />
            <p className="text-xs font-medium text-gray-700 ml-0">
              Allow duplicate tabs for all pages on {currentDomain}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Site-Specific Rules
            </h3>
            {hasSiteRule && (
              <button
                type="button"
                onClick={handleRemoveSiteRule}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-all duration-200"
              >
                Remove Rule
              </button>
            )}
          </div>
          
          
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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
              <p className="text-xs font-medium text-gray-700 ml-0 mt-2">
                Choose how to handle duplicate tabs for this domain
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Toggle
                label="Ignore URL parameters"
                checked={currentIgnoreParameters}
                onChange={(checked): void => {
                  handleCreateOrUpdateSiteRule({ ignoreParameters: checked }).catch((error) => {
                    console.error('Error updating site rule:', error);
                  });
                }}
                className="mb-1"
              />
              <p className="text-xs font-medium text-gray-700 ml-0">
                Match URLs without query parameters (?id=123, etc.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

