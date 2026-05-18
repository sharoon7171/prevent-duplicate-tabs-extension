import React from 'react';

import { Footer } from './Footer';
import { Header } from './Header';
import { optionsMainStack } from '@/ui-classes/layout';
import { textBodyBold } from '@/ui-classes/typography';

interface LoadingProps {
  title?: string;
  subtitle?: string;
  isPopup?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  title = 'Prevent Duplicate Tabs',
  subtitle,
  isPopup = false,
}: LoadingProps): React.JSX.Element => {
  const spinner = (
  <div className="flex items-center justify-center py-6">
      <div className="relative">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full bg-linear-to-br from-blue-50 to-blue-100" />
        </div>
      </div>
    </div>
  );

  const message = (
    <div className="text-center">
      <p className={`animate-pulse ${textBodyBold}`}>Loading settings...</p>
    </div>
  );

  if (isPopup) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-50">
        <Header title={title} subtitle={subtitle || 'Loading settings...'} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-2.5 py-2">
            {spinner}
            {message}
          </div>
        </main>
        <Footer variant="popup" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-linear-to-br from-gray-50 via-white to-gray-100">
      <Header title={title} subtitle={subtitle || 'Loading settings...'} />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={optionsMainStack}>
          {spinner}
          {message}
        </div>
      </main>
      <Footer />
    </div>
  );
};
