import { useCallback } from 'react';
import { useStore, type Lang } from '../state/store';
import en, { type Dict } from './locales/en';
import zhHK from './locales/zh-HK';
import zhCN from './locales/zh-CN';
import ja from './locales/ja';
import ko from './locales/ko';
import th from './locales/th';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';

export type Key = keyof Dict;
type Partial = { [K in Key]?: string };

const DICTS: Record<Lang, Partial> = { en, 'zh-HK': zhHK, 'zh-CN': zhCN, ja, ko, th, es, fr, de };

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
  const t: TFn = useCallback((key, vars) => translate(lang, key, vars), [lang]);
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
