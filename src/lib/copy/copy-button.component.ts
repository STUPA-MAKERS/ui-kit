import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ButtonComponent, type ButtonSize, type ButtonVariant } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { UI_KIT_INTL } from '../intl/intl';
import { copyText } from './copy-text';

/**
 * A button that copies a text ("Kopieren" → "Kopiert"). After a successful write the label
 * and the icon switch to the copied state for `resetMs`, and a polite live region says it.
 * A refused write leaves the button as it was. A new `text` drops the copied state.
 *
 * `<app-copy-button [text]="url()" variant="tonal" size="sm" />`
 *
 * `label` and `copiedLabel` replace the built-in texts (`copy.copy`, `copy.copied`).
 * `ariaLabel` names the button when the visible text is short ("Kopieren" for "MCP-
 * Konfiguration kopieren"); in the copied state the name is the copied label.
 */
@Component({
  selector: 'app-copy-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  templateUrl: './copy-button.component.html',
  styleUrl: './copy-button.component.scss',
})
export class CopyButtonComponent {
  private readonly intl = inject(UI_KIT_INTL);
  private readonly zone = inject(NgZone);

  /** The text to put on the clipboard. Empty: the button does nothing. */
  readonly text = input('');
  readonly label = input('');
  readonly copiedLabel = input('');
  readonly ariaLabel = input('');
  readonly variant = input<ButtonVariant>('tonal');
  readonly size = input<ButtonSize>('sm');
  /** The copy icon, and a check in the copied state. */
  readonly icon = input(true);
  /** How long the copied state shows, in ms. 0 keeps it until `text` changes. */
  readonly resetMs = input(2000);

  /** The result of each click: true when the text is on the clipboard. */
  readonly copiedChange = output<boolean>();

  readonly copied = signal(false);
  protected readonly shownLabel = computed(() =>
    this.copied()
      ? this.copiedLabel() || this.intl.translate('copy.copied')
      : this.label() || this.intl.translate('copy.copy'),
  );
  protected readonly name = computed(() =>
    this.copied() ? this.shownLabel() : this.ariaLabel(),
  );

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.text();
      untracked(() => this.reset());
    });
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected async copy(): Promise<void> {
    const text = this.text();
    if (!text) return;
    const ok = await copyText(text);
    this.clearTimer();
    this.copied.set(ok);
    this.copiedChange.emit(ok);
    const ms = this.resetMs();
    if (ok && ms > 0) {
      // Outside the zone: the timer is no pending task that keeps the page unstable.
      this.timer = this.zone.runOutsideAngular(() =>
        setTimeout(() => {
          this.timer = null;
          this.copied.set(false);
        }, ms),
      );
    }
  }

  /** Drop the copied state now (a page that reopens the button calls it). */
  reset(): void {
    this.clearTimer();
    this.copied.set(false);
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
