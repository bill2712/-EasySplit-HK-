import { describe, expect, it } from 'vitest';
import { NO_EXTRAS, computeBill } from './bill';
import { extrasFor } from './countries';
import { allocate, currencyDecimals, parseAmount, roundToStep, toMinor } from './money';
import { directTransfers, minimalTransfers, summarize } from './settle';
import type { Expense, Group, SplitSpec } from './types';

const spec = (over: Partial<SplitSpec>): SplitSpec => ({
  mode: 'equal',
  amount: 0,
  participants: ['a', 'b', 'c'],
  weights: {},
  items: [],
  treated: [],
  extras: null,
  ...over,
});

describe('money', () => {
  it('knows currency decimals', () => {
    expect(currencyDecimals('HKD')).toBe(2);
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('KRW')).toBe(0);
    expect(currencyDecimals('TWD')).toBe(0);
  });

  it('allocates exactly', () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(1000, [1, 0, 1])).toEqual([500, 0, 500]);
    expect(allocate(7, [0, 0])).toEqual([4, 3]);
    expect(allocate(-10, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(-10);
    const parts = allocate(99999, [3.3, 1.1, 7.7, 0.01]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(99999);
  });

  it('parses amounts and simple sums', () => {
    expect(parseAmount('1,234.50')).toBe(1234.5);
    expect(parseAmount('1.234,50')).toBe(1234.5);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('1,000')).toBe(1000);
    expect(parseAmount('120+35.5')).toBe(155.5);
    expect(parseAmount('3×48')).toBe(144);
    expect(parseAmount('(10+20)/3')).toBe(10);
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('１２３')).toBe(123);
  });

  it('rounds to steps', () => {
    expect(roundToStep(23340, 500)).toBe(23500);
    expect(roundToStep(23000, 500)).toBe(23000);
    expect(roundToStep(23240, 500, 'nearest')).toBe(23000);
    expect(toMinor(1.005, 'USD')).toBe(101);
  });
});

describe('bill', () => {
  it('HK dinner with 加一 split 3 ways', () => {
    const r = computeBill(spec({ amount: 1000, extras: extrasFor('HK') }), 'HKD');
    expect(r.totals.service).toBe(10000);
    expect(r.totals.total).toBe(110000);
    expect(Object.values(r.lines).map((l) => l.total)).toEqual([36667, 36667, 36666]);
  });

  it('Singapore ++ (service then GST on top)', () => {
    const r = computeBill(spec({ amount: 100, participants: ['a'], extras: extrasFor('SG') }), 'SGD');
    // 100 + 10 service + 9% GST on 110 = 119.90
    expect(r.totals.total).toBe(11990);
  });

  it('US: tax added, tip on pre-tax subtotal', () => {
    const ex = { ...extrasFor('US'), tax: 8.875, tip: 20 };
    const r = computeBill(spec({ amount: 200, participants: ['a', 'b'], extras: ex }), 'USD');
    expect(r.totals.tax).toBe(1775);
    expect(r.totals.tip).toBe(4000);
    expect(r.totals.total).toBe(25775);
  });

  it('Italy cover charge per person', () => {
    const r = computeBill(spec({ amount: 90, extras: { ...NO_EXTRAS, cover: 2.5 } }), 'EUR');
    expect(r.totals.total).toBe(9750);
    expect(r.lines.a.total).toBe(3250);
  });

  it('included VAT is informational only', () => {
    const r = computeBill(spec({ amount: 120, participants: ['a'], extras: { ...NO_EXTRAS, tax: 20, taxIncluded: true } }), 'GBP');
    expect(r.totals.total).toBe(12000);
    expect(r.includedTax).toBe(2000);
  });

  it('birthday person is treated by the others', () => {
    const r = computeBill(spec({ amount: 300, treated: ['c'] }), 'HKD');
    expect(r.lines.c.total).toBe(0);
    expect(r.lines.a.total).toBe(15000);
    expect(r.lines.b.total).toBe(15000);
  });

  it('itemised split with shared items and service', () => {
    const r = computeBill(
      spec({
        mode: 'items',
        items: [
          { id: '1', name: 'Steak', price: 300, qty: 1, who: ['a'] },
          { id: '2', name: 'Salad', price: 90, qty: 1, who: ['b', 'c'] },
          { id: '3', name: 'Wine', price: 60, qty: 2, who: [] },
        ],
        extras: { ...NO_EXTRAS, service: 10 },
      }),
      'HKD',
    );
    // a: 300 + 40 = 340 -> 374 ; b,c: 45 + 40 = 85 -> 93.5
    expect(r.lines.a.total).toBe(37400);
    expect(r.lines.b.total).toBe(9350);
    expect(r.lines.c.total).toBe(9350);
    expect(r.totals.total).toBe(56100);
  });

  it('shares and percent modes', () => {
    const s = computeBill(spec({ mode: 'shares', amount: 400, weights: { a: 2, b: 1, c: 1 } }), 'HKD');
    expect(s.lines.a.total).toBe(20000);
    const p = computeBill(spec({ mode: 'percent', amount: 200, weights: { a: 50, b: 25, c: 25 } }), 'HKD');
    expect(p.lines.b.total).toBe(5000);
  });

  it('JPY has no decimals', () => {
    const r = computeBill(spec({ amount: 10000 }), 'JPY');
    expect(Object.values(r.lines).map((l) => l.total)).toEqual([3334, 3333, 3333]);
  });

  it('discount before service', () => {
    const r = computeBill(spec({ amount: 1000, participants: ['a'], extras: { ...NO_EXTRAS, discount: 20, service: 10 } }), 'HKD');
    expect(r.totals.total).toBe(88000);
  });
});

const expense = (over: Partial<Expense>): Expense => ({
  id: Math.random().toString(36),
  kind: 'expense',
  title: 'x',
  category: 'food',
  date: '2026-01-01',
  currency: 'HKD',
  rate: 1,
  payerId: 'a',
  createdAt: 0,
  mode: 'equal',
  amount: 0,
  participants: ['a', 'b', 'c'],
  weights: {},
  items: [],
  treated: [],
  extras: null,
  ...over,
});

const group = (expenses: Expense[], over: Partial<Group> = {}): Group => ({
  id: 'g',
  name: 'Trip',
  emoji: '✈️',
  kind: 'trip',
  currency: 'HKD',
  country: 'HK',
  members: [
    { id: 'a', name: 'Amy' },
    { id: 'b', name: 'Ben' },
    { id: 'c', name: 'Cat' },
  ],
  expenses,
  rates: {},
  simplify: true,
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe('settlement', () => {
  it('nets out balances and minimises transfers', () => {
    const g = group([expense({ amount: 300, payerId: 'a' }), expense({ amount: 150, payerId: 'b' })]);
    const s = summarize(g);
    expect(s.net).toEqual({ a: 15000, b: 0, c: -15000 });
    expect(minimalTransfers(s.net)).toEqual([{ from: 'c', to: 'a', amount: 15000 }]);
    expect(s.totalSpent).toBe(45000);
  });

  it('converts foreign currency to the base currency', () => {
    const g = group([expense({ amount: 3000, currency: 'JPY', rate: 0.052, payerId: 'a' })]);
    const s = summarize(g);
    expect(s.totalSpent).toBe(15600);
    expect(Object.values(s.net).reduce((x, y) => x + y, 0)).toBe(0);
  });

  it('couples settle as one', () => {
    const g = group([expense({ amount: 300, payerId: 'a' })], {
      members: [
        { id: 'a', name: 'Amy' },
        { id: 'b', name: 'Ben', linkedTo: 'c' },
        { id: 'c', name: 'Cat' },
      ],
    });
    const s = summarize(g);
    expect(s.net).toEqual({ a: 20000, b: 0, c: -20000 });
  });

  it('transfers cancel debts', () => {
    const g = group([
      expense({ amount: 300, payerId: 'a' }),
      expense({ kind: 'transfer', category: 'transfer', amount: 100, payerId: 'b', participants: ['a'] }),
    ]);
    const s = summarize(g);
    expect(s.net).toEqual({ a: 10000, b: 0, c: -10000 });
    expect(s.totalSpent).toBe(30000);
  });

  it('multiple payers', () => {
    const g = group([expense({ amount: 300, payerId: 'a', paidAmounts: { a: 200, b: 100 } })]);
    expect(summarize(g).net).toEqual({ a: 10000, b: 0, c: -10000 });
  });

  it('direct (non-simplified) debts', () => {
    const g = group([expense({ amount: 300, payerId: 'a' }), expense({ amount: 300, payerId: 'b' })], { simplify: false });
    const t = directTransfers(g);
    expect(t).toContainEqual({ from: 'c', to: 'a', amount: 10000 });
    expect(t).toContainEqual({ from: 'c', to: 'b', amount: 10000 });
    expect(t.length).toBe(2);
  });
});
