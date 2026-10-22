// Data that arrives from outside (share links, backup files, live sync from a
// friend's device, or an older app version) may be incomplete. These helpers
// fill in safe defaults so a malformed record can never crash the app.

import type { Expense, Extras, Group, Item, Member } from './types';
import { NO_EXTRAS } from './bill';

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = <T extends object>(v: unknown): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : ({} as T));
const ids = (v: unknown): string[] => arr<unknown>(v).filter((x): x is string => typeof x === 'string');
const currency = (v: unknown, d: string) => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? v : d);

function numbers(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, x] of Object.entries(obj<Record<string, unknown>>(v))) if (typeof x === 'number' && Number.isFinite(x)) out[k] = x;
  return out;
}

function normalizeExtras(v: unknown): Extras | null {
  if (!v || typeof v !== 'object') return null;
  const e = obj<Partial<Extras>>(v);
  return {
    discount: num(e.discount),
    discountType: e.discountType === 'amount' ? 'amount' : 'percent',
    service: num(e.service),
    tax: num(e.tax),
    taxIncluded: e.taxIncluded !== false,
    taxOnService: !!e.taxOnService,
    tip: num(e.tip),
    tipType: e.tipType === 'amount' ? 'amount' : 'percent',
    tipOnTotal: !!e.tipOnTotal,
    cover: num(e.cover, NO_EXTRAS.cover),
  };
}

function normalizeItem(v: unknown, i: number): Item {
  const it = obj<Partial<Item>>(v);
  return { id: str(it.id, `item${i}`), name: str(it.name), price: num(it.price), qty: Math.max(1, num(it.qty, 1)), who: ids(it.who) };
}

export function normalizeExpense(v: unknown, fallbackCurrency: string, i = 0): Expense {
  const e = obj<Partial<Expense>>(v);
  const modes = ['equal', 'shares', 'exact', 'percent', 'items'] as const;
  const paid = e.paidAmounts && typeof e.paidAmounts === 'object' ? numbers(e.paidAmounts) : null;
  return {
    id: str(e.id, `expense${i}`),
    kind: e.kind === 'transfer' ? 'transfer' : 'expense',
    title: str(e.title),
    category: (str(e.category, 'other') || 'other') as Expense['category'],
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(e.date)) ? str(e.date) : new Date(num(e.createdAt, Date.now())).toISOString().slice(0, 10),
    currency: currency(e.currency, fallbackCurrency),
    rate: num(e.rate, 1),
    payerId: str(e.payerId),
    paidAmounts: paid && Object.keys(paid).length ? paid : null,
    note: typeof e.note === 'string' ? e.note : undefined,
    createdAt: num(e.createdAt, 0),
    mode: modes.includes(e.mode as (typeof modes)[number]) ? (e.mode as Expense['mode']) : 'equal',
    amount: num(e.amount),
    participants: ids(e.participants),
    weights: numbers(e.weights),
    items: arr<unknown>(e.items).map(normalizeItem),
    treated: ids(e.treated),
    extras: normalizeExtras(e.extras),
  };
}

function normalizeMember(v: unknown, i: number): Member {
  const m = obj<Partial<Member>>(v);
  return {
    id: str(m.id, `member${i}`),
    name: str(m.name, `#${i + 1}`),
    linkedTo: typeof m.linkedTo === 'string' ? m.linkedTo : null,
    payInfo: typeof m.payInfo === 'string' ? m.payInfo : undefined,
  };
}

/** A complete, safe Group, or null if the input isn't recognisably a group. */
export function normalizeGroup(v: unknown): Group | null {
  if (!v || typeof v !== 'object') return null;
  const g = obj<Partial<Group>>(v);
  if (typeof g.id !== 'string' || !g.id) return null;
  const base = currency(g.currency, 'USD');
  const now = Date.now();
  return {
    id: g.id,
    name: str(g.name, 'Group'),
    emoji: str(g.emoji, '🍽️') || '🍽️',
    kind: (['meal', 'gathering', 'trip', 'home'] as const).includes(g.kind as Group['kind']) ? (g.kind as Group['kind']) : 'meal',
    currency: base,
    country: str(g.country, 'XX'),
    members: arr<unknown>(g.members).map(normalizeMember),
    expenses: arr<unknown>(g.expenses).map((e, i) => normalizeExpense(e, base, i)),
    rates: numbers(g.rates),
    simplify: g.simplify !== false,
    budget: typeof g.budget === 'number' && g.budget > 0 ? g.budget : undefined,
    cloudId: typeof g.cloudId === 'string' ? g.cloudId : undefined,
    createdAt: num(g.createdAt, now),
    updatedAt: num(g.updatedAt, now),
  };
}
