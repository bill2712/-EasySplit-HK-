import type { Category } from './types';

export const CATEGORIES: { id: Category; emoji: string; color: string }[] = [
  { id: 'food', emoji: '🍜', color: 'bg-orange-400' },
  { id: 'drinks', emoji: '🍻', color: 'bg-amber-400' },
  { id: 'groceries', emoji: '🛒', color: 'bg-lime-500' },
  { id: 'transport', emoji: '🚕', color: 'bg-sky-500' },
  { id: 'stay', emoji: '🏨', color: 'bg-indigo-400' },
  { id: 'activities', emoji: '🎟️', color: 'bg-fuchsia-400' },
  { id: 'shopping', emoji: '🛍️', color: 'bg-pink-400' },
  { id: 'gifts', emoji: '🎁', color: 'bg-rose-400' },
  { id: 'fees', emoji: '🧾', color: 'bg-zinc-400' },
  { id: 'other', emoji: '📦', color: 'bg-teal-400' },
];

export function categoryOf(id: Category) {
  if (id === 'transfer') return { id, emoji: '💸', color: 'bg-emerald-500' };
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
