import React, { useState, useEffect, useMemo } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { storageService } from '@/services/storage';
import { normalizeException } from '@/utils/urlNormalization';
import { gradientBarClass } from '@/ui-classes/gradient-bar';

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
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-white to-slate-50 p-2.5 shadow-card transition-all duration-300 hover:border-gray-300 hover:shadow-lg sm:p-3 ${className}`}
    >
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-amber-200 bg-white shadow-md">
          <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black leading-tight text-black sm:text-xl">
              Exceptions
            </h2>
            {exceptionItems.length > 0 && (
              <span className="rounded-full bg-linear-to-r from-amber-600 to-orange-600 px-2.5 py-0.5 text-xs font-extrabold text-white shadow-md sm:text-sm">
                {exceptionItems.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-gray-600">
            Allow duplicates for specific URLs or domains
          </p>
        </div>
      </div>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="example.com or example.com/page"
            value={inputValue}
            onChange={setInputValue}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        <Button onClick={handleAdd} className="whitespace-nowrap sm:w-auto w-full">
          Add Exception
        </Button>
      </div>

      {exceptionItems.length > 0 && (
        <div className="mb-2">
          <Input
            placeholder="Search exceptions..."
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>
      )}

      <div className="flex flex-col">
        {filteredItems.length > 0 && (
          <div className="space-y-2 overflow-y-auto max-h-[420px] pr-2">
            {filteredItems.map((item, index) => {
              const isEditing = editingIndex === index;

              return (
                <div
                  key={`${item}-${index}`}
                  className="flex shrink-0 items-center justify-between gap-2 rounded-xl border-2 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-3 py-2"
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e): void => setEditingValue(e.target.value)}
                        onKeyDown={(e): void => handleKeyDown(e, index, item)}
                        className="flex-1 min-w-0 px-4 py-2.5 border-2 border-blue-300 rounded-lg shadow-sm focus:outline-none focus:border-brand text-sm font-medium text-gray-900 bg-white"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 shrink-0">
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </Button>
                        <Button variant="ghost" color="muted" onClick={handleEditCancel} title="Cancel (Esc)">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span
                        className="mr-3 flex-1 min-w-0 break-all text-sm font-bold text-gray-900 sm:text-base"
                        title={item}
                        style={{ wordBreak: 'break-all' }}
                      >
                        {item}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          color="brand"
                          onClick={(): void => handleEditStart(index, item)}
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex flex-1 flex-col justify-center py-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600 sm:text-base">
              No exceptions added yet
            </p>
          </div>
        )}

        {exceptionItems.length > 0 && filteredItems.length === 0 && (
          <div className="flex flex-1 flex-col justify-center py-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600 sm:text-base">
              No exceptions match your search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
