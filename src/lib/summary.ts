import type { TFn } from '../i18n';
import type { BillResult } from './bill';
import { getCountry } from './countries';
import { formatMinor, fromMinor } from './money';
import { settlementPlan, splitExpense, summarize } from './settle';
import type { Expense, Group } from './types';

export function quickSummaryText(opts: {
  t: TFn;
  locale: string;
  bill: BillResult;
  names: Record<string, string>;
  rounded: Record<string, number>;
  treated: string[];
  equalEach: number | null;
  serviceRate: number;
  taxRate: number;
  tipRate: number | null;
}): string {
  const { t, locale, bill, names, rounded, treated } = opts;
  const m = (v: number) => formatMinor(v, bill.currency, locale);
  const date = new Date().toLocaleDateString(locale, { dateStyle: 'medium' });
  const lines: string[] = [`🧾 ${t('share.billTitle')} · ${date}`, ''];
  lines.push(`${t('bill.subtotal')}: ${m(bill.totals.base)}`);
  if (bill.totals.discount) lines.push(`${t('extras.discount')}: ${m(bill.totals.discount)}`);
  if (bill.totals.service) lines.push(`${t('extras.service')} ${opts.serviceRate}%: ${m(bill.totals.service)}`);
  if (bill.totals.tax) lines.push(`${t('extras.tax')} ${opts.taxRate}%: ${m(bill.totals.tax)}`);
  if (bill.totals.tip) lines.push(`${t('extras.tip')}${opts.tipRate ? ` ${opts.tipRate}%` : ''}: ${m(bill.totals.tip)}`);
  if (bill.totals.cover) lines.push(`${t('extras.cover')}: ${m(bill.totals.cover)}`);
  lines.push(`💰 ${t('bill.total')}: ${m(bill.totals.total)}`, '');
  if (opts.equalEach !== null) {
    lines.push(`👥 ${t('quick.eachPays', { n: bill.participants.length })}: ${m(opts.equalEach)}`);
  } else {
    for (const p of bill.participants) {
      const label = treated.includes(p) ? `🎂 ${t('quick.treated')}` : m(rounded[p] ?? bill.lines[p].total);
      lines.push(`• ${names[p]}: ${label}`);
    }
  }
  lines.push('', `— ${t('app.name')}`);
  return lines.join('\n');
}

export function groupSummaryText(g: Group, t: TFn, locale: string): string {
  const s = summarize(g);
  const plan = settlementPlan(g);
  const name = (id: string) => g.members.find((m) => m.id === id)?.name ?? '?';
  const m = (v: number) => formatMinor(v, g.currency, locale);
  const lines: string[] = [`${g.emoji} ${g.name}`, ''];
  lines.push(`💰 ${t('group.totalSpent')}: ${m(s.totalSpent)}`);
  const n = g.members.length;
  if (n) lines.push(`👥 ${t('group.perPerson')}: ${m(Math.round(s.totalSpent / n))}`);
  lines.push('', `📊 ${t('share.spentBy')}`);
  for (const mem of g.members) lines.push(`• ${mem.name}: ${m(s.consumed[mem.id] ?? 0)} (${t('stats.paid')} ${m(s.paid[mem.id] ?? 0)})`);
  lines.push('', `🔁 ${t('share.settleUp')}`);
  if (plan.length === 0) lines.push(`🎉 ${t('balances.allSettled')}`);
  for (const tr of plan) {
    const to = g.members.find((x) => x.id === tr.to);
    lines.push(`👉 ${name(tr.from)} → ${name(tr.to)}: ${m(tr.amount)}${to?.payInfo ? `  (${to.payInfo})` : ''}`);
  }
  const apps = getCountry(g.country).payApps.slice(0, 3).join(' / ');
  if (plan.length && apps) lines.push('', `💸 ${apps}`);
  lines.push('', `— ${t('app.name')}`);
  return lines.join('\n');
}

export function groupCsv(g: Group): string {
  const name = (id: string) => g.members.find((m) => m.id === id)?.name ?? '';
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['date', 'title', 'category', 'type', 'amount', 'currency', 'rate', `amount_${g.currency}`, 'paid_by', ...g.members.map((m) => `share_${m.name}`)];
  const rows = [header.map(esc).join(',')];
  for (const e of [...g.expenses].sort((a, b) => a.date.localeCompare(b.date))) {
    const split = splitFor(e, g);
    const payer = e.paidAmounts ? Object.keys(e.paidAmounts).filter((k) => e.paidAmounts![k] > 0).map(name).join(' + ') : name(e.payerId);
    rows.push(
      [
        e.date,
        e.title,
        e.category,
        e.kind,
        split.totalMajor,
        e.currency,
        e.currency === g.currency ? 1 : e.rate,
        split.baseMajor,
        payer,
        ...g.members.map((m) => split.share(m.id)),
      ]
        .map(esc)
        .join(','),
    );
  }
  return rows.join('\n');
}

function splitFor(e: Expense, g: Group) {
  const s = splitExpense(e, g.currency);
  return {
    totalMajor: fromMinor(s.total, e.currency),
    baseMajor: fromMinor(s.totalBase, g.currency),
    share: (id: string) => fromMinor(s.shares[id] ?? 0, g.currency),
  };
}
