import React, { useId } from 'react';

import {
  toggleThumb,
  toggleThumbOff,
  toggleThumbOn,
  toggleTrack,
} from '@/ui-classes/control';
import { textControlHint, textControlLabel } from '@/ui-classes/typography';

interface ToggleProps {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  interactiveRow?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked = false,
  onChange,
  className = '',
  interactiveRow = false,
}: ToggleProps): React.JSX.Element => {
  const reactId = useId();
  const switchId = `toggle-${reactId.replace(/:/g, '')}`;
  const descriptionId = description ? `toggle-desc-${reactId.replace(/:/g, '')}` : undefined;
  const trimmedLabel = label.trim();
  const showTextColumn = Boolean(trimmedLabel) || Boolean(description);

  const handleClick = (): void => {
    if (onChange) {
      onChange(!checked);
    }
  };

  const handleRowClick = (): void => {
    if (interactiveRow && onChange) {
      onChange(!checked);
    }
  };

  const handleSwitchClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    handleClick();
  };

  return (
    <div
      className={`flex items-center ${
        showTextColumn ? 'justify-between' : 'justify-end'
      } gap-2 ${interactiveRow && onChange ? 'cursor-pointer' : ''} ${className}`}
      onClick={interactiveRow ? handleRowClick : undefined}
    >
      {showTextColumn && (
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          {trimmedLabel ? (
            interactiveRow ? (
              <span className={`select-none ${textControlLabel}`}>{label}</span>
            ) : (
              <label htmlFor={switchId} className={`cursor-pointer select-none ${textControlLabel}`}>
                {label}
              </label>
            )
          ) : null}
          {description ? (
            interactiveRow ? (
              <span id={descriptionId} className={`select-none ${textControlHint}`}>
                {description}
              </span>
            ) : (
              <p id={descriptionId} className={`ml-0 select-none ${textControlHint}`}>
                {description}
              </p>
            )
          ) : null}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={trimmedLabel || description || 'Toggle'}
        aria-describedby={descriptionId}
        id={switchId}
        onClick={interactiveRow ? handleSwitchClick : handleClick}
        className={`${toggleTrack} ${checked ? 'bg-brand' : 'bg-gray-300'}`}
      >
        <span className={`${toggleThumb} ${checked ? toggleThumbOn : toggleThumbOff}`} />
      </button>
    </div>
  );
};
