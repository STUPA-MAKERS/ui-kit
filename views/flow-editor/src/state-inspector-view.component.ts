import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  I18nInputComponent,
  type I18nMap,
  InputComponent,
  MoveButtonsComponent,
  registerUiKitTexts,
  SelectFieldComponent,
  type SelectOption,
  SwitchComponent,
  TruncatedDirective,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import type { StateDef } from './flow-editor.types';
import { FlowColorViewComponent } from './flow-color-view.component';
import { UI_KIT_FLOW_EDITOR_TEXTS } from './flow-editor.texts';

/** Row of the guard priority stack. The parent computes the label. */
export interface GuardPriorityRow {
  readonly sig: string;
  readonly label: string;
}

/**
 * Inspector panel for the selected state. It edits key, labels, colour, the flags
 * (start, editing allowed, terminal, approved, denied), the kind with its gremium and the guard priority
 * of the exits.
 */
@Component({
  selector: 'app-state-inspector-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MoveButtonsComponent,
    I18nInputComponent,
    TruncatedDirective,
    FormsModule,
    UiKitTranslatePipe,
    InputComponent,
    SelectFieldComponent,
    SwitchComponent,
    FlowColorViewComponent,
  ],
  templateUrl: './state-inspector-view.component.html',
  styleUrl: './state-inspector-view.component.scss',
})
export class StateInspectorViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_FLOW_EDITOR_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);

  readonly state = input.required<StateDef>();
  readonly kindOptions = input.required<SelectOption[]>();
  readonly gremiumOptions = input.required<SelectOption[]>();
  /** Guard priority rows. The stack appears for normal states with two or more groups. */
  readonly guardGroups = input.required<GuardPriorityRow[]>();

  readonly keyChange = output<string>();
  readonly labelChange = output<I18nMap>();
  readonly colorChange = output<string>();
  readonly makeInitial = output<void>();
  readonly editAllowedChange = output<boolean>();
  readonly terminalChange = output<boolean>();
  /** The flag `Bewilligt` or `Abgelehnt` of a normal state (spec 000571). */
  readonly outcomeChange = output<{ outcome: 'approved' | 'denied'; on: boolean }>();
  /** "Ziel für ersetzte Anträge" (001722) was switched. */
  readonly replacedTargetChange = output<boolean>();
  readonly kindChange = output<string>();
  readonly gremiumChange = output<string>();
  readonly gremiumSourceChange = output<'fixed' | 'budget'>();

  /** The gremium source of a vote state: `budget`, else a fixed gremium. */
  protected readonly gremiumSource = computed<'fixed' | 'budget'>(() =>
    this.state().config?.gremiumSource === 'budget' ? 'budget' : 'fixed',
  );

  protected gremiumSourceOptions(): SelectOption[] {
    return [
      { value: 'fixed', label: this.i18n.translate('admin.flow.cfgGremiumSourceFixed') },
      { value: 'budget', label: this.i18n.translate('admin.flow.cfgGremiumSourceBudget') },
    ];
  }
  readonly guardMove = output<{ sig: string; dir: -1 | 1 }>();
}
