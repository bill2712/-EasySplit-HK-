export type ID = string;

export interface Member {
  id: ID;
  name: string;
  /** Couples / families: this person's share is settled by another member. */
  linkedTo?: ID | null;
  /** How to pay this person, e.g. "PayMe 9123 4567" or "venmo @alex". */
  payInfo?: string;
}

/** Service charge, tax, tip and friends that sit on top of the food. */
export interface Extras {
  discount: number;
  discountType: 'percent' | 'amount';
  service: number; // percent
  tax: number; // percent
  taxIncluded: boolean; // prices already include tax (VAT/GST shown for info only)
  taxOnService: boolean; // tax is charged on the service charge too (SG, MY, TH)
  tip: number;
  tipType: 'percent' | 'amount';
  tipOnTotal: boolean; // false = tip on pre-tax subtotal (US norm), true = on the final total
  cover: number; // cover charge per person (coperto, table charge, tea charge)
}

export type SplitMode = 'equal' | 'shares' | 'exact' | 'percent' | 'items';

export interface Item {
  id: ID;
  name: string;
  price: number; // unit price
  qty: number;
  /** Who shares this item. Empty = everyone in the split. */
  who: ID[];
}

export interface SplitSpec {
  mode: SplitMode;
  /** Amount before extras (ignored in "items" and "exact" mode). */
  amount: number;
  participants: ID[];
  /** Per-person value for shares / exact / percent modes. */
  weights: Record<ID, number>;
  items: Item[];
  /** People being treated (birthday, guest) — everyone else covers their share. */
  treated: ID[];
  extras: Extras | null;
}

export type Category =
  | 'food'
  | 'drinks'
  | 'groceries'
  | 'transport'
  | 'stay'
  | 'activities'
  | 'shopping'
  | 'gifts'
  | 'fees'
  | 'other'
  | 'transfer';

export interface Expense extends SplitSpec {
  id: ID;
  kind: 'expense' | 'transfer';
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD
  currency: string;
  /** Value of 1 unit of `currency` in the group's base currency. */
  rate: number;
  payerId: ID;
  /** Set when several people paid. Amounts in `currency`. */
  paidAmounts?: Record<ID, number> | null;
  note?: string;
  createdAt: number;
}

export type GroupKind = 'meal' | 'gathering' | 'trip' | 'home';

export interface Group {
  id: ID;
  name: string;
  emoji: string;
  kind: GroupKind;
  currency: string;
  country: string;
  members: Member[];
  expenses: Expense[];
  /** Last-used exchange rates: 1 unit of key currency = value in base currency. */
  rates: Record<string, number>;
  simplify: boolean;
  /** Optional budget per person in the base currency (major units). */
  budget?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Transfer {
  from: ID;
  to: ID;
  amount: number; // minor units of the group's base currency
}
