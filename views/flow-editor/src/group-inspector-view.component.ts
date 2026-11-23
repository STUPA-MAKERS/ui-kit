import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  ButtonGroupComponent,
  InputComponent,
  registerUiKitTexts,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import type { FlowGroup } from './flow-editor.types';
import { FlowColorViewComponent } from './flow-color-view.component';
import { UI_KIT_FLOW_EDITOR_TEXTS } from './flow-editor.texts';

/** Inspector panel for the group that is currently open (drilled into). */
@Component({
  selector: 'app-group-inspector-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, UiKitTranslatePipe, ButtonComponent, ButtonGroupComponent, InputComponent, FlowColorViewComponent],
  templateUrl: './group-inspector-view.component.html',
  styleUrl: './group-inspector-view.component.scss',
})
export class GroupInspectorViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_FLOW_EDITOR_TEXTS);

  readonly group = input.required<FlowGroup>();

  readonly nameChange = output<string>();
  readonly colorChange = output<string>();
  readonly dissolve = output<void>();
}
