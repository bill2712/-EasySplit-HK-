// Runs against the Firestore emulator (npm run test:emulator).
// Skipped in the normal unit test run.
import { afterAll, describe, expect, it } from 'vitest';
import { collection, getDocs, getFirestore, collectionGroup } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { connect, fetchRemote, publish, push, watch } from './firestore';
import { diffGroup } from './model';
import type { Expense, Group } from '../types';

const host = process.env.FIRESTORE_EMULATOR_HOST;
const run = host ? describe : describe.skip;

const expense = (id: string, amount: number): Expense => ({
  id,
  kind: 'expense',
  title: `Dinner ${id}`,
  category: 'food',
  date: '2026-10-21',
  currency: 'HKD',
  rate: 1,
  payerId: 'a',
  paidAmounts: null,
  createdAt: Number(id.replace(/\D/g, '')) || 1,
  mode: 'equal',
  amount,
  participants: ['a', 'b'],
  weights: {},
  items: [],
  treated: [],
  extras: null,
});

const group: Group = {
  id: 'local1',
  name: 'Hotpot',
  emoji: '🍲',
  kind: 'meal',
  currency: 'HKD',
  country: 'HK',
  members: [
    { id: 'a', name: 'Amy' },
    { id: 'b', name: 'Ben' },
  ],
  expenses: [expense('e1', 300)],
  rates: {},
  simplify: true,
  createdAt: 1,
  updatedAt: 1,
};

run('firestore (emulator)', () => {
  connect({ apiKey: 'demo', projectId: 'demo-easysplit', appId: 'demo' }, host);
  afterAll(() => undefined);

  it('publishes, pushes changes and reads them back live', async () => {
    const cloudId = await publish(group);
    expect(cloudId).toMatch(/^[A-Za-z0-9]{24}$/);

    const seen: number[] = [];
    const off = watch(cloudId, (s) => seen.push(s.expenses.length), (e) => {
      throw e;
    });

    const next: Group = { ...group, name: 'Hotpot night', expenses: [...group.expenses, expense('e2', 120)] };
    await push(cloudId, diffGroup(group, next));
    const after: Group = { ...next, expenses: next.expenses.filter((e) => e.id !== 'e1') };
    await push(cloudId, diffGroup(next, after));

    const remote = await fetchRemote(cloudId);
    expect(remote?.meta.name).toBe('Hotpot night');
    expect(remote?.expenses.map((e) => e.id)).toEqual(['e2']);
    await new Promise((r) => setTimeout(r, 300));
    expect(seen.at(-1)).toBe(1);
    off();
  });

  it('returns null for an unknown group', async () => {
    expect(await fetchRemote('NoSuchGroupNoSuchGroup00')).toBeNull();
  });

  it('refuses to list groups or search expenses across groups', async () => {
    const db = getFirestore(getApp('easysplit'));
    await expect(getDocs(collection(db, 'groups'))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(getDocs(collectionGroup(db, 'expenses'))).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('rejects malformed writes', async () => {
    const bad = { ...group, currency: 'DOLLARS' };
    await expect(publish(bad)).rejects.toMatchObject({ code: 'permission-denied' });
  });
});
