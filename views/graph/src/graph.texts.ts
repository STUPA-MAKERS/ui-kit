import { type UiKitGraphTextKey, type UiKitTexts } from "@stupa-makers/ui-kit";

/** The DE and EN texts of the graph views (002237). A view registers them when it is created. */
export const UI_KIT_GRAPH_TEXTS: UiKitTexts<UiKitGraphTextKey> = {
  de: {
    "graph.zoom.group": "Ansicht der Zeichnung",
    "graph.zoom.in": "Vergrößern",
    "graph.zoom.out": "Verkleinern",
    "graph.zoom.all": "Alles zeigen",
  },
  en: {
    "graph.zoom.group": "View of the drawing",
    "graph.zoom.in": "Zoom in",
    "graph.zoom.out": "Zoom out",
    "graph.zoom.all": "Show all",
  },
};
