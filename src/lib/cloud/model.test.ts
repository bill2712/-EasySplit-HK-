import { describe, expect, it } from 'vitest';
import { diffGroup, groupFromRemote, isCloudId, mergeRemote, metaOf, newCloudId } from './model';
import type { Expense, Group } from '../types';

const e = (id: string, amount = 100, createdAt = 1): Expense => ({
  id,
  kind: 'expense',
  title: id,
  category: 'food',
  date: '2026-10-21',
  currency: 'HKD',
  rate: 1,
  payerId: 'a',
  createdAt,
  mode: 'equal',
  amount,
  participants: ['a', 'b'],
  weights: {},
  items: [],
  treated: [],
  extras: null,
});

const g: Group = {
  id: 'local',
  cloudId: 'x'.repeat(24),
  name: 'Trip',
  emoji: '✈️',
  kind: 'trip',
  currency: 'HKD',
  country: 'HK',
  members: [
    { id: 'a', name: 'Amy' },
    { id: 'b', name: 'Ben' },
  ],
  expenses: [e('e1', 100, 1), e('e2', 200, 2)],
  rates: {},
  simplify: true,
  createdAt: 1,
  updatedAt: 1,
};

describe('live sync model', () => {
  it('makes long unguessable ids', () => {
    const id = newCloudId();
    expect(isCloudId(id)).toBe(true);
    expect(newCloudId()).not.toBe(id);
    expect(isCloudId('short')).toBe(false);
  });

  it('only writes what changed', () => {
    expect(diffGroup(g, g)).toEqual([]);
    const edited = { ...g, expenses: [g.expenses[0], { ...g.expenses[1], amount: 250 }, e('e3')] };
    expect(diffGroup(g, edited).map((o) => (o.type === 'set' ? `set:${o.expense.id}` : o.type))).toEqual(['set:e2', 'set:e3']);
    const removed = { ...g, expenses: [g.expenses[1]] };
    expect(diffGroup(g, removed)).toEqual([{ type: 'delete', id: 'e1' }]);
    const renamed = { ...g, name: 'Tokyo', updatedAt: 99 };
    expect(diffGroup(g, renamed).map((o) => o.type)).toEqual(['meta']);
  });

  it('ignores key order and timestamps when comparing', () => {
    const reordered = { ...g, updatedAt: 50, expenses: g.expenses.map((x) => Object.fromEntries(Object.entries(x).reverse()) as Expense) };
    expect(diffGroup(g, reordered)).toEqual([]);
  });

  it('merges the online copy into the local group', () => {
    const meta = { ...metaOf(g), name: 'Tokyo 2026', updatedAt: 5 };
    const merged = mergeRemote(g, meta, [e('e9', 50, 9), e('e1', 100, 1)]);
    expect(merged.id).toBe('local');
    expect(merged.cloudId).toBe(g.cloudId);
    expect(merged.name).toBe('Tokyo 2026');
    expect(merged.expenses.map((x) => x.id)).toEqual(['e1', 'e9']);
    const joined = groupFromRemote('new', 'y'.repeat(24), meta, [e('e1')]);
    expect(joined.members).toHaveLength(2);
    expect(joined.cloudId).toBe('y'.repeat(24));
  });
});
