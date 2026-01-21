import React, { useState } from 'react';
import { User, Expense } from '../types';
import { Receipt, Plus, X } from 'lucide-react';

interface Props {
  users: User[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

export const ExpenseForm: React.FC<Props> = ({ users, expenses, setExpenses }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState<string>(users[0]?.id || '');
  
  // Default involved: Everyone except birthday people
  const getDefaultInvolved = () => users.filter(u => !u.isBirthday).map(u => u.id);
  const [involvedIds, setInvolvedIds] = useState<string[]>([]);
  
  // Initialize default state when users change or form opens
  React.useEffect(() => {
    if (involvedIds.length === 0 && users.length > 0) {
        setInvolvedIds(getDefaultInvolved());
    }
    if (!payerId && users.length > 0) {
        setPayerId(users[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !payerId || involvedIds.length === 0) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      title,
      amount: parseFloat(amount),
      payerId,
      involvedUserIds: involvedIds,
      timestamp: Date.now()
    };

    setExpenses([...expenses, newExpense]);
    setTitle('');
    setAmount('');
    setInvolvedIds(getDefaultInvolved());
  };

  const toggleInvolved = (userId: string) => {
    setInvolvedIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeExpense = (id: string) => {
      setExpenses(expenses.filter(e => e.id !== id));
  };

  const selectAll = () => setInvolvedIds(users.map(u => u.id));
  const selectNone = () => setInvolvedIds([]);

  if (users.length === 0) {
      return <div className="text-center p-8 text-gray-500">請先在「參加者」分頁新增朋友</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-indigo-600" />
          新增費用
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">項目名稱 (Item)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner, Taxi, Cake"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 ($)</label>
                <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">先付者 (Payer)</label>
                <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                required
                >
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
                </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">誰有份? (Involved)</label>
                <div className="space-x-2 text-xs">
                    <button type="button" onClick={selectAll} className="text-indigo-600 hover:underline">全選</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={selectNone} className="text-gray-500 hover:underline">全不選</button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleInvolved(user.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    involvedIds.includes(user.id)
                      ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {user.name} {user.isBirthday && '🎂'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
          >
            加入清單
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-indigo-600" />
            費用紀錄 ({expenses.length})
          </h2>
          
          <div className="space-y-3">
            {expenses.length === 0 && (
                <p className="text-gray-400 italic">暫時沒有紀錄...</p>
            )}
            {expenses.map(expense => (
                <div key={expense.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center group">
                    <div>
                        <h3 className="font-bold text-gray-800">{expense.title}</h3>
                        <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-700">{users.find(u => u.id === expense.payerId)?.name}</span> 先付 ${expense.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {expense.involvedUserIds.length} 人分擔
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-indigo-600">
                            ${expense.amount.toFixed(2)}
                        </span>
                        <button 
                            onClick={() => removeExpense(expense.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};
