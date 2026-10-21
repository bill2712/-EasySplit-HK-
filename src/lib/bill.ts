import { allocate, toMinor } from './money';
import type { Extras, ID, SplitSpec } from './types';

export const NO_EXTRAS: Extras = {
  discount: 0,
  discountType: 'percent',
  service: 0,
  tax: 0,
  taxIncluded: true,
  taxOnService: false,
  tip: 0,
  tipType: 'percent',
  tipOnTotal: false,
  cover: 0,
};

export interface BillParts {
  base: number;
  discount: number;
  service: number;
  tax: number;
  tip: number;
  cover: number;
  treat: number;
  total: number;
}

export interface BillResult {
  currency: string;
  participants: ID[];
  /** Per-person amounts in minor units. `total` values sum exactly to totals.total. */
  lines: Record<ID, BillParts>;
  totals: BillParts;
  /** Tax already inside the prices (for "incl. VAT" display), minor units. */
  includedTax: number;
}

const zero = (): BillParts => ({ base: 0, discount: 0, service: 0, tax: 0, tip: 0, cover: 0, treat: 0, total: 0 });

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Each participant's share of the food/drink before any extras (major units). */
export function baseShares(spec: SplitSpec): Record<ID, number> {
  const people = spec.participants;
  const out: Record<ID, number> = {};
  people.forEach((p) => (out[p] = 0));
  if (people.length === 0) return out;
  const amount = num(spec.amount);

  switch (spec.mode) {
    case 'equal':
      people.forEach((p) => (out[p] = amount / people.length));
      break;
    case 'shares':
    case 'percent': {
      const ws = people.map((p) => Math.max(0, num(spec.weights[p] ?? (spec.mode === 'shares' ? 1 : 0))));
      const sum = ws.reduce((a, b) => a + b, 0);
      people.forEach((p, i) => (out[p] = sum > 0 ? (amount * ws[i]) / sum : amount / people.length));
      break;
    }
    case 'exact':
      people.forEach((p) => (out[p] = Math.max(0, num(spec.weights[p]))));
      break;
    case 'items':
      for (const item of spec.items) {
        const cost = num(item.price) * (num(item.qty) || 1);
        const who = item.who.filter((w) => people.includes(w));
        const eaters = who.length > 0 ? who : people;
        eaters.forEach((p) => (out[p] += cost / eaters.length));
      }
      break;
  }
  return out;
}

/** The subtotal the split is based on, before extras (major units). */
export function splitSubtotal(spec: SplitSpec): number {
  if (spec.mode === 'items') {
    return spec.items.reduce((s, it) => s + num(it.price) * (num(it.qty) || 1), 0);
  }
  if (spec.mode === 'exact') {
    return spec.participants.reduce((s, p) => s + Math.max(0, num(spec.weights[p])), 0);
  }
  return num(spec.amount);
}

/** Work out the full bill: extras on top, then each person's exact share. */
export function computeBill(spec: SplitSpec, currency: string): BillResult {
  const people = spec.participants;
  const ex = spec.extras ?? NO_EXTRAS;
  const shares = baseShares(spec);
  const S = people.reduce((s, p) => s + shares[p], 0);

  const discount = ex.discountType === 'percent' ? (S * num(ex.discount)) / 100 : Math.min(num(ex.discount), S);
  const S1 = Math.max(0, S - discount);
  const service = (S1 * num(ex.service)) / 100;
  const taxBase = S1 + (ex.taxOnService ? service : 0);
  const taxRate = num(ex.tax) / 100;
  const tax = ex.taxIncluded ? 0 : taxBase * taxRate;
  const includedTax = ex.taxIncluded && taxRate > 0 ? taxBase - taxBase / (1 + taxRate) : 0;
  const tipBase = ex.tipOnTotal ? S1 + service + tax : S1;
  const tip = ex.tipType === 'percent' ? (tipBase * num(ex.tip)) / 100 : Math.max(0, num(ex.tip));
  const coverEach = Math.max(0, num(ex.cover));

  // Per-person floats.
  const f: Record<ID, BillParts> = {};
  for (const p of people) {
    const frac = S > 0 ? shares[p] / S : 1 / people.length;
    const line = zero();
    line.base = shares[p];
    line.discount = -discount * frac;
    line.service = service * frac;
    line.tax = tax * frac;
    line.tip = tip * frac;
    line.cover = coverEach;
    line.total = line.base + line.discount + line.service + line.tax + line.tip + line.cover;
    f[p] = line;
  }

  // Treated people: everyone else picks up their share, evenly.
  const treated = people.filter((p) => spec.treated.includes(p));
  const payers = people.filter((p) => !spec.treated.includes(p));
  if (treated.length > 0 && payers.length > 0) {
    const pot = treated.reduce((s, p) => s + f[p].total, 0);
    treated.forEach((p) => {
      f[p].treat = -f[p].total;
      f[p].total = 0;
    });
    payers.forEach((p) => {
      f[p].treat = pot / payers.length;
      f[p].total += pot / payers.length;
    });
  }

  const grand = S1 + service + tax + tip + coverEach * people.length;
  const grandMinor = toMinor(grand, currency);
  const finals = allocate(grandMinor, people.map((p) => f[p].total));

  const lines: Record<ID, BillParts> = {};
  people.forEach((p, i) => {
    const l = f[p];
    lines[p] = {
      base: toMinor(l.base, currency),
      discount: toMinor(l.discount, currency),
      service: toMinor(l.service, currency),
      tax: toMinor(l.tax, currency),
      tip: toMinor(l.tip, currency),
      cover: toMinor(l.cover, currency),
      treat: toMinor(l.treat, currency),
      total: finals[i],
    };
  });

  return {
    currency,
    participants: people,
    lines,
    totals: {
      base: toMinor(S, currency),
      discount: -toMinor(discount, currency),
      service: toMinor(service, currency),
      tax: toMinor(tax, currency),
      tip: toMinor(tip, currency),
      cover: toMinor(coverEach * people.length, currency),
      treat: 0,
      total: grandMinor,
    },
    includedTax: toMinor(includedTax, currency),
  };
}

/** Does this extras object add anything on top of the food? */
export function hasExtras(ex: Extras | null | undefined): boolean {
  if (!ex) return false;
  return !!(ex.discount || ex.service || (ex.tax && !ex.taxIncluded) || ex.tip || ex.cover);
}
