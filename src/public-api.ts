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
  UI_KIT_FORMAT_LOCALES,
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

// --- layout breakpoints (same values as styles/_breakpoints.scss) ------------
export { BREAKPOINTS, MEDIA, widthClass } from './lib/breakpoints/breakpoints';
export type { WidthClass } from './lib/breakpoints/breakpoints';

// --- loading overlay token --------------------------------------------------
export { UI_KIT_LOADING } from './lib/loading/loading.token';
export type { UiKitLoadingState } from './lib/loading/loading.token';

// --- components -------------------------------------------------------------
export { ButtonComponent, buttonLook } from './lib/button/button.component';
export type { ButtonVariant, ButtonSize, ButtonLook } from './lib/button/button.component';
export { ButtonLinkComponent } from './lib/button/button-link.component';
export { SwitchComponent } from './lib/switch/switch.component';
export { SegmentedComponent } from './lib/segmented/segmented.component';
export type { SegmentedOption } from './lib/segmented/segmented.component';
export { TabsComponent } from './lib/tabs/tabs.component';
export type { TabItem } from './lib/tabs/tabs.component';
export { InputComponent } from './lib/input/input.component';
export { CheckboxComponent } from './lib/checkbox/checkbox.component';
export { SelectComponent } from './lib/select/select.component';
export type { SelectOption } from './lib/select/select.component';
export { DatepickerComponent } from './lib/datepicker/datepicker.component';
export { TimeInputComponent } from './lib/time-input/time-input.component';
export { DateRangeComponent } from './lib/datepicker/date-range.component';
export type { DateRange } from './lib/datepicker/date-range.component';
export { IconComponent } from './lib/icon/icon.component';
export type { IconName, IconShape } from './lib/icon/icon.component';
export { ICON_NAMES, iconShapes } from './lib/icon/icons';
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
export type { Step, StepperOrientation } from './lib/stepper/stepper.component';
export { DialogComponent } from './lib/dialog/dialog.component';
export { FileViewerComponent } from './lib/file-viewer/file-viewer.component';
export { fileViewerKind } from './lib/file-viewer/file-viewer.types';
export type { FileViewerItem, FileViewerKind } from './lib/file-viewer/file-viewer.types';
export { TableComponent } from './lib/table/table.component';
export type { Column } from './lib/table/table.component';
export { DataTableComponent } from './lib/data-table/data-table.component';
export type { ColumnDef, SortState } from './lib/data-table/data-table.component';
export { CellDirective } from './lib/data-table/cell.directive';
export { FootCellDirective } from './lib/data-table/foot-cell.directive';
export { RowDetailDirective } from './lib/data-table/row-detail.directive';
export { CurrencyInputComponent } from './lib/currency-input/currency-input.component';
export {
  MONEY_MAX_DECIMALS,
  type MoneyParseResult,
  parseMoney,
  parseMoneyModel,
} from './lib/currency-input/parse-money';
export { LoadingOverlayComponent } from './lib/loading-overlay/loading-overlay.component';
export { ChipComponent } from './lib/chip/chip.component';
export type { ChipRemoveSize } from './lib/chip/chip.component';
export { ChipGroupComponent } from './lib/chip/chip-group.component';
export type { ChipOption } from './lib/chip/chip-group.component';
export { CopyButtonComponent } from './lib/copy/copy-button.component';
export { HighlightComponent } from './lib/highlight/highlight.component';
export { highlight, type TextPart } from './lib/highlight/highlight';
export { LockedFieldComponent } from './lib/locked-field/locked-field.component';
export { InfiniteScrollDirective } from './lib/infinite-scroll/infinite-scroll.directive';
export { AutocompleteComponent } from './lib/autocomplete/autocomplete.component';
export { TextareaComponent } from './lib/textarea/textarea.component';
export { FilePickerComponent } from './lib/file-picker/file-picker.component';
export { MoveButtonsComponent } from './lib/move-buttons/move-buttons.component';
export { moveItem } from './lib/move-buttons/move-item';
export {
  FOCUSABLE_SELECTOR,
  focusableIn,
  lockBodyScroll,
  trapTab,
  type TrapTabOptions,
} from './lib/focus/focus-trap';
export {
  anchorOutOfView,
  placeBelow,
  showInTopLayer,
  watchAnchoredPopover,
  type AnchoredPopoverWatch,
  type PlaceBelowOptions,
  type PopoverPlace,
} from './lib/popover/anchored-popover';
export { nowSignal } from './lib/signals/now-signal';
export { matchesMedia, mediaQuery } from './lib/signals/media-query';
export {
  elementSize,
  observeElementSize,
  type ElementSize,
  type ElementSizeBox,
} from './lib/signals/element-size';
export { copyText } from './lib/copy/copy-text';
export { ToastComponent } from './lib/toast/toast.component';
export { ToastService } from './lib/toast/toast.service';
export type { Toast, ToastVariant } from './lib/toast/toast.service';
