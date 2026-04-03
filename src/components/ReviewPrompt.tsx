import React, { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { CHROME_WEB_STORE_REVIEWS_URL } from '@/constants/chromeWebStore';
import { storageService } from '@/services/storage';
import { gradientBarClass } from '@/ui-classes/gradient-bar';
import { type ReviewPromptState } from '@/types/reviewPrompt';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DAYS_AFTER_INSTALL = 7;
const SNOOZE_LATER_DAYS = 3;

const STAR_PATH =
  'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.563.563 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z';

function StarRow({ compact }: { compact: boolean }): React.JSX.Element {
  const size = compact ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <div
      className="flex justify-center items-center gap-1"
      role="img"
      aria-label="Reviews on the Chrome Web Store can include a star rating"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          className={`${size} shrink-0 text-amber-400`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

function isEligible(review: ReviewPromptState, now: number, enabled: boolean): boolean {
  if (!enabled || review.dismissed) {
    return false;
  }
  if (review.snoozeUntil != null && review.snoozeUntil > now) {
    return false;
  }
  if (now - review.firstSeenAt < MIN_DAYS_AFTER_INSTALL * DAY_MS) {
    return false;
  }
  return true;
}

interface ReviewPromptProps {
  enabled: boolean;
  variant?: 'popup' | 'options';
}

export const ReviewPrompt: React.FC<ReviewPromptProps> = ({
  enabled,
  variant = 'options',
}): React.JSX.Element | null => {
  const [reviewState, setReviewState] = useState<ReviewPromptState | null>(null);
  const [visible, setVisible] = useState(false);
  const isPopup = variant === 'popup';

  useEffect(() => {
    let cancelled = false;
    void storageService.getReviewPromptState().then((s) => {
      if (!cancelled) {
        setReviewState(s);
      }
    });
    const unsub = storageService.subscribeReviewPrompt((s) => {
      if (!cancelled) {
        setReviewState(s);
      }
    });
    return (): void => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (reviewState == null) {
      return;
    }
    const el = isEligible(reviewState, Date.now(), enabled);
    if (el) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [reviewState, enabled]);

  const handleRate = (): void => {
    chrome.tabs.create({ url: CHROME_WEB_STORE_REVIEWS_URL, active: true });
    void storageService.dismissReviewPrompt();
    setVisible(false);
  };

  const handleReviewLater = (): void => {
    const snoozeUntil = Date.now() + SNOOZE_LATER_DAYS * DAY_MS;
    void storageService.snoozeReviewPromptUntil(snoozeUntil);
    setVisible(false);
  };

  const handleDontShowAgain = (): void => {
    void storageService.dismissReviewPrompt();
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  const secondaryActionClass = `shrink-0 cursor-pointer rounded-sm border-0 bg-transparent px-0.5 py-1 font-medium text-gray-600 underline decoration-transparent underline-offset-2 transition-colors duration-200 hover:text-brand hover:decoration-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${isPopup ? 'text-sm' : 'text-sm sm:text-base'}`;

  const shell =
    'relative overflow-hidden flex flex-col items-center gap-2.5 text-center rounded-xl border border-gray-200 bg-linear-to-br from-white to-slate-50 p-2.5 shadow-card transition-all duration-300 hover:border-gray-300 hover:shadow-lg sm:p-3';

  return (
    <div className={shell} role="region" aria-labelledby="review-prompt-heading">
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <StarRow compact={isPopup} />

      <div className="space-y-1.5 w-full max-w-md mx-auto">
        <h2
          id="review-prompt-heading"
          className={`font-black leading-tight text-black ${isPopup ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}
        >
          Enjoying Prevent Duplicate Tabs?
        </h2>
        <p className={`font-medium leading-snug text-gray-600 ${isPopup ? 'text-sm' : 'text-sm sm:text-base'}`}>
          Tap below to leave a quick star rating — it helps others find the extension.
        </p>
      </div>

      <Button
        type="button"
        variant="primary"
        color="brand"
        onClick={handleRate}
        className={`mx-auto flex h-10 w-full max-w-md flex-row items-center justify-center gap-2 rounded-xl text-sm font-extrabold sm:h-11 ${isPopup ? 'sm:text-base' : 'sm:text-lg'}`}
      >
        <svg
          className="h-4 w-4 shrink-0 text-amber-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
        <span>Rate on Chrome Web Store</span>
      </Button>

      <div className="mx-auto flex max-w-md flex-row flex-wrap items-center justify-center gap-x-1 gap-y-1">
        <button type="button" onClick={handleReviewLater} className={secondaryActionClass}>
          Remind me later
        </button>
        <span className="select-none px-0.5 text-gray-300" aria-hidden="true">
          ·
        </span>
        <button type="button" onClick={handleDontShowAgain} className={secondaryActionClass}>
          {"Don't show again"}
        </button>
      </div>
    </div>
  );
};
