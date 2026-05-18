import { textFooter, textFooterAction } from '@/ui-classes/typography';

export const footerShell =
  'relative mt-2 w-full shrink-0 overflow-hidden border-t border-gray-200/80';

export const footerInner = 'px-2.5 py-1';

export const footerInnerOptions = 'mx-auto max-w-5xl px-2.5 py-1 sm:px-3';

export const footerRow =
  'flex w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1';

export const footerAttribution = `shrink-0 leading-none ${textFooter}`;

export const footerActions =
  'flex min-w-0 flex-1 flex-wrap items-center justify-end';

export const footerButtonGroup =
  'inline-flex w-auto max-w-full shrink-0 divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200 bg-white shadow-card-sm';

export const footerButton = `inline-flex shrink-0 items-center justify-center whitespace-nowrap bg-white px-2 py-0.5 ${textFooterAction} transition-colors duration-200 hover:text-brand focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand`;
