import { _IdGenerator } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  IconComponent,
  SkeletonComponent,
  ToastService,
  UI_KIT_INTL,
  type Action,
  type LoadState,
  type RouteLink,
  type ScreenHead,
} from '@stupa-makers/ui-kit';

import { ScreenBodyDirective } from '../detail-screen/detail-screen.component';

/** One step of the crumb trail above the title ("Start › Öffentliche Protokolle"). */
export interface PublicCrumb {
  readonly label: string;
  /** Without a link the step is the current page. */
  readonly link?: RouteLink;
}

/**
 * The public screen (002245): a copy of the public pages of STUPA-Workflow (Erklärung zur
 * Barrierefreiheit, Öffentliche Protokolle, Beschlüsse). The shell draws the public frame (header
 * and footer, 001356); the screen draws the column: the crumb trail, the title in 28 px (000677),
 * the lede, the pill buttons and the body. `narrow` is the text column of 45rem, `wide` the
 * column of 67.5rem of the lists; both are centred (000201).
 */
@Component({
  selector: 'app-public-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, EmptyStateComponent, IconComponent, SkeletonComponent],
  templateUrl: './public-screen.component.html',
  styleUrl: './public-screen.component.scss',
  host: { '[class.pub--wide]': "width() === 'wide'" },
})
export class PublicScreenComponent {
  readonly head = input.required<ScreenHead>();
  readonly state = input<LoadState<unknown>>({ state: 'ready', data: null });
  /** The line under the title. */
  readonly lede = input<string | null>(null);
  readonly crumbs = input<readonly PublicCrumb[]>([]);
  /** The pill buttons under the lede ("Beschlüsse"): a route is a link, else an (action). */
  readonly actions = input<readonly Action[]>([]);
  readonly width = input<'narrow' | 'wide'>('narrow');
  /** The rows of the skeleton while it loads (Barrierefreiheit 6, Protokolle 4). */
  readonly skeletonRows = input(6);
  /** The pill button in the empty state ("Zur Startseite"). */
  readonly emptyAction = input<Action | null>(null);

  readonly acted = output<{ readonly key: string }>({ alias: 'action' });

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly toasts = inject(ToastService);
  protected readonly body = contentChild(ScreenBodyDirective);
  protected readonly titleId = inject(_IdGenerator).getId('app-public-screen-title-');

  protected readonly empty = computed(() => {
    const s = this.state();
    return s.state === 'empty' ? s : null;
  });
  private readonly errorToast = signal<number | null>(null);

  constructor() {
    this.toastOnError();
  }

  /** A load error is a toast with Erneut versuchen, as `app-load-error` of the app shows it. */
  private toastOnError(): void {
    const hide = (): void => {
      const id = this.errorToast();
      if (id !== null) this.toasts.dismiss(id);
      this.errorToast.set(null);
    };
    effect(() => {
      const s = this.state();
      untracked(() => {
        if (s.state !== 'error') return hide();
        if (this.errorToast() !== null) return;
        this.errorToast.set(
          this.toasts.showAction({
            message: s.message,
            action: this.intl.translate('note.retry'),
            actionIcon: 'reload',
            variant: 'danger',
            timeout: 0,
            closed: (how) => {
              this.errorToast.set(null);
              if (how === 'action') s.retry();
            },
          }),
        );
      });
    });
    inject(DestroyRef).onDestroy(hide);
  }
}
