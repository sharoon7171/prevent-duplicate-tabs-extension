import React from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

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
  if (isPopup) {
    return (
      <div className="h-full min-h-0 w-full min-w-0 flex flex-col overflow-hidden bg-slate-50">
        <Header title={title} subtitle={subtitle || 'Loading settings...'} />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-3 py-2">
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-linear-to-br from-blue-50 to-blue-100 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="animate-pulse text-base font-bold text-gray-800">
                Loading settings...
              </p>
            </div>
          </div>
        </main>
        <Footer variant="popup" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-linear-to-br from-gray-50 via-white to-gray-100">
      <Header title={title} subtitle={subtitle || 'Loading settings...'} />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-linear-to-br from-blue-50 to-blue-100 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="animate-pulse text-base font-bold text-gray-800">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
