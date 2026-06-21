/*
 * Public API of @stupa-makers/ui-kit.
 *
 * The MarkdownEditorComponent is deliberately NOT re-exported here — it pulls Tiptap
 * (hundreds of kB). Import it from the secondary entry point instead, so it stays in the
 * consumer's lazy chunk:  import { MarkdownEditorComponent } from '@stupa-makers/ui-kit/markdown-editor';
 */

// --- i18n decoupling (token + built-in DE/EN defaults + pipe) ---------------
export {
  UI_KIT_INTL,
  UI_KIT_DEFAULT_MESSAGES,
  DefaultUiKitIntl,
  provideUiKit,
  uiKitIntlFromLang,
  UiKitTranslatePipe,
} from './lib/intl';
export type {
  UiKitIntl,
  UiKitIntlOptions,
  UiKitMessages,
  UiKitTextKey,
  UiLang,
} from './lib/intl';

// --- loading overlay token --------------------------------------------------
export { UI_KIT_LOADING } from './lib/loading/loading.token';
export type { UiKitLoadingState } from './lib/loading/loading.token';

// --- components -------------------------------------------------------------
export { ButtonComponent } from './lib/button/button.component';
export type { ButtonVariant, ButtonSize } from './lib/button/button.component';
export { InputComponent } from './lib/input/input.component';
export { CheckboxComponent } from './lib/checkbox/checkbox.component';
export { SelectComponent } from './lib/select/select.component';
export type { SelectOption } from './lib/select/select.component';
export { DatepickerComponent } from './lib/datepicker/datepicker.component';
export { TimeInputComponent } from './lib/time-input/time-input.component';
export { DateRangeComponent } from './lib/datepicker/date-range.component';
export type { DateRange } from './lib/datepicker/date-range.component';
export { IconComponent } from './lib/icon/icon.component';
export type { IconName } from './lib/icon/icon.component';
export { CardComponent } from './lib/card/card.component';
export { BadgeComponent } from './lib/badge/badge.component';
export type { BadgeVariant } from './lib/badge/badge.component';
export { ConfigDiffComponent } from './lib/config-diff/config-diff.component';
export type {
  ConfigDiffData,
  ConfigDiffEntry,
  ConfigFieldChange,
} from './lib/config-diff/config-diff.types';
export { StepperComponent } from './lib/stepper/stepper.component';
export type { Step } from './lib/stepper/stepper.component';
export { DialogComponent } from './lib/dialog/dialog.component';
export { TableComponent } from './lib/table/table.component';
export type { Column } from './lib/table/table.component';
export { DataTableComponent } from './lib/data-table/data-table.component';
export type { ColumnDef } from './lib/data-table/data-table.component';
export { CellDirective } from './lib/data-table/cell.directive';
export { RowDetailDirective } from './lib/data-table/row-detail.directive';
export { CurrencyInputComponent } from './lib/currency-input/currency-input.component';
export { LoadingOverlayComponent } from './lib/loading-overlay/loading-overlay.component';
export { FilterBarComponent } from './lib/filter/filter-bar.component';
export { FilterFieldComponent } from './lib/filter/filter-field.component';
export { FilterRangeComponent } from './lib/filter/filter-range.component';
export { ToastComponent } from './lib/toast/toast.component';
export { ToastService } from './lib/toast/toast.service';
export type { Toast, ToastVariant } from './lib/toast/toast.service';
