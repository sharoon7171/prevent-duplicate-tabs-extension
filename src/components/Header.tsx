import React from 'react';

import { gradientBarClass } from '@/ui-classes/gradient-bar';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  stats?: { currentTabsCount: number; tabsClosedCount: number };
}

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
      return chrome.runtime.getURL('icon-48.png');
    }
    return '/icon-48.png';
  };

  const defaultIcon = (
    <img
      src={getIconSrc()}
      alt="Extension Icon"
      className="h-9 w-9 rounded-lg border-2 border-white/20 shadow-md"
    />
  );

  const displayIcon = icon ?? defaultIcon;

  return (
    <header
      className={`w-full shrink-0 text-white shadow-header relative overflow-hidden transition-all duration-300 hover:shadow-xl bg-linear-to-br from-brand to-brand-dark ${className}`}
    >
      <div className={`${gradientBarClass} rounded-t-2xl`} />
      <div className="mx-auto max-w-6xl px-3 py-2 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 text-white">
              {displayIcon}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-sm font-semibold leading-snug text-blue-100">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {stats != null && (
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <span className="rounded bg-white/20 px-2 py-0.5 text-white" title="Active tabs">
                  {stats.currentTabsCount.toLocaleString()} tabs
                </span>
                <span className="rounded bg-white/20 px-2 py-0.5 text-white" title="Duplicates prevented">
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
