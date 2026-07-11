/**
 * Static storefront identity for this deployment.
 *
 * Header and footer are shared across every page and carry the store's own
 * name, tagline, and legal registration details. In this version these are
 * fixed content (no admin-authoring surface yet), centralized here so a
 * different deployment can repoint them without touching component code — the
 * same "config map, not string literals" discipline the content zones follow.
 */
export interface StoreIdentity {
  /** Wordmark shown in the header logo and footer brand block. */
  name: string;
  /** Short brand tagline under the footer wordmark. */
  tagline: string;
  /** Chamber-of-Commerce registration number (legal footer line). */
  registrationNumber: string;
  /** Legal entity named in the copyright line. */
  legalEntity: string;
}

export const STORE_IDENTITY: StoreIdentity = {
  name: 'TopDrinks',
  tagline: 'Jouw online drankspeciaalzaak — 8.000+ premium dranken, morgen in huis.',
  registrationNumber: 'KvK 87654321',
  legalEntity: 'TopDrinks B.V.',
};
