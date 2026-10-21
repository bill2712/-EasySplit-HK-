// Shared helpers for the build-time page generators.

import en from '../src/i18n/locales/en';
import zhHK from '../src/i18n/locales/zh-HK';
import zhCN from '../src/i18n/locales/zh-CN';
import ja from '../src/i18n/locales/ja';
import ko from '../src/i18n/locales/ko';
import th from '../src/i18n/locales/th';
import es from '../src/i18n/locales/es';
import fr from '../src/i18n/locales/fr';
import de from '../src/i18n/locales/de';
import { LANG_SLUGS, SITE_URL, type LangCode } from '../src/lib/site';

export { LANG_SLUGS, SITE_URL };
export type { LangCode };

export type Dict = typeof en;
export const DICTS: Record<LangCode, Partial<Dict>> = { en, 'zh-HK': zhHK, 'zh-CN': zhCN, ja, ko, th, es, fr, de };
export const LANGS = Object.keys(LANG_SLUGS) as LangCode[];
export const NATIVE: Record<LangCode, string> = {
  en: 'English', 'zh-HK': '繁體中文', 'zh-CN': '简体中文', ja: '日本語', ko: '한국어', th: 'ไทย', es: 'Español', fr: 'Français', de: 'Deutsch',
};
export const OG_LOCALE: Record<LangCode, string> = {
  en: 'en_US', 'zh-HK': 'zh_HK', 'zh-CN': 'zh_CN', ja: 'ja_JP', ko: 'ko_KR', th: 'th_TH', es: 'es_ES', fr: 'fr_FR', de: 'de_DE',
};
export const HTML_LANG: Record<LangCode, string> = {
  en: 'en', 'zh-HK': 'zh-Hant-HK', 'zh-CN': 'zh-Hans-CN', ja: 'ja', ko: 'ko', th: 'th', es: 'es', fr: 'fr', de: 'de',
};

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const pageUrl = (lang: LangCode) => SITE_URL + (LANG_SLUGS[lang] ? `${LANG_SLUGS[lang]}/` : '');

export function tr(lang: LangCode) {
  return (key: keyof Dict, vars?: Record<string, string>) => {
    let s = DICTS[lang][key] ?? en[key];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  };
}

/** Site path prefix, e.g. "/-EasySplit-HK-/". */
export const BASE = new URL(SITE_URL).pathname;

/** Path (under BASE) of a page in a language: langPath('ja', 'tipping/jp/') -> "ja/tipping/jp/". */
export const langPath = (lang: LangCode, rest = '') => (LANG_SLUGS[lang] ? `${LANG_SLUGS[lang]}/` : '') + rest;

// Shorter everyday names where CLDR's official ones are long.
const SHORT_NAMES: Partial<Record<LangCode, Record<string, string>>> = {
  'zh-HK': { HK: '香港', MO: '澳門', TW: '台灣' },
  'zh-CN': { HK: '香港', MO: '澳门', TW: '台湾' },
  ja: { HK: '香港', MO: 'マカオ' },
  en: { HK: 'Hong Kong', MO: 'Macau' },
};

/** Sentence separator: CJK text doesn't put spaces between sentences. */
export const sentenceGap = (lang: LangCode) => (lang === 'zh-HK' || lang === 'zh-CN' || lang === 'ja' ? '' : ' ');

export function regionName(code: string, lang: LangCode): string {
  const short = SHORT_NAMES[lang]?.[code];
  if (short) return short;
  try {
    return new Intl.DisplayNames([HTML_LANG[lang], 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
