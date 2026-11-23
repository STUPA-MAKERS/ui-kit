import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CellDirective,
  type ColumnDef,
  CurrencyInputComponent,
  DataTableComponent,
  IconComponent,
  registerUiKitTexts,
  StatusTextComponent,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from "@stupa-makers/ui-kit";
import { planMoney, sumDigits } from "./plan-format";
import { cents, type PlanRow } from "./plan-table.types";
import { UI_KIT_PLAN_TABLE_TEXTS } from "./plan-table.texts";

/** An amount that a person typed in a field of the table. */
export interface PlanAmountEdit {
  readonly row: PlanRow;
  readonly value: string | null;
}

/**
 * The table of the lines of a plan version, a copy of the table of the app Haushaltsplan page
 * (S/framework/views/002279): one row per Kostenstelle with its path and its marks, the Ansatz
 * and the compared amounts. `nested` indents the rows of the tree and gives a row with children
 * its chevron. With `fields` a line without children has an amount field; the sum of a parent
 * stands where the field would be (001020). The view saves nothing: it emits the typed amount
 * and the save when the field loses the focus or takes Enter (002256).
 */
@Component({
  selector: "app-plan-table-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CellDirective,
    CurrencyInputComponent,
    DataTableComponent,
    FormsModule,
    IconComponent,
    StatusTextComponent,
    UiKitTranslatePipe,
  ],
  templateUrl: "./plan-table-view.component.html",
  styleUrl: "./plan-table-view.component.scss",
})
export class PlanTableViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_PLAN_TABLE_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly rows = input.required<readonly PlanRow[]>();
  readonly columns = input.required<ColumnDef[]>();
  /** The rows stand as a tree: indented, a row with children has a chevron. */
  readonly nested = input(false);
  readonly loading = input(false);
  /** The rows whose children show. */
  readonly opened = input<ReadonlySet<string>>(new Set<string>());
  /** A search runs: the tree shows every hit, and the chevrons are off. */
  readonly searching = input(false);
  /** A line without children has an amount field. */
  readonly fields = input(false);
  /** The amount fields take the wide form (an Ansatz of ten million or more). */
  readonly wideFields = input(false);
  /** The version is a Nachtrag: the change compares with the version before, not the year before. */
  readonly nachtrag = input(false);
  /** The amount a field shows: the text a person types, else the saved amount. */
  readonly fieldValue = input<(row: PlanRow) => string | number>(
    (row) => row.amount,
  );

  /** A row was pressed. */
  readonly rowClick = output<PlanRow>();
  /** The chevron of a row was pressed. */
  readonly toggle = output<PlanRow>();
  /** A person typed an amount. */
  readonly edit = output<PlanAmountEdit>();
  /** An amount field lost the focus or took Enter: save its amount. */
  readonly save = output<PlanRow>();

  private readonly locale = computed(() => this.i18n.formatLocale());

  readonly rowId = (row: unknown): string => (row as PlanRow).id;

  asRow(value: unknown): PlanRow {
    return value as PlanRow;
  }

  isOpen(row: PlanRow): boolean {
    return this.opened().has(row.id);
  }

  money(value: number | null): string {
    return planMoney(value, this.locale());
  }

  sumDigits(value: number): string {
    return sumDigits(value, this.locale());
  }

  /** The Ansatz against the version before for a Nachtrag, else against the year before. */
  changeText(row: PlanRow): string {
    const against = this.nachtrag() ? (row.base ?? 0) : row.prev;
    const change = against === null ? 0 : cents(row.amount) - cents(against);
    if (change === 0) return "–";
    return (change > 0 ? "+" : "−") + this.money(Math.abs(change) / 100);
  }

  onToggle(event: Event, row: PlanRow): void {
    event.stopPropagation();
    this.toggle.emit(row);
  }

  /** Enter in an amount field saves the amount and does not open the row. */
  onEnter(event: Event, row: PlanRow): void {
    event.stopPropagation();
    this.save.emit(row);
  }
}
