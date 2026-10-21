import { useMemo } from 'react';
import { ArrowRight, BellRing, Copy, Share2 } from 'lucide-react';
import { getCountry } from '../../lib/countries';
import { formatMinor, fromMinor } from '../../lib/money';
import { settlementPlan, settlerOf, summarize } from '../../lib/settle';
import { groupSummaryText } from '../../lib/summary';
import type { Group } from '../../lib/types';
import { useI18n } from '../../i18n';
import { actions } from '../../state/store';
import { Avatar, Button, IconButton, Section, Toggle, copyText, cx, shareOrCopy, toast } from '../../components/ui';
import { SupportCard } from '../../components/extras';
import { SITE_URL } from '../../lib/site';

export function Balances({ group }: { group: Group }) {
  const { t, locale } = useI18n();
  const summary = useMemo(() => summarize(group), [group]);
  const plan = useMemo(() => settlementPlan(group), [group]);
  const money = (m: number) => formatMinor(m, group.currency, locale);
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const max = Math.max(1, ...Object.values(summary.net).map(Math.abs));
  const apps = getCountry(group.country).payApps;

  const markPaid = (from: string, to: string, amount: number) => {
    const msg = t('balances.confirmPaid', { from: name(from), to: name(to), amount: money(amount) });
    if (!window.confirm(msg)) return;
    actions.recordPayment(group.id, from, to, fromMinor(amount, group.currency), group.currency, t('balances.payment'));
    toast(t('toast.paid'));
  };

  const remind = async (from: string, to: string, amount: number) => {
    const receiver = group.members.find((m) => m.id === to);
    const lines = [
      t('remind.text', { from: name(from), to: name(to), amount: money(amount), group: `${group.emoji} ${group.name}` }),
    ];
    if (receiver?.payInfo) lines.push(t('remind.payInfo', { info: receiver.payInfo }));
    lines.push(t('remind.thanks'), '', `— ${t('app.name')} · ${SITE_URL}`);
    const r = await shareOrCopy(lines.join('\n'), group.name);
    if (r === 'copied') toast(t('toast.copied'));
  };

  const share = async () => {
    const r = await shareOrCopy(groupSummaryText(group, t, locale), group.name);
    if (r === 'copied') toast(t('toast.copied'));
  };

  return (
    <div className="space-y-6">
      <Section title={t('balances.settleUp')}>
        {plan.length === 0 ? (
          <div className="card px-6 py-8 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 font-semibold">{t('balances.allSettled')}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('balances.allSettledBody')}</p>
            {group.expenses.length > 0 && <SupportCard compact className="mt-4" />}
          </div>
        ) : (
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
            {plan.map((tr, i) => {
              const receiver = group.members.find((m) => m.id === tr.to);
              return (
                <div key={`${tr.from}-${tr.to}-${i}`} className="space-y-2 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar id={tr.from} name={name(tr.from)} size="sm" />
                    <span className="min-w-0 truncate font-medium">{name(tr.from)}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                    <Avatar id={tr.to} name={name(tr.to)} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">{name(tr.to)}</span>
                    <span className="text-lg font-bold tabular-nums">{money(tr.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    {receiver?.payInfo ? (
                      <button
                        type="button"
                        onClick={async () => (await copyText(receiver.payInfo!)) === 'copied' && toast(t('toast.copied'))}
                        className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <Copy className="h-3 w-3 shrink-0" /> <span className="truncate">{receiver.payInfo}</span>
                      </button>
                    ) : (
                      <span className="truncate text-xs text-zinc-400">{apps.slice(0, 3).join(' · ')}</span>
                    )}
                    <IconButton label={t('remind.button')} className="ml-auto h-9 w-9" onClick={() => remind(tr.from, tr.to, tr.amount)}>
                      <BellRing className="h-4 w-4" />
                    </IconButton>
                    <Button size="sm" variant="soft" className="shrink-0" onClick={() => markPaid(tr.from, tr.to, tr.amount)}>
                      {t('balances.markPaid')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="card px-4 py-2">
          <Toggle
            checked={group.simplify}
            onChange={(simplify) => actions.updateGroup(group.id, (g) => ({ ...g, simplify }))}
            label={t('balances.simplify')}
            hint={t('balances.simplifyHint')}
          />
        </div>
        <Button className="w-full" onClick={share}>
          <Share2 className="h-5 w-5" /> {t('balances.shareSummary')}
        </Button>
      </Section>

      <Section title={t('balances.net')}>
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {group.members.map((m) => {
            const settler = settlerOf(group, m.id);
            const v = summary.net[m.id] ?? 0;
            const linked = settler !== m.id;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar id={m.id} name={m.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{m.name}</p>
                  {linked ? (
                    <p className="truncate text-xs text-zinc-500">{t('balances.coveredBy', { name: name(settler) })}</p>
                  ) : (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={cx('h-full rounded-full', v >= 0 ? 'bg-brand-500' : 'bg-rose-400')}
                        style={{ width: `${(Math.abs(v) / max) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {!linked && (
                  <div className="text-right">
                    <p className={cx('font-semibold tabular-nums', v > 0 ? 'text-brand-700 dark:text-brand-300' : v < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400')}>
                      {v > 0 ? '+' : ''}
                      {money(v)}
                    </p>
                    <p className="text-[11px] text-zinc-500">{v > 0 ? t('balances.getsBack') : v < 0 ? t('balances.owes') : t('balances.even')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
