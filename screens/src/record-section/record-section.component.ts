import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  ButtonGroupComponent,
  EmptyStateComponent,
  IconComponent,
  ListItemComponent,
  SectionComponent,
  SkeletonComponent,
  UI_KIT_INTL,
  loadedData,
  type Action,
  type ListRow,
  type LoadState,
} from '@stupa-makers/ui-kit';
import { errorToastOn } from '../error-toast';
import { ScreenListFootDirective, ScreenRecordDirective } from '../records-screen/records-screen.component';

/**
 * The record section (002258): one headed row group of records with its own load state, in a
 * screen or in an editor (the three lists of Gruppen-Zuordnung, the list of Backups, the
 * Versionsverlauf of the form and flow editors). The heading with its actions, the skeleton rows,
 * the small empty face, the load error as a toast and the rows.
 */
@Component({
  selector: 'app-record-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ButtonComponent,
    ButtonGroupComponent,
    EmptyStateComponent,
    IconComponent,
    ListItemComponent,
    SectionComponent,
    SkeletonComponent,
  ],
  templateUrl: './record-section.component.html',
  styleUrl: './record-section.component.scss',
})
export class RecordSectionComponent {
  readonly heading = input.required<string>();
  readonly level = input<2 | 3>(2);
  readonly rows = input.required<LoadState<readonly ListRow[]>>();
  /** Buttons at the end of the heading row (Anlegen); the heading is their accessible suffix. */
  readonly actions = input<readonly Action[]>([]);
  /** The name of the list for screen readers; without it, the heading. */
  readonly listLabel = input<string | null>(null);
  /** `records`: the denser row group of the record tables (`rowgroup--records`). */
  readonly variant = input<'rows' | 'records'>('rows');
  /** The rows have an order (versions): the list is an `ol`. */
  readonly ordered = input(false);
  /** A load error keeps the rows or the empty state that showed before. */
  readonly keepOnError = input(true);
  /** Grey rows while the first load runs. */
  readonly skeleton = input(3);

  readonly acted = output<{ readonly key: string }>({ alias: 'action' });

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly router = inject(Router);
  protected readonly recordSlot = contentChild(ScreenRecordDirective);
  protected readonly footSlot = contentChild(ScreenListFootDirective);
  private readonly settled = signal<LoadState<readonly ListRow[]> | null>(null);
  protected readonly shown = computed<LoadState<readonly ListRow[]> | null>(() => {
    const r = this.rows();
    if (r.state === 'error') return this.keepOnError() ? this.settled() : null;
    return r;
  });
  protected readonly data = computed(() => {
    const r = this.shown();
    return r ? (loadedData(r) ?? []) : [];
  });
  /** A load error with no rows on screen: the face shows the error text (002405). */
  protected readonly failed = computed(() => {
    const r = this.rows();
    return r.state === 'error' && this.data().length === 0 ? r.message : null;
  });
  protected readonly firstLoad = computed(
    () => this.rows().state === 'loading' && this.data().length === 0,
  );
  protected readonly label = computed(() => this.listLabel() ?? this.heading());

  constructor() {
    effect(() => {
      const r = this.rows();
      if (r.state === 'ready' || r.state === 'empty') untracked(() => this.settled.set(r));
    });
    errorToastOn(() => this.rows());
  }

  /** An action with a route navigates; every other action is emitted with its key. */
  protected run(a: Action): void {
    if (a.route) {
      void this.router.navigate([...a.route.commands], { queryParams: a.route.query });
      return;
    }
    this.acted.emit({ key: a.key });
  }
}
