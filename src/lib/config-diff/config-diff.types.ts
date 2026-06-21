/**
 * Resolved field diff consumed by {@link ConfigDiffComponent}. Deliberately framework- and
 * app-agnostic: any `{ added, removed, changed }` object with this shape works (structural
 * typing), so callers can pass their own diff models without adapting.
 */
export interface ConfigDiffEntry {
  key: string;
  value: unknown;
}

export interface ConfigFieldChange {
  key: string;
  old: unknown;
  new: unknown;
}

export interface ConfigDiffData {
  added: ConfigDiffEntry[];
  removed: ConfigDiffEntry[];
  changed: ConfigFieldChange[];
}
