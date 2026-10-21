// Public addresses and per-language landing pages (used by the app and the SEO build step).

export const SITE_URL = 'https://bill2712.github.io/-EasySplit-HK-/';
export const KOFI_URL = 'https://ko-fi.com/beyond01hk';

export type LangCode = 'en' | 'zh-HK' | 'zh-CN' | 'ja' | 'ko' | 'th' | 'es' | 'fr' | 'de';

/** URL folder for each language's landing page. English lives at the root. */
export const LANG_SLUGS: Record<LangCode, string> = {
  en: '',
  'zh-HK': 'zh-hk',
  'zh-CN': 'zh-cn',
  ja: 'ja',
  ko: 'ko',
  th: 'th',
  es: 'es',
  fr: 'fr',
  de: 'de',
};

/** Language implied by the landing page the visitor arrived on, if any. */
export function langFromPath(pathname: string): LangCode | null {
  const seg = pathname.toLowerCase().split('/').filter(Boolean);
  for (const [code, slug] of Object.entries(LANG_SLUGS)) {
    if (slug && seg.includes(slug)) return code as LangCode;
  }
  return null;
}

/** Languages that have their own privacy / terms / about pages. */
export const LEGAL_LANGS: LangCode[] = ['en', 'zh-HK', 'zh-CN'];

/** Link to a static content page (guide, legal) for the current language. */
export function contentHref(base: string, lang: LangCode, rest: string, legal = false): string {
  const l = legal && !LEGAL_LANGS.includes(lang) ? 'en' : lang;
  return `${base}${LANG_SLUGS[l] ? `${LANG_SLUGS[l]}/` : ''}${rest}`;
}
