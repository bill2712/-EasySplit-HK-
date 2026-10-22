import { describe, expect, it } from 'vitest';
import { computeBill } from './bill';
import { COUNTRIES, extrasFor } from './countries';
import { parseAmount } from './money';
import { normalizeGroup } from './normalize';
import { decodeGroup, encodeGroup } from './share';
import { directTransfers, minimalTransfers, summarize } from './settle';
import type { Expense, Group, SplitMode, SplitSpec } from './types';

// Small deterministic PRNG so failures are reproducible.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const CURRENCIES = ['HKD', 'JPY', 'USD', 'KRW', 'EUR', 'TWD', 'IDR'];
const MODES: SplitMode[] = ['equal', 'shares', 'exact', 'percent', 'items'];

function randomSpec(r: () => number, people: string[]): SplitSpec {
  const mode = MODES[Math.floor(r() * MODES.length)];
  const participants = people.filter(() => r() > 0.2);
  if (!participants.length) participants.push(people[0]);
  const weights: Record<string, number> = {};
  participants.forEach((p) => (weights[p] = Math.round(r() * 300) / (mode === 'shares' ? 100 : 1)));
  const items = Array.from({ length: Math.floor(r() * 5) }, (_, i) => ({
    id: `i${i}`,
    name: '',
    price: Math.round(r() * 50000) / 100,
    qty: 1 + Math.floor(r() * 3),
    who: participants.filter(() => r() > 0.5),
  }));
  const country = COUNTRIES[Math.floor(r() * COUNTRIES.length)].code;
  const ex = r() > 0.3 ? { ...extrasFor(country), discount: r() > 0.8 ? Math.round(r() * 30) : 0, cover: r() > 0.8 ? 2 : 0 } : null;
  return {
    mode,
    amount: Math.round(r() * 200000) / 100,
    participants,
    weights,
    items,
    treated: participants.filter(() => r() > 0.85),
    extras: ex,
  };
}

describe('bill engine invariants (random bills)', () => {
  it('shares always add up to the total, never NaN or negative', () => {
    const r = rng(42);
    const people = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let n = 0; n < 3000; n++) {
      const spec = randomSpec(r, people);
      const cur = CURRENCIES[n % CURRENCIES.length];
      const bill = computeBill(spec, cur);
      const sum = Object.values(bill.lines).reduce((s, l) => s + l.total, 0);
      expect(Number.isFinite(bill.totals.total)).toBe(true);
      expect(sum).toBe(bill.totals.total);
      for (const l of Object.values(bill.lines)) expect(l.total).toBeGreaterThanOrEqual(0);
      // Treated people pay nothing as long as someone else is paying.
      if (spec.treated.length < spec.participants.length) for (const t of spec.treated) expect(bill.lines[t].total).toBe(0);
    }
  });
});

describe('settlement invariants (random groups)', () => {
  it('balances sum to zero and the suggested transfers settle everyone', () => {
    const r = rng(7);
    for (let n = 0; n < 2000; n++) {
      const members = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id, linkedTo: null as string | null }));
      if (r() > 0.7) members[1].linkedTo = 'a';
      const expenses: Expense[] = Array.from({ length: 1 + Math.floor(r() * 8) }, (_, i) => {
        const spec = randomSpec(r, members.map((m) => m.id));
        const currency = r() > 0.7 ? 'JPY' : 'HKD';
        const multi = r() > 0.8;
        return {
          ...spec,
          id: `e${i}`,
          kind: r() > 0.9 ? 'transfer' : 'expense',
          title: 'x',
          category: 'food',
          date: '2026-10-21',
          currency,
          rate: currency === 'JPY' ? 0.052 : 1,
          payerId: members[Math.floor(r() * members.length)].id,
          paidAmounts: multi ? { a: Math.round(r() * 1000), c: Math.round(r() * 1000) } : null,
          createdAt: i,
        };
      });
      const g: Group = { id: 'g', name: 'g', emoji: 'x', kind: 'trip', currency: 'HKD', country: 'HK', members, expenses, rates: {}, simplify: true, createdAt: 0, updatedAt: 0 };
      const s = summarize(g);
      expect(Object.values(s.net).reduce((x, y) => x + y, 0)).toBe(0);
      for (const plan of [minimalTransfers(s.net), directTransfers(g)]) {
        const after = { ...s.net };
        for (const t of plan) {
          expect(t.amount).toBeGreaterThan(0);
          after[t.from] += t.amount;
          after[t.to] -= t.amount;
        }
        expect(Object.values(after).every((v) => v === 0)).toBe(true);
      }
      expect(minimalTransfers(s.net).length).toBeLessThanOrEqual(Math.max(0, Object.values(s.net).filter((v) => v !== 0).length - 1));
    }
  });
});

describe('amount input', () => {
  it('accepts currency symbols, codes and thousands separators', () => {
    expect(parseAmount('HK$120')).toBe(120);
    expect(parseAmount('120 HKD')).toBe(120);
    expect(parseAmount('€12,50')).toBe(12.5);
    expect(parseAmount('¥24,000')).toBe(24000);
    expect(parseAmount('1.000.000')).toBe(1000000);
    expect(parseAmount("1'250")).toBe(1250);
    expect(parseAmount('2x48')).toBe(96);
    expect(parseAmount('(120+80)×1.1')).toBeCloseTo(220);
    expect(parseAmount('12..5')).toBeNull();
    expect(parseAmount('1/0')).toBeNull();
  });
});

describe('untrusted data', () => {
  it('repairs incomplete groups instead of crashing', () => {
    const g = normalizeGroup({ id: 'x', currency: 'JPY', members: [{ id: 'a' }, 'junk'], expenses: [{ id: 'e', amount: 100, mode: 'items' }, null] });
    expect(g).not.toBeNull();
    expect(g!.members).toHaveLength(2);
    expect(g!.expenses[0].items).toEqual([]);
    expect(g!.expenses[1].participants).toEqual([]);
    expect(() => summarize(g!)).not.toThrow();
    expect(normalizeGroup({ name: 'no id' })).toBeNull();
    expect(normalizeGroup(null)).toBeNull();
  });

  it('round-trips a group through a share link', () => {
    const g = normalizeGroup({ id: 'g1', name: '飲茶 🍵', currency: 'HKD', members: [{ id: 'a', name: 'Amy' }], expenses: [] })!;
    expect(decodeGroup(encodeGroup(g))).toEqual(g);
    expect(decodeGroup('not-a-link')).toBeNull();
  });
});
