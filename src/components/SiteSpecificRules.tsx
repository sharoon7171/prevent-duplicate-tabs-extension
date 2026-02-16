import React, { useState, useEffect, useMemo } from 'react';
import type { SiteSpecificRulesProps, SiteRule } from '@/types/components';
import type { DuplicateAction } from '@/types/settings';
import { Toggle } from './Toggle';
import { RadioGroup } from './RadioGroup';
import { Input } from './Input';
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
 * Modern site-specific rules component with improved layout
 * Allows configuring custom settings for specific domains
 * 
 * @param props - SiteSpecificRules component properties
 * @returns JSX.Element
 */
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

  // Filter rules based on search input
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
    // Load initial settings if not provided
    if (initialSiteRules === undefined) {
      storageService.getSettings().then((settings) => {
        setSiteRules(settings.siteRules);
      });
    }

    // Subscribe to storage changes
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
      // Normalize domain (trim and lowercase)
      const normalizedDomain = editingDomainValue.trim().toLowerCase();
      
      // Check if normalized domain already exists (and it's not the current rule being edited)
      const isDuplicate = siteRules.some((rule, idx) => 
        idx !== index && rule.domain.toLowerCase() === normalizedDomain
      );

      if (!isDuplicate) {
        const updatedRules = [...siteRules];
        // Update domain while preserving other rule settings
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
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md border-2 border-blue-200">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-black">
            Site-Specific Rules
          </h2>
          {siteRules.length > 0 && (
            <span className="px-3 py-1 text-white text-xs font-bold rounded-full shadow-md"
              style={{
                backgroundColor: '#3182ce',
              }}
            >
              {siteRules.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <p className="text-sm font-semibold text-gray-600 mb-3">
          Override global settings for specific domains
        </p>

        {!showAddForm ? (
          <button
            type="button"
            onClick={(): void => setShowAddForm(true)}
            className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 focus:outline-none transition-all duration-200 mb-3"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            }}
          >
            + Add New Rule
          </button>
        ) : (
          <div className="border border-gray-200 rounded-xl p-4 mb-3 shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="space-y-3">
              <Input
                label="Domain"
                placeholder="example.com"
                value={newRule.domain}
                onChange={(value): void => setNewRule({ ...newRule, domain: value })}
                onKeyDown={handleDomainInputKeyDown}
              />
              <div className="p-2.5 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                }}
              >
                <RadioGroup
                  label="When duplicate tab detected"
                  value={newRule.duplicateAction}
                  options={DUPLICATE_ACTION_OPTIONS}
                  onChange={(value): void => setNewRule({ ...newRule, duplicateAction: value as DuplicateAction })}
                />
              </div>
              <div className="p-2.5 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                }}
              >
                <Toggle
                  label="Ignore URL parameters"
                  checked={newRule.ignoreParameters}
                  onChange={(checked): void => setNewRule({ ...newRule, ignoreParameters: checked })}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="flex-1 px-4 py-2 text-white text-sm font-bold rounded-xl focus:outline-none transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  style={{
                    backgroundColor: '#3182ce',
                  }}
                  onMouseEnter={(e): void => {
                    e.currentTarget.style.backgroundColor = '#2c5aa0';
                  }}
                  onMouseLeave={(e): void => {
                    e.currentTarget.style.backgroundColor = '#3182ce';
                  }}
                >
                  Add Rule
                </button>
                <button
                  type="button"
                  onClick={(): void => {
                    setShowAddForm(false);
                    setNewRule({ domain: '', duplicateAction: 'close-new-stay-current', ignoreParameters: false });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 focus:outline-none transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Input */}
        {siteRules.length > 0 && (
          <div className="mb-3">
            <Input
              placeholder="Search rules..."
              value={searchValue}
              onChange={setSearchValue}
            />
          </div>
        )}

        {/* Scrollable Rules List */}
        <div className="flex flex-col flex-1 min-h-0">
          {filteredRules.length > 0 && (
            <div className="space-y-2 overflow-y-auto max-h-[520px] pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
              {filteredRules.map(({ rule, originalIndex }) => {
                const isExpanded = expandedRules.has(originalIndex);
                const isEditingDomain = editingDomainIndex === originalIndex;
                
                return (
                  <div
                    key={`${rule.domain}-${originalIndex}`}
                    className="border border-gray-200 rounded-xl shrink-0 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between p-3 transition-colors duration-200"
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
                            className="flex-1 min-w-0 px-3 py-2 border-2 border-blue-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 bg-white mr-2"
                            autoFocus
                            onClick={(e): void => e.stopPropagation()}
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleDomainEditSave(originalIndex).catch((error) => {
                                  console.error('Error saving domain edit:', error);
                                });
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 text-sm font-bold focus:outline-none rounded-lg px-2 py-1.5 transition-all duration-200"
                              title="Save (Enter)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleDomainEditCancel();
                              }}
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 text-sm font-bold focus:outline-none rounded-lg px-2 py-1.5 transition-all duration-200"
                              title="Cancel (Esc)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 
                            className="text-sm font-semibold text-gray-800 flex-1 min-w-0 break-all"
                            title={rule.domain}
                            style={{ wordBreak: 'break-all' }}
                          >
                            {rule.domain}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleDomainEditStart(originalIndex, rule.domain);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-bold focus:outline-none rounded-lg px-2 py-1.5 transition-all duration-200"
                              title="Edit domain"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e): void => {
                                e.stopPropagation();
                                handleRemoveRule(originalIndex).catch((error) => {
                                  console.error('Error removing rule:', error);
                                });
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-bold focus:outline-none rounded-lg px-3 py-1.5 transition-all duration-200"
                            >
                              Remove
                            </button>
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
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-3">
                        <div className="p-2.5 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          }}
                        >
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
                        <div className="p-2.5 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          }}
                        >
                          <Toggle
                            label="Ignore URL parameters"
                            checked={rule.ignoreParameters}
                            onChange={(checked): void => {
                              handleUpdateRule(originalIndex, { ...rule, ignoreParameters: checked }).catch((error) => {
                                console.error('Error updating rule:', error);
                              });
                            }}
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
            <div className="text-center py-8 flex flex-col justify-center flex-1">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                No site-specific rules configured
              </p>
            </div>
          )}

          {siteRules.length > 0 && filteredRules.length === 0 && (
            <div className="text-center py-8 flex flex-col justify-center flex-1">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                No rules match your search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

