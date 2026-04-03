import React from 'react';

import { CHROME_WEB_STORE_REVIEWS_URL } from '@/constants/chromeWebStore';
import { NEW_ISSUE_URL } from '@/constants/repo';
import { gradientBarClass } from '@/ui-classes/gradient-bar';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'popup';
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
  variant = 'default',
}: FooterProps): React.JSX.Element => {
  const isPopup = variant === 'popup';

  const attribution = (
    <p
      className={
        isPopup
          ? 'shrink-0 text-sm font-medium text-gray-600'
          : 'shrink-0 text-sm font-medium text-gray-600 sm:text-base'
      }
    >
      By{' '}
      <a
        href="https://www.sqtech.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-brand transition-colors duration-200 hover:text-brand-dark"
      >
        SQ Tech
      </a>
    </p>
  );

  const actionGroup = (
    <div className="inline-flex divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200 bg-white shadow-card-sm">
      <a
        href={CHROME_WEB_STORE_REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center bg-white px-2.5 py-1.5 text-sm font-extrabold text-gray-800 transition-colors duration-200 hover:text-brand focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        Rate extension
      </a>
      <a
        href={`${NEW_ISSUE_URL}?labels=enhancement`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center bg-white px-2.5 py-1.5 text-sm font-extrabold text-gray-800 transition-colors duration-200 hover:text-brand focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        Request feature
      </a>
      <a
        href={`${NEW_ISSUE_URL}?labels=bug`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center bg-white px-2.5 py-1.5 text-sm font-extrabold text-gray-800 transition-colors duration-200 hover:text-brand focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        Report bug
      </a>
    </div>
  );

  const trailing = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-0">
      <span
        className="hidden h-4 w-px shrink-0 bg-gray-300/80 sm:mr-3 sm:block"
        aria-hidden="true"
      />
      {actionGroup}
    </div>
  );

  const innerClass = isPopup
    ? 'px-3 py-2'
    : 'mx-auto max-w-6xl px-3 py-2 sm:px-4 sm:py-2.5';

  return (
    <footer
      className={`relative mt-3 w-full shrink-0 overflow-hidden border-t border-gray-200/80 ${isPopup ? 'bg-slate-100/95' : 'bg-slate-50'} ${className}`}
    >
      <div className={gradientBarClass} />
      <div className={innerClass}>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {attribution}
          {trailing}
        </div>
      </div>
    </footer>
  );
};
