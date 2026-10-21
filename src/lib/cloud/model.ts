// Pure helpers for live sharing: what goes online, and how local and online
// copies of a group are compared and merged. No Firebase imports here.

import type { Expense, Group } from '../types';

/** Group fields shared online (everything except local bookkeeping). */
export interface GroupMeta {
  v: 1;
  name: string;
  emoji: string;
  kind: Group['kind'];
  currency: string;
  country: string;
  members: Group['members'];
  rates: Group['rates'];
  simplify: boolean;
  budget: number | null;
  updatedAt: number;
}

export type SyncOp = { type: 'meta'; meta: GroupMeta } | { type: 'set'; expense: Expense } | { type: 'delete'; id: string };

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Long random id: the link itself is the key to a live group, so it must be unguessable. */
export function newCloudId(length = 24): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('');
}

export function isCloudId(id: string): boolean {
  return /^[A-Za-z0-9_-]{20,40}$/.test(id);
}

export function metaOf(g: Group): GroupMeta {
  return {
    v: 1,
    name: g.name,
    emoji: g.emoji,
    kind: g.kind,
    currency: g.currency,
    country: g.country,
    members: g.members,
    rates: g.rates,
    simplify: g.simplify,
    budget: g.budget ?? null,
    updatedAt: g.updatedAt,
  };
}

/** JSON with sorted keys, so objects that came back from the server compare equal. */
export function stableStringify(v: unknown): string {
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.keys(val).sort().map((k) => [k, (val as Record<string, unknown>)[k]]))
      : val,
  );
}

export function sameMeta(a: GroupMeta, b: GroupMeta): boolean {
  const strip = ({ updatedAt: _u, ...rest }: GroupMeta) => rest;
  return stableStringify(strip(a)) === stableStringify(strip(b));
}

/** Writes needed to bring the online copy from `prev` to `next`. */
export function diffGroup(prev: Group | undefined, next: Group): SyncOp[] {
  const ops: SyncOp[] = [];
  if (!prev || !sameMeta(metaOf(prev), metaOf(next))) ops.push({ type: 'meta', meta: metaOf(next) });
  const before = new Map((prev?.expenses ?? []).map((e) => [e.id, e]));
  for (const e of next.expenses) {
    const old = before.get(e.id);
    if (!old || (old !== e && stableStringify(old) !== stableStringify(e))) ops.push({ type: 'set', expense: e });
    before.delete(e.id);
  }
  for (const id of before.keys()) ops.push({ type: 'delete', id });
  return ops;
}

/** Local group updated with the online meta and expenses. */
export function mergeRemote(local: Group, meta: GroupMeta | null, expenses: Expense[]): Group {
  const sorted = [...expenses].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const next: Group = { ...local, expenses: sorted };
  if (meta) {
    next.name = meta.name;
    next.emoji = meta.emoji;
    next.kind = meta.kind;
    next.currency = meta.currency;
    next.country = meta.country;
    next.members = meta.members ?? [];
    next.rates = meta.rates ?? {};
    next.simplify = meta.simplify;
    next.budget = meta.budget ?? undefined;
    next.updatedAt = Math.max(local.updatedAt, meta.updatedAt ?? 0);
  }
  return next;
}

/** A fresh local group for an online group someone shared with us. */
export function groupFromRemote(localId: string, cloudId: string, meta: GroupMeta, expenses: Expense[]): Group {
  const now = Date.now();
  const base: Group = {
    id: localId,
    cloudId,
    name: meta.name,
    emoji: meta.emoji,
    kind: meta.kind,
    currency: meta.currency,
    country: meta.country,
    members: [],
    expenses: [],
    rates: {},
    simplify: meta.simplify,
    createdAt: now,
    updatedAt: now,
  };
  return mergeRemote(base, meta, expenses);
}
