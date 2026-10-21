import { computeBill } from './bill';
import { allocate, fromMinor, toMinor } from './money';
import type { Expense, Group, ID, Transfer } from './types';

export interface ExpenseSplit {
  /** Total in the expense's own currency, minor units. */
  total: number;
  /** Total converted to the group's base currency, minor units. */
  totalBase: number;
  /** Who consumed what, in base minor units (sums to totalBase). */
  shares: Record<ID, number>;
  /** Who paid what, in base minor units (sums to totalBase). */
  paid: Record<ID, number>;
}

export function expenseTotal(e: Expense): number {
  return computeBill(e, e.currency).totals.total;
}

export function splitExpense(e: Expense, baseCurrency: string): ExpenseSplit {
  const bill = computeBill(e, e.currency);
  const total = bill.totals.total;
  const rate = e.currency === baseCurrency ? 1 : e.rate || 0;
  const totalBase = e.currency === baseCurrency ? total : toMinor(fromMinor(total, e.currency) * rate, baseCurrency);

  const people = bill.participants;
  const shareParts = allocate(totalBase, people.map((p) => bill.lines[p].total));
  const shares: Record<ID, number> = {};
  people.forEach((p, i) => (shares[p] = shareParts[i]));

  const paid: Record<ID, number> = {};
  const multi = e.paidAmounts && Object.values(e.paidAmounts).some((v) => v > 0);
  if (multi) {
    const ids = Object.keys(e.paidAmounts!).filter((id) => (e.paidAmounts![id] || 0) > 0);
    const parts = allocate(totalBase, ids.map((id) => e.paidAmounts![id]));
    ids.forEach((id, i) => (paid[id] = parts[i]));
  } else {
    paid[e.payerId] = totalBase;
  }
  return { total, totalBase, shares, paid };
}

/** Follow "paid by" links (couples / families) to the person who settles. */
export function settlerOf(group: Group, id: ID): ID {
  const seen = new Set<ID>();
  let cur = id;
  for (;;) {
    const m = group.members.find((x) => x.id === cur);
    const next = m?.linkedTo;
    if (!next || seen.has(next) || !group.members.some((x) => x.id === next)) return cur;
    seen.add(cur);
    cur = next;
  }
}

export interface GroupSummary {
  /** Net position per member before couples are merged (+ = is owed). */
  raw: Record<ID, number>;
  /** Net position after merging couples/families into their settler. */
  net: Record<ID, number>;
  paid: Record<ID, number>;
  consumed: Record<ID, number>;
  totalSpent: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
}

export function summarize(group: Group): GroupSummary {
  const raw: Record<ID, number> = {};
  const paid: Record<ID, number> = {};
  const consumed: Record<ID, number> = {};
  group.members.forEach((m) => {
    raw[m.id] = 0;
    paid[m.id] = 0;
    consumed[m.id] = 0;
  });
  let totalSpent = 0;
  const byCategory: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  for (const e of group.expenses) {
    const s = splitExpense(e, group.currency);
    for (const [id, v] of Object.entries(s.paid)) raw[id] = (raw[id] ?? 0) + v;
    for (const [id, v] of Object.entries(s.shares)) raw[id] = (raw[id] ?? 0) - v;
    if (e.kind === 'expense') {
      totalSpent += s.totalBase;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + s.totalBase;
      byDay[e.date] = (byDay[e.date] ?? 0) + s.totalBase;
      for (const [id, v] of Object.entries(s.paid)) paid[id] = (paid[id] ?? 0) + v;
      for (const [id, v] of Object.entries(s.shares)) consumed[id] = (consumed[id] ?? 0) + v;
    }
  }

  const net: Record<ID, number> = {};
  group.members.forEach((m) => (net[m.id] = 0));
  for (const [id, v] of Object.entries(raw)) {
    const s = settlerOf(group, id);
    net[s] = (net[s] ?? 0) + v;
  }
  return { raw, net, paid, consumed, totalSpent, byCategory, byDay };
}

/** Fewest transfers that settle everyone (greedy: biggest debtor pays biggest creditor). */
export function minimalTransfers(net: Record<ID, number>): Transfer[] {
  const debtors = Object.entries(net)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, v: -v }));
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, v }));
  const out: Transfer[] = [];
  for (;;) {
    debtors.sort((a, b) => b.v - a.v);
    creditors.sort((a, b) => b.v - a.v);
    const d = debtors[0];
    const c = creditors[0];
    if (!d || !c || d.v <= 0 || c.v <= 0) break;
    const amt = Math.min(d.v, c.v);
    out.push({ from: d.id, to: c.id, amount: amt });
    d.v -= amt;
    c.v -= amt;
    if (d.v === 0) debtors.shift();
    if (c.v === 0) creditors.shift();
  }
  return out;
}

/** Who owes whom without simplifying across people (each debt goes back to who paid). */
export function directTransfers(group: Group): Transfer[] {
  const owe = new Map<string, number>(); // "from>to" -> amount
  const add = (from: ID, to: ID, amt: number) => {
    if (from === to || amt === 0) return;
    const [a, b, v] = from < to ? [from, to, amt] : [to, from, -amt];
    const key = `${a}>${b}`;
    owe.set(key, (owe.get(key) ?? 0) + v);
  };
  for (const e of group.expenses) {
    const s = splitExpense(e, group.currency);
    const payers = Object.keys(s.paid);
    for (const [who, share] of Object.entries(s.shares)) {
      const parts = allocate(share, payers.map((p) => s.paid[p]));
      payers.forEach((p, i) => add(settlerOf(group, who), settlerOf(group, p), parts[i]));
    }
  }
  const out: Transfer[] = [];
  for (const [key, v] of owe) {
    const [a, b] = key.split('>');
    if (v > 0) out.push({ from: a, to: b, amount: v });
    else if (v < 0) out.push({ from: b, to: a, amount: -v });
  }
  return out.sort((x, y) => y.amount - x.amount);
}

export function settlementPlan(group: Group): Transfer[] {
  return group.simplify ? minimalTransfers(summarize(group).net) : directTransfers(group);
}
