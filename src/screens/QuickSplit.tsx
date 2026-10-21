import { useMemo, useState, type ReactNode } from 'react';
import { Cake, FolderPlus, Plus, RotateCcw, Share2, Users, UtensilsCrossed } from 'lucide-react';
import { computeBill, type BillResult } from '../lib/bill';
import { extrasFor, flagEmoji, getCountry } from '../lib/countries';
import { uid } from '../lib/id';
import { formatMinor, parseAmount, roundToStep, roundingSteps, toMinor } from '../lib/money';
import { quickSummaryText } from '../lib/summary';
import type { Item, SplitSpec } from '../lib/types';
import { useI18n } from '../i18n';
import { actions, useStore, type QuickState } from '../state/store';
import { ExtrasEditor } from '../components/ExtrasEditor';
import { CountryPicker, CurrencyPicker } from '../components/pickers';
import { AmountInput, Avatar, Button, Chip, IconButton, Section, Segmented, Stepper, TopBar, cx, shareOrCopy, toast } from '../components/ui';
import { SaveToGroupSheet } from './SaveToGroup';
import { ItemRow } from '../components/ItemRow';
import { navigate } from '../router';
import { SupportCard } from '../components/extras';

export function quickSpec(q: QuickState): SplitSpec {
  return {
    mode: q.mode === 'items' ? 'items' : 'equal',
    amount: parseAmount(q.amount) ?? 0,
    participants: q.people.map((p) => p.id),
    weights: {},
    items: q.items,
    treated: q.treated,
    extras: q.extras,
  };
}

export function QuickSplit() {
  const { t, locale } = useI18n();
  const q = useStore((s) => s.quick);
  const [countryOpen, setCountryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const country = getCountry(q.country);

  const bill: BillResult = useMemo(() => computeBill(quickSpec(q), q.currency), [q]);
  const names = useMemo(
    () => Object.fromEntries(q.people.map((p, i) => [p.id, p.name.trim() || t('quick.personN', { n: i + 1 })])),
    [q.people, t],
  );
  const stepMinor = q.round ? toMinor(q.round, q.currency) : 0;
  const rounded = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of q.people) out[p.id] = roundToStep(bill.lines[p.id]?.total ?? 0, stepMinor);
    return out;
  }, [bill, q.people, stepMinor]);
  const collected = Object.values(rounded).reduce((a, b) => a + b, 0);
  const surplus = collected - bill.totals.total;
  const money = (m: number) => formatMinor(m, q.currency, locale);
  const payers = q.people.filter((p) => !q.treated.includes(p.id));
  // Equal split: shares differ by at most one cent, so show the larger one.
  const equalEach =
    q.mode === 'equal' && payers.length > 0 && q.treated.length === 0 ? Math.max(...payers.map((p) => rounded[p.id])) : null;
  const hasBill = bill.totals.total > 0;

  const setPeopleCount = (n: number) => {
    actions.setQuick((cur) => {
      const people = [...cur.people];
      while (people.length < n) people.push({ id: uid(), name: '' });
      while (people.length > n) people.pop();
      const ids = new Set(people.map((p) => p.id));
      return {
        people,
        treated: cur.treated.filter((id) => ids.has(id)),
        payerId: cur.payerId && ids.has(cur.payerId) ? cur.payerId : null,
        items: cur.items.map((it) => ({ ...it, who: it.who.filter((w) => ids.has(w)) })),
      };
    });
  };

  const setCountry = (code: string) => {
    const c = getCountry(code);
    actions.setQuick({ country: c.code, currency: c.currency, extras: extrasFor(c.code), round: 0 });
    actions.setSettings({ country: c.code });
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    actions.setQuick((cur) => ({ items: cur.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));

  const share = async () => {
    const text = quickSummaryText({
      t,
      locale,
      bill,
      names,
      rounded,
      treated: q.treated,
      equalEach,
      serviceRate: q.extras.service,
      taxRate: q.extras.tax,
      tipRate: q.extras.tipType === 'percent' ? q.extras.tip : null,
      payerId: q.payerId,
    });
    const r = await shareOrCopy(text, t('share.billTitle'));
    if (r === 'copied') toast(t('toast.copied'));
  };

  return (
    <div className="pb-40">
      <TopBar
        title={t('quick.title')}
        onBack={() => navigate('/')}
        right={
          <>
            <button
              type="button"
              onClick={() => setCountryOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold shadow-sm ring-1 ring-zinc-200 transition active:scale-95 dark:bg-zinc-800 dark:ring-zinc-700"
            >
              <span className="text-base leading-none">{flagEmoji(country.code)}</span>
              {q.currency}
            </button>
            <IconButton label={t('common.reset')} onClick={() => actions.resetQuick()}>
              <RotateCcw className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
        <Segmented
          value={q.mode}
          onChange={(mode) => actions.setQuick({ mode })}
          options={[
            { value: 'equal', label: <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{t('quick.modeEqual')}</span> },
            { value: 'items', label: <span className="inline-flex items-center gap-1.5"><UtensilsCrossed className="h-4 w-4" />{t('quick.modeItems')}</span> },
          ]}
        />

        {q.mode === 'equal' ? (
          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[15px] font-semibold">{t('quick.billAmount')}</label>
              <button type="button" onClick={() => setCurrencyOpen(true)} className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                {t('quick.changeCurrency')}
              </button>
            </div>
            <AmountInput
              big
              autoFocus={!q.amount}
              prefix={q.currency}
              value={q.amount}
              onChange={(amount) => actions.setQuick({ amount })}
              ariaLabel={t('quick.billAmount')}
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t('quick.billHint')}</p>
          </section>
        ) : (
          <Section
            title={t('quick.items')}
            action={
              <button type="button" onClick={() => setCurrencyOpen(true)} className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                {q.currency}
              </button>
            }
          >
            <div className="space-y-3">
              {q.items.map((it, idx) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  index={idx}
                  people={q.people.map((p) => ({ id: p.id, name: names[p.id] }))}
                  currency={q.currency}
                  onChange={(patch) => updateItem(it.id, patch)}
                  onRemove={() => actions.setQuick((cur) => ({ items: cur.items.filter((x) => x.id !== it.id) }))}
                />
              ))}
              <Button
                variant="soft"
                className="w-full"
                onClick={() => actions.setQuick((cur) => ({ items: [...cur.items, { id: uid(), name: '', price: 0, qty: 1, who: [] }] }))}
              >
                <Plus className="h-5 w-5" /> {t('quick.addItem')}
              </Button>
            </div>
          </Section>
        )}

        <Section title={t('quick.people')} action={<Stepper value={q.people.length} onChange={setPeopleCount} min={1} max={60} />}>
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
            {q.people.map((p, i) => {
              const treated = q.treated.includes(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2">
                  <Avatar id={p.id} name={names[p.id]} badge={treated ? '🎂' : undefined} />
                  <input
                    value={p.name}
                    aria-label={t('quick.personN', { n: i + 1 })}
                    placeholder={t('quick.personN', { n: i + 1 })}
                    onChange={(e) =>
                      actions.setQuick((cur) => ({ people: cur.people.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))
                    }
                    className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-zinc-400"
                  />
                  {hasBill && (
                    <span className={cx('text-sm tabular-nums', treated ? 'text-zinc-400' : 'font-semibold')}>{money(rounded[p.id] ?? 0)}</span>
                  )}
                  <button
                    type="button"
                    aria-pressed={treated}
                    title={t('quick.treatHint')}
                    onClick={() =>
                      actions.setQuick((cur) => ({
                        treated: treated ? cur.treated.filter((x) => x !== p.id) : [...cur.treated, p.id],
                      }))
                    }
                    className={cx(
                      'grid h-9 w-9 place-items-center rounded-full transition active:scale-90',
                      treated ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300' : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600',
                    )}
                  >
                    <Cake className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('quick.treatHint')}</p>
        </Section>

        <Section title={t('quick.charges')}>
          <div className="card p-4">
            <ExtrasEditor
              extras={q.extras}
              onChange={(extras) => actions.setQuick({ extras })}
              currency={q.currency}
              country={q.country}
              bill={bill}
              onPreset={() => actions.setQuick({ extras: extrasFor(q.country) })}
            />
          </div>
        </Section>

        <Section title={t('quick.paidBy')}>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={!q.payerId} onClick={() => actions.setQuick({ payerId: null })}>
              {t('quick.paidByNone')}
            </Chip>
            {q.people.map((p) => (
              <Chip key={p.id} active={q.payerId === p.id} onClick={() => actions.setQuick({ payerId: p.id })}>
                {names[p.id]}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t('quick.rounding')}>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={!q.round} onClick={() => actions.setQuick({ round: 0 })}>
              {t('quick.exact')}
            </Chip>
            {roundingSteps(q.currency).map((s) => (
              <Chip key={s} active={q.round === s} onClick={() => actions.setQuick({ round: s })}>
                ↑ {formatMinor(toMinor(s, q.currency), q.currency, locale, true)}
              </Chip>
            ))}
          </div>
        </Section>

        {hasBill && (
          <Section title={t('quick.result')}>
            <div className="card overflow-hidden">
              <div className="space-y-1.5 p-4 text-[15px]">
                <Row label={t('bill.subtotal')} value={money(bill.totals.base)} />
                {!!bill.totals.discount && <Row label={t('extras.discount')} value={money(bill.totals.discount)} />}
                {!!bill.totals.service && <Row label={`${t('extras.service')} ${q.extras.service}%`} value={money(bill.totals.service)} />}
                {!!bill.totals.tax && <Row label={`${country.taxName ?? t('extras.tax')} ${q.extras.tax}%`} value={money(bill.totals.tax)} />}
                {!!bill.totals.tip && <Row label={t('extras.tip')} value={money(bill.totals.tip)} />}
                {!!bill.totals.cover && <Row label={t('extras.cover')} value={money(bill.totals.cover)} />}
                <div className="my-2 border-t border-dashed border-zinc-200 dark:border-zinc-700" />
                <Row label={<b>{t('bill.total')}</b>} value={<b className="text-lg">{money(bill.totals.total)}</b>} />
                {!!bill.includedTax && (
                  <p className="text-right text-xs text-zinc-500">{t('bill.inclTax', { amount: money(bill.includedTax) })}</p>
                )}
                {q.payerId && names[q.payerId] && (
                  <p className="rounded-xl bg-zinc-100 px-3 py-2 text-[13px] font-medium dark:bg-zinc-800">
                    👉 {t('quick.payToShare', { name: names[q.payerId] })}
                  </p>
                )}
                {stepMinor > 0 && surplus > 0 && (
                  <p className="rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
                    {t('quick.roundNote', { collected: money(collected), extra: money(surplus) })}
                  </p>
                )}
              </div>
              <div className="flex gap-2 border-t border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <Button variant="secondary" className="flex-1" onClick={() => setSaveOpen(true)}>
                  <FolderPlus className="h-5 w-5" /> {t('quick.saveToGroup')}
                </Button>
                <Button className="flex-1" onClick={share}>
                  <Share2 className="h-5 w-5" /> {t('common.share')}
                </Button>
              </div>
            </div>
            <div className="pt-1 text-center">
              <SupportCard compact />
            </div>
          </Section>
        )}
      </main>

      {/* Sticky result bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {equalEach !== null ? t('quick.eachPays', { n: payers.length }) : t('bill.total')}
            </p>
            <p className="truncate text-2xl font-bold tabular-nums tracking-tight">
              {money(equalEach !== null ? equalEach : bill.totals.total)}
            </p>
          </div>
          <Button size="lg" onClick={share} disabled={!hasBill}>
            <Share2 className="h-5 w-5" /> {t('common.share')}
          </Button>
        </div>
      </div>

      <CountryPicker open={countryOpen} onClose={() => setCountryOpen(false)} value={q.country} onPick={setCountry} />
      <CurrencyPicker
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        value={q.currency}
        suggested={[country.currency, 'USD', 'EUR']}
        onPick={(currency) => actions.setQuick({ currency, round: 0 })}
      />
      {saveOpen && <SaveToGroupSheet onClose={() => setSaveOpen(false)} names={names} />}
    </div>
  );
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
