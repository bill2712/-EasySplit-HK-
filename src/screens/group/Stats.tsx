import { useMemo } from 'react';
import { categoryOf } from '../../lib/categories';
import { formatMinor } from '../../lib/money';
import { summarize } from '../../lib/settle';
import type { Category, Group } from '../../lib/types';
import { useI18n, type Key } from '../../i18n';
import { Avatar, EmptyState, Section } from '../../components/ui';

export function Stats({ group }: { group: Group }) {
  const { t, locale } = useI18n();
  const s = useMemo(() => summarize(group), [group]);
  const money = (m: number, compact = false) => formatMinor(m, group.currency, locale, compact);

  if (s.totalSpent === 0) return <EmptyState icon="📊" title={t('stats.empty')} />;

  const cats = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]);
  const days = Object.entries(s.byDay).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(1, ...days.map((d) => d[1]));
  const maxPerson = Math.max(1, ...group.members.map((m) => Math.max(s.paid[m.id] ?? 0, s.consumed[m.id] ?? 0)));
  const count = group.expenses.filter((e) => e.kind === 'expense').length;
  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        <Tile label={t('stats.items')} value={String(count)} />
        {days.length > 1 ? (
          <Tile label={t('stats.perDay')} value={money(Math.round(s.totalSpent / days.length), true)} />
        ) : (
          <Tile label={t('stats.perItem')} value={money(Math.round(s.totalSpent / Math.max(1, count)), true)} />
        )}
      </div>

      <Section title={t('stats.byCategory')}>
        <div className="card space-y-3 p-4">
          <div className="flex h-3 overflow-hidden rounded-full">
            {cats.map(([c, v]) => (
              <div key={c} className={categoryOf(c as Category).color} style={{ width: `${(v / s.totalSpent) * 100}%` }} title={c} />
            ))}
          </div>
          {cats.map(([c, v]) => {
            const cat = categoryOf(c as Category);
            return (
              <div key={c} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-lg dark:bg-zinc-800">{cat.emoji}</span>
                <span className="flex-1 text-[15px]">{t(`cat.${cat.id}` as Key)}</span>
                <span className="text-xs text-zinc-500">{Math.round((v / s.totalSpent) * 100)}%</span>
                <span className="w-24 text-right font-semibold tabular-nums">{money(v)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={t('stats.byPerson')}>
        <div className="card space-y-4 p-4">
          <div className="flex gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" />{t('stats.paid')}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />{t('stats.share')}</span>
          </div>
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar id={m.id} name={m.name} size="sm" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate font-medium">{m.name}</span>
                  <span className="tabular-nums text-zinc-500">
                    {money(s.paid[m.id] ?? 0, true)} / {money(s.consumed[m.id] ?? 0, true)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${((s.paid[m.id] ?? 0) / maxPerson) * 100}%` }} />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${((s.consumed[m.id] ?? 0) / maxPerson) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {days.length > 1 && (
        <Section title={t('stats.byDay')}>
          <div className="card p-4">
            <div className="flex h-40 items-end gap-1.5 overflow-x-auto">
              {days.map(([d, v]) => (
                <div key={d} className="flex min-w-[2.25rem] flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-zinc-500">{money(v, true)}</span>
                  <div className="w-full rounded-t-lg bg-brand-400 dark:bg-brand-500" style={{ height: `${Math.max(4, (v / maxDay) * 110)}px` }} />
                  <span className="text-[10px] text-zinc-500">{fmtDay(d)}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 truncate text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
