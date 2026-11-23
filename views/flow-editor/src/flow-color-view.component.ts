import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { registerUiKitTexts, UiKitTranslatePipe } from "@stupa-makers/ui-kit";
import { UI_KIT_FLOW_EDITOR_TEXTS } from "./flow-editor.texts";

/**
 * The colours a state, a transition or a group can take with one click. Each one is a
 * hex value, because the graph stores the colour as hex. The values follow the faculty
 * colours of the redesign mockups.
 */
export const FLOW_COLOR_PRESETS: readonly string[] = [
  "#72a384",
  "#0075bf",
  "#f18700",
  "#ce1625",
  "#6b7280",
] as const;

/**
 * The colour row of the flow inspector: "no colour", the preset swatches and a custom
 * colour (the native colour picker). The row is a radio group; the chosen swatch has a
 * ring. It emits the new hex value, or an empty string for "no colour".
 */
@Component({
  selector: "app-flow-color-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiKitTranslatePipe],
  templateUrl: "./flow-color-view.component.html",
  styleUrl: "./flow-color-view.component.scss",
})
export class FlowColorViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_FLOW_EDITOR_TEXTS);

  /** The current colour (hex), or empty for none. */
  readonly value = input<string | null | undefined>(null);
  /** The new colour (hex), or an empty string for "no colour". */
  readonly changed = output<string>();

  protected readonly presets = FLOW_COLOR_PRESETS;

  /** The current colour in lower case, so a preset matches whatever case it was saved in. */
  protected readonly current = computed(() =>
    (this.value() ?? "").toLowerCase(),
  );
  /** A colour is set that is not one of the presets. */
  protected readonly custom = computed(
    () => !!this.current() && !this.presets.includes(this.current()),
  );
}
