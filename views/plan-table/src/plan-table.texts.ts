import {
  type UiKitPlanTableTextKey,
  type UiKitTexts,
} from "@stupa-makers/ui-kit";

/** The DE and EN texts of the plan-table views (002237). A view registers them when it is created. */
export const UI_KIT_PLAN_TABLE_TEXTS: UiKitTexts<UiKitPlanTableTextKey> = {
  de: {
    "budget.dash.collapse": "{name} zuklappen",
    "budget.dash.expand": "{name} aufklappen",
    "budget.cc.inactive": "inaktiv",
    "budget.plan.marks.transferable": "Übertragbar",
    "budget.plan.marks.coverable": "Deckungsfähig",
    "budget.plan.marks.blockedBadge": "Gesperrt: {amount}",
    "budget.plan.amountOf": "Ansatz: {name}",
    "budget.plan.income": "Einnahmen",
    "budget.plan.expense": "Ausgaben",
    "budget.plan.difference": "Differenz",
    "budget.plan.balanced": "Ausgeglichen",
    "budget.plan.unbalanced": "Nicht ausgeglichen",
  },
  en: {
    "budget.dash.collapse": "Collapse {name}",
    "budget.dash.expand": "Expand {name}",
    "budget.cc.inactive": "inactive",
    "budget.plan.marks.transferable": "Transferable",
    "budget.plan.marks.coverable": "Coverable",
    "budget.plan.marks.blockedBadge": "Blocked: {amount}",
    "budget.plan.amountOf": "Planned amount: {name}",
    "budget.plan.income": "Income",
    "budget.plan.expense": "Expenses",
    "budget.plan.difference": "Difference",
    "budget.plan.balanced": "Balanced",
    "budget.plan.unbalanced": "Not balanced",
  },
};
