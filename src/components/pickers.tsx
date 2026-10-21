import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { COUNTRIES, flagEmoji } from '../lib/countries';
import { countryName, currencyName, useI18n } from '../i18n';
import { Sheet, cx } from './ui';

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="sticky top-0 z-10 -mx-1 bg-zinc-50 px-1 pb-3 dark:bg-zinc-900">
      <div className="field flex items-center gap-2 py-2">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          autoFocus
          aria-label={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

export function CountryPicker({ open, onClose, value, onPick }: { open: boolean; onClose: () => void; value: string; onPick: (code: string) => void }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const named = COUNTRIES.map((c) => ({ ...c, name: countryName(c.code, locale, t) }));
    const other = named.filter((c) => c.code === 'XX');
    const rest = named.filter((c) => c.code !== 'XX').sort((a, b) => a.name.localeCompare(b.name, locale));
    const all = [...rest, ...other];
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((c) => c.name.toLowerCase().includes(s) || c.code.toLowerCase() === s || c.currency.toLowerCase().includes(s));
  }, [q, locale, t]);

  return (
    <Sheet open={open} onClose={onClose} title={t('picker.country')}>
      <SearchBox value={q} onChange={setQ} placeholder={t('picker.search')} />
      <p className="mb-3 px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('picker.countryHint')}</p>
      <ul className="space-y-1">
        {list.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              onClick={() => {
                onPick(c.code);
                onClose();
              }}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-zinc-200/60 dark:hover:bg-zinc-800',
                value === c.code && 'bg-brand-50 dark:bg-brand-500/10',
              )}
            >
              <span className="text-2xl leading-none">{flagEmoji(c.code)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {c.currency}
                  {c.service ? ` · ${t('extras.service')} ${c.service}%` : ''}
                  {c.tax && !c.taxIncluded ? ` · ${c.taxName ?? t('extras.tax')} ${c.tax}%` : ''}
                  {` · ${t(`tip.${c.tipCulture}`)}`}
                </span>
              </span>
              {value === c.code && <Check className="h-5 w-5 text-brand-600" />}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

let allCurrencies: string[] | null = null;
function getAllCurrencies(): string[] {
  if (allCurrencies) return allCurrencies;
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (k: string) => string[] };
    allCurrencies = intl.supportedValuesOf ? intl.supportedValuesOf('currency') : [];
  } catch {
    allCurrencies = [];
  }
  const fromCountries = COUNTRIES.map((c) => c.currency);
  allCurrencies = Array.from(new Set([...fromCountries, ...allCurrencies])).sort();
  return allCurrencies;
}

export function CurrencyPicker({
  open,
  onClose,
  value,
  onPick,
  suggested = [],
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onPick: (code: string) => void;
  suggested?: string[];
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = getAllCurrencies();
    const top = Array.from(new Set(suggested.filter(Boolean)));
    const rows = s ? all : [...top, ...all.filter((c) => !top.includes(c))];
    return rows
      .map((code) => ({ code, name: currencyName(code, locale) }))
      .filter((c) => !s || c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
  }, [q, locale, suggested]);
  const topCount = q.trim() ? 0 : Array.from(new Set(suggested.filter(Boolean))).length;

  return (
    <Sheet open={open} onClose={onClose} title={t('picker.currency')}>
      <SearchBox value={q} onChange={setQ} placeholder={t('picker.search')} />
      <ul className="space-y-1">
        {list.map((c, i) => (
          <li key={c.code}>
            {i === topCount && topCount > 0 && <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />}
            <button
              type="button"
              onClick={() => {
                onPick(c.code);
                onClose();
              }}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-zinc-200/60 dark:hover:bg-zinc-800',
                value === c.code && 'bg-brand-50 dark:bg-brand-500/10',
              )}
            >
              <span className="w-12 font-mono text-sm font-bold">{c.code}</span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {value === c.code && <Check className="h-5 w-5 text-brand-600" />}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
