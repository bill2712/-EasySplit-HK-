import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeftRight, Download, Link2, MoreHorizontal, Plus, Share2, UserPlus } from 'lucide-react';
import { categoryOf } from '../../lib/categories';
import { formatMinor } from '../../lib/money';
import { splitExpense, summarize } from '../../lib/settle';
import { encodeGroup } from '../../lib/share';
import { groupCsv, groupSummaryText } from '../../lib/summary';
import type { Expense, Group } from '../../lib/types';
import { useI18n } from '../../i18n';
import { useStore } from '../../state/store';
import { appUrl, navigate, useRoute } from '../../router';
import { Button, EmptyState, IconButton, Segmented, Sheet, TopBar, cx, shareOrCopy, toast } from '../../components/ui';
import { downloadFile } from '../Settings';
import { Balances } from './Balances';
import { ExpenseEditor } from './ExpenseEditor';
import { People } from './People';
import { Stats } from './Stats';

type Tab = 'expenses' | 'balances' | 'stats' | 'people';

export function GroupScreen({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const route = useRoute();
  const tab = (route[2] as Tab) || 'expenses';
  const [editing, setEditing] = useState<Expense | null | 'new' | 'transfer'>(null);
  const [menu, setMenu] = useState(false);
  const summary = useMemo(() => (group ? summarize(group) : null), [group]);

  if (!group || !summary) {
    return (
      <div className="mx-auto max-w-md p-6">
        <EmptyState icon="🤔" title={t('group.notFound')} action={<Button onClick={() => navigate('/')}>{t('common.home')}</Button>} />
      </div>
    );
  }

  const setTab = (tb: Tab) => navigate(`/g/${group.id}${tb === 'expenses' ? '' : `/${tb}`}`, true);
  const money = (m: number, compact = false) => formatMinor(m, group.currency, locale, compact);
  const needsPeople = group.members.length < 2;

  const shareLink = async () => {
    setMenu(false);
    const url = appUrl(`/import/${encodeGroup(group)}`);
    const r = await shareOrCopy(t('group.shareLinkText', { name: group.name }), group.name, url);
    if (r === 'copied') toast(t('toast.linkCopied'));
  };
  const shareText = async () => {
    setMenu(false);
    const r = await shareOrCopy(groupSummaryText(group, t, locale), group.name);
    if (r === 'copied') toast(t('toast.copied'));
  };
  const exportCsv = () => {
    setMenu(false);
    downloadFile(`${group.name.replace(/[^\p{L}\p{N}]+/gu, '-') || 'group'}.csv`, '﻿' + groupCsv(group), 'text/csv;charset=utf-8');
  };

  return (
    <div className="pb-28">
      <TopBar
        title={
          <span className="flex items-center gap-2">
            <span>{group.emoji}</span>
            <span className="truncate">{group.name}</span>
          </span>
        }
        sub={t('home.groupMeta', { people: group.members.length, items: group.expenses.filter((e) => e.kind === 'expense').length })}
        onBack={() => navigate('/')}
        right={
          <IconButton label={t('common.more')} onClick={() => setMenu(true)}>
            <MoreHorizontal className="h-5 w-5" />
          </IconButton>
        }
      />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
        <div className="relative overflow-hidden rounded-[28px] bg-zinc-900 p-5 text-white dark:bg-zinc-800">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-500/30 blur-2xl" />
          <p className="text-xs font-medium text-white/60">{t('group.totalSpent')}</p>
          <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">{money(summary.totalSpent)}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
            <span>
              {t('group.perPerson')}: <b className="text-white">{money(Math.round(summary.totalSpent / Math.max(1, group.members.length)), true)}</b>
            </span>
            <span>{group.currency}</span>
          </div>
        </div>

        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'expenses', label: t('tab.expenses') },
            { value: 'balances', label: t('tab.balances') },
            { value: 'stats', label: t('tab.stats') },
            { value: 'people', label: t('tab.people') },
          ]}
        />

        {tab === 'expenses' &&
          (needsPeople ? (
            <EmptyState
              icon="👥"
              title={t('group.addPeopleTitle')}
              body={t('group.addPeopleBody')}
              action={
                <Button onClick={() => setTab('people')}>
                  <UserPlus className="h-5 w-5" /> {t('group.addPeople')}
                </Button>
              }
            />
          ) : (
            <ExpenseList group={group} onOpen={(e) => setEditing(e)} onAdd={() => setEditing('new')} />
          ))}
        {tab === 'balances' && <Balances group={group} />}
        {tab === 'stats' && <Stats group={group} />}
        {tab === 'people' && <People group={group} />}
      </main>

      {tab !== 'people' && !needsPeople && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto flex max-w-2xl justify-end gap-2 px-4 pb-4">
            <Button variant="secondary" size="lg" className="shadow-lg" onClick={() => setEditing('transfer')}>
              <ArrowLeftRight className="h-5 w-5" />
              <span className="hidden sm:inline">{t('balances.recordPayment')}</span>
            </Button>
            <Button size="lg" className="shadow-lg shadow-brand-900/30" onClick={() => setEditing('new')}>
              <Plus className="h-5 w-5" /> {t('expense.add')}
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <ExpenseEditor
          group={group}
          expense={typeof editing === 'object' ? editing : null}
          kind={editing === 'transfer' || (typeof editing === 'object' && editing.kind === 'transfer') ? 'transfer' : 'expense'}
          onClose={() => setEditing(null)}
        />
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={group.name}>
        <div className="space-y-2">
          <MenuItem icon={<Share2 className="h-5 w-5" />} label={t('balances.shareSummary')} onClick={shareText} />
          <MenuItem icon={<Link2 className="h-5 w-5" />} label={t('group.shareLink')} hint={t('group.shareLinkHint')} onClick={shareLink} />
          <MenuItem icon={<Download className="h-5 w-5" />} label={t('group.exportCsv')} onClick={exportCsv} />
        </div>
      </Sheet>
    </div>
  );
}

function MenuItem({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
      </span>
    </button>
  );
}

function ExpenseList({ group, onOpen, onAdd }: { group: Group; onOpen: (e: Expense) => void; onAdd: () => void }) {
  const { t, locale } = useI18n();
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';

  const byDay = useMemo(() => {
    const sorted = [...group.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const days: { date: string; items: { e: Expense; base: number; own: number }[]; total: number }[] = [];
    for (const e of sorted) {
      const s = splitExpense(e, group.currency);
      let d = days[days.length - 1];
      if (!d || d.date !== e.date) {
        d = { date: e.date, items: [], total: 0 };
        days.push(d);
      }
      d.items.push({ e, base: s.totalBase, own: s.total });
      if (e.kind === 'expense') d.total += s.totalBase;
    }
    return days;
  }, [group]);

  if (group.expenses.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title={t('group.noExpenses')}
        body={t('group.noExpensesBody')}
        action={
          <Button onClick={onAdd}>
            <Plus className="h-5 w-5" /> {t('expense.add')}
          </Button>
        }
      />
    );
  }

  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-5">
      {byDay.map((day) => (
        <section key={day.date} className="space-y-2">
          <div className="flex justify-between px-1 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span>{fmtDay(day.date)}</span>
            <span className="tabular-nums">{formatMinor(day.total, group.currency, locale)}</span>
          </div>
          <div className="card divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800">
            {day.items.map(({ e, base, own }) => {
              const cat = categoryOf(e.category);
              const transfer = e.kind === 'transfer';
              const payers = e.paidAmounts ? Object.keys(e.paidAmounts).filter((k) => e.paidAmounts![k] > 0) : [e.payerId];
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpen(e)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl', transfer ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-zinc-100 dark:bg-zinc-800')}>
                    {cat.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{e.title}</span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {transfer
                        ? `${name(e.payerId)} → ${name(e.participants[0])}`
                        : `${t('expense.paidByName', { name: payers.map(name).join(' + ') })} · ${t('expense.forN', { n: e.participants.length })}${e.treated.length ? ' · 🎂' : ''}${e.extras && (e.extras.service || e.extras.tip || (!e.extras.taxIncluded && e.extras.tax)) ? ' · 🧾' : ''}`}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={cx('block font-semibold tabular-nums', transfer && 'text-emerald-700 dark:text-emerald-300')}>{formatMinor(base, group.currency, locale)}</span>
                    {e.currency !== group.currency && <span className="block text-xs tabular-nums text-zinc-500">{formatMinor(own, e.currency, locale)}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
