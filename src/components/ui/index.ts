export { Button } from './core/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './core/Button';

export { IconButton } from './core/IconButton';
export type { IconButtonProps, IconButtonShape } from './core/IconButton';

export { PagerButton } from './core/PagerButton';
export type {
  PagerButtonProps,
  PagerButtonVariant,
  PagerButtonDirection,
} from './core/PagerButton';

export { Badge } from './core/Badge';
export type { BadgeProps, BadgeVariant } from './core/Badge';

export { Chip } from './core/Chip';
export type { ChipProps, ChipVariant } from './core/Chip';

export { Rating } from './core/Rating';
export type { RatingProps } from './core/Rating';

// NOTE: `Logo` (./core/Logo) is deliberately NOT re-exported here. It is the
// only `ui/core` component that imports `@/i18n/navigation` (for `Link`), and
// this barrel is imported broadly — including by components that want a
// single unrelated export (e.g. CartPill imports only `formatEuro`). Barrel
// re-export would pull a real, unmocked `@/i18n/navigation` → next-intl
// navigation evaluation into every one of those consumers' module graphs,
// which breaks under Vitest in this environment (next-intl's client
// navigation entry fails to resolve `next/navigation`) even though none of
// those consumers use Logo. Header/Footer import `Logo` directly from
// `@/components/ui/core/Logo` instead — mirroring `useDismissMenu`, which is
// also never barrel-exported and is imported the same direct-path way by
// HeaderShell.

export { SearchBar } from './forms/SearchBar';
export type { SearchBarProps } from './forms/SearchBar';

export { TextField } from './forms/TextField';
export type { TextFieldProps } from './forms/TextField';

export { Alert } from './feedback/Alert';
export type { AlertProps, AlertTone } from './feedback/Alert';

export { Toast } from './feedback/Toast';
export type { ToastProps, ToastTone } from './feedback/Toast';

export { ProductCard } from './product/ProductCard';
export type { ProductCardProps } from './product/ProductCard';

export { PriceBlock, formatEuro } from './product/PriceBlock';
export type { PriceBlockProps } from './product/PriceBlock';

export { DeliveryNote } from './commerce/DeliveryNote';
export type { DeliveryNoteProps } from './commerce/DeliveryNote';

export { QuantityStepper } from './commerce/QuantityStepper';
export type {
  QuantityStepperProps,
  QuantityStepperSize,
} from './commerce/QuantityStepper';

export { CountrySelector } from './i18n/CountrySelector';
export type { CountrySelectorProps } from './i18n/CountrySelector';

export { LanguageSelector } from './i18n/LanguageSelector';
export type { LanguageSelectorProps } from './i18n/LanguageSelector';
