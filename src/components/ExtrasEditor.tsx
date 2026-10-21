import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { BillResult } from '../lib/bill';
import { getCountry, flagEmoji } from '../lib/countries';
import { formatMinor } from '../lib/money';
import type { Extras } from '../lib/types';
import { useI18n } from '../i18n';
import { Chip, NumField, Segmented, Toggle, cx } from './ui';

/** Service charge / tax / tip / cover / discount editor with live amounts. */
export function ExtrasEditor({
  extras,
  onChange,
  currency,
  country,
  bill,
  onPreset,
}: {
  extras: Extras;
  onChange: (e: Extras) => void;
  currency: string;
  country: string;
  bill?: BillResult;
  onPreset?: () => void;
}) {
  const { t, locale } = useI18n();
  const c = getCountry(country);
  const [more, setMore] = useState(!!(extras.discount || extras.cover));
  const set = (patch: Partial<Extras>) => onChange({ ...extras, ...patch });
  const money = (m: number) => formatMinor(m, currency, locale);
  const tips = Array.from(new Set([0, ...c.tips])).sort((a, b) => a - b);

  const Amount = ({ v, muted }: { v?: number; muted?: boolean }) =>
    v ? (
      <span className={cx('w-24 shrink-0 text-right text-sm tabular-nums', muted ? 'text-zinc-400' : 'font-semibold text-zinc-700 dark:text-zinc-200')}>
        {v > 0 && !muted ? '+' : ''}
        {money(v)}
      </span>
    ) : (
      <span className="w-24 shrink-0" />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">
          {flagEmoji(c.code)} {t(`tipHint.${c.tipCulture}`)}
          {onPreset && (
            <button type="button" onClick={onPreset} className="ml-1 font-semibold underline underline-offset-2">
              {t('extras.applyPreset')}
            </button>
          )}
        </span>
      </div>

      {/* Service charge */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">{t('extras.service')}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.serviceName ?? t('extras.serviceHint')}</p>
        </div>
        <NumField className="w-24" value={extras.service} onChange={(v) => set({ service: v })} suffix="%" ariaLabel={t('extras.service')} />
        <Amount v={bill?.totals.service} />
      </div>

      {/* Tax */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">{c.taxName ?? t('extras.tax')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('extras.taxHint')}</p>
          </div>
          <NumField className="w-24" value={extras.tax} onChange={(v) => set({ tax: v })} suffix="%" ariaLabel={t('extras.tax')} />
          {extras.taxIncluded ? <Amount v={bill?.includedTax} muted /> : <Amount v={bill?.totals.tax} />}
        </div>
        {extras.tax > 0 && (
          <div className="flex flex-wrap items-center gap-2 pl-0.5">
            <Segmented
              size="sm"
              className="w-full max-w-xs"
              value={extras.taxIncluded ? 'in' : 'add'}
              onChange={(v) => set({ taxIncluded: v === 'in' })}
              options={[
                { value: 'in', label: t('extras.taxIncluded') },
                { value: 'add', label: t('extras.taxAdded') },
              ]}
            />
            {!extras.taxIncluded && extras.service > 0 && (
              <div className="w-full">
                <Toggle checked={extras.taxOnService} onChange={(v) => set({ taxOnService: v })} label={t('extras.taxOnService')} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">{t('extras.tip')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{extras.tipOnTotal ? t('extras.tipOnTotal') : t('extras.tipOnSubtotal')}</p>
          </div>
          <NumField
            className="w-24"
            value={extras.tip}
            onChange={(v) => set({ tip: v })}
            suffix={extras.tipType === 'percent' ? '%' : currency}
            ariaLabel={t('extras.tip')}
          />
          <Amount v={bill?.totals.tip} />
        </div>
        {extras.tipType === 'percent' && (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {tips.map((p) => (
              <Chip key={p} active={extras.tip === p} onClick={() => set({ tip: p })}>
                {p === 0 ? t('extras.noTip') : `${p}%`}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMore(!more)}
        className="flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300"
      >
        {t('extras.more')}
        <ChevronDown className={cx('h-4 w-4 transition', more && 'rotate-180')} />
      </button>

      {more && (
        <div className="animate-pop space-y-4 rounded-2xl bg-zinc-100/70 p-3 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{t('extras.cover')}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('extras.coverHint')}</p>
            </div>
            <NumField className="w-24" value={extras.cover} onChange={(v) => set({ cover: v })} suffix={currency} ariaLabel={t('extras.cover')} />
            <Amount v={bill?.totals.cover} />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{t('extras.discount')}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('extras.discountHint')}</p>
            </div>
            <NumField
              className="w-24"
              value={extras.discount}
              onChange={(v) => set({ discount: v })}
              suffix={extras.discountType === 'percent' ? '%' : currency}
              ariaLabel={t('extras.discount')}
            />
            <Amount v={bill?.totals.discount} />
          </div>
          <Segmented
            size="sm"
            value={extras.discountType}
            onChange={(v) => set({ discountType: v })}
            options={[
              { value: 'percent', label: t('extras.discountPercent') },
              { value: 'amount', label: t('extras.discountAmount') },
            ]}
          />
          <Segmented
            size="sm"
            value={extras.tipType}
            onChange={(v) => set({ tipType: v, tip: 0 })}
            options={[
              { value: 'percent', label: t('extras.tipPercent') },
              { value: 'amount', label: t('extras.tipAmount') },
            ]}
          />
          <Toggle checked={extras.tipOnTotal} onChange={(v) => set({ tipOnTotal: v })} label={t('extras.tipOnTotalToggle')} />
        </div>
      )}
    </div>
  );
}
