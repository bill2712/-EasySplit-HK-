import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { flagEmoji, getCountry } from '../../lib/countries';
import { niceRate, rateToBase } from '../../lib/rates';
import type { Group, Member } from '../../lib/types';
import { countryName, useI18n } from '../../i18n';
import { actions, memberIsUsed } from '../../state/store';
import { navigate } from '../../router';
import { CountryPicker, CurrencyPicker } from '../../components/pickers';
import { Avatar, Button, Field, IconButton, Section, TextField, cx, toast } from '../../components/ui';

const EMOJIS = ['🍽️', '🍜', '🍣', '🍲', '🥘', '🍕', '🍻', '🎂', '🎉', '🎤', '✈️', '🏖️', '🏔️', '🚗', '⛺', '🏠', '⚽', '💼'];

export function People({ group }: { group: Group }) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState('');
  const [pick, setPick] = useState<'country' | 'currency' | null>(null);

  const add = () => {
    const names = draft.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
    names.forEach((n) => actions.addMember(group.id, n));
    setDraft('');
  };

  const update = (m: Member, patch: Partial<Member>) => actions.updateMember(group.id, { ...m, ...patch });

  const remove = (m: Member) => {
    if (memberIsUsed(group, m.id)) return toast(t('people.cantRemove'));
    actions.removeMember(group.id, m.id);
  };

  const changeBase = async (to: string) => {
    const from = group.currency;
    if (to === from) return;
    // Rates are stored relative to the base currency, so re-express them.
    const needsRate = group.expenses.some((e) => e.currency !== to);
    let k = 1;
    if (needsRate) {
      const live = await rateToBase(from, to);
      let r = live?.rate ?? null;
      if (!r) {
        const typed = window.prompt(t('people.baseRatePrompt', { from, to }));
        r = typed ? Number(typed.replace(',', '.')) : null;
        if (!r || !(r > 0)) return toast(t('expense.errRate'));
      }
      k = r;
    }
    const conv = (cur: string, rate: number) => (cur === to ? 1 : cur === from ? niceRate(k) : niceRate(rate * k));
    actions.updateGroup(group.id, (g) => ({
      ...g,
      currency: to,
      expenses: g.expenses.map((e) => ({ ...e, rate: conv(e.currency, e.rate) })),
      rates: needsRate
        ? Object.fromEntries(
            Object.entries({ ...g.rates, [from]: 1 })
              .filter(([c]) => c !== to)
              .map(([c, v]) => [c, conv(c, v)]),
          )
        : {},
    }));
    toast(t('people.baseChanged', { cur: to }));
  };

  return (
    <div className="space-y-6">
      <Section title={t('people.members', { n: group.members.length })}>
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {group.members.map((m) => (
            <div key={m.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar id={m.id} name={m.name} />
                <input
                  value={m.name}
                  aria-label={t('people.name')}
                  onChange={(e) => update(m, { name: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none"
                />
                <IconButton label={t('common.delete')} onClick={() => remove(m)}>
                  <Trash2 className="h-4.5 w-4.5 text-zinc-400" />
                </IconButton>
              </div>
              <div className="grid gap-2 pl-12 sm:grid-cols-2">
                <select
                  value={m.linkedTo ?? ''}
                  aria-label={t('people.settledBy')}
                  onChange={(e) => update(m, { linkedTo: e.target.value || null })}
                  className="field py-2 text-sm"
                >
                  <option value="">{t('people.paysOwn')}</option>
                  {group.members
                    .filter((x) => x.id !== m.id && x.linkedTo !== m.id)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {t('people.paidBy', { name: x.name })}
                      </option>
                    ))}
                </select>
                <input
                  value={m.payInfo ?? ''}
                  onChange={(e) => update(m, { payInfo: e.target.value })}
                  placeholder={t('people.payInfoPlaceholder', { app: getCountry(group.country).payApps[0] })}
                  aria-label={t('people.payInfo')}
                  className="field py-2 text-sm"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-3">
            <TextField value={draft} onChange={setDraft} onEnter={add} placeholder={t('people.addPlaceholder')} className="flex-1" />
            <Button onClick={add} disabled={!draft.trim()} className="shrink-0">
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('people.coupleHint')}</p>
      </Section>

      <Section title={t('people.groupSettings')}>
        <div className="card space-y-4 p-4">
          <Field label={t('group.name')}>
            <TextField value={group.name} onChange={(name) => actions.updateGroup(group.id, (g) => ({ ...g, name }))} />
          </Field>
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => actions.updateGroup(group.id, (g) => ({ ...g, emoji: e }))}
                className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl transition', group.emoji === e ? 'bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-500/20' : 'bg-zinc-100 dark:bg-zinc-800')}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('group.country')}>
              <button type="button" onClick={() => setPick('country')} className="field flex items-center gap-2 text-left">
                <span className="text-lg leading-none">{flagEmoji(group.country)}</span>
                <span className="truncate">{countryName(group.country, locale, t)}</span>
              </button>
            </Field>
            <Field label={t('group.currency')}>
              <button type="button" onClick={() => setPick('currency')} className="field text-left font-semibold">
                {group.currency}
              </button>
            </Field>
          </div>
          <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('people.currencyHint')}</p>
        </div>
      </Section>

      <Button
        variant="danger"
        className="w-full"
        onClick={() => {
          if (!window.confirm(t('group.confirmDelete', { name: group.name }))) return;
          actions.deleteGroup(group.id);
          navigate('/');
        }}
      >
        <Trash2 className="h-5 w-5" /> {t('group.delete')}
      </Button>

      <CountryPicker open={pick === 'country'} onClose={() => setPick(null)} value={group.country} onPick={(country) => actions.updateGroup(group.id, (g) => ({ ...g, country }))} />
      <CurrencyPicker open={pick === 'currency'} onClose={() => setPick(null)} value={group.currency} onPick={changeBase} suggested={[group.currency, getCountry(group.country).currency, ...Object.keys(group.rates)]} />
    </div>
  );
}
