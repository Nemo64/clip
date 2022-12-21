import i18next, { Resource } from "i18next";

const resources: Resource = {};

// @ts-ignore
const resourceContext = require.context("../locales", true, /\.json$/);
for (const key of resourceContext.keys()) {
  const [locale, namespace] = key.slice(2, -5).split("/");
  resources[locale] ??= {};
  resources[locale][namespace] = resourceContext(key);
}

i18next.init({
  lng: "en",
  debug:
    process.env.NODE_ENV === "development" && typeof window !== "undefined",
  resources,
});

export const t = i18next.t.bind(i18next);

export function setLocale(locale: string) {
  if (locale === i18next.language) {
    return;
  }

  i18next.changeLanguage(locale);
}
export function getLocale(): string {
  return i18next.language;
}

const numberFormatter = new Map<string, Intl.NumberFormat>();
export function formatNumber(
  value: number | string | undefined,
  props: Intl.NumberFormatOptions = {}
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const locale = getLocale();
  try {
    const key = locale + JSON.stringify(props);
    let formatter = numberFormatter.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, props);
      numberFormatter.set(key, formatter);
    }
    return formatter.format(Number(value));
  } catch (error) {
    console.error("number formatter", { locale, props, error });
    return value.toString();
  }
}
