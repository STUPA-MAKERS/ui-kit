import { Injectable, inject, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  DefaultUiKitIntl,
  UI_KIT_FORMAT_LOCALES,
  UI_KIT_INTL,
  UI_KIT_DEFAULT_MESSAGES,
  provideUiKit,
  registerUiKitTexts,
  uiKitIntlFromLang,
} from "./intl";
import { UI_KIT_GRAPH_TEXTS } from "../../../views/graph/src/graph.texts";

describe("UiKitIntl", () => {
  it("maps each language to its format locale (EN is en-GB, not en-US)", () => {
    expect(UI_KIT_FORMAT_LOCALES).toEqual({ de: "de-DE", en: "en-GB" });
    const intl = new DefaultUiKitIntl();
    intl.setLang("de");
    expect(intl.formatLocale()).toBe("de-DE");
    intl.setLang("en");
    expect(intl.formatLocale()).toBe("en-GB");
  });

  it("follows an external language signal", () => {
    const lang = signal<"de" | "en">("de");
    const intl = uiKitIntlFromLang(lang);
    expect(intl.formatLocale()).toBe("de-DE");
    lang.set("en");
    expect(intl.formatLocale()).toBe("en-GB");
  });

  it("takes the format locale of the host app when given", () => {
    const fmt = signal("en-IE");
    const intl = uiKitIntlFromLang(signal("en" as const), undefined, fmt);
    expect(intl.formatLocale()).toBe("en-IE");
    fmt.set("de-AT");
    expect(intl.formatLocale()).toBe("de-AT");
  });

  it("translates with parameters and keeps unknown placeholders", () => {
    const intl = uiKitIntlFromLang(signal("en" as const), {
      en: { loading: "Loading {what} {other}" },
    });
    expect(intl.translate("loading", { what: "rows" })).toBe(
      "Loading rows {other}",
    );
  });

  it("provideUiKit registers the default implementation", () => {
    TestBed.configureTestingModule({
      providers: [provideUiKit({ lang: signal("en" as const) })],
    });
    const intl = TestBed.inject(UI_KIT_INTL);
    expect(intl.formatLocale()).toBe("en-GB");
    expect(intl.translate("dialog.close")).toBe("Close");
  });

  it("provideUiKit takes an intl factory that injects a service provided after it", () => {
    @Injectable()
    class AppLang {
      readonly lang = signal("en" as const);
    }
    TestBed.configureTestingModule({
      providers: [
        provideUiKit({ intl: () => uiKitIntlFromLang(inject(AppLang).lang) }),
        AppLang,
      ],
    });
    expect(TestBed.inject(UI_KIT_INTL).translate("dialog.close")).toBe("Close");
  });
});

describe("view texts §S/framework/texts/002237", () => {
  const key = Object.keys(
    UI_KIT_GRAPH_TEXTS.de,
  )[0] as keyof typeof UI_KIT_GRAPH_TEXTS.de;

  it("keeps the texts of a view out of the core catalogue", () => {
    expect(key in UI_KIT_DEFAULT_MESSAGES.de).toBe(false);
    expect(Object.keys(UI_KIT_GRAPH_TEXTS.en).sort()).toEqual(
      Object.keys(UI_KIT_GRAPH_TEXTS.de).sort(),
    );
  });

  it("translates the texts of a view once the view registered them", () => {
    const intl = uiKitIntlFromLang(signal("en" as const));
    expect(registerUiKitTexts(UI_KIT_GRAPH_TEXTS)).toBe(UI_KIT_GRAPH_TEXTS);
    expect(intl.translate(key)).toBe(UI_KIT_GRAPH_TEXTS.en[key]);
  });

  it("lets an override of the app win over a registered text", () => {
    registerUiKitTexts(UI_KIT_GRAPH_TEXTS);
    const intl = uiKitIntlFromLang(signal("en" as const), {
      en: { [key]: "Own" },
    });
    expect(intl.translate(key)).toBe("Own");
  });
});
