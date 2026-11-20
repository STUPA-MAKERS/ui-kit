import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SHOWCASE_PAGES } from './pages';

type Theme = 'light' | 'dark';
type Contrast = 'normal' | 'more' | 'very-high';

/** The frame of the showcase: the page list and the switches for theme and contrast. */
@Component({
  selector: 'sc-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sc-nav" aria-label="Seiten">
      @for (page of pages; track page.path) {
        <a [routerLink]="page.path" routerLinkActive="sc-active">{{ page.title }}</a>
      }
      <span class="sc-gap"></span>
      <label>
        Thema
        <select [value]="theme()" (change)="theme.set(pick($event))">
          <option value="light">Hell</option>
          <option value="dark">Dunkel</option>
        </select>
      </label>
      <label>
        Kontrast
        <select [value]="contrast()" (change)="contrast.set(pick($event))">
          <option value="normal">Normal</option>
          <option value="more">Hoch</option>
          <option value="very-high">Sehr hoch</option>
        </select>
      </label>
    </nav>
    <main><router-outlet /></main>
  `,
  styles: `
    .sc-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border, currentColor);
    }
    .sc-gap {
      flex: 1;
    }
    .sc-active {
      font-weight: 600;
    }
    main {
      padding: 16px;
    }
  `,
})
export class ShowcaseComponent {
  protected readonly pages = SHOWCASE_PAGES;
  protected readonly theme = signal<Theme>('light');
  protected readonly contrast = signal<Contrast>('normal');

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      root.dataset['theme'] = this.theme();
      const contrast = this.contrast();
      root.dataset['contrast'] = contrast === 'normal' ? 'normal' : 'more';
      root.dataset['veryHighContrast'] = contrast === 'very-high' ? 'on' : 'off';
    });
  }

  protected pick<T extends string>(event: Event): T {
    return (event.target as HTMLSelectElement).value as T;
  }
}
