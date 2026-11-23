import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  type UiKitTextKey,
  EmptyStateComponent,
  IconComponent,
  MetaLineComponent,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import type { TransitionListRow, TransitionLists } from './flow-editor.types';

/**
 * Incoming and outgoing transitions of the selected state, under the state settings in
 * the inspector. A row click selects the transition.
 */
@Component({
  selector: 'app-transition-lists-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetaLineComponent, EmptyStateComponent, UiKitTranslatePipe, IconComponent],
  templateUrl: './transition-lists-view.component.html',
  styleUrl: './transition-lists-view.component.scss',
})
export class TransitionListsViewComponent {
  readonly lists = input.required<TransitionLists>();

  readonly selectTransition = output<number>();

  /** The two lists with their headings, incoming first. */
  protected readonly columns = computed<
    readonly {
      readonly key: string;
      readonly title: UiKitTextKey;
      readonly rows: readonly TransitionListRow[];
    }[]
  >(() => [
    { key: 'in', title: 'admin.flow.list.incoming', rows: this.lists().incoming },
    { key: 'out', title: 'admin.flow.list.outgoing', rows: this.lists().outgoing },
  ]);
}
