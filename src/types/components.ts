export interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  stats?: { currentTabsCount: number; tabsClosedCount: number };
}

export interface ToggleProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  label?: string;
  value: string;
  options: readonly SelectOption[];
  onChange?: (value: string) => void;
  className?: string;
}

export interface SiteRule {
  domain: string;
  duplicateAction: import('@/types/settings').DuplicateAction;
  ignoreParameters: boolean;
}

export interface GlobalSettingsProps {
  duplicateAction?: import('@/types/settings').DuplicateAction;
  ignoreParameters?: boolean;
  className?: string;
  initialGlobalSettings?: {
    duplicateAction: import('@/types/settings').DuplicateAction;
    ignoreParameters: boolean;
  };
}

export interface ExceptionsProps {
  items?: string[];
  className?: string;
  initialExceptions?: string[];
}

export interface SiteSpecificRulesProps {
  rules?: SiteRule[];
  className?: string;
  initialSiteRules?: SiteRule[];
}

export interface ExtensionStatusProps {
  enabled?: boolean;
  className?: string;
  initialEnabled?: boolean;
}

export interface CurrentDomainSettingsProps {
  className?: string;
  initialSettings?: import('@/types/settings').ExtensionSettings;
}

export interface FooterProps {
  className?: string;
}

