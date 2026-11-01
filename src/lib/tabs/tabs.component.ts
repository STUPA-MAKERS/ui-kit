import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
} from '@angular/core';

let nextId = 0;

/** One tab. `count` shows a number after the label, for example "Verlauf 4". */
export interface TabItem {
  id: string;
  label: string;
  count?: number | null;
  disabled?: boolean;
}

/**
 * Tab bar of a page or a detail pane (Antrag | Verlauf 4 | Kommentare 2). It follows the
 * WAI-ARIA tabs pattern with automatic activation: one tab stop, the arrow keys move to
 * the next tab and select it, Home and End jump to the ends.
 *
 * The component draws only the bar. The page renders the panel of the active tab and
 * gives it `id="{{ panelId(tab) }}"` and `role="tabpanel"`, so `aria-controls` points to it:
 *
 * `<app-tabs #t ariaLabel="Antrag" [tabs]="tabs" [(active)]="tab" />`
 * `<section role="tabpanel" [id]="t.panelId(tab())" [attr.aria-labelledby]="t.tabId(tab())">`
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tabs = input<readonly TabItem[]>([]);
  readonly active = model<string | null>(null);
  readonly ariaLabel = input('');
  /** Prefix of the element ids. Set it when one page shows two tab bars. */
  readonly idPrefix = input(`app-tabs-${nextId++}`);

  /** The active tab; with no valid `active` the first enabled tab. */
  protected readonly current = computed(() => {
    const tabs = this.tabs();
    const hit = tabs.find((t) => t.id === this.active() && !t.disabled);
    return (hit ?? tabs.find((t) => !t.disabled))?.id ?? null;
  });

  tabId(id: string | null): string {
    return `${this.idPrefix()}-tab-${id ?? ''}`;
  }

  panelId(id: string | null): string {
    return `${this.idPrefix()}-panel-${id ?? ''}`;
  }

  /**
   * The accessible name of a tab with a count, for example "Verlauf 4". The label and the
   * count are two spans with only a CSS gap between them, so the name from the content
   * would be "Verlauf4". A tab without a count takes its name from the content.
   */
  accessibleName(tab: TabItem): string | null {
    return tab.count === null || tab.count === undefined ? null : `${tab.label} ${tab.count}`;
  }

  select(tab: TabItem): void {
    if (tab.disabled || tab.id === this.active()) return;
    this.active.set(tab.id);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
        next = this.step(index, 1);
        break;
      case 'ArrowLeft':
        next = this.step(index, -1);
        break;
      case 'Home':
        next = this.step(-1, 1);
        break;
      case 'End':
        next = this.step(tabs.length, -1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next < 0) return;
    this.select(tabs[next]);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  /** Index of the next enabled tab from `from` in direction `dir`, with wrap-around. */
  private step(from: number, dir: 1 | -1): number {
    const tabs = this.tabs();
    const n = tabs.length;
    for (let i = 1; i <= n; i++) {
      const idx = (((from + dir * i) % n) + n) % n;
      if (!tabs[idx].disabled) return idx;
    }
    return -1;
  }
}
