import {
  type UiKitActivityTextKey,
  type UiKitTexts,
} from "@stupa-makers/ui-kit";

/** The DE and EN texts of the activity views (002237). A view registers them when it is created. */
export const UI_KIT_ACTIVITY_TEXTS: UiKitTexts<UiKitActivityTextKey> = {
  de: {
    "activity.loading": "Aktivität wird geladen",
    "activity.new": "Neu",
    "activity.more": "Mehr laden",
  },
  en: {
    "activity.loading": "Loading activity",
    "activity.new": "New",
    "activity.more": "Load more",
  },
};
