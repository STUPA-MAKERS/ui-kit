import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { PublicAppointment, PublicMeeting } from './calendar.types';
import { UI_KIT_INTL } from '@stupa-makers/ui-kit';
import { UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import {
  ButtonComponent,
  ButtonGroupComponent,
  DialogComponent,
  IconComponent,
  FactsComponent,
  DialogBodyDirective,
} from '@stupa-makers/ui-kit';
import { spanText } from './calendar.util';

/** An entry of the public calendar with its public fields: a Termin or a meeting. */
export type PublicEntry =
  | { readonly kind: 'appointment'; readonly data: PublicAppointment }
  | { readonly kind: 'meeting'; readonly data: PublicMeeting };

/**
 * The dialog of one entry of the public calendar (§ 000730-000732). A public Termin
 * shows its time, its place and its description. A public meeting shows its time, its
 * Gremium, the titles of its TOPs that are not internal and, when its public protocol
 * exists, a link to it. The dialog never shows a person. On a phone the kit shows the
 * dialog as a bottom sheet.
 */
@Component({
  selector: 'app-public-entry-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogBodyDirective,
    FactsComponent,
    ButtonComponent,
    ButtonGroupComponent,
    DialogComponent,
    IconComponent,
    UiKitTranslatePipe,
  ],
  templateUrl: './public-entry-view.component.html',
  styleUrls: ['./external-entry-view.component.scss', './public-entry-view.component.scss'],
})
export class PublicEntryViewComponent {
  private readonly i18n = inject(UI_KIT_INTL);

  readonly open = input(false);
  readonly entry = input<PublicEntry | null>(null);
  readonly closed = output<void>();
  /** Open the public protocol of a meeting: the app routes to it. */
  readonly protocolOpen = output<string>();

  readonly title = computed(() => this.entry()?.data.title ?? '');
  readonly when = computed(() => {
    const e = this.entry();
    if (!e) return '';
    const span =
      e.kind === 'meeting'
        ? { startsOn: e.data.day, endsOn: e.data.day, startTime: e.data.startTime, endTime: e.data.endTime }
        : e.data;
    return spanText(span, this.i18n.formatLocale());
  });

  /** Open the public protocol of the meeting. */
  openProtocol(id: string): void {
    this.closed.emit();
    this.protocolOpen.emit(id);
  }
}
