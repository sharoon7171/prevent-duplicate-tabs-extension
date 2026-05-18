import React, { useState, useEffect, useMemo } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { storageService } from '@/services/storage';
import { normalizeException } from '@/utils/urlNormalization';
import { gradientBarClass } from '@/ui-classes/gradient-bar';
import { iconButtonSvg, inputInlineEdit } from '@/ui-classes/control';
import {
  cardHeaderRow,
  cardIconBoxAmber,
  cardIconSvg,
  cardShell,
  cardShellTopRadius,
  emptyStateIcon,
  emptyStateIconSvg,
  emptyStateWrap,
  listItemShell,
  scrollList,
} from '@/ui-classes/layout';
import { textBadge, textBodyBold, textCaption, textCardSubtitle, textCardTitle } from '@/ui-classes/typography';

interface ExceptionsProps {
  items?: string[];
  className?: string;
  initialExceptions?: string[];
}

export const Exceptions: React.FC<ExceptionsProps> = ({
  items: propItems,
  className = '',
  initialExceptions,
}: ExceptionsProps): React.JSX.Element => {
  const [exceptionItems, setExceptionItems] = useState<string[]>(initialExceptions ?? propItems ?? []);
  const [inputValue, setInputValue] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) {
      return exceptionItems;
    }
    const searchLower = searchValue.toLowerCase();
    return exceptionItems.filter((item) =>
      item.toLowerCase().includes(searchLower)
    );
  }, [exceptionItems, searchValue]);

  useEffect(() => {
    if (initialExceptions === undefined) {
      storageService.getSettings().then((settings) => {
        setExceptionItems(settings.exceptions);
      });
    }

    const unsubscribe = storageService.subscribe((settings) => {
      setExceptionItems(settings.exceptions);
    });

    return (): void => {
      unsubscribe();
    };
  }, [initialExceptions]);

  const handleAdd = async (): Promise<void> => {
    if (inputValue.trim()) {
      const normalizedException = normalizeException(inputValue.trim());

      if (!exceptionItems.includes(normalizedException)) {
        const newItems = [...exceptionItems, normalizedException];
        setExceptionItems(newItems);
        await storageService.updateSettings({ exceptions: newItems });
      }
      setInputValue('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd().catch((error) => {
        console.error('Error adding exception:', error);
      });
    }
  };

  const handleRemove = async (item: string): Promise<void> => {
    const newItems = exceptionItems.filter((i) => i !== item);
    setExceptionItems(newItems);
    await storageService.updateSettings({ exceptions: newItems });
  };

  const handleEditStart = (index: number, item: string): void => {
    setEditingIndex(index);
    setEditingValue(item);
  };

  const handleEditCancel = (): void => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleEditSave = async (index: number, oldValue: string): Promise<void> => {
    if (editingValue.trim()) {
      const normalizedException = normalizeException(editingValue.trim());
      const currentItem = filteredItems[index];
      const isDuplicate = exceptionItems.some((item) =>
        item === normalizedException && item !== currentItem
      );

      if (!isDuplicate) {
        const itemIndex = exceptionItems.indexOf(oldValue);
        if (itemIndex !== -1) {
          const newItems = [...exceptionItems];
          newItems[itemIndex] = normalizedException;
          setExceptionItems(newItems);
          await storageService.updateSettings({ exceptions: newItems });
        }
      }
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, oldValue: string): void => {
    if (e.key === 'Enter') {
      handleEditSave(index, oldValue).catch((error) => {
        console.error('Error saving edit:', error);
      });
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className={`${cardShell} ${className}`}>
      <div className={`${gradientBarClass} ${cardShellTopRadius}`} />
      <div className={cardHeaderRow}>
        <div className={cardIconBoxAmber}>
          <svg className={`${cardIconSvg} text-amber-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className={textCardTitle}>Exceptions</h2>
            {exceptionItems.length > 0 && (
              <span className={`${textBadge} rounded-full bg-linear-to-r from-amber-600 to-orange-600 px-2 py-0.5 text-white shadow-md`}>
                {exceptionItems.length}
              </span>
            )}
          </div>
          <p className={`mt-0.5 ${textCardSubtitle}`}>
            Allow duplicates for specific URLs or domains
          </p>
        </div>
      </div>
      <div className="mb-1.5 flex flex-col gap-1.5 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="example.com or example.com/page"
            value={inputValue}
            onChange={setInputValue}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        <Button onClick={handleAdd} className="w-full whitespace-nowrap sm:w-auto">
          Add Exception
        </Button>
      </div>

      {exceptionItems.length > 0 && (
        <div className="mb-1.5">
          <Input
            placeholder="Search exceptions..."
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>
      )}

      <div className="flex flex-col">
        {filteredItems.length > 0 && (
          <div className={scrollList}>
            {filteredItems.map((item, index) => {
              const isEditing = editingIndex === index;

              return (
                <div key={`${item}-${index}`} className={listItemShell}>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e): void => setEditingValue(e.target.value)}
                        onKeyDown={(e): void => handleKeyDown(e, index, item)}
                        className={inputInlineEdit}
                        autoFocus
                      />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          variant="ghost"
                          color="success"
                          onClick={(): void => {
                            handleEditSave(index, item).catch((error) => {
                              console.error('Error saving edit:', error);
                            });
                          }}
                          title="Save (Enter)"
                        >
                          <svg className={iconButtonSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </Button>
                        <Button variant="ghost" color="muted" onClick={handleEditCancel} title="Cancel (Esc)">
                          <svg className={iconButtonSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={`${textBodyBold} mr-2 min-w-0 flex-1 break-all`} title={item}>
                        {item}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          variant="ghost"
                          color="brand"
                          onClick={(): void => handleEditStart(index, item)}
                          title="Edit"
                        >
                          <svg className={iconButtonSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          color="danger"
                          onClick={(): void => {
                            handleRemove(item).catch((error) => {
                              console.error('Error removing exception:', error);
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {exceptionItems.length === 0 && (
          <div className={emptyStateWrap}>
            <div className={emptyStateIcon}>
              <svg className={emptyStateIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className={textCaption}>No exceptions added yet</p>
          </div>
        )}

        {exceptionItems.length > 0 && filteredItems.length === 0 && (
          <div className={emptyStateWrap}>
            <div className={emptyStateIcon}>
              <svg className={emptyStateIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className={textCaption}>No exceptions match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};
