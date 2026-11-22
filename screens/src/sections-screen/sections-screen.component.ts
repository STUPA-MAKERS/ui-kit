import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  FabComponent,
  PageHeaderComponent,
  placeActions,
  type Action,
  type ScreenHead,
} from '@stupa-makers/ui-kit';

/**
 * The sections screen (002259): a page of the detail pane with a head and a column of sections
 * (Gruppen-Zuordnung, Backups). The sections are projected content: record sections (002258),
 * kit sections and notes. Each section carries its own load state, so the screen has none.
 */
@Component({
  selector: 'app-sections-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, FabComponent, PageHeaderComponent],
  templateUrl: './sections-screen.component.html',
  styleUrl: './sections-screen.component.scss',
})
export class SectionsScreenComponent {
  readonly head = input.required<ScreenHead>();
  readonly actions = input<readonly Action[]>([]);

  readonly acted = output<{ readonly key: string }>({ alias: 'action' });

  private readonly router = inject(Router);
  protected readonly placed = computed(() => placeActions(this.actions(), 'wide'));

  /** An action with a route navigates; every other action is emitted with its key. */
  protected run(a: Action): void {
    if (a.route) {
      void this.router.navigate([...a.route.commands], { queryParams: a.route.query });
      return;
    }
    this.acted.emit({ key: a.key });
  }
}
