import React, { useState, useEffect, useMemo } from 'react';
import type { DuplicateAction, SiteRule } from '@/types/settings';
import { Toggle } from './Toggle';
import { RadioGroup } from './RadioGroup';
import { Input } from './Input';
import { Button } from './Button';
import { storageService } from '@/services/storage';
import { gradientBarClass } from '@/ui-classes/gradient-bar';

interface SiteSpecificRulesProps {
  rules?: SiteRule[];
  className?: string;
  initialSiteRules?: SiteRule[];
}

const DUPLICATE_ACTION_OPTIONS = [
  { value: 'close-new-stay-current', label: 'Close new duplicate tab and stay on current tab' },
  { value: 'close-old-stay-current', label: 'Close old duplicate and stay on current tab' },
  { value: 'close-new-switch-existing', label: 'Close new duplicate tab and switch to existing tab' },
  { value: 'close-old-switch-new', label: 'Close old duplicate and switch to new tab' },
] as const;

export const SiteSpecificRules: React.FC<SiteSpecificRulesProps> = ({
  rules: propRules,
  className = '',
  initialSiteRules,
}: SiteSpecificRulesProps): React.JSX.Element => {
  const [siteRules, setSiteRules] = useState<SiteRule[]>(initialSiteRules ?? propRules ?? []);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());
  const [editingDomainIndex, setEditingDomainIndex] = useState<number | null>(null);
  const [editingDomainValue, setEditingDomainValue] = useState<string>('');
  const [newRule, setNewRule] = useState<SiteRule>({
    domain: '',
    duplicateAction: 'close-new-stay-current',
    ignoreParameters: false,
  });

  const toggleRuleExpansion = (index: number): void => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRules(newExpanded);
  };

  const filteredRules = useMemo(() => {
    if (!searchValue.trim()) {
      return siteRules.map((rule, index) => ({ rule, originalIndex: index }));
    }
    const searchLower = searchValue.toLowerCase();
    return siteRules
      .map((rule, index) => ({ rule, originalIndex: index }))
      .filter(({ rule }) => rule.domain.toLowerCase().includes(searchLower));
  }, [siteRules, searchValue]);

  useEffect(() => {
    if (initialSiteRules === undefined) {
      storageService.getSettings().then((settings) => {
        setSiteRules(settings.siteRules);
      });
    }

    const unsubscribe = storageService.subscribe((settings) => {
      setSiteRules(settings.siteRules);
    });

    return (): void => {
      unsubscribe();
    };
  }, [initialSiteRules]);

  const handleAddRule = async (): Promise<void> => {
    if (newRule.domain.trim()) {
      const updatedRules = [...siteRules, { ...newRule, domain: newRule.domain.trim() }];
      setSiteRules(updatedRules);
      await storageService.updateSettings({ siteRules: updatedRules });
      setNewRule({ domain: '', duplicateAction: 'close-new-stay-current', ignoreParameters: false });
      setShowAddForm(false);
    }
  };

  const handleDomainInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRule().catch((error) => {
        console.error('Error adding rule:', error);
      });
    }
  };

  const handleUpdateRule = async (index: number, updatedRule: SiteRule): Promise<void> => {
    const updatedRules = [...siteRules];
    updatedRules[index] = updatedRule;
    setSiteRules(updatedRules);
    await storageService.updateSettings({ siteRules: updatedRules });
  };

  const handleRemoveRule = async (index: number): Promise<void> => {
    const updatedRules = siteRules.filter((_, i) => i !== index);
    setSiteRules(updatedRules);
    await storageService.updateSettings({ siteRules: updatedRules });
  };

  const handleDomainEditStart = (index: number, domain: string): void => {
    setEditingDomainIndex(index);
    setEditingDomainValue(domain);
  };

  const handleDomainEditCancel = (): void => {
    setEditingDomainIndex(null);
    setEditingDomainValue('');
  };

  const handleDomainEditSave = async (index: number): Promise<void> => {
    if (editingDomainValue.trim()) {
      const normalizedDomain = editingDomainValue.trim().toLowerCase();
      const isDuplicate = siteRules.some((rule, idx) =>
        idx !== index && rule.domain.toLowerCase() === normalizedDomain
      );

      if (!isDuplicate) {
        const updatedRules = [...siteRules];
        const existingRule = updatedRules[index];
        if (existingRule) {
          updatedRules[index] = {
            domain: normalizedDomain,
            duplicateAction: existingRule.duplicateAction,
            ignoreParameters: existingRule.ignoreParameters,
          };
          setSiteRules(updatedRules);
          await storageService.updateSettings({ siteRules: updatedRules });
        }
      }
    }
    setEditingDomainIndex(null);
    setEditingDomainValue('');
  };

  const handleDomainKeyDown = (e: React.KeyboardEvent, index: number): void => {
    if (e.key === 'Enter') {
      handleDomainEditSave(index).catch((error) => {
        console.error('Error saving domain edit:', error);
      });
    } else if (e.key === 'Escape') {
      handleDomainEditCancel();
    }
  };

  return (
    <div 
      className={`relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-white to-slate-50 p-2.5 shadow-card transition-all duration-300 hover:border-gray-300 hover:shadow-lg sm:p-3 ${className}`}
    >
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-blue-200 bg-white shadow-md">
          <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black leading-tight text-black sm:text-xl">
            Site-Specific Rules
          </h2>
          {siteRules.length > 0 && (
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-extrabold text-white shadow-md sm:text-sm">
              {siteRules.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <p className="mb-2 text-sm font-semibold leading-snug text-gray-700 sm:text-base">
          Override global settings for specific domains
        </p>

        {!showAddForm ? (
          <Button variant="dashed" onClick={(): void => setShowAddForm(true)} className="mb-2 w-full">
            + Add New Rule
          </Button>
        ) : (
          <div className="mb-2 rounded-xl border border-gray-200 bg-linear-to-br from-white to-slate-50 p-3 shadow-card-sm transition-all duration-200 hover:shadow-md">
            <div className="space-y-2">
              <Input
                label="Domain"
                placeholder="example.com"
                value={newRule.domain}
                onChange={(value): void => setNewRule({ ...newRule, domain: value })}
                onKeyDown={handleDomainInputKeyDown}
              />
              <div className="p-2.5 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-sm bg-linear-to-br from-white to-slate-50">
                <RadioGroup
                  label="When duplicate tab detected"
                  value={newRule.duplicateAction}
                  options={DUPLICATE_ACTION_OPTIONS}
                  onChange={(value): void => setNewRule({ ...newRule, duplicateAction: value as DuplicateAction })}
                />
              </div>
              <div className="rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-sm bg-linear-to-br from-white to-slate-50">
                <Toggle
                  label="Ignore URL parameters"
                  description="Match URLs without query parameters (?id=123, etc.)"
                  checked={newRule.ignoreParameters}
                  onChange={(checked): void => setNewRule({ ...newRule, ignoreParameters: checked })}
                  interactiveRow
                  className="w-full p-2.5"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleAddRule} className="flex-1">
                  Add Rule
                </Button>
                <Button
                  variant="secondary"
                  onClick={(): void => {
                    setShowAddForm(false);
                    setNewRule({ domain: '', duplicateAction: 'close-new-stay-current', ignoreParameters: false });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {siteRules.length > 0 && (
          <div className="mb-2">
            <Input
              placeholder="Search rules..."
              value={searchValue}
              onChange={setSearchValue}
            />
          </div>
        )}

        <div className="flex flex-col">
          {filteredRules.length > 0 && (
            <div className="space-y-2 overflow-y-auto max-h-[520px] pr-2">
              {filteredRules.map(({ rule, originalIndex }) => {
                const isExpanded = expandedRules.has(originalIndex);
                const isEditingDomain = editingDomainIndex === originalIndex;
                
                return (
                  <div
                    key={`${rule.domain}-${originalIndex}`}
                    className="border border-gray-200 rounded-xl shrink-0 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 shadow-card-sm bg-linear-to-br from-white to-slate-50"
                  >
                    <div className="flex items-center justify-between p-2.5 transition-colors duration-200"
                      style={{ cursor: isEditingDomain ? 'default' : 'pointer' }}
                      onClick={(): void => {
                        if (!isEditingDomain) {
                          toggleRuleExpansion(originalIndex);
                        }
                      }}
                    >
                      {isEditingDomain ? (
                        <>
                          <input
                            type="text"
                            value={editingDomainValue}
                            onChange={(e): void => setEditingDomainValue(e.target.value)}
                            onKeyDown={(e): void => handleDomainKeyDown(e, originalIndex)}
                            className="flex-1 min-w-0 px-3 py-2 border-2 border-blue-300 rounded-lg shadow-sm focus:outline-none focus:border-brand text-sm font-medium text-gray-900 bg-white mr-2"
                            autoFocus
                            onClick={(e): void => e.stopPropagation()}
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              color="success"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleDomainEditSave(originalIndex).catch((error) => {
                                  console.error('Error saving domain edit:', error);
                                });
                              }}
                              className="px-2"
                              title="Save (Enter)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              color="muted"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleDomainEditCancel();
                              }}
                              className="px-2"
                              title="Cancel (Esc)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 
                            className="flex-1 min-w-0 break-all text-sm font-bold text-gray-900 sm:text-base"
                            title={rule.domain}
                            style={{ wordBreak: 'break-all' }}
                          >
                            {rule.domain}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              color="brand"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleDomainEditStart(originalIndex, rule.domain);
                              }}
                              className="px-2"
                              title="Edit domain"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              color="danger"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleRemoveRule(originalIndex).catch((error) => {
                                  console.error('Error removing rule:', error);
                                });
                              }}
                            >
                              Remove
                            </Button>
                        <button
                          type="button"
                          onClick={(e): void => {
                            e.stopPropagation();
                            toggleRuleExpansion(originalIndex);
                          }}
                          className="text-gray-600 hover:text-gray-800 focus:outline-none transition-colors duration-200"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                        </>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="space-y-1.5 border-t border-gray-200 px-2.5 pb-2 pt-2">
                        <div className="p-2.5 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm bg-linear-to-br from-white to-slate-50">
                          <RadioGroup
                            label="When duplicate tab detected"
                            value={rule.duplicateAction}
                            options={DUPLICATE_ACTION_OPTIONS}
                            onChange={(value): void => {
                              handleUpdateRule(originalIndex, { ...rule, duplicateAction: value as DuplicateAction }).catch((error) => {
                                console.error('Error updating rule:', error);
                              });
                            }}
                          />
                        </div>
                        <div className="rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm bg-linear-to-br from-white to-slate-50">
                          <Toggle
                            label="Ignore URL parameters"
                            description="Match URLs without query parameters (?id=123, etc.)"
                            checked={rule.ignoreParameters}
                            onChange={(checked): void => {
                              handleUpdateRule(originalIndex, { ...rule, ignoreParameters: checked }).catch((error) => {
                                console.error('Error updating rule:', error);
                              });
                            }}
                            interactiveRow
                            className="w-full p-2.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {siteRules.length === 0 && !showAddForm && (
            <div className="flex flex-1 flex-col justify-center py-6 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 sm:text-base">
                No site-specific rules configured
              </p>
            </div>
          )}

          {siteRules.length > 0 && filteredRules.length === 0 && (
            <div className="flex flex-1 flex-col justify-center py-6 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 sm:text-base">
                No rules match your search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
