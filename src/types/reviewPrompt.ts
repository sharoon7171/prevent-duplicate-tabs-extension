export interface ReviewPromptState {
  firstSeenAt: number;
  dismissed: boolean;
  snoozeUntil: number | null;
}

export const DEFAULT_REVIEW_PROMPT_STATE: ReviewPromptState = {
  firstSeenAt: 0,
  dismissed: false,
  snoozeUntil: null,
};

export const REVIEW_PROMPT_STORAGE_KEY = 'extensionReviewPrompt';
