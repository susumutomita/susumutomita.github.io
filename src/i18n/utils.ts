import { ui, defaultLang, showDefaultLang, routes, untranslatedPages } from "./ui";

export function getLangFromUrl(url: URL): keyof typeof ui {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang): string {
    const pathName = path.replace(/^\//, "").split("/")[0] || "";

    // Check if this page has a translation
    const hasTranslation =
      routes[l as keyof typeof routes] !== undefined &&
      pathName in routes[l as keyof typeof routes];

    // For pages without translations, always return English path
    if (!hasTranslation && untranslatedPages.includes(pathName as typeof untranslatedPages[number])) {
      return path; // Return original English path
    }

    // For default language, return path without prefix
    if (!showDefaultLang && l === defaultLang) {
      return path;
    }

    // For translated pages, add locale prefix
    return `/${l}${path}`;
  };
}

export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname;
  const parts = pathname?.split("/");
  const path = parts.pop() || parts.pop();

  if (path === undefined) {
    return undefined;
  }

  const currentLang = getLangFromUrl(url);

  if (defaultLang === currentLang) {
    const route = Object.values(routes)[0];
    return Object.keys(route).find(
      (key) => route[key as keyof typeof route] === path
    );
  }

  const getKeyByValue = (
    obj: Record<string, string>,
    value: string
  ): string | undefined => {
    return Object.keys(obj).find((key) => obj[key] === value);
  };

  const reversedKey = getKeyByValue(
    routes[currentLang as keyof typeof routes] as unknown as Record<
      string,
      string
    >,
    path
  );

  if (reversedKey !== undefined) {
    return reversedKey;
  }

  return path;
}

export function getLocalizedPathname(
  pathname: string,
  locale: keyof typeof ui
): string {
  // Remove leading slash and split
  const parts = pathname.replace(/^\//, "").split("/");

  // Check if first part is a locale
  const firstPart = parts[0];
  const isLocalePath = firstPart in ui;

  // Get the path without locale
  const pathWithoutLocale = isLocalePath ? parts.slice(1).join("/") : parts.join("/");

  // For default language, return path without prefix
  if (locale === defaultLang && !showDefaultLang) {
    return `/${pathWithoutLocale}` || "/";
  }

  // For other languages, add locale prefix
  return `/${locale}/${pathWithoutLocale}` || `/${locale}`;
}

export const locales = Object.keys(ui) as Array<keyof typeof ui>;
