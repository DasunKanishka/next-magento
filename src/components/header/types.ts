/**
 * Serializable header navigation model.
 *
 * The header's server layer resolves the live category tree through the
 * DataSource connector and hands it to the interactive client shell as plain
 * data (no class instances, no functions) so it crosses the server/client
 * boundary cleanly. Two levels are carried: top-level categories for the nav
 * row + mega-menu left rail, and their children for the mega-menu middle
 * column.
 */
export interface NavChild {
  id: string;
  name: string;
  urlPath: string;
}

export interface NavCategory {
  id: string;
  name: string;
  urlPath: string;
  children: NavChild[];
}
