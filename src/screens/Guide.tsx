import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { COUNTRIES, extrasFor, flagEmoji, getCountry } from '../lib/countries';
import { tipRange } from '../lib/guide';
import { countryName, useI18n, type Key } from '../i18n';
import { actions } from '../state/store';
import { navigate } from '../router';
import { SupportCard } from '../components/extras';
import { TopBar, cx } from '../components/ui';

const TIP_STYLE: Record<string, string> = {
  none: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  roundup: 'bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200',
  optional: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
  expected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
};

/** Service charge, tax and tipping customs around the world. */
export function Guide() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const rows = COUNTRIES.filter((c) => c.code !== 'XX')
      .map((c) => ({ c, name: countryName(c.code, locale, t) }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => r.name.toLowerCase().includes(s) || r.c.currency.toLowerCase().includes(s) || r.c.code.toLowerCase() === s) : rows;
  }, [q, locale, t]);

  const useCountry = (code: string) => {
    const c = getCountry(code);
    actions.setQuick({ country: c.code, currency: c.currency, extras: extrasFor(c.code), round: 0 });
    navigate('/quick');
  };

  return (
    <div className="pb-12">
      <TopBar title={t('guide.title')} onBack={() => navigate('/')} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">{t('guide.intro')}</p>
        <div className="field flex items-center gap-2 py-2">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('picker.search')} aria-label={t('picker.search')} className="w-full bg-transparent outline-none" />
        </div>
        <div className="space-y-3">
          {list.map(({ c, name }) => {
            const range = tipRange(c);
            return (
              <article key={c.code} className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl leading-none">{flagEmoji(c.code)}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold">{name}</h2>
                    <p className="text-xs text-zinc-500">{c.currency}</p>
                  </div>
                  <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', TIP_STYLE[c.tipCulture])}>
                    {t(`tip.${c.tipCulture}` as Key)}
                    {range ? ` · ${range}` : ''}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
                    <dt className="text-xs text-zinc-500">{t('extras.service')}</dt>
                    <dd className="font-semibold">{c.service ? `${c.service}%${c.serviceName ? ` · ${c.serviceName}` : ''}` : t('guide.noneUsual')}</dd>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
                    <dt className="text-xs text-zinc-500">{c.taxName ?? t('extras.tax')}</dt>
                    <dd className="font-semibold">
                      {c.tax ? `${c.tax}% · ${c.taxIncluded ? t('guide.included') : c.taxOnService ? t('guide.addedOnService') : t('guide.added')}` : t('guide.noneUsual')}
                    </dd>
                  </div>
                  {!!c.cover && (
                    <div className="col-span-2 rounded-2xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
                      <dt className="text-xs text-zinc-500">{t('extras.cover')}</dt>
                      <dd className="font-semibold">{t('guide.coverTypical', { amount: `${c.cover} ${c.currency}` })}</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-3 text-[13px] text-zinc-600 dark:text-zinc-300">{t(`tipHint.${c.tipCulture}` as Key)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {c.payApps.map((a) => (
                    <span key={a} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {a}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => useCountry(c.code)}
                    className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300"
                  >
                    {t('guide.useThis')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="px-1 text-xs text-zinc-500">{t('guide.disclaimer')}</p>
        <SupportCard />
      </main>
    </div>
  );
}
