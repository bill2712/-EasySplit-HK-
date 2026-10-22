import { useEffect, useMemo, useRef, useState } from 'react';
import { Cake, Check, ChevronDown, Copy, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { computeBill, hasExtras, splitSubtotal } from '../../lib/bill';
import { CATEGORIES } from '../../lib/categories';
import { COUNTRIES, extrasFor } from '../../lib/countries';
import { today, uid } from '../../lib/id';
import { allocate, formatMinor, fromMinor, parseAmount, toMinor } from '../../lib/money';
import { niceRate, rateToBase } from '../../lib/rates';
import type { Expense, Group, SplitMode } from '../../lib/types';
import { useI18n, type Key } from '../../i18n';
import { actions } from '../../state/store';
import { ExtrasEditor } from '../../components/ExtrasEditor';
import { ItemRow } from '../../components/ItemRow';
import { CurrencyPicker } from '../../components/pickers';
import { AmountInput, Avatar, Button, Chip, Field, NumField, Segmented, Sheet, TextField, cx, toast } from '../../components/ui';

function newExpense(g: Group, kind: 'expense' | 'transfer'): Expense {
  const last = [...g.expenses].filter((e) => e.kind === 'expense').sort((a, b) => b.createdAt - a.createdAt)[0];
  const currency = last?.currency ?? g.currency;
  return {
    id: uid(),
    kind,
    title: '',
    category: kind === 'transfer' ? 'transfer' : 'food',
    date: today(),
    currency,
    rate: currency === g.currency ? 1 : g.rates[currency] ?? last?.rate ?? 0,
    payerId: last?.payerId && g.members.some((m) => m.id === last.payerId) ? last.payerId : g.members[0]?.id ?? '',
    paidAmounts: null,
    createdAt: Date.now(),
    mode: 'equal',
    amount: 0,
    participants: kind === 'transfer' ? [g.members[1]?.id ?? g.members[0]?.id ?? ''] : g.members.map((m) => m.id),
    weights: {},
    items: [],
    treated: [],
    extras: null,
  };
}

/** Pick the most likely country for a currency (for tip/tax presets abroad). */
function countryForCurrency(currency: string, fallback: string): string {
  const own = COUNTRIES.find((c) => c.code === fallback);
  if (own?.currency === currency) return fallback;
  return COUNTRIES.find((c) => c.currency === currency)?.code ?? fallback;
}

const MODES: { value: SplitMode; label: Key }[] = [
  { value: 'equal', label: 'split.equal' },
  { value: 'shares', label: 'split.shares' },
  { value: 'exact', label: 'split.exact' },
  { value: 'percent', label: 'split.percent' },
  { value: 'items', label: 'split.items' },
];

export function ExpenseEditor({
  group,
  expense,
  kind = 'expense',
  onClose,
}: {
  group: Group;
  expense?: Expense | null;
  kind?: 'expense' | 'transfer';
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const isNew = !expense;
  const [e, setE] = useState<Expense>(() => expense ?? newExpense(group, kind));
  const [amountText, setAmountText] = useState(expense?.amount ? String(expense.amount) : '');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [showExtras, setShowExtras] = useState(hasExtras(expense?.extras));
  const [rateInfo, setRateInfo] = useState<string | null>(null);
  const [rateBusy, setRateBusy] = useState(false);
  const rateTouched = useRef(!!expense);
  const isTransfer = e.kind === 'transfer';
  const base = group.currency;
  const foreign = e.currency !== base;
  const set = (patch: Partial<Expense>) => setE((cur) => ({ ...cur, ...patch }));
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const money = (m: number, cur = e.currency) => formatMinor(m, cur, locale);
  const extrasCountry = countryForCurrency(e.currency, group.country);

  const bill = useMemo(() => computeBill(e, e.currency), [e]);
  const total = bill.totals.total;

  const loadRate = async (currency: string, force = false) => {
    if (currency === base) return;
    setRateBusy(true);
    const r = await rateToBase(currency, base, force);
    setRateBusy(false);
    if (r) {
      setE((cur) => (cur.currency === currency ? { ...cur, rate: niceRate(r.rate) } : cur));
      setRateInfo(t('expense.rateUpdated', { time: new Date(r.at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }) }));
    } else {
      setRateInfo(t('expense.rateOffline'));
    }
  };

  useEffect(() => {
    if (foreign && !rateTouched.current && !e.rate) loadRate(e.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- validation ----------
  const multiPaid = !!e.paidAmounts;
  const paidSum = multiPaid ? Object.values(e.paidAmounts!).reduce((a, b) => a + toMinor(b || 0, e.currency), 0) : total;
  const pctSum = e.mode === 'percent' ? e.participants.reduce((s, p) => s + (e.weights[p] || 0), 0) : 100;
  let error: string | null = null;
  if (e.participants.length === 0) error = t('expense.errNoOne');
  else if (total <= 0) error = t('expense.errAmount');
  else if (e.mode === 'percent' && Math.round(pctSum * 100) !== 10000) error = t('expense.errPercent', { sum: Math.round(pctSum * 100) / 100 });
  else if (multiPaid && paidSum !== total) error = t('expense.errPaid', { diff: money(total - paidSum) });
  else if (foreign && !(e.rate > 0)) error = t('expense.errRate');
  else if (isTransfer && e.payerId === e.participants[0]) error = t('expense.errSelf');

  const save = () => {
    if (error) return toast(error);
    const cat = CATEGORIES.find((c) => c.id === e.category);
    const title = e.title.trim() || (isTransfer ? t('balances.payment') : t(`cat.${cat?.id ?? 'other'}` as Key));
    const clean: Expense = {
      ...e,
      title,
      rate: foreign ? e.rate : 1,
      extras: showExtras && !isTransfer ? e.extras : null,
      treated: e.treated.filter((id) => e.participants.includes(id)),
      paidAmounts: multiPaid ? e.paidAmounts : null,
    };
    actions.saveExpense(group.id, clean);
    toast(t('toast.saved'));
    onClose();
  };

  // Copy an existing expense (e.g. the same taxi ride twice) dated today.
  const duplicate = () => {
    if (!expense) return;
    actions.saveExpense(group.id, { ...expense, id: uid(), date: today(), createdAt: Date.now() });
    toast(t('toast.duplicated'));
    onClose();
  };

  const remove = () => {
    if (!expense) return;
    if (!window.confirm(t('expense.confirmDelete'))) return;
    actions.deleteExpense(group.id, expense.id);
    onClose();
  };

  const toggleParticipant = (id: string) => {
    const on = e.participants.includes(id);
    set({ participants: on ? e.participants.filter((p) => p !== id) : group.members.map((m) => m.id).filter((m) => m === id || e.participants.includes(m)) });
  };

  const setMode = (mode: SplitMode) => {
    const patch: Partial<Expense> = { mode };
    if (mode === 'items' && e.items.length === 0) {
      patch.items = [{ id: uid(), name: '', price: 0, qty: 1, who: [] }];
    }
    if (mode === 'exact' || mode === 'percent' || mode === 'shares') {
      const w: Record<string, number> = {};
      const people = e.participants;
      // Even starting values that add up exactly (e.g. 33.33 / 33.33 / 33.34 %).
      const even = (total: number) => allocate(Math.round(total * 100), people.map(() => 1)).map((c) => c / 100);
      const pct = even(100);
      const amt = even(e.amount || 0);
      people.forEach((p, i) => {
        if (mode === 'shares') w[p] = 1;
        if (mode === 'percent') w[p] = pct[i];
        if (mode === 'exact') w[p] = amt[i];
      });
      patch.weights = w;
    }
    set(patch);
  };

  const amountFromInput = e.mode !== 'items' && e.mode !== 'exact';

  return (
    <Sheet
      open
      wide
      onClose={onClose}
      title={isTransfer ? (isNew ? t('balances.recordPayment') : t('balances.payment')) : isNew ? t('expense.new') : t('expense.edit')}
      footer={
        <div className="space-y-2">
          {error && total > 0 && <p className="text-center text-[13px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex gap-2">
            {!isNew && (
              <Button variant="danger" onClick={remove} className="px-3">
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            {!isNew && (
              <Button variant="secondary" onClick={duplicate} className="px-3">
                <Copy className="h-5 w-5" />
                <span className="sr-only">{t('expense.duplicate')}</span>
              </Button>
            )}
            <Button className="flex-1" onClick={save} disabled={!!error}>
              <Check className="h-5 w-5" /> {t('common.save')}
              {total > 0 && <span className="opacity-80">· {money(total)}</span>}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* What & how much */}
        {!isTransfer && (
          <div className="space-y-3">
            <TextField value={e.title} onChange={(title) => set({ title })} placeholder={t('expense.titlePlaceholder')} ariaLabel={t('expense.title')} />
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={e.category === c.id} onClick={() => set({ category: c.id })}>
                  <span>{c.emoji}</span> {t(`cat.${c.id}` as Key)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {amountFromInput ? (
            <AmountInput
              big
              autoFocus={isNew}
              prefix={
                <button type="button" onClick={() => setCurrencyOpen(true)} className="rounded-lg bg-zinc-200/70 px-2 py-0.5 text-base text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {e.currency}
                </button>
              }
              value={amountText}
              onChange={(v) => {
                setAmountText(v);
                set({ amount: parseAmount(v) ?? 0 });
              }}
              ariaLabel={t('expense.amount')}
            />
          ) : (
            <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
              <button type="button" onClick={() => setCurrencyOpen(true)} className="rounded-lg bg-zinc-200/70 px-2 py-0.5 font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                {e.currency}
              </button>
              <span className="text-sm text-zinc-500">{t('expense.subtotalFromSplit')}</span>
              <span className="text-xl font-bold tabular-nums">{money(toMinor(splitSubtotal(e), e.currency))}</span>
            </div>
          )}
          {foreign && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-100">
              <span className="font-medium">1 {e.currency} =</span>
              <NumField
                className="w-28 bg-white dark:bg-zinc-900"
                value={e.rate}
                onChange={(rate) => {
                  rateTouched.current = true;
                  set({ rate });
                }}
                suffix={base}
                ariaLabel={t('expense.rate')}
              />
              <button
                type="button"
                onClick={() => loadRate(e.currency, true)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-500/20"
              >
                <RefreshCw className={cx('h-4 w-4', rateBusy && 'animate-spin')} /> {t('expense.liveRate')}
              </button>
              {total > 0 && e.rate > 0 && (
                <span className="ml-auto font-semibold tabular-nums">≈ {money(toMinor(fromMinor(total, e.currency) * e.rate, base), base)}</span>
              )}
              {rateInfo && <span className="w-full text-xs opacity-75">{rateInfo}</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('expense.date')}>
            <input type="date" value={e.date} onChange={(ev) => set({ date: ev.target.value || today() })} className="field" />
          </Field>
          {isTransfer && (
            <Field label={t('expense.note')}>
              <TextField value={e.note ?? ''} onChange={(note) => set({ note })} />
            </Field>
          )}
        </div>

        {/* Who paid */}
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{isTransfer ? t('balances.from') : t('expense.paidBy')}</p>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <Chip key={m.id} active={!multiPaid && e.payerId === m.id} onClick={() => set({ payerId: m.id, paidAmounts: null })}>
                {m.name}
              </Chip>
            ))}
            {!isTransfer && group.members.length > 1 && (
              <Chip active={multiPaid} onClick={() => set({ paidAmounts: multiPaid ? null : { [e.payerId]: fromMinor(total, e.currency) } })}>
                {t('expense.multiPayers')}
              </Chip>
            )}
          </div>
          {multiPaid && (
            <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar id={m.id} name={m.name} size="sm" />
                  <span className="flex-1 truncate">{m.name}</span>
                  <NumField
                    className="w-32"
                    value={e.paidAmounts![m.id] ?? 0}
                    onChange={(v) => set({ paidAmounts: { ...e.paidAmounts!, [m.id]: v } })}
                    suffix={e.currency}
                    ariaLabel={m.name}
                  />
                </div>
              ))}
              <p className={cx('px-3 py-2 text-right text-xs font-medium', paidSum === total ? 'text-brand-700 dark:text-brand-300' : 'text-rose-600')}>
                {paidSum === total ? '✓' : t('expense.left', { amount: money(total - paidSum) })}
              </p>
            </div>
          )}
        </div>

        {isTransfer ? (
          <div className="space-y-2">
            <p className="px-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{t('balances.to')}</p>
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => (
                <Chip key={m.id} active={e.participants[0] === m.id} onClick={() => set({ participants: [m.id] })}>
                  {m.name}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Split */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{t('expense.splitHow')}</p>
                <button
                  type="button"
                  className="text-[13px] font-semibold text-brand-700 dark:text-brand-300"
                  onClick={() => set({ participants: e.participants.length === group.members.length ? [] : group.members.map((m) => m.id) })}
                >
                  {e.participants.length === group.members.length ? t('common.none') : t('common.everyone')}
                </button>
              </div>
              <Segmented size="sm" value={e.mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: t(m.label) }))} />
              <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t(`split.${e.mode}Hint` as Key)}</p>

              <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.members.map((m) => {
                  const on = e.participants.includes(m.id);
                  const treated = e.treated.includes(m.id);
                  const line = bill.lines[m.id];
                  return (
                    <div key={m.id} className={cx('flex items-center gap-2.5 px-3 py-2', !on && 'opacity-50')}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        aria-label={m.name}
                        onClick={() => toggleParticipant(m.id)}
                        className={cx(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition',
                          on ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-500' : 'border-zinc-300 dark:border-zinc-600',
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </button>
                      <Avatar id={m.id} name={m.name} size="sm" badge={treated ? '🎂' : undefined} />
                      <span className="min-w-0 flex-1 truncate text-[15px]">{m.name}</span>
                      {on && (e.mode === 'shares' || e.mode === 'exact' || e.mode === 'percent') && (
                        <NumField
                          className="w-24"
                          value={e.weights[m.id] ?? (e.mode === 'shares' ? 1 : 0)}
                          onChange={(v) => set({ weights: { ...e.weights, [m.id]: v } })}
                          suffix={e.mode === 'shares' ? '×' : e.mode === 'percent' ? '%' : undefined}
                          ariaLabel={m.name}
                        />
                      )}
                      <span className="w-20 text-right text-sm font-semibold tabular-nums">{on && line ? money(line.total) : ''}</span>
                      {on && (
                        <button
                          type="button"
                          aria-pressed={treated}
                          title={t('quick.treatHint')}
                          onClick={() => set({ treated: treated ? e.treated.filter((x) => x !== m.id) : [...e.treated, m.id] })}
                          className={cx(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-full transition',
                            treated ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300' : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600',
                          )}
                        >
                          <Cake className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {e.mode === 'percent' && Math.round(pctSum * 100) !== 10000 && (
                <p className="px-1 text-right text-xs font-medium text-rose-600">{t('expense.pctLeft', { pct: Math.round((100 - pctSum) * 100) / 100 })}</p>
              )}

              {e.mode === 'items' && (
                <div className="space-y-3">
                  {e.items.map((it, idx) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      index={idx}
                      people={e.participants.map((p) => ({ id: p, name: name(p) }))}
                      currency={e.currency}
                      onChange={(patch) => set({ items: e.items.map((x) => (x.id === it.id ? { ...x, ...patch } : x)) })}
                      onRemove={() => set({ items: e.items.filter((x) => x.id !== it.id) })}
                    />
                  ))}
                  <Button variant="soft" className="w-full" onClick={() => set({ items: [...e.items, { id: uid(), name: '', price: 0, qty: 1, who: [] }] })}>
                    <Plus className="h-5 w-5" /> {t('quick.addItem')}
                  </Button>
                </div>
              )}
            </div>

            {/* Charges */}
            <div className="card overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (!showExtras && !e.extras) set({ extras: extrasFor(extrasCountry) });
                  setShowExtras(!showExtras);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-xl">🧾</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t('expense.charges')}</span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {showExtras && hasExtras(e.extras)
                      ? [
                          bill.totals.service && `${t('extras.service')} ${money(bill.totals.service)}`,
                          bill.totals.tax && `${t('extras.tax')} ${money(bill.totals.tax)}`,
                          bill.totals.tip && `${t('extras.tip')} ${money(bill.totals.tip)}`,
                          bill.totals.cover && `${t('extras.cover')} ${money(bill.totals.cover)}`,
                          bill.totals.discount && `${t('extras.discount')} ${money(bill.totals.discount)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : t('expense.chargesHint')}
                  </span>
                </span>
                <ChevronDown className={cx('h-5 w-5 text-zinc-400 transition', showExtras && 'rotate-180')} />
              </button>
              {showExtras && e.extras && (
                <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                  <ExtrasEditor
                    extras={e.extras}
                    onChange={(extras) => set({ extras })}
                    currency={e.currency}
                    country={extrasCountry}
                    bill={bill}
                    onPreset={() => set({ extras: extrasFor(extrasCountry) })}
                  />
                </div>
              )}
            </div>

            <Field label={t('expense.note')}>
              <TextField value={e.note ?? ''} onChange={(note) => set({ note })} placeholder={t('expense.notePlaceholder')} />
            </Field>
          </>
        )}
      </div>

      <CurrencyPicker
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        value={e.currency}
        suggested={[base, ...Object.keys(group.rates), ...group.expenses.map((x) => x.currency)]}
        onPick={(currency) => {
          rateTouched.current = false;
          setRateInfo(null);
          set({ currency, rate: currency === base ? 1 : group.rates[currency] ?? 0 });
          if (currency !== base) loadRate(currency);
        }}
      />
    </Sheet>
  );
}
