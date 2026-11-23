import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import type { ExternalEntry } from "./calendar.types";
import { registerUiKitTexts, UI_KIT_INTL } from "@stupa-makers/ui-kit";
import { UiKitTranslatePipe } from "@stupa-makers/ui-kit";
import {
  DialogComponent,
  FactsComponent,
  DialogBodyDirective,
} from "@stupa-makers/ui-kit";
import { spanText } from "./calendar.util";
import { UI_KIT_CALENDAR_TEXTS } from "./calendar.texts";

/**
 * The dialog of one entry of an external calendar (§ 000714): the title, the time, the
 * place, the name of the calendar and the description. It is read-only, because the
 * entry belongs to another system (§ 000723). On a phone the kit shows the dialog as a
 * bottom sheet.
 */
@Component({
  selector: "app-external-entry-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogBodyDirective,
    FactsComponent,
    DialogComponent,
    UiKitTranslatePipe,
  ],
  templateUrl: "./external-entry-view.component.html",
  styleUrl: "./external-entry-view.component.scss",
})
export class ExternalEntryViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_CALENDAR_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly open = input(false);
  readonly entry = input<ExternalEntry | null>(null);
  readonly closed = output<void>();

  readonly when = computed(() => {
    const e = this.entry();
    return e ? spanText(e, this.i18n.formatLocale()) : "";
  });
}
