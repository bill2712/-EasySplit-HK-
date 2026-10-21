import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Calculator, ChevronDown, ChevronRight, Plus, Settings2, X } from 'lucide-react';
import { flagEmoji, getCountry } from '../lib/countries';
import { formatMinor } from '../lib/money';
import { summarize } from '../lib/settle';
import type { GroupKind } from '../lib/types';
import { useI18n, type Key } from '../i18n';
import { actions, useStore } from '../state/store';
import { navigate } from '../router';
import { CountryPicker, CurrencyPicker } from '../components/pickers';
import { Avatar, Button, Field, Section, Sheet, TextField, cx } from '../components/ui';
import { SettingsSheet } from './Settings';
import { InstallButton, SupportCard } from '../components/extras';

const KINDS: { kind: GroupKind; emoji: string; label: Key; hint: Key }[] = [
  { kind: 'meal', emoji: '🍽️', label: 'kind.meal', hint: 'kind.mealHint' },
  { kind: 'gathering', emoji: '🎉', label: 'kind.gathering', hint: 'kind.gatheringHint' },
  { kind: 'trip', emoji: '✈️', label: 'kind.trip', hint: 'kind.tripHint' },
  { kind: 'home', emoji: '🏠', label: 'kind.home', hint: 'kind.homeHint' },
];

const FEATURES: { emoji: string; title: Key; body: Key }[] = [
  { emoji: '🌍', title: 'home.feat1Title', body: 'home.feat1Body' },
  { emoji: '💱', title: 'home.feat2Title', body: 'home.feat2Body' },
  { emoji: '🤝', title: 'home.feat3Title', body: 'home.feat3Body' },
];

export const FAQ: [Key, Key][] = [
  ['faq.q1', 'faq.a1'],
  ['faq.q2', 'faq.a2'],
  ['faq.q3', 'faq.a3'],
  ['faq.q4', 'faq.a4'],
  ['faq.q5', 'faq.a5'],
  ['faq.q6', 'faq.a6'],
];

export function Home() {
  const { t, locale } = useI18n();
  const groups = useStore((s) => s.groups);
  const quick = useStore((s) => s.quick);
  const [createKind, setCreateKind] = useState<GroupKind | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rows = useMemo(
    () =>
      [...groups]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((g) => ({ g, total: summarize(g).totalSpent })),
    [groups],
  );

  return (
    <div className="pb-16">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 pb-2 pt-6">
        <div className="flex items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="h-10 w-10 rounded-2xl shadow-sm" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('app.name')}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('app.tagline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <InstallButton />
        <button
          type="button"
          aria-label={t('settings.title')}
          onClick={() => setSettingsOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition active:scale-95 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800"
        >
          <Settings2 className="h-5 w-5" />
        </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-7 px-4 pt-3">
        {/* Quick split hero */}
        <button
          type="button"
          onClick={() => navigate('/quick')}
          className="group relative block w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-5 text-left text-white shadow-lg shadow-brand-900/20 transition active:scale-[0.99]"
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <Calculator className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{t('home.quickTitle')}</p>
              <p className="mt-0.5 text-sm text-white/85">{t('home.quickBody')}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                {flagEmoji(quick.country)} {quick.currency}
                {quick.extras.service ? ` · +${quick.extras.service}%` : ''}
                {quick.extras.tax && !quick.extras.taxIncluded ? ` · ${getCountry(quick.country).taxName ?? t('extras.tax')} ${quick.extras.tax}%` : ''}
                {quick.extras.tip ? ` · ${t('extras.tip')} ${quick.extras.tip}%` : ''}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
          </div>
        </button>

        {/* Groups */}
        <Section
          title={t('home.groups')}
          action={
            groups.length > 0 && (
              <button type="button" onClick={() => setCreateKind('meal')} className="flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                <Plus className="h-4 w-4" /> {t('home.new')}
              </button>
            )
          }
        >
          {rows.length === 0 ? (
            <div className="card p-4">
              <p className="mb-3 px-1 text-sm text-zinc-600 dark:text-zinc-300">{t('home.groupsEmpty')}</p>
              <div className="grid grid-cols-2 gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k.kind}
                    type="button"
                    onClick={() => setCreateKind(k.kind)}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-brand-500/10"
                  >
                    <span className="text-2xl">{k.emoji}</span>
                    <span className="mt-1 block font-semibold">{t(k.label)}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">{t(k.hint)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="card divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800">
              {rows.map(({ g, total }) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(`/g/${g.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-2xl dark:bg-zinc-800">{g.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{g.name}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="flex -space-x-1.5">
                        {g.members.slice(0, 5).map((m) => (
                          <Avatar key={m.id} id={m.id} name={m.name} size="sm" />
                        ))}
                      </span>
                      <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {t('home.groupMeta', { people: g.members.length, items: g.expenses.filter((e) => e.kind === 'expense').length })}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums">{formatMinor(total, g.currency, locale, true)}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                </button>
              ))}
            </div>
          )}
        </Section>

        <section className="divide-y divide-zinc-200/70 rounded-3xl bg-white/60 ring-1 ring-zinc-200/70 dark:divide-zinc-800 dark:bg-zinc-900/60 dark:ring-zinc-800">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 px-4 py-3 text-sm">
              <span className="text-xl leading-6">{f.emoji}</span>
              <span>
                <span className="block font-semibold">{t(f.title)}</span>
                <span className="block text-zinc-500 dark:text-zinc-400">{t(f.body)}</span>
              </span>
            </div>
          ))}
        </section>

        <button
          type="button"
          onClick={() => navigate('/guide')}
          className="card flex w-full items-center gap-3 p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t('guide.title')}</span>
            <span className="block text-sm text-zinc-500 dark:text-zinc-400">{t('home.guideBody')}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-600" />
        </button>

        <Section title={t('faq.title')}>
          <div className="card divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                  <span>{t(q)}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{t(a)}</p>
              </details>
            ))}
          </div>
        </Section>

        <SupportCard />

        <p className="pb-4 text-center text-xs text-zinc-400">{t('home.privacy')}</p>
      </main>

      {createKind && <CreateGroupSheet initialKind={createKind} onClose={() => setCreateKind(null)} />}
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export function CreateGroupSheet({ initialKind, onClose }: { initialKind: GroupKind; onClose: () => void }) {
  const { t } = useI18n();
  const settingsCountry = useStore((s) => s.settings.country);
  const [kind, setKind] = useState<GroupKind>(initialKind);
  const [name, setName] = useState('');
  const [country, setCountry] = useState(settingsCountry);
  const [currency, setCurrency] = useState(getCountry(settingsCountry).currency);
  const [members, setMembers] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [pick, setPick] = useState<'country' | 'currency' | null>(null);
  const k = KINDS.find((x) => x.kind === kind)!;

  const addDraft = (text = draft) => {
    const parts = text
      .split(/[,，、\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) setMembers((m) => [...m, ...parts.filter((p) => !m.includes(p))]);
    setDraft('');
  };

  const create = () => {
    const all = [...members, ...draft.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean)];
    const g = actions.createGroup({ name: name.trim() || t(k.label), emoji: k.emoji, kind, currency, country, members: Array.from(new Set(all)) });
    onClose();
    navigate(`/g/${g.id}`);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('home.newGroup')}
      footer={
        <Button className="w-full" onClick={create}>
          {t('common.create')}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-2">
          {KINDS.map((x) => (
            <button
              key={x.kind}
              type="button"
              onClick={() => setKind(x.kind)}
              className={cx(
                'rounded-2xl border p-2 text-center transition',
                kind === x.kind ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
              )}
            >
              <span className="block text-2xl">{x.emoji}</span>
              <span className="block truncate text-xs font-semibold">{t(x.label)}</span>
            </button>
          ))}
        </div>

        <Field label={t('group.name')}>
          <TextField autoFocus value={name} onChange={setName} placeholder={t(`${k.label}Example` as Key)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('group.country')}>
            <button type="button" onClick={() => setPick('country')} className="field flex items-center gap-2 text-left">
              <span className="text-lg leading-none">{flagEmoji(country)}</span>
              <span className="truncate">{country === 'XX' ? t('country.other') : country}</span>
            </button>
          </Field>
          <Field label={t('group.currency')}>
            <button type="button" onClick={() => setPick('currency')} className="field text-left font-semibold">
              {currency}
            </button>
          </Field>
        </div>
        {kind === 'trip' && <p className="-mt-3 px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('group.tripCurrencyHint')}</p>}

        <Field label={t('group.members')} hint={t('group.membersHint')}>
          <div className="field flex flex-wrap items-center gap-1.5 py-2">
            {members.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 rounded-full bg-brand-100 py-1 pl-3 pr-1 text-sm font-medium text-brand-900 dark:bg-brand-500/20 dark:text-brand-100">
                {m}
                <button type="button" aria-label={t('common.delete')} onClick={() => setMembers(members.filter((x) => x !== m))} className="rounded-full p-0.5 hover:bg-brand-200 dark:hover:bg-brand-500/30">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <input
              value={draft}
              onChange={(e) => (/[,，、]/.test(e.target.value) ? addDraft(e.target.value) : setDraft(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDraft();
                } else if (e.key === 'Backspace' && !draft && members.length) {
                  setMembers(members.slice(0, -1));
                }
              }}
              onBlur={() => addDraft()}
              placeholder={members.length ? '' : t('group.membersPlaceholder')}
              aria-label={t('group.members')}
              className="min-w-[8rem] flex-1 bg-transparent py-1 outline-none placeholder:text-zinc-400"
            />
          </div>
        </Field>
      </div>

      <CountryPicker
        open={pick === 'country'}
        onClose={() => setPick(null)}
        value={country}
        onPick={(c) => {
          setCountry(c);
          setCurrency(getCountry(c).currency);
        }}
      />
      <CurrencyPicker open={pick === 'currency'} onClose={() => setPick(null)} value={currency} onPick={setCurrency} suggested={[getCountry(country).currency, getCountry(settingsCountry).currency, 'USD', 'EUR']} />
    </Sheet>
  );
}
