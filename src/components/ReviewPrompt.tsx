import React, { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { CHROME_WEB_STORE_REVIEWS_URL } from '@/constants/chromeWebStore';
import { storageService } from '@/services/storage';
import { gradientBarClass } from '@/ui-classes/gradient-bar';
import { type ReviewPromptState } from '@/types/reviewPrompt';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DAYS_AFTER_INSTALL = 3;
const MIN_TABS_CLOSED = 10;
const SNOOZE_LATER_DAYS = 7;

const STAR_PATH =
  'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z';

function StarScaleHint({ compact }: { compact: boolean }): React.JSX.Element {
  const size = compact ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label="Reviews on the Chrome Web Store can include a star rating"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          className={`${size} shrink-0 text-amber-500`}
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

function isEligible(
  review: ReviewPromptState,
  now: number,
  tabsClosedCount: number,
  enabled: boolean,
): boolean {
  if (!enabled || review.dismissed) {
    return false;
  }
  if (review.snoozeUntil != null && review.snoozeUntil > now) {
    return false;
  }
  if (now - review.firstSeenAt < MIN_DAYS_AFTER_INSTALL * DAY_MS) {
    return false;
  }
  if (tabsClosedCount < MIN_TABS_CLOSED) {
    return false;
  }
  return true;
}

interface ReviewPromptProps {
  enabled: boolean;
  tabsClosedCount: number;
  variant?: 'popup' | 'options';
}

export const ReviewPrompt: React.FC<ReviewPromptProps> = ({
  enabled,
  tabsClosedCount,
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
    const el = isEligible(reviewState, Date.now(), tabsClosedCount, enabled);
    if (el) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [reviewState, tabsClosedCount, enabled]);

  const handleReview = (): void => {
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

  const shell =
    'relative overflow-hidden flex flex-col rounded-xl border border-gray-200 shadow-card p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:border-gray-300 bg-linear-to-br from-white to-slate-50';

  return (
    <div className={shell} role="region" aria-labelledby="review-prompt-heading">
      <div className={`${gradientBarClass} rounded-t-xl`} />
      <div className="mb-4">
        <h2
          id="review-prompt-heading"
          className={`font-black text-black ${isPopup ? 'text-base' : 'text-lg'}`}
        >
          Enjoying Prevent Duplicate Tabs?
        </h2>
        <p className="text-xs font-semibold text-gray-600 mt-0.5">Chrome Web Store</p>
        <div className={isPopup ? 'mt-1.5' : 'mt-2'}>
          <StarScaleHint compact={isPopup} />
        </div>
      </div>

      <div className="space-y-4 flex-1 flex flex-col">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700">
            <span className="font-semibold tabular-nums text-gray-900">{tabsClosedCount.toLocaleString()}</span>
            {' duplicate tabs closed in this Chrome profile'}
          </p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          This appears after you have used the extension for a while. Public reviews on the Chrome Web Store
          help others find it. The button below opens the review page in a new tab; you can skip it or use the
          other links if you prefer.
        </p>

        <Button type="button" onClick={handleReview} className="self-start min-h-[44px]">
          Leave a review
        </Button>

        <div className="flex flex-col gap-0.5 items-start">
          <Button
            type="button"
            variant="ghost"
            color="muted"
            onClick={handleReviewLater}
            className="text-left font-semibold"
          >
            Remind me in a week
          </Button>
          <Button
            type="button"
            variant="ghost"
            color="muted"
            onClick={handleDontShowAgain}
            className="text-left font-semibold"
          >
            {"Don't show this again"}
          </Button>
        </div>
      </div>
    </div>
  );
};
