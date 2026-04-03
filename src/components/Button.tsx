import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dashed';
type ButtonColor = 'brand' | 'danger' | 'success' | 'muted';

interface ButtonProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'rounded-xl bg-brand px-4 py-2 text-white shadow-md hover:bg-brand-dark hover:shadow-lg',
  secondary:
    'rounded-xl bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300',
  ghost:
    'rounded-lg px-2.5 py-1',
  dashed:
    'rounded-xl border-2 border-dashed border-gray-300 bg-linear-to-br from-white to-slate-50 px-3 py-2 text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900',
};

const ghostColorClasses: Record<ButtonColor, string> = {
  brand: 'text-brand hover:text-brand-dark hover:bg-blue-50',
  danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
  success: 'text-green-600 hover:text-green-700 hover:bg-green-50',
  muted: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  color = 'brand',
  children,
  onClick,
  className = '',
  title,
  type = 'button',
}: ButtonProps): React.JSX.Element => {
  const base = variantClasses[variant];
  const colorClass = variant === 'ghost' ? ghostColorClasses[color] : '';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`text-sm font-bold focus:outline-none transition-all duration-200 sm:text-base ${base} ${colorClass} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
};
