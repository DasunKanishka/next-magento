import type { SupportedLocale } from './locales';

/**
 * The store-locale catalog for functional UI-chrome copy. This replaces the
 * removed next-intl message catalogs (`messages/*.json`): nothing in this
 * frontend calls next-intl's `useTranslations`/`getTranslations`, so a full
 * message-catalog mechanism doesn't earn its keep for a single real locale.
 * next-intl itself is retained only for the `[locale]` URL segment + its
 * locale-aware navigation primitives (`./navigation.ts`), which need a
 * resolved locale but no message content.
 *
 * SCOPE — chrome vs. editorial: this catalog carries FUNCTIONAL microcopy
 * (button/control labels, aria-labels, system/empty-state messages) — the UI
 * "chrome" that ships with the component regardless of what a merchant sells.
 * Content a merchant authors (store identity, marketing/editorial copy, CMS
 * blocks) is a DIFFERENT concern and stays backend-sourced via
 * `getStoreIdentity()`/`getEditorialContent()` — never duplicated here. One
 * entry below is legal/compliance-adjacent (the newsletter consent line): it
 * is catalogued here because it is still fixed UI copy shipped with the
 * component (not merchant-authored), but its WORDING carries compliance
 * weight — see its own comment for exact-wording constraints. The age-gate
 * legal notice and the footer's 18+ alcohol notice are NOT here — they are
 * merchant/legal-authored content, backend-sourced via `getStoreIdentity()`
 * (`StoreIdentity.alcoholLegalNotice`, see
 * `src/config/store-identity-content.ts`), same as every other admin-owned
 * legal/identity field.
 *
 * `Record<SupportedLocale, ChromeCopy>` is a closed map keyed by the type, not
 * a lookup with a fallback branch: TypeScript forces every entry in
 * `supportedLocales` to have a complete catalog here, so a locale can never be
 * "supported" for routing while silently missing its chrome copy. Growing to
 * a second store view is exactly one additive entry — no speculative entries
 * for locales the backend doesn't (yet) define.
 */
export interface ChromeCopy {
  // ---- Header / navigation --------------------------------------------
  /** Logo (shared Header/Footer home link) aria-label: "{name} — go to homepage". */
  homeLinkLabel: (name: string) => string;
  /** HeaderShell account/login entry point — text + aria-label (same string). */
  accountLabel: string;
  /** HeaderShell primary `<nav>` landmark aria-label. */
  mainNavLabel: string;
  /** HeaderShell mobile compact search input placeholder. */
  searchPlaceholder: string;
  /** HeaderShell "more" overflow-categories nav trigger. */
  moreLabel: string;
  /** CartPill aria-label: item count + running total. */
  cartAriaLabel: (count: number, total: string) => string;
  /** FreeShippingProgress aria-label: remaining threshold copy. */
  freeShippingAriaLabel: (threshold: string) => string;
  /** FreeShippingProgress visible message, threshold reached. */
  freeShippingReachedMessage: string;
  /** FreeShippingProgress visible message, threshold not yet reached. */
  freeShippingRemainingMessage: (remaining: string) => string;
  /** DeliveryCountdown label, past today's order cut-off (falls back to the next-day promise). */
  deliveryCountdownPastCutoff: (cutoffLabel: string) => string;
  /** DeliveryCountdown label, still before today's order cut-off. */
  deliveryCountdownRemaining: (hours: number, minutes: number) => string;

  // ---- MegaMenu ----------------------------------------------------------
  /** MegaMenu panel `role="region"` aria-label for the active category. */
  megaMenuRegionLabel: (category: string) => string;
  /** MegaMenu: shown in the middle column when a category has no subtypes. */
  megaMenuEmptyState: string;
  /** MegaMenu: prefix for the right-column "view all in {category}" promo link. */
  megaMenuViewAllPrefix: string;

  // ---- MobileMenu ---------------------------------------------------------
  /** MobileMenu hamburger trigger aria-label, open/closed. */
  mobileMenuToggleOpen: string;
  mobileMenuToggleClose: string;
  /** MobileMenu drawer `<nav>` landmark aria-label. */
  mobileMenuLabel: string;
  /** MobileMenu drill-down "back" control. */
  mobileMenuBack: string;
  /** MobileMenu drill-down "all in {category}" link prefix. */
  mobileMenuViewAllPrefix: (category: string) => string;
  /** MobileMenu root-list section eyebrow, above the category list. */
  mobileMenuSectionLabel: string;
  /** MobileMenu category-with-subtypes drill-in control aria-label suffix. */
  mobileMenuOpenSubmenu: (category: string) => string;
  /** MobileMenu language-list eyebrow + `<ul role="menu">` aria-label (same string). */
  mobileMenuLanguageLabel: string;

  // ---- Country/language selectors ----------------------------------------
  /** CountrySelector trigger label ("Deliver to"). */
  deliverToLabel: string;
  /** CountrySelector trigger aria-label: active country + hint. */
  countrySelectorAriaLabel: (country: string) => string;
  /** CountrySelector combined panel aria-label. */
  countryAndLanguagePanelLabel: string;
  /** CountrySelector left column group aria-label + heading (same string). */
  countryColumnLabel: string;
  /** CountrySelector/LanguageSelector right column group aria-label + heading (same string). */
  languageColumnLabel: string;
  /** LanguageSelector trigger aria-label: active language + hint. */
  languageSelectorAriaLabel: (language: string) => string;

  // ---- Age/country compliance gate ---------------------------------------
  /** AgeGate heading. */
  ageGateTitle: string;
  /** AgeGate intro copy. */
  ageGateCopy: string;
  /** AgeGate delivery-country fieldset legend. */
  ageGateCountryLegend: string;
  /** AgeGate 18+ confirmation checkbox label. */
  ageGateAgeConfirm: string;
  /** AgeGate submit CTA. */
  ageGateCta: string;

  // ---- Footer / newsletter ------------------------------------------------
  /** Footer payment-methods list aria-label. */
  footerPaymentMethods: string;
  /** NewsletterSignup section label above the email field. */
  newsletterHeading: string;
  /** NewsletterSignup email input placeholder (an illustrative example, not real content). */
  newsletterEmailPlaceholder: string;
  /** NewsletterSignup email input aria-label. */
  newsletterEmailAriaLabel: string;
  /** NewsletterSignup submit button, idle vs. submitting. */
  newsletterSubmitLabel: string;
  newsletterSubmittingLabel: string;
  /** NewsletterSignup success status. */
  newsletterSuccessLabel: string;
  /** NewsletterSignup double opt-in consent checkbox label. */
  newsletterConsentLabel: string;
  /** NewsletterSignup submit-failure message. */
  newsletterErrorMessage: string;
  /** NewsletterSignup client-side email-format validation message. */
  newsletterInvalidEmailMessage: string;
  /** NewsletterSignup missing-consent validation message. */
  newsletterConsentRequiredMessage: string;
  /** NewsletterSignup post-submit "check your email" confirmation message. */
  newsletterAlmostDoneMessage: string;

  // ---- Home merchandising chrome ------------------------------------------
  /** BusinessReviews section aria-label. */
  businessReviewsLabel: string;
  /** Carousel (generic) prev/next controls. */
  carouselPrevLabel: string;
  carouselNextLabel: string;
  /** HeroSlider section aria-label + its prev/next/tablist controls. */
  heroSliderLabel: string;
  heroSliderPrevLabel: string;
  heroSliderNextLabel: string;
  heroSliderTablistLabel: string;
  /** HeroSlider per-slide dot control aria-label ("Slide {n}"). */
  heroSliderDotLabel: (position: number) => string;
  /** ProductOfMonth section aria-label + eyebrow (same string) + empty state. */
  productOfMonthLabel: string;
  productOfMonthEmptyState: string;
  /** ProductRail empty-state note. */
  productRailEmptyState: string;
  /** SeoContent section aria-label. */
  seoContentLabel: string;
  /** CategoryBar section aria-label + heading (same string). */
  categoryBarLabel: string;

  // ---- Shared UI-kit chrome ------------------------------------------------
  /** QuantityStepper decrease/increase controls. */
  quantityDecreaseLabel: string;
  quantityIncreaseLabel: string;
  /** Alert dismiss control. */
  alertCloseLabel: string;
  /** SearchBar's sr-only input label (also composed into its default button label). */
  searchLabel: string;
  /** SearchBar's empty-query validation message. */
  searchEmptyQueryMessage: string;
  /** Rating's review-count suffix word (e.g. "reviews"). */
  reviewsSuffix: string;
  /** ProductCard wishlist control. */
  wishlistLabel: string;
  /** ProductCard's placeholder media caption (no product photo wired yet). */
  productPhotoPlaceholder: string;
  /** AddToCartCard stock/acknowledgement status. */
  addToCartLabel: string;
  outOfStockLabel: string;
  addedToCartLabel: string;
  /** PriceBlock's auto-computed savings flag (UI-kit primitive; not currently wired into a page). */
  savingsLabel: (amount: string) => string;
  /** DeliveryNote (UI-kit primitive; not currently wired into a page) order-by-countdown copy. */
  deliveryNoteOrderPrefix: string;
  deliveryNoteOrderSuffix: string;

  // ---- Error boundary -------------------------------------------------
  /** Segment error boundary (`error.tsx`) heading. */
  errorTitle: string;
  /** Segment error boundary body copy. */
  errorBody: string;
  /** Segment error boundary retry button label. */
  errorRetry: string;
}

const CHROME_COPY: Record<SupportedLocale, ChromeCopy> = {
  en: {
    homeLinkLabel: (name) => `${name} — go to homepage`,
    accountLabel: 'Sign in',
    mainNavLabel: 'Main navigation',
    searchPlaceholder: 'Search brand, type, or product…',
    moreLabel: 'more ▾',
    cartAriaLabel: (count, total) => `Cart: ${count} items, total ${total}`,
    freeShippingAriaLabel: (threshold) => `Free shipping from ${threshold}`,
    freeShippingReachedMessage: 'You have free shipping',
    freeShippingRemainingMessage: (remaining) => `${remaining} more for free shipping`,
    deliveryCountdownPastCutoff: (cutoffLabel) =>
      `Order before ${cutoffLabel} for delivery tomorrow`,
    deliveryCountdownRemaining: (hours, minutes) =>
      `Today, ${hours}h ${minutes}m left for delivery tomorrow`,

    megaMenuRegionLabel: (category) => `Category menu: ${category}`,
    megaMenuEmptyState: 'Explore the full collection.',
    megaMenuViewAllPrefix: 'View all in',

    mobileMenuToggleOpen: 'Open menu',
    mobileMenuToggleClose: 'Close menu',
    mobileMenuLabel: 'Main menu',
    mobileMenuBack: 'Back',
    mobileMenuViewAllPrefix: (category) => `All in ${category}`,
    mobileMenuSectionLabel: 'Menu',
    mobileMenuOpenSubmenu: (category) => `${category} — open submenu`,
    mobileMenuLanguageLabel: 'Language',

    deliverToLabel: 'Deliver to',
    countrySelectorAriaLabel: (country) =>
      `Delivery country: ${country}. Choose country and language`,
    countryAndLanguagePanelLabel: 'Country and language',
    countryColumnLabel: 'Country',
    languageColumnLabel: 'Language',
    languageSelectorAriaLabel: (language) => `Language: ${language}. Choose language`,

    ageGateTitle: 'Where can we deliver to?',
    ageGateCopy: 'Choose your delivery country and confirm your age to enter the store.',
    ageGateCountryLegend: 'Delivery country',
    ageGateAgeConfirm: 'Yes, I am 18 years or older',
    ageGateCta: 'Enter the store →',

    footerPaymentMethods: 'Payment methods',
    newsletterHeading: 'Stay up to date with offers',
    newsletterEmailPlaceholder: 'you@example.com',
    newsletterEmailAriaLabel: 'Email address',
    newsletterSubmitLabel: 'Subscribe',
    newsletterSubmittingLabel: 'Submitting…',
    newsletterSuccessLabel: 'Success ✓',
    newsletterConsentLabel:
      'Yes, I want to receive the newsletter and agree to double opt-in confirmation.',
    newsletterErrorMessage: 'Subscribing failed. Please try again later.',
    newsletterInvalidEmailMessage: 'Enter a valid email address.',
    newsletterConsentRequiredMessage: 'Give consent to subscribe.',
    newsletterAlmostDoneMessage:
      'Almost done! Confirm your subscription via the email we just sent.',

    businessReviewsLabel: 'Customer reviews',
    carouselPrevLabel: 'Previous',
    carouselNextLabel: 'Next',
    heroSliderLabel: 'Featured campaigns',
    heroSliderPrevLabel: 'Previous campaign',
    heroSliderNextLabel: 'Next campaign',
    heroSliderTablistLabel: 'Choose a campaign',
    heroSliderDotLabel: (position) => `Slide ${position}`,
    productOfMonthLabel: 'Product of the month',
    productOfMonthEmptyState: 'No product featured this month yet.',
    productRailEmptyState: 'No products in this selection right now.',
    seoContentLabel: 'About our store',
    categoryBarLabel: 'Shop by category',

    quantityDecreaseLabel: 'Decrease quantity',
    quantityIncreaseLabel: 'Increase quantity',
    alertCloseLabel: 'Close',
    searchLabel: 'Search',
    searchEmptyQueryMessage: 'Enter a search term to search.',
    reviewsSuffix: 'reviews',
    wishlistLabel: 'Add to wishlist',
    productPhotoPlaceholder: 'PRODUCT PHOTO',
    addToCartLabel: 'Add to cart',
    outOfStockLabel: 'Temporarily out of stock',
    addedToCartLabel: 'Added ✓',
    savingsLabel: (amount) => `You save ${amount}`,
    deliveryNoteOrderPrefix: 'Order within',
    deliveryNoteOrderSuffix: 'today ·',

    errorTitle: 'Something went wrong',
    errorBody: 'The page cannot be displayed right now. Please try again later.',
    errorRetry: 'Try again',
  },
};

/** Resolve the chrome-copy catalog entry for the given store-resolved locale. */
export function getChromeCopy(locale: SupportedLocale): ChromeCopy {
  return CHROME_COPY[locale];
}
