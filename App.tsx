import React, { useState } from 'react';
import { User, Expense } from './types';
import { Tab, APP_NAME } from './constants';
import { ParticipantSetup } from './components/ParticipantSetup';
import { ExpenseForm } from './components/ExpenseForm';
import { SettlementReport } from './components/SettlementReport';
import { Users, Receipt, CheckCircle, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PEOPLE);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.PEOPLE:
        return <ParticipantSetup users={users} setUsers={setUsers} />;
      case Tab.EXPENSES:
        return <ExpenseForm users={users} expenses={expenses} setExpenses={setExpenses} />;
      case Tab.SETTLEMENT:
        return <SettlementReport users={users} expenses={expenses} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: Tab.PEOPLE, label: '參加者', icon: Users },
    { id: Tab.EXPENSES, label: '費用輸入', icon: Receipt },
    { id: Tab.SETTLEMENT, label: '智能結算', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Share2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">{APP_NAME}</h1>
          </div>
          
          <div className="text-sm text-gray-500 hidden sm:block">
            {users.length} 人參與 • {expenses.length} 筆費用
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 mb-20">
        {renderContent()}
      </main>

      {/* Bottom Navigation (Mobile Friendly) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg pb-safe z-40">
        <div className="max-w-5xl mx-auto flex justify-around">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-full py-3 transition-all ${
                  isActive 
                    ? 'text-indigo-600 font-medium' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1 rounded-full mb-1 transition-all ${isActive ? 'bg-indigo-50' : ''}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'fill-indigo-600' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Safe area padding for bottom nav */}
      <div className="h-16" /> 
    </div>
  );
};

export default App;
