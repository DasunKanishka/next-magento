import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/**
 * Locale-aware navigation primitives bound to the storefront routing config.
 * The selector components use `useRouter` + `usePathname` to switch the active
 * locale while preserving the current path, so changing language/country is a
 * client-side locale swap rather than a hard reload to a hardcoded URL.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
