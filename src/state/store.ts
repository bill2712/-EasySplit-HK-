import { useSyncExternalStore } from 'react';
import { extrasFor, getCountry, guessCountry } from '../lib/countries';
import { today, uid } from '../lib/id';
import type { Expense, Extras, Group, GroupKind, ID, Item, Member } from '../lib/types';

export type Lang = 'en' | 'zh-HK' | 'zh-CN' | 'ja' | 'ko' | 'th' | 'es' | 'fr' | 'de';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  lang: Lang;
  theme: Theme;
  country: string;
}

export interface QuickPerson {
  id: ID;
  name: string;
}

export interface QuickState {
  country: string;
  currency: string;
  mode: 'equal' | 'items';
  amount: string;
  people: QuickPerson[];
  treated: ID[];
  items: Item[];
  extras: Extras;
  round: number; // step in major units, 0 = exact
}

export interface AppState {
  version: 1;
  settings: Settings;
  groups: Group[];
  quick: QuickState;
}

const STORAGE_KEY = 'easysplit:v1';

export function detectLang(): Lang {
  const langs = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : ['en'];
  for (const raw of langs) {
    const l = raw.toLowerCase();
    if (l.startsWith('zh')) {
      if (/(hant|hk|tw|mo)/.test(l)) return 'zh-HK';
      return 'zh-CN';
    }
    const base = l.split('-')[0];
    if (['ja', 'ko', 'th', 'es', 'fr', 'de', 'en'].includes(base)) return base as Lang;
  }
  return 'en';
}

export function newQuick(country: string, names?: string[]): QuickState {
  const c = getCountry(country);
  const people = (names && names.length ? names : ['', '']).map((name) => ({ id: uid(), name }));
  return {
    country: c.code,
    currency: c.currency,
    mode: 'equal',
    amount: '',
    people,
    treated: [],
    items: [],
    extras: extrasFor(c.code),
    round: 0,
  };
}

function initialState(): AppState {
  const country = guessCountry();
  return {
    version: 1,
    settings: { lang: detectLang(), theme: 'system', country },
    groups: [],
    quick: newQuick(country),
  };
}

function load(): AppState {
  const fresh = initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      version: 1,
      settings: { ...fresh.settings, ...saved.settings },
      groups: Array.isArray(saved.groups) ? saved.groups : [],
      quick: saved.quick ? { ...fresh.quick, ...saved.quick, extras: { ...fresh.quick.extras, ...saved.quick.extras } } : fresh.quick,
    };
  } catch {
    return fresh;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode / quota: keep working in memory */
    }
  }, 150);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  });
}

export function getState(): AppState {
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

// ---------- actions ----------

export const actions = {
  setSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },

  setQuick(patch: Partial<QuickState> | ((q: QuickState) => Partial<QuickState>)) {
    setState((s) => {
      const p = typeof patch === 'function' ? patch(s.quick) : patch;
      return { ...s, quick: { ...s.quick, ...p } };
    });
  },

  resetQuick() {
    setState((s) => ({
      ...s,
      quick: { ...newQuick(s.quick.country, s.quick.people.map((p) => p.name)), currency: s.quick.currency },
    }));
  },

  createGroup(input: { name: string; emoji: string; kind: GroupKind; currency: string; country: string; members: string[] }): Group {
    const now = Date.now();
    const g: Group = {
      id: uid(),
      name: input.name.trim(),
      emoji: input.emoji,
      kind: input.kind,
      currency: input.currency,
      country: input.country,
      members: input.members.filter((n) => n.trim()).map((name) => ({ id: uid(), name: name.trim() })),
      expenses: [],
      rates: {},
      simplify: true,
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({ ...s, groups: [g, ...s.groups] }));
    return g;
  },

  importGroup(g: Group, mode: 'replace' | 'copy') {
    setState((s) => {
      if (mode === 'replace') {
        const exists = s.groups.some((x) => x.id === g.id);
        return { ...s, groups: exists ? s.groups.map((x) => (x.id === g.id ? g : x)) : [g, ...s.groups] };
      }
      return { ...s, groups: [{ ...g, id: uid(), updatedAt: Date.now() }, ...s.groups] };
    });
  },

  updateGroup(id: ID, fn: (g: Group) => Group) {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) => (g.id === id ? { ...fn(g), updatedAt: Date.now() } : g)),
    }));
  },

  deleteGroup(id: ID) {
    setState((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== id) }));
  },

  saveExpense(groupId: ID, e: Expense) {
    actions.updateGroup(groupId, (g) => {
      const exists = g.expenses.some((x) => x.id === e.id);
      const expenses = exists ? g.expenses.map((x) => (x.id === e.id ? e : x)) : [...g.expenses, e];
      const rates = e.currency !== g.currency && e.rate ? { ...g.rates, [e.currency]: e.rate } : g.rates;
      return { ...g, expenses, rates };
    });
  },

  deleteExpense(groupId: ID, expenseId: ID) {
    actions.updateGroup(groupId, (g) => ({ ...g, expenses: g.expenses.filter((x) => x.id !== expenseId) }));
  },

  addMember(groupId: ID, name: string): Member {
    const m: Member = { id: uid(), name: name.trim() };
    actions.updateGroup(groupId, (g) => ({ ...g, members: [...g.members, m] }));
    return m;
  },

  updateMember(groupId: ID, m: Member) {
    actions.updateGroup(groupId, (g) => ({ ...g, members: g.members.map((x) => (x.id === m.id ? m : x)) }));
  },

  removeMember(groupId: ID, memberId: ID) {
    actions.updateGroup(groupId, (g) => ({
      ...g,
      members: g.members
        .filter((x) => x.id !== memberId)
        .map((x) => (x.linkedTo === memberId ? { ...x, linkedTo: null } : x)),
    }));
  },

  recordPayment(groupId: ID, from: ID, to: ID, amountMajor: number, currency: string, title: string) {
    const e: Expense = {
      id: uid(),
      kind: 'transfer',
      title,
      category: 'transfer',
      date: today(),
      currency,
      rate: 1,
      payerId: from,
      createdAt: Date.now(),
      mode: 'equal',
      amount: amountMajor,
      participants: [to],
      weights: {},
      items: [],
      treated: [],
      extras: null,
    };
    actions.saveExpense(groupId, e);
  },
};

export function memberIsUsed(g: Group, id: ID): boolean {
  return g.expenses.some(
    (e) =>
      e.payerId === id ||
      e.participants.includes(id) ||
      (e.paidAmounts && (e.paidAmounts[id] || 0) > 0) ||
      e.items.some((it) => it.who.includes(id)),
  );
}
