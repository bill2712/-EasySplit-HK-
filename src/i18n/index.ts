import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useStore, type Lang } from '../state/store';
import en, { type Dict } from './locales/en';

export type Key = keyof Dict;
type Partial = { [K in Key]?: string };

// English is bundled (it's also the fallback); other languages load on demand.
const LOADERS: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Partial }>> = {
  'zh-HK': () => import('./locales/zh-HK'),
  'zh-CN': () => import('./locales/zh-CN'),
  ja: () => import('./locales/ja'),
  ko: () => import('./locales/ko'),
  th: () => import('./locales/th'),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  de: () => import('./locales/de'),
};
const DICTS: { [L in Lang]?: Partial } = { en };
const pending = new Map<Lang, Promise<void>>();
const subs = new Set<() => void>();

export function loadLang(lang: Lang): Promise<void> {
  if (DICTS[lang] || lang === 'en') return Promise.resolve();
  let p = pending.get(lang);
  if (!p) {
    const next = LOADERS[lang as Exclude<Lang, 'en'>]()
      .then((m) => {
        DICTS[lang] = m.default;
        subs.forEach((f) => f());
      })
      .catch(() => {
        pending.delete(lang);
      });
    pending.set(lang, next);
    p = next;
  }
  return p;
}

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-HK', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'th', label: 'ไทย' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

export type TFn = (key: Key, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Locale used for number/date formatting. */
export function intlLocale(lang: Lang): string {
  if (lang === 'zh-HK') return 'zh-Hant-HK';
  if (lang === 'zh-CN') return 'zh-Hans-CN';
  return lang;
}

export function useI18n() {
  const lang = useStore((s) => s.settings.lang);
  const ready = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => Boolean(DICTS[lang]),
  );
  useEffect(() => {
    loadLang(lang);
  }, [lang]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t: TFn = useCallback((key, vars) => translate(lang, key, vars), [lang, ready]);
  return { t, lang, locale: intlLocale(lang) };
}

const regionNames = new Map<string, Intl.DisplayNames | null>();
const currencyNames = new Map<string, Intl.DisplayNames | null>();

function displayNames(cache: Map<string, Intl.DisplayNames | null>, locale: string, type: 'region' | 'currency') {
  if (!cache.has(locale)) {
    try {
      cache.set(locale, new Intl.DisplayNames([locale, 'en'], { type }));
    } catch {
      cache.set(locale, null);
    }
  }
  return cache.get(locale);
}

export function countryName(code: string, locale: string, t: TFn): string {
  if (code === 'XX') return t('country.other');
  return displayNames(regionNames, locale, 'region')?.of(code) ?? code;
}

export function currencyName(code: string, locale: string): string {
  try {
    return displayNames(currencyNames, locale, 'currency')?.of(code) ?? code;
  } catch {
    return code;
  }
}
