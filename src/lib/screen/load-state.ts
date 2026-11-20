import { type Signal, computed } from '@angular/core';
import type { IconName } from '../icon/icon.component';

/** The state of a screen or a view. §S/framework/types/002234 */
export type LoadState<T> =
  | { readonly state: 'loading'; readonly previous?: T }
  | { readonly state: 'ready'; readonly data: T; readonly more?: boolean }
  | { readonly state: 'empty'; readonly heading: string; readonly icon: IconName }
  | { readonly state: 'error'; readonly message: string; readonly retry: () => void };

/** The parts of an Angular resource that {@link toLoadState} reads. */
export interface LoadSource<T> {
  readonly value: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<unknown>;
  reload(): unknown;
}

/** Options of {@link toLoadState}. */
export interface LoadStateOptions<T> {
  /** The empty state when `isEmpty` says so. */
  readonly empty: { readonly heading: string; readonly icon: IconName };
  /** Default: an empty array counts as empty. */
  readonly isEmpty?: (data: T) => boolean;
  /** The text of the error toast. */
  readonly error: string;
  /** Default true: more rows can follow. */
  readonly more?: Signal<boolean>;
}

const emptyArray = (data: unknown): boolean => Array.isArray(data) && data.length === 0;

/**
 * Turns an Angular resource (or anything with the same signals) into a `LoadState` signal.
 * §S/framework/state/002220
 */
export function toLoadState<T>(source: LoadSource<T>, options: LoadStateOptions<T>): Signal<LoadState<T>> {
  const isEmpty = options.isEmpty ?? emptyArray;
  return computed<LoadState<T>>(() => {
    const value = source.value();
    if (source.isLoading()) {
      return value === undefined ? { state: 'loading' } : { state: 'loading', previous: value };
    }
    if (source.error() !== undefined && source.error() !== null) {
      return { state: 'error', message: options.error, retry: () => void source.reload() };
    }
    if (value === undefined) return { state: 'loading' };
    if (isEmpty(value)) return { state: 'empty', heading: options.empty.heading, icon: options.empty.icon };
    return { state: 'ready', data: value, more: options.more?.() ?? false };
  });
}

/** The data of a state, also the old data while it loads again. */
export function loadedData<T>(state: LoadState<T>): T | undefined {
  if (state.state === 'ready') return state.data;
  if (state.state === 'loading') return state.previous;
  return undefined;
}
