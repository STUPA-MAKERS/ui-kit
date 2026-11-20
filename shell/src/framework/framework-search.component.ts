import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { liveSearch, UI_KIT_INTL } from '@stupa-makers/ui-kit';
import { of } from 'rxjs';

import { CommandPalette } from '../command-palette/command-palette.service';
import {
  CommandPaletteComponent,
  type PaletteGroup,
  type PaletteRow,
} from '../command-palette/command-palette.component';
import { FRAMEWORK, type SearchHit } from './framework';

/** The search port runs from this length on (STUPA-Workflow:000329). */
export const SEARCH_MIN = 2;
/** How long to wait after a keystroke before asking the port. */
const DEBOUNCE_MS = 180;
/** The most pages that show. */
const PAGES_MAX = 5;

interface SourceRow extends PaletteRow {
  readonly group: string;
}

/** `groups` with `row` added: to the last group when it has the same label, else in a new one. */
export function appendRow(groups: readonly PaletteGroup[], row: SourceRow): readonly PaletteGroup[] {
  const last = groups.at(-1);
  return last?.label === row.group
    ? [...groups.slice(0, -1), { label: last.label, rows: [...last.rows, row] }]
    : [...groups, { label: row.group, rows: [row] }];
}

/**
 * The search palette of the framework shell. It answers "take me to that page" and "take me
 * to that record" in one box. The pages are the entries of the config whose label holds the
 * query, at once. The records come from the `search` port, debounced, and a new query cancels
 * the one that is out. The `kind` of a hit is the label of its group, so the app gives it in
 * the UI language. Pages come first: they are instant and exact. §S/framework/shell/002261
 */
@Component({
  selector: 'app-framework-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommandPaletteComponent],
  template: `
    <app-command-palette
      [groups]="groups()"
      [query]="query()"
      [loading]="loading()"
      [minQuery]="min"
      (queryChange)="onQuery($event)"
    />
  `,
})
export class FrameworkSearchComponent {
  private readonly config = inject(FRAMEWORK);
  private readonly intl = inject(UI_KIT_INTL);
  private readonly router = inject(Router);

  protected readonly min = SEARCH_MIN;
  readonly query = signal('');
  private readonly hits = signal<readonly SearchHit[]>([]);

  private readonly search = liveSearch<readonly SearchHit[]>({
    minLength: SEARCH_MIN,
    debounceMs: DEBOUNCE_MS,
    run: (q) => this.config.ports.search?.(q) ?? of([]),
    result: (hits) => this.hits.set(hits),
    reset: () => this.hits.set([]),
    error: () => this.hits.set([]),
  });
  readonly loading = this.search.pending;

  private readonly pageRows = computed<readonly SourceRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const group = this.intl.translate('palette.pages');
    return this.config
      .nav()
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, PAGES_MAX)
      .map((item) => ({
        id: `page:${item.path}`,
        group,
        title: item.label,
        icon: item.icon,
        link: item.path,
      }));
  });

  private readonly recordRows = computed<readonly SourceRow[]>(() =>
    this.hits().map((hit, i) => {
      const url = this.router.serializeUrl(
        this.router.createUrlTree([...hit.link.commands], {
          queryParams: hit.link.query,
          fragment: hit.link.fragment,
        }),
      );
      return {
        id: `${hit.kind}:${i}:${url}`,
        group: hit.kind,
        title: hit.title,
        subtitle: hit.sub ?? null,
        icon: hit.icon,
        link: url,
      };
    }),
  );

  readonly groups = computed<readonly PaletteGroup[]>(() =>
    [...this.pageRows(), ...this.recordRows()].reduce<readonly PaletteGroup[]>(appendRow, []),
  );

  /** Each opening starts with an empty field and no answer of the last search. */
  constructor() {
    inject(CommandPalette)
      .opened$.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.query.set('');
        this.search.sync('');
        this.hits.set([]);
      });
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.search.set(value);
  }
}
