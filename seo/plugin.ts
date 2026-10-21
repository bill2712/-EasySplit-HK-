// Build step that turns the single-page app into crawlable pages:
// - one landing page per language (title, description, FAQ, tipping table,
//   hreflang, Open Graph, JSON-LD); React replaces the static content on load
// - static content pages: tipping guide per country, privacy, terms, about, 404
// - sitemap.xml and robots.txt

import type { Plugin } from 'vite';
import { COUNTRIES } from '../src/lib/countries';
import { tipRange } from '../src/lib/guide';
import { KOFI_URL } from '../src/lib/site';
import { HTML_LANG, LANGS, LANG_SLUGS, NATIVE, OG_LOCALE, SITE_URL, BASE, esc, langPath, pageUrl, regionName, tr, type Dict, type LangCode } from './shared';
import { contentPages } from './pages';
import { LEGAL } from './legal';

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
      return `<tr><td><a href="${BASE}${langPath(lang, `tipping/${c.code.toLowerCase()}/`)}">${esc(name)}</a></td><td>${esc(c.currency)}</td><td>${esc(service)}</td><td>${esc(tax)}</td><td>${esc(tip)}</td></tr>`;
    })
    .join('');
  const faq = [1, 2, 3, 4, 5, 6]
    .map((i) => `<h3>${esc(t(`faq.q${i}` as keyof Dict))}</h3><p>${esc(t(`faq.a${i}` as keyof Dict))}</p>`)
    .join('');
  const legal = (k: string) => (LEGAL[lang] ? langPath(lang, `${k}/`) : `${k}/`);
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
        <p><small>${esc(t('guide.disclaimer'))}</small> · <a href="${BASE}${langPath(lang, 'tipping/')}">${esc(t('guide.title'))}</a></p>
      </section>
      <section>
        <h2>${esc(t('faq.title'))}</h2>
        ${faq}
      </section>
      <footer>
        <p>${esc(t('home.privacy'))}</p>
        <p><a href="${KOFI_URL}" rel="noopener">☕ ${esc(t('support.button'))}</a></p>
        <p><a href="${BASE}${legal('about')}">${esc(t('footer.about'))}</a> · <a href="${BASE}${legal('privacy')}">${esc(t('footer.privacy'))}</a> · <a href="${BASE}${legal('terms')}">${esc(t('footer.terms'))}</a></p>
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
      const landing = LANGS.map((l) => {
        const links = LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[x]}" href="${pageUrl(x)}"/>`).join('');
        return `<url><loc>${pageUrl(l)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${l === 'en' ? '1.0' : '0.9'}</priority>${links}</url>`;
      });
      const pages = contentPages();
      for (const p of pages) this.emitFile({ type: 'asset', fileName: p.path.endsWith('/') ? `${p.path}index.html` : p.path, source: p.html });
      const content = pages
        .filter((p) => p.sitemap)
        .map((p) => {
          const links = Object.entries(p.alternates)
            .map(([l, path]) => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[l as LangCode]}" href="${SITE_URL}${path}"/>`)
            .join('');
          return `<url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${links}</url>`;
        });
      const urls = [...landing, ...content].join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n` });
    },
  };
}
