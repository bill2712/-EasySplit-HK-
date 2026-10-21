// Build step that turns the single-page app into crawlable landing pages:
// one static HTML page per language (title, description, FAQ, tipping guide,
// hreflang, Open Graph, JSON-LD), plus sitemap.xml and robots.txt.
// The React app replaces the static content in #root once it loads.

import type { Plugin } from 'vite';
import en from '../src/i18n/locales/en';
import zhHK from '../src/i18n/locales/zh-HK';
import zhCN from '../src/i18n/locales/zh-CN';
import ja from '../src/i18n/locales/ja';
import ko from '../src/i18n/locales/ko';
import th from '../src/i18n/locales/th';
import es from '../src/i18n/locales/es';
import fr from '../src/i18n/locales/fr';
import de from '../src/i18n/locales/de';
import { COUNTRIES } from '../src/lib/countries';
import { tipRange } from '../src/lib/guide';
import { KOFI_URL, LANG_SLUGS, SITE_URL, type LangCode } from '../src/lib/site';

type Dict = typeof en;
const DICTS: Record<LangCode, Partial<Dict>> = { en, 'zh-HK': zhHK, 'zh-CN': zhCN, ja, ko, th, es, fr, de };
const LANGS = Object.keys(LANG_SLUGS) as LangCode[];
const NATIVE: Record<LangCode, string> = {
  en: 'English', 'zh-HK': '繁體中文', 'zh-CN': '简体中文', ja: '日本語', ko: '한국어', th: 'ไทย', es: 'Español', fr: 'Français', de: 'Deutsch',
};
const OG_LOCALE: Record<LangCode, string> = {
  en: 'en_US', 'zh-HK': 'zh_HK', 'zh-CN': 'zh_CN', ja: 'ja_JP', ko: 'ko_KR', th: 'th_TH', es: 'es_ES', fr: 'fr_FR', de: 'de_DE',
};
const HTML_LANG: Record<LangCode, string> = {
  en: 'en', 'zh-HK': 'zh-Hant-HK', 'zh-CN': 'zh-Hans-CN', ja: 'ja', ko: 'ko', th: 'th', es: 'es', fr: 'fr', de: 'de',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pageUrl = (lang: LangCode) => SITE_URL + (LANG_SLUGS[lang] ? `${LANG_SLUGS[lang]}/` : '');

function tr(lang: LangCode) {
  return (key: keyof Dict, vars?: Record<string, string>) => {
    let s = DICTS[lang][key] ?? en[key];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  };
}

function head(lang: LangCode): string {
  const t = tr(lang);
  const url = pageUrl(lang);
  const faq = [1, 2, 3, 4, 5, 6].map((i) => ({
    '@type': 'Question',
    name: t(`faq.q${i}` as keyof Dict),
    acceptedAnswer: { '@type': 'Answer', text: t(`faq.a${i}` as keyof Dict) },
  }));
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('app.name'),
      alternateName: ['EasySplit', '夾錢易'],
      url,
      description: t('seo.description'),
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      inLanguage: HTML_LANG[lang],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      image: `${SITE_URL}og-image.png`,
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq },
  ];
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${pageUrl(l)}" />`).join('\n    ');
  return `<title>${esc(t('seo.title'))}</title>
    <meta name="description" content="${esc(t('seo.description'))}" />
    <meta name="keywords" content="${esc(t('seo.keywords'))}" />
    <link rel="canonical" href="${url}" />
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="EasySplit 夾錢易" />
    <meta property="og:title" content="${esc(t('seo.title'))}" />
    <meta property="og:description" content="${esc(t('seo.description'))}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE_URL}og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${OG_LOCALE[lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(t('seo.title'))}" />
    <meta name="twitter:description" content="${esc(t('seo.description'))}" />
    <meta name="twitter:image" content="${SITE_URL}og-image.png" />
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}

function regionName(code: string, lang: LangCode): string {
  try {
    return new Intl.DisplayNames([HTML_LANG[lang], 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function body(lang: LangCode): string {
  const t = tr(lang);
  const features: [keyof Dict, keyof Dict][] = [
    ['home.quickTitle', 'home.quickBody'],
    ['home.feat1Title', 'home.feat1Body'],
    ['home.feat2Title', 'home.feat2Body'],
    ['home.feat3Title', 'home.feat3Body'],
    ['kind.trip', 'kind.tripHint'],
    ['kind.gathering', 'kind.gatheringHint'],
  ];
  const rows = COUNTRIES.filter((c) => c.code !== 'XX')
    .map((c) => ({ c, name: regionName(c.code, lang) }))
    .sort((a, b) => a.name.localeCompare(b.name, HTML_LANG[lang]))
    .map(({ c, name }) => {
      const service = c.service ? `${c.service}%` : t('guide.noneUsual');
      const tax = c.tax ? `${c.tax}% (${c.taxIncluded ? t('guide.included') : t('guide.added')})` : t('guide.noneUsual');
      const range = tipRange(c);
      const tip = t(`tip.${c.tipCulture}` as keyof Dict) + (range ? ` ${range}` : '');
      return `<tr><td>${esc(name)}</td><td>${esc(c.currency)}</td><td>${esc(service)}</td><td>${esc(tax)}</td><td>${esc(tip)}</td></tr>`;
    })
    .join('');
  const faq = [1, 2, 3, 4, 5, 6]
    .map((i) => `<h3>${esc(t(`faq.q${i}` as keyof Dict))}</h3><p>${esc(t(`faq.a${i}` as keyof Dict))}</p>`)
    .join('');
  const langNav = LANGS.map((l) => `<a href="${pageUrl(l)}" hreflang="${HTML_LANG[l]}"${l === lang ? ' aria-current="page"' : ''}>${NATIVE[l]}</a>`).join(' · ');

  return `<div class="seo">
      <header>
        <h1>${esc(t('seo.h1'))}</h1>
        <p>${esc(t('seo.intro'))}</p>
        <p><a class="cta" href="#/quick">${esc(t('seo.cta'))}</a></p>
      </header>
      <section>
        <h2>${esc(t('seo.howTitle'))}</h2>
        <ol><li>${esc(t('seo.how1'))}</li><li>${esc(t('seo.how2'))}</li><li>${esc(t('seo.how3'))}</li></ol>
      </section>
      <section>
        <h2>${esc(t('seo.featuresTitle'))}</h2>
        <ul>${features.map(([a, b]) => `<li><strong>${esc(t(a))}</strong> — ${esc(t(b))}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>${esc(t('guide.title'))}</h2>
        <p>${esc(t('guide.intro'))}</p>
        <table>
          <thead><tr><th></th><th>${esc(t('picker.currency'))}</th><th>${esc(t('extras.service'))}</th><th>${esc(t('extras.tax'))}</th><th>${esc(t('extras.tip'))}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p><small>${esc(t('guide.disclaimer'))}</small></p>
      </section>
      <section>
        <h2>${esc(t('faq.title'))}</h2>
        ${faq}
      </section>
      <footer>
        <p>${esc(t('home.privacy'))}</p>
        <p><a href="${KOFI_URL}" rel="noopener">☕ ${esc(t('support.button'))}</a></p>
        <nav aria-label="${esc(t('seo.languages'))}">${langNav}</nav>
      </footer>
    </div>`;
}

function render(template: string, lang: LangCode): string {
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[lang]}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('<!--seo:head-->', head(lang))
    .replace('<!--seo:body-->', body(lang));
}

export function seoPlugin(): Plugin {
  return {
    name: 'easysplit-seo',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset') return;
      const template = String(index.source);
      index.source = render(template, 'en');
      for (const lang of LANGS) {
        if (!LANG_SLUGS[lang]) continue;
        this.emitFile({ type: 'asset', fileName: `${LANG_SLUGS[lang]}/index.html`, source: render(template, lang) });
      }
      const today = new Date().toISOString().slice(0, 10);
      const urls = LANGS.map((l) => {
        const links = LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[x]}" href="${pageUrl(x)}"/>`).join('');
        return `<url><loc>${pageUrl(l)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${l === 'en' ? '1.0' : '0.9'}</priority>${links}</url>`;
      }).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n` });
    },
  };
}
