import { DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { ToastService, UI_KIT_INTL } from '@stupa-makers/ui-kit';

/** A state that can be a load error with a retry. */
type MaybeError = { readonly state: string } & Partial<{
  readonly message: string;
  readonly retry: () => void;
}>;

/**
 * Shows a load error of `state` as a sticky error toast with "Erneut versuchen" (000576) and
 * closes it when the state is no error any more or the screen goes. Call it in an injection
 * context. The face with the error text is the template's part (002405).
 */
export function errorToastOn(state: () => MaybeError | null): void {
  const toasts = inject(ToastService);
  const intl = inject(UI_KIT_INTL);
  const id = signal<number | null>(null);
  const hide = (): void => {
    const open = id();
    if (open !== null) toasts.dismiss(open);
    id.set(null);
  };
  effect(() => {
    const s = state();
    untracked(() => {
      if (s?.state !== 'error') return hide();
      if (id() !== null) return;
      id.set(
        toasts.show({
          text: s.message ?? '',
          action: { key: 'retry', label: intl.translate('note.retry'), icon: 'reload' },
          kind: 'error',
          sticky: true,
          closed: (how) => {
            id.set(null);
            if (how === 'action') s.retry?.();
          },
        }),
      );
    });
  });
  inject(DestroyRef).onDestroy(hide);
}
