import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  ButtonComponent,
  ButtonGroupComponent,
  EmptyStateComponent,
  IconComponent,
  InfiniteScrollDirective,
  ListGroupComponent,
  ListItemComponent,
  MEDIA,
  SkeletonComponent,
  UI_KIT_INTL,
  loadedData,
  mediaQuery,
  type LoadState,
} from '@stupa-makers/ui-kit';

import { activityDays, type ActivityDay, type ActivityEntry } from './activity.types';

/**
 * The activity view (002280): a copy of the list of the page "Aktivität" of STUPA-Workflow.
 * The entries by day, newest first; a row names the item, the actor and the change and the
 * time, and opens the item. A new entry has a dot on its icon. While the first page loads, the
 * view shows grey rows; an empty list and a failed load show the face (002405). The toast of a
 * failed load is the job of the page. The next entries load at the end of the list or by the
 * button below it (`more`).
 */
@Component({
  selector: 'app-activity-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    ButtonGroupComponent,
    EmptyStateComponent,
    IconComponent,
    InfiniteScrollDirective,
    ListGroupComponent,
    ListItemComponent,
    SkeletonComponent,
  ],
  templateUrl: './activity-view.component.html',
  styleUrl: './activity-view.component.scss',
})
export class ActivityViewComponent {
  /** The entries; `ready.more` shows the next step at the end of the list. */
  readonly entries = input.required<LoadState<readonly ActivityEntry[]>>();
  /** The next entries are loading. */
  readonly loadingMore = input(false);
  /** The text under the heading of the empty face. */
  readonly emptyBody = input<string | null>(null);

  /** The person reached the end of the list or pressed "Mehr laden". */
  readonly more = output<void>();

  protected readonly intl = inject(UI_KIT_INTL);
  protected readonly phone = mediaQuery(MEDIA.phone);

  protected readonly days = computed<readonly ActivityDay[]>(() =>
    activityDays(loadedData(this.entries()) ?? []),
  );
  protected readonly hasMore = computed(() => {
    const e = this.entries();
    return e.state === 'ready' && !!e.more;
  });

  protected sub(e: ActivityEntry): string {
    return e.actor ? `${e.actor.name} · ${e.change}` : e.change;
  }

  protected loadMore(): void {
    if (this.loadingMore() || this.entries().state !== 'ready') return;
    this.more.emit();
  }
}
