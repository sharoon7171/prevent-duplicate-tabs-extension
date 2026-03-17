import React from 'react';
import type { HeaderProps } from '@/types/components';

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  stats,
  className = '',
}: HeaderProps): React.JSX.Element => {
  const getIconSrc = (): string => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL('icons/icon-48.png');
    }
    return '/icons/icon-48.png';
  };

  const defaultIcon = (
    <img
      src={getIconSrc()}
      alt="Extension Icon"
      className="w-10 h-10 rounded-lg shadow-md border-2 border-white/20"
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    />
  );

  const displayIcon = icon ?? defaultIcon;

  return (
    <header
      className={`w-full text-white shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)',
        boxShadow: '0 4px 20px rgba(49, 130, 206, 0.2)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.75"
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #3182ce 0%, #38a169 50%, #e53e3e 100%)',
          borderRadius: '16px 16px 0 0',
        }}
      />
      <div className="max-w-6xl mx-auto px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 text-white">
              {displayIcon}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs font-semibold text-blue-100 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {stats != null && (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded" title="Active tabs">
                  {stats.currentTabsCount.toLocaleString()} tabs
                </span>
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded" title="Duplicates prevented">
                  {stats.tabsClosedCount.toLocaleString()} prevented
                </span>
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
