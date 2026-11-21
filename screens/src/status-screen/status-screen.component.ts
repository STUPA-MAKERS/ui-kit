import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  ButtonGroupComponent,
  ButtonLinkComponent,
  IconComponent,
  type Action,
  type IconName,
} from '@stupa-makers/ui-kit';

/** What went wrong: the code and the icon of the screen follow from it. */
export type StatusKind = 'not-found' | 'forbidden' | 'error' | 'offline';

const LOOK: Readonly<
  Record<StatusKind, { readonly code: string | null; readonly icon: IconName }>
> = {
  'not-found': { code: '404', icon: 'search' },
  forbidden: { code: '403', icon: 'lock' },
  error: { code: '500', icon: 'alert' },
  offline: { code: null, icon: 'cloud-off' },
};

/**
 * The status screen (002246): a copy of the error pages of STUPA-Workflow (403, 404). One
 * block in the middle of the page: the code, the heading with its icon, one sentence and the
 * ways out as one button group (the first filled, the others tonal). The shell draws the frame
 * around it (rail or public bar).
 */
@Component({
  selector: 'app-status-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonComponent, ButtonGroupComponent, ButtonLinkComponent, IconComponent],
  templateUrl: './status-screen.component.html',
  styleUrl: './status-screen.component.scss',
})
export class StatusScreenComponent {
  readonly kind = input.required<StatusKind>();
  readonly heading = input.required<string>();
  readonly body = input<string | null>(null);
  readonly actions = input<readonly Action[]>([]);

  readonly acted = output<{ readonly key: string }>({ alias: 'action' });

  protected readonly look = computed(() => LOOK[this.kind()]);
}
