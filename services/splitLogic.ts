import { User, Expense, SettlementResult, Transaction } from '../types';

export const calculateSettlement = (users: User[], expenses: Expense[]): SettlementResult => {
  // 1. Calculate raw balances (how much everyone paid vs how much they consumed)
  const rawBalances: Record<string, number> = {};
  users.forEach(u => rawBalances[u.id] = 0);

  expenses.forEach(expense => {
    const payer = users.find(u => u.id === expense.payerId);
    if (!payer) return;

    // Credit the payer
    rawBalances[expense.payerId] += expense.amount;

    // Debit the consumers
    const count = expense.involvedUserIds.length;
    if (count > 0) {
      const share = expense.amount / count;
      expense.involvedUserIds.forEach(uid => {
        if (rawBalances[uid] !== undefined) {
          rawBalances[uid] -= share;
        }
      });
    }
  });

  // 2. Handle Couples / Linked Payers
  // If User B is linked to User A, User B's balance is transferred to User A.
  const consolidatedBalances = { ...rawBalances };
  
  users.forEach(user => {
    if (user.linkedPayerId && user.linkedPayerId !== user.id) {
      const mainPayerId = user.linkedPayerId;
      const dependentBalance = consolidatedBalances[user.id];
      
      // Add dependent's balance to main payer
      consolidatedBalances[mainPayerId] = (consolidatedBalances[mainPayerId] || 0) + dependentBalance;
      
      // Zero out dependent
      consolidatedBalances[user.id] = 0;
    }
  });

  // 3. Minimize Transactions (Greedy algorithm)
  // Separate into debtors (negative balance) and creditors (positive balance)
  let debtors: { id: string; amount: number }[] = [];
  let creditors: { id: string; amount: number }[] = [];

  Object.entries(consolidatedBalances).forEach(([id, amount]) => {
    // Round to 2 decimal places to avoid floating point errors
    const rounded = Math.round(amount * 100) / 100;
    if (rounded < -0.01) debtors.push({ id, amount: rounded });
    if (rounded > 0.01) creditors.push({ id, amount: rounded });
  });

  // Sort by magnitude (descending) to optimize flow
  debtors.sort((a, b) => a.amount - b.amount); // Most negative first
  creditors.sort((a, b) => b.amount - a.amount); // Most positive first

  const transactions: Transaction[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // The amount to settle is the minimum of what's owed vs what's receivable
    const amount = Math.min(creditor.amount, -debtor.amount);
    
    // Create transaction
    if (amount > 0.01) {
        transactions.push({
            fromId: debtor.id,
            toId: creditor.id,
            amount: Number(amount.toFixed(2))
        });
    }

    // Update remaining balances
    creditor.amount -= amount;
    debtor.amount += amount;

    // Move indices if settled
    if (Math.abs(creditor.amount) < 0.01) i++;
    if (Math.abs(debtor.amount) < 0.01) j++;
  }

  return {
    transactions,
    balances: consolidatedBalances
  };
};