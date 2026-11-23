import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  ButtonGroupComponent,
  I18nInputComponent,
  type I18nMap,
  IconComponent,
  SelectFieldComponent,
  type SelectOption,
  SwitchComponent,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import type { TransitionDef } from './flow-editor.types';
import { FlowColorViewComponent } from './flow-color-view.component';

/**
 * Inspector panel for the selected transition. It edits endpoints, labels, colour, the
 * flags (automatic, requires action) and the result branch. The guard and the actions
 * follow it in the panel (`app-transition-detail`).
 */
@Component({
  selector: 'app-transition-inspector-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    I18nInputComponent,
    FormsModule,
    UiKitTranslatePipe,
    ButtonComponent,
    ButtonGroupComponent,
    IconComponent,
    SelectFieldComponent,
    SwitchComponent,
    FlowColorViewComponent,
  ],
  templateUrl: './transition-inspector-view.component.html',
  styleUrl: './transition-inspector-view.component.scss',
})
export class TransitionInspectorViewComponent {
  readonly transition = input.required<TransitionDef>();
  readonly stateOptions = input.required<SelectOption[]>();
  /** Result branches of the source state. An empty list hides the branch select. */
  readonly branchOptions = input.required<SelectOption[]>();

  readonly fromChange = output<string>();
  readonly toChange = output<string>();
  readonly labelChange = output<I18nMap>();
  readonly colorChange = output<string>();
  readonly automaticChange = output<boolean>();
  readonly requiresActionChange = output<boolean>();
  readonly branchChange = output<string>();
  readonly remove = output<void>();
}
