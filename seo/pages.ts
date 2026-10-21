// Static content pages (no app JavaScript): tipping guide per country and an
// index per language, privacy / terms / about, and a 404 page.

import { computeBill } from '../src/lib/bill';
import { COUNTRIES, extrasFor, flagEmoji, type CountryPreset } from '../src/lib/countries';
import { tipRange } from '../src/lib/guide';
import { formatMinor } from '../src/lib/money';
import { KOFI_URL } from '../src/lib/site';
import { LEGAL, type LegalKind } from './legal';
import { BASE, HTML_LANG, LANGS, NATIVE, OG_LOCALE, SITE_URL, esc, langPath, regionName, sentenceGap, tr, type Dict, type LangCode } from './shared';

export interface Page {
  /** Path under BASE, e.g. "ja/tipping/jp/". */
  path: string;
  html: string;
  /** Same page in other languages (for hreflang + sitemap). */
  alternates: Partial<Record<LangCode, string>>;
  sitemap: boolean;
}

const GUIDE_COUNTRIES = COUNTRIES.filter((c) => c.code !== 'XX');
const LEGAL_KINDS: LegalKind[] = ['privacy', 'terms', 'about'];

const CSS = `
:root{--bg:#f4f4f5;--card:#fff;--text:#18181b;--muted:#71717a;--line:#e4e4e7;--brand:#0f9d74;--brand-ink:#0b7a5c;--soft:#ecfdf5}
@media (prefers-color-scheme:dark){:root{--bg:#09090b;--card:#18181b;--text:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--brand:#34d399;--brand-ink:#6ee7b7;--soft:#052e23}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,-apple-system,'Segoe UI',Roboto,'PingFang HK','Hiragino Sans','Apple SD Gothic Neo','Noto Sans','Noto Sans Thai',sans-serif;-webkit-text-size-adjust:100%}
a{color:var(--brand-ink)}
.wrap{max-width:46rem;margin:0 auto;padding:0 16px}
.top{position:sticky;top:0;z-index:2;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:56px;gap:12px}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--text);text-decoration:none}
.brand img{width:30px;height:30px;border-radius:9px}
.btn{display:inline-flex;align-items:center;gap:6px;background:var(--brand);color:#fff;text-decoration:none;font-weight:600;border-radius:14px;padding:9px 16px;font-size:15px;white-space:nowrap}
@media (prefers-color-scheme:dark){.btn{color:#022c22}}
.crumbs{font-size:13px;color:var(--muted);margin:18px 0 6px}
.crumbs a{color:var(--muted)}
h1{font-size:clamp(1.6rem,4.5vw,2.2rem);line-height:1.2;margin:.2em 0 .5em;letter-spacing:-.01em}
h2{font-size:1.2rem;margin:2em 0 .6em}
h3{font-size:1.02rem;margin:1.4em 0 .3em}
.lead{font-size:1.08rem;color:var(--text)}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:18px 20px;margin:16px 0}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0;padding:0}
.facts div{background:var(--bg);border-radius:14px;padding:10px 12px}
.facts dt{font-size:12px;color:var(--muted)}
.facts dd{margin:0;font-weight:650}
.example{background:var(--soft);border-radius:18px;padding:16px 18px}
.example table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;margin-top:6px}
.example td{padding:3px 0}
.example td:last-child{text-align:right}
.example tr.total td{border-top:1px dashed var(--line);padding-top:8px;font-weight:700}
table.list{width:100%;border-collapse:collapse;font-size:14px}
table.list th,table.list td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line)}
.chips{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}
.chips a{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 12px;text-decoration:none;color:var(--text);font-size:14px}
footer{margin:48px 0 32px;padding-top:20px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
footer nav{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0}
footer a{color:var(--muted)}
.kofi{display:inline-block;margin:6px 0;color:#e11d48;font-weight:600}
`;

function money(minor: number, currency: string, lang: LangCode) {
  return formatMinor(minor, currency, HTML_LANG[lang], true);
}

function layout(opts: {
  lang: LangCode;
  path: string;
  title: string;
  description: string;
  alternates: Partial<Record<LangCode, string>>;
  body: string;
  jsonLd?: unknown[];
  noindex?: boolean;
  ctaHref?: string;
}): string {
  const { lang } = opts;
  const t = tr(lang);
  const url = SITE_URL + opts.path;
  const home = BASE + langPath(lang);
  const alt = Object.entries(opts.alternates)
    .map(([l, p]) => `<link rel="alternate" hreflang="${HTML_LANG[l as LangCode]}" href="${SITE_URL}${p}" />`)
    .join('\n    ');
  const xDefault = opts.alternates.en !== undefined ? `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${opts.alternates.en}" />` : '';
  const legalHref = (k: LegalKind) => BASE + (LEGAL[lang] ? langPath(lang, `${k}/`) : `${k}/`);
  const langLinks = LANGS.filter((l) => opts.alternates[l] !== undefined)
    .map((l) => `<a href="${BASE}${opts.alternates[l]}" hreflang="${HTML_LANG[l]}"${l === lang ? ' aria-current="page"' : ''}>${NATIVE[l]}</a>`)
    .join('');
  return `<!doctype html>
<html lang="${HTML_LANG[lang]}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${esc(opts.title)}</title>
    <meta name="description" content="${esc(opts.description)}" />
    ${opts.noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`}
    ${alt}
    ${xDefault}
    <meta name="theme-color" content="#0f9d74" />
    <link rel="icon" type="image/svg+xml" href="${BASE}icon.svg" />
    <link rel="apple-touch-icon" href="${BASE}apple-touch-icon.png" />
    <link rel="manifest" href="${BASE}manifest.webmanifest" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="EasySplit 夾錢易" />
    <meta property="og:title" content="${esc(opts.title)}" />
    <meta property="og:description" content="${esc(opts.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE_URL}og-image.png" />
    <meta property="og:locale" content="${OG_LOCALE[lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>${CSS.replace(/\n/g, '')}</style>
    ${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
  </head>
  <body>
    <header class="top"><div class="wrap">
      <a class="brand" href="${home}"><img src="${BASE}icon.svg" alt="" width="30" height="30" />${esc(t('app.name'))}</a>
      <a class="btn" href="${opts.ctaHref ?? `${home}#/quick`}">${esc(t('seo.cta'))}</a>
    </div></header>
    <main class="wrap">
${opts.body}
    </main>
    <footer class="wrap">
      <nav aria-label="EasySplit">
        <a href="${home}">${esc(t('tp.home'))}</a>
        <a href="${BASE}${langPath(lang, 'tipping/')}">${esc(t('guide.title'))}</a>
        <a href="${legalHref('about')}">${esc(t('footer.about'))}</a>
        <a href="${legalHref('privacy')}">${esc(t('footer.privacy'))}</a>
        <a href="${legalHref('terms')}">${esc(t('footer.terms'))}</a>
      </nav>
      <a class="kofi" href="${KOFI_URL}" rel="noopener">☕ ${esc(t('support.button'))}</a>
      ${langLinks ? `<nav aria-label="${esc(t('seo.languages'))}">${langLinks}</nav>` : ''}
      <p>${esc(t('home.privacy'))}</p>
    </footer>
  </body>
</html>
`;
}

const slug = (c: CountryPreset) => c.code.toLowerCase();

/** Plain-language facts about eating out in a country, in the page language. */
export function countryFacts(c: CountryPreset, lang: LangCode) {
  const t = tr(lang);
  const country = regionName(c.code, lang);
  const taxLabel = c.taxName ?? t('extras.tax');
  const service = c.service
    ? t('tp.serviceYes', { country, pct: String(c.service) }) + (c.serviceName ? ` (${c.serviceName})` : '')
    : t('tp.serviceNo', { country });
  const tax = !c.tax
    ? t('tp.taxNone')
    : c.taxIncluded
      ? t('tp.taxIncluded', { tax: taxLabel, pct: String(c.tax) })
      : c.taxOnService && c.service
        ? t('tp.taxAddedOnService', { tax: taxLabel, pct: String(c.tax) })
        : t('tp.taxAdded', { tax: taxLabel, pct: String(c.tax) });
  const range = tipRange(c);
  const gap = sentenceGap(lang);
  const tip = t(`tipHint.${c.tipCulture}` as keyof Dict) + (range ? `${gap}${t('tp.tipRange', { range })}` : '');
  const cover = c.cover ? t('tp.cover', { amount: `${c.cover} ${c.currency}` }) : '';
  const apps = t('tp.payApps', { apps: c.payApps.join(', ') });

  const subtotal = c.example ?? 100;
  const bill = computeBill(
    { mode: 'equal', amount: subtotal, participants: ['a', 'b', 'c', 'd'], weights: {}, items: [], treated: [], extras: extrasFor(c.code) },
    c.currency,
  );
  const each = Math.max(...Object.values(bill.lines).map((l) => l.total));
  const m = (v: number) => money(v, c.currency, lang);
  const charged = bill.totals.total !== bill.totals.base;
  const example = charged
    ? t('tp.example', { subtotal: m(bill.totals.base), total: m(bill.totals.total), each: m(each) })
    : t('tp.exampleNoCharges', { subtotal: m(bill.totals.base), each: m(each) });
  return { country, taxLabel, service, tax, tip, cover, apps, bill, each, example, m, range, gap };
}

function countryPage(c: CountryPreset, lang: LangCode): Page {
  const t = tr(lang);
  const f = countryFacts(c, lang);
  const path = langPath(lang, `tipping/${slug(c)}/`);
  const alternates = Object.fromEntries(LANGS.map((l) => [l, langPath(l, `tipping/${slug(c)}/`)])) as Record<LangCode, string>;
  const home = BASE + langPath(lang);
  const cta = `${home}#/quick?c=${c.code}`;
  const faqs: [string, string][] = [
    [t('tp.faqTip', { country: f.country }), f.tip],
    [t('tp.faqService', { country: f.country }), f.service],
    [t('tp.faqTax', { country: f.country }), f.tax],
  ];
  const rows: [string, number][] = [
    [t('bill.subtotal'), f.bill.totals.base],
    [t('extras.discount'), f.bill.totals.discount],
    [`${t('extras.service')}${c.service ? ` ${c.service}%` : ''}`, f.bill.totals.service],
    [`${f.taxLabel}${c.tax ? ` ${c.tax}%` : ''}`, f.bill.totals.tax],
    [t('extras.tip'), f.bill.totals.tip],
    [t('extras.cover'), f.bill.totals.cover],
  ];
  const others = GUIDE_COUNTRIES.filter((x) => x.code !== c.code)
    .map((x) => ({ x, name: regionName(x.code, lang) }))
    .sort((a, b) => a.name.localeCompare(b.name, HTML_LANG[lang]))
    .map(({ x, name }) => `<li><a href="${BASE}${langPath(lang, `tipping/${slug(x)}/`)}">${flagEmoji(x.code)} ${esc(name)}</a></li>`)
    .join('');

  const body = `
      <nav class="crumbs"><a href="${home}">${esc(t('tp.home'))}</a> › <a href="${BASE}${langPath(lang, 'tipping/')}">${esc(t('guide.title'))}</a> › ${esc(f.country)}</nav>
      <h1>${flagEmoji(c.code)} ${esc(t('tp.h1', { country: f.country }))}</h1>
      <p class="lead">${esc([f.tip, f.service, f.tax].join(f.gap))}</p>
      <section class="card">
        <h2 style="margin-top:0">${esc(t('tp.glance'))}</h2>
        <dl class="facts">
          <div><dt>${esc(t('picker.currency'))}</dt><dd>${esc(c.currency)}</dd></div>
          <div><dt>${esc(t('extras.service'))}</dt><dd>${c.service ? `${c.service}%` : esc(t('guide.noneUsual'))}</dd></div>
          <div><dt>${esc(f.taxLabel)}</dt><dd>${c.tax ? `${c.tax}% · ${esc(c.taxIncluded ? t('guide.included') : t('guide.added'))}` : esc(t('guide.noneUsual'))}</dd></div>
          <div><dt>${esc(t('extras.tip'))}</dt><dd>${esc(t(`tip.${c.tipCulture}` as keyof Dict))}${f.range ? ` · ${f.range}` : ''}</dd></div>
          ${c.cover ? `<div><dt>${esc(t('extras.cover'))}</dt><dd>${esc(`${c.cover} ${c.currency}`)}</dd></div>` : ''}
        </dl>
        ${f.cover ? `<p>${esc(f.cover)}</p>` : ''}
        <p>${esc(f.apps)}</p>
      </section>
      <section class="example">
        <h2 style="margin-top:0">${esc(t('tp.exampleTitle'))}</h2>
        <p>${esc(f.example)}</p>
        <table>${rows
          .filter(([, v], i) => i === 0 || v !== 0)
          .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${f.m(v)}</td></tr>`)
          .join('')}<tr class="total"><td>${esc(t('bill.total'))}</td><td>${f.m(f.bill.totals.total)}</td></tr><tr><td>${esc(t('quick.eachPays', { n: '4' }))}</td><td><strong>${f.m(f.each)}</strong></td></tr></table>
        <p style="margin-bottom:0"><a class="btn" href="${cta}">${esc(t('tp.cta', { country: f.country }))}</a></p>
      </section>
      <section>
        <h2>${esc(t('faq.title'))}</h2>
        ${faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}
        <p><small>${esc(t('guide.disclaimer'))}</small></p>
      </section>
      <section>
        <h2>${esc(t('tp.others'))}</h2>
        <ul class="chips">${others}</ul>
      </section>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('tp.home'), item: SITE_URL + langPath(lang) },
        { '@type': 'ListItem', position: 2, name: t('guide.title'), item: SITE_URL + langPath(lang, 'tipping/') },
        { '@type': 'ListItem', position: 3, name: f.country, item: SITE_URL + path },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];

  return {
    path,
    alternates,
    sitemap: true,
    html: layout({
      lang,
      path,
      title: t('tp.title', { country: f.country }),
      description: t('tp.description', { country: f.country }),
      alternates,
      body,
      jsonLd,
      ctaHref: cta,
    }),
  };
}

function guideIndex(lang: LangCode): Page {
  const t = tr(lang);
  const path = langPath(lang, 'tipping/');
  const alternates = Object.fromEntries(LANGS.map((l) => [l, langPath(l, 'tipping/')])) as Record<LangCode, string>;
  const rows = GUIDE_COUNTRIES.map((c) => ({ c, name: regionName(c.code, lang) }))
    .sort((a, b) => a.name.localeCompare(b.name, HTML_LANG[lang]))
    .map(({ c, name }) => {
      const range = tipRange(c);
      return `<tr><td><a href="${BASE}${langPath(lang, `tipping/${slug(c)}/`)}">${flagEmoji(c.code)} ${esc(name)}</a></td><td>${c.service ? `${c.service}%` : '—'}</td><td>${c.tax ? `${c.tax}%${c.taxIncluded ? '' : ' +'}` : '—'}</td><td>${esc(t(`tip.${c.tipCulture}` as keyof Dict))}${range ? ` ${range}` : ''}</td></tr>`;
    })
    .join('');
  const body = `
      <nav class="crumbs"><a href="${BASE}${langPath(lang)}">${esc(t('tp.home'))}</a> › ${esc(t('guide.title'))}</nav>
      <h1>${esc(t('guide.title'))}</h1>
      <p class="lead">${esc(t('guide.intro'))}</p>
      <div class="card" style="padding:6px 10px;overflow-x:auto">
        <table class="list">
          <thead><tr><th></th><th>${esc(t('extras.service'))}</th><th>${esc(t('extras.tax'))}</th><th>${esc(t('extras.tip'))}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p><small>${esc(t('guide.disclaimer'))}</small></p>`;
  return {
    path,
    alternates,
    sitemap: true,
    html: layout({ lang, path, title: `${t('guide.title')} · ${t('app.name')}`, description: t('tp.indexDescription'), alternates, body }),
  };
}

function legalPage(kind: LegalKind, lang: LangCode): Page | null {
  const content = LEGAL[lang]?.[kind];
  if (!content) return null;
  const t = tr(lang);
  const path = langPath(lang, `${kind}/`);
  const alternates = Object.fromEntries(LANGS.filter((l) => LEGAL[l]).map((l) => [l, langPath(l, `${kind}/`)])) as Partial<Record<LangCode, string>>;
  const linkify = (s: string) => esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,:;)])/g, '<a href="$1" rel="noopener">$1</a>');
  const body = `
      <nav class="crumbs"><a href="${BASE}${langPath(lang)}">${esc(t('tp.home'))}</a> › ${esc(content.title)}</nav>
      <h1>${esc(content.title)}</h1>
      ${content.sections.map((s) => `${s.h ? `<h2>${esc(s.h)}</h2>` : ''}${s.p.map((p) => `<p>${linkify(p)}</p>`).join('')}`).join('\n      ')}`;
  return {
    path,
    alternates,
    sitemap: true,
    html: layout({ lang, path, title: `${content.title} · ${t('app.name')}`, description: content.description, alternates, body }),
  };
}

function notFound(): Page {
  const en = tr('en');
  const zh = tr('zh-HK');
  const body = `
      <h1>${esc(en('nf.title'))} · ${esc(zh('nf.title'))}</h1>
      <p class="lead">${esc(en('nf.body'))}<br />${esc(zh('nf.body'))}</p>
      <p><a class="btn" href="${BASE}">${esc(en('nf.home'))} · ${esc(zh('nf.home'))}</a></p>
      <script>setTimeout(function(){location.replace(${JSON.stringify(BASE)})},4000)</script>`;
  return {
    path: '404.html',
    alternates: {},
    sitemap: false,
    html: layout({ lang: 'en', path: '404.html', title: `${en('nf.title')} · EasySplit`, description: en('nf.body'), alternates: {}, body, noindex: true }),
  };
}

export function contentPages(): Page[] {
  const pages: Page[] = [];
  for (const lang of LANGS) {
    pages.push(guideIndex(lang));
    for (const c of GUIDE_COUNTRIES) pages.push(countryPage(c, lang));
    for (const k of LEGAL_KINDS) {
      const p = legalPage(k, lang);
      if (p) pages.push(p);
    }
  }
  pages.push(notFound());
  return pages;
}
