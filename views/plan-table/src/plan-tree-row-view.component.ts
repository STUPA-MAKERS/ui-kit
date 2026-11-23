import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import {
  IconComponent,
  registerUiKitTexts,
  StatusTextComponent,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from "@stupa-makers/ui-kit";
import { planMoney } from "./plan-format";
import type { PlanRow } from "./plan-table.types";
import { UI_KIT_PLAN_TABLE_TEXTS } from "./plan-table.texts";

/**
 * One row of the plan tree, a copy of the tree row of the app Haushaltsplan page
 * (S/framework/views/002279, 001130): the chevron of a row with children, the name in up to two
 * lines, the inactive mark and the Ansatz. A line for each level above the row runs through the
 * column of the chevrons; `--bp-g0` of the tree sets the level of the first line. The host is
 * the row, so the tree around it sets its gaps.
 */
@Component({
  selector: "app-plan-tree-row-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StatusTextComponent, UiKitTranslatePipe],
  templateUrl: "./plan-tree-row-view.component.html",
  styleUrl: "./plan-tree-row-view.component.scss",
  host: {
    class: "tn",
    "[class.tn--on]": "selected()",
    "[style.--tn-depth]": "row().depth + base()",
  },
})
export class PlanTreeRowViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_PLAN_TABLE_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly row = input.required<PlanRow>();
  /** The depth of the first level: 1 in the list below the top-level row, 0 on a phone. */
  readonly base = input(1);
  readonly selected = input(false);
  readonly open = input(false);
  /** A search runs: the tree shows every hit, and the chevron is off. */
  readonly searching = input(false);

  /** The chevron was pressed. */
  readonly toggle = output<PlanRow>();
  /** The row was pressed. */
  readonly pick = output<PlanRow>();

  readonly amount = computed(() =>
    planMoney(this.row().amount, this.i18n.formatLocale()),
  );
}
