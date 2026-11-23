import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import {
  registerUiKitTexts,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from "@stupa-makers/ui-kit";
import { planMoney } from "./plan-format";
import { cents } from "./plan-table.types";
import { UI_KIT_PLAN_TABLE_TEXTS } from "./plan-table.texts";

/**
 * The sums of a plan version, a copy of the figures of the app Haushaltsplan page
 * (S/framework/views/002279): Einnahmen, Ausgaben and the difference, which is red and says
 * "Nicht ausgeglichen" while the two sides differ. On a phone the difference takes the whole row.
 */
@Component({
  selector: "app-plan-figures-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe],
  templateUrl: "./plan-figures-view.component.html",
  styleUrl: "./plan-figures-view.component.scss",
})
export class PlanFiguresViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_PLAN_TABLE_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  /** The sum of the Ansätze of the income side. */
  readonly income = input.required<number>();
  /** The sum of the Ansätze of the expense side. */
  readonly expense = input.required<number>();

  readonly difference = computed(
    () => (cents(this.income()) - cents(this.expense())) / 100,
  );
  readonly balanced = computed(() => this.difference() === 0);

  money(value: number): string {
    return planMoney(value, this.i18n.formatLocale());
  }
}
