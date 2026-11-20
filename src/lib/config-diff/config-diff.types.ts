/**
 * Resolved field diff consumed by {@link ConfigDiffComponent}. Deliberately framework- and
 * app-agnostic: any `{ added, removed, changed }` object with this shape works (structural
 * typing), so callers can pass their own diff models without adapting.
 */
export interface ConfigDiffEntry {
  readonly key: string;
  readonly value: unknown;
}

export interface ConfigFieldChange {
  readonly key: string;
  readonly old: unknown;
  readonly new: unknown;
}

export interface ConfigDiffData {
  readonly added: readonly ConfigDiffEntry[];
  readonly removed: readonly ConfigDiffEntry[];
  readonly changed: readonly ConfigFieldChange[];
}
