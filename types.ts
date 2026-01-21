export interface User {
  id: string;
  name: string;
  // If defined, this user's debt/credit is managed by the linkedPayerId user.
  // They still count as a "head" for splitting, but don't pay.
  linkedPayerId?: string | null; 
  isBirthday?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  involvedUserIds: string[]; // Who consumed this?
  timestamp: number;
}

export interface Transaction {
  fromId: string;
  toId: string;
  amount: number;
}

export interface SettlementResult {
  transactions: Transaction[];
  balances: Record<string, number>; // Post-consolidation balances
}