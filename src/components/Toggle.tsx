import React, { useId } from 'react';

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

  const titleClass =
    'select-none text-sm font-extrabold text-gray-900 sm:text-base';
  const descClass = 'select-none text-sm font-medium leading-snug text-gray-600';

  return (
    <div
      className={`flex items-center ${
        showTextColumn ? 'justify-between' : 'justify-end'
      } gap-3 ${interactiveRow && onChange ? 'cursor-pointer' : ''} ${className}`}
      onClick={interactiveRow ? handleRowClick : undefined}
    >
      {showTextColumn && (
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          {trimmedLabel ? (
            interactiveRow ? (
              <span className={titleClass}>{label}</span>
            ) : (
              <label htmlFor={switchId} className={`cursor-pointer ${titleClass}`}>
                {label}
              </label>
            )
          ) : null}
          {description ? (
            interactiveRow ? (
              <span id={descriptionId} className={descClass}>
                {description}
              </span>
            ) : (
              <p id={descriptionId} className={`ml-0 ${descClass}`}>
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
        className={`
          relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-all duration-300 ease-in-out focus:outline-none
          shadow-inner
          ${checked ? 'bg-brand' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0
            transition duration-300 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};
