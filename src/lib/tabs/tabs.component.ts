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

/** One tab. A tab shows only its label, never a count (app spec 000560). */
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * Tab bar of a page or a detail pane (Antrag | Verlauf | Kommentare). It follows the
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

  select(tab: TabItem): void {
    if (tab.disabled || tab.id === this.active()) return;
    this.active.set(tab.id);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    const next = this.keyTarget(event.key, index);
    if (next === null) return;
    event.preventDefault();
    if (next < 0) return;
    this.select(tabs[next]);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  /** Index of the next enabled tab from `from` in direction `dir`, with wrap-around. */
  private step(from: number, dir: 1 | -1): number {
    const tabs = this.tabs();
    const n = tabs.length;
    const ring = Array.from({ length: n }, (_, i) => (((from + dir * (i + 1)) % n) + n) % n);
    return ring.find((idx) => !tabs[idx].disabled) ?? -1;
  }

  /** The index a key moves to (-1 when no tab is enabled), or null for another key. */
  private keyTarget(key: string, index: number): number | null {
    switch (key) {
      case 'ArrowRight':
        return this.step(index, 1);
      case 'ArrowLeft':
        return this.step(index, -1);
      case 'Home':
        return this.step(-1, 1);
      case 'End':
        return this.step(this.tabs().length, -1);
      default:
        return null;
    }
  }
}
