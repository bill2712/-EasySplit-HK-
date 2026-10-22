// Live sharing engine: mirrors local edits of live groups to Firestore and
// applies changes made by friends. Only loads Firebase when a group is live.

import { useSyncExternalStore } from 'react';
import type { FirebaseOptions } from 'firebase/app';
import { cloudEnabled, emulatorHost, firebaseConfig } from '../lib/cloud/config';
import { diffGroup, groupFromRemote, mergeRemote, sameMeta, metaOf, stableStringify, type GroupMeta } from '../lib/cloud/model';
import { uid } from '../lib/id';
import { normalizeExpense, normalizeGroup } from '../lib/normalize';
import type { Expense, Group } from '../lib/types';
import { getState, onStateChange, setState } from './store';

type Cloud = typeof import('../lib/cloud/firestore');
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let cloudPromise: Promise<Cloud> | null = null;

function loadCloud(): Promise<Cloud> {
  if (!cloudEnabled) return Promise.reject(new Error('Live sharing is not configured'));
  cloudPromise ??= import('../lib/cloud/firestore').then((m) => {
    m.connect(firebaseConfig as FirebaseOptions, emulatorHost);
    return m;
  });
  return cloudPromise;
}

// ---------- status per local group ----------

const statuses = new Map<string, SyncStatus>();
const statusSubs = new Set<() => void>();
function setStatus(id: string, s: SyncStatus) {
  if (statuses.get(id) === s) return;
  statuses.set(id, s);
  statusSubs.forEach((f) => f());
}

export function useSyncStatus(groupId: string): SyncStatus | null {
  return useSyncExternalStore(
    (f) => {
      statusSubs.add(f);
      return () => statusSubs.delete(f);
    },
    () => statuses.get(groupId) ?? null,
    () => null,
  );
}

// ---------- remote -> local ----------

const watchers = new Map<string, { cloudId: string; off: () => void }>();
let applyingRemote = false;

function applyRemote(localId: string, meta: GroupMeta, expenses: Expense[]) {
  const cur = getState().groups.find((g) => g.id === localId);
  if (!cur?.cloudId) return;
  const merged = normalizeGroup(mergeRemote(cur, meta, expenses.map((e, i) => normalizeExpense(e, cur.currency, i)))) ?? cur;
  if (sameMeta(metaOf(merged), metaOf(cur)) && stableStringify(merged.expenses) === stableStringify(cur.expenses)) return;
  applyingRemote = true;
  try {
    setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === localId ? merged : g)) }));
  } finally {
    applyingRemote = false;
  }
}

function syncWatchers(groups: Group[]) {
  const live = new Map(groups.filter((g) => g.cloudId).map((g) => [g.id, g.cloudId!]));
  for (const [id, w] of watchers) {
    if (live.get(id) !== w.cloudId) {
      w.off();
      watchers.delete(id);
      statuses.delete(id);
    }
  }
  for (const [id, cloudId] of live) {
    if (watchers.has(id)) continue;
    const entry = { cloudId, off: () => {} };
    watchers.set(id, entry);
    setStatus(id, navigator.onLine ? 'syncing' : 'offline');
    loadCloud()
      .then((cloud) => {
        if (watchers.get(id) !== entry) return;
        entry.off = cloud.watch(
          cloudId,
          (rs) => {
            if (rs.meta) applyRemote(id, rs.meta, rs.expenses);
            setStatus(id, !navigator.onLine ? 'offline' : rs.pending || rs.fromCache ? 'syncing' : 'synced');
          },
          () => setStatus(id, 'error'),
        );
      })
      .catch(() => setStatus(id, 'error'));
  }
}

// ---------- local -> remote ----------

function onLocalChange(next: { groups: Group[] }, prev: { groups: Group[] }) {
  if (!applyingRemote) {
    for (const g of next.groups) {
      if (!g.cloudId) continue;
      const before = prev.groups.find((p) => p.id === g.id);
      if (!before || before === g || before.cloudId !== g.cloudId) continue;
      const ops = diffGroup(before, g);
      if (!ops.length) continue;
      const cloudId = g.cloudId;
      setStatus(g.id, navigator.onLine ? 'syncing' : 'offline');
      loadCloud()
        .then((cloud) => cloud.push(cloudId, ops))
        .then(() => setStatus(g.id, 'synced'))
        .catch(() => setStatus(g.id, 'error'));
    }
  }
  syncWatchers(next.groups);
}

let started = false;
export function startSync() {
  if (started || !cloudEnabled) return;
  started = true;
  onStateChange(onLocalChange);
  syncWatchers(getState().groups);
  const refresh = () => {
    for (const id of watchers.keys()) setStatus(id, navigator.onLine ? 'syncing' : 'offline');
  };
  window.addEventListener('online', refresh);
  window.addEventListener('offline', refresh);
}

// ---------- actions ----------

/** Put a group online and return its share id. */
export async function goLive(groupId: string): Promise<string> {
  const g = getState().groups.find((x) => x.id === groupId);
  if (!g) throw new Error('Group not found');
  if (g.cloudId) return g.cloudId;
  const cloud = await loadCloud();
  const cloudId = await cloud.publish(g);
  setState((s) => ({ ...s, groups: s.groups.map((x) => (x.id === groupId ? { ...x, cloudId } : x)) }));
  return cloudId;
}

export function stopLive(groupId: string) {
  setState((s) => ({ ...s, groups: s.groups.map((x) => (x.id === groupId ? { ...x, cloudId: undefined } : x)) }));
}

export async function fetchShared(cloudId: string) {
  const cloud = await loadCloud();
  return cloud.fetchRemote(cloudId);
}

/** Add an online group to this device. Returns the local group id. */
export function joinShared(cloudId: string, meta: GroupMeta, expenses: Expense[]): string {
  const existing = getState().groups.find((g) => g.cloudId === cloudId);
  if (existing) return existing.id;
  const g = normalizeGroup(groupFromRemote(uid(), cloudId, meta, expenses.map((e, i) => normalizeExpense(e, meta.currency, i))));
  if (!g) throw new Error('Invalid group');
  setState((s) => ({ ...s, groups: [g, ...s.groups] }));
  return g.id;
}
