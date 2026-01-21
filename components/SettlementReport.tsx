import React, { useState, useMemo } from 'react';
import { User, Expense, SettlementResult } from '../types';
import { calculateSettlement } from '../services/splitLogic';
import { generateSummaryMessage } from '../services/geminiService';
import { Calculator, Send, Copy, ArrowRight, Wallet, Sparkles, Loader2 } from 'lucide-react';

interface Props {
  users: User[];
  expenses: Expense[];
}

export const SettlementReport: React.FC<Props> = ({ users, expenses }) => {
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Memoize calculation to prevent unnecessary re-runs
  const result: SettlementResult = useMemo(() => {
    if (users.length === 0) return { transactions: [], balances: {} };
    return calculateSettlement(users, expenses);
  }, [users, expenses]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleGenerateAi = async () => {
    setIsLoadingAi(true);
    setAiMessage('');
    try {
        const msg = await generateSummaryMessage(users, expenses, result.transactions);
        setAiMessage(msg);
    } catch (e) {
        setAiMessage("Error generating message.");
    } finally {
        setIsLoadingAi(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已複製到剪貼簿! (Copied!)");
  };

  if (users.length === 0) return <div className="text-center p-8 text-gray-500">請先新增參加者</div>;
  if (expenses.length === 0) return <div className="text-center p-8 text-gray-500">請先新增費用</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium opacity-90">總支出 (Total)</h3>
                <Wallet className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
            <p className="text-sm opacity-70 mt-1">{expenses.length} 筆項目</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
                每人餘額 (Net Balance)
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {Object.entries(result.balances)
                 .sort(([, a], [, b]) => b - a) // Sort mostly positive first
                 .map(([uid, amount]) => {
                    const user = users.find(u => u.id === uid);
                    if (!user) return null;
                    if (Math.abs(amount) < 0.01) return null; // Hide settled/zero balances

                    const isPositive = amount > 0;
                    return (
                        <div key={uid} className="flex justify-between text-sm">
                            <span>{user.name}</span>
                            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{amount.toFixed(2)}
                            </span>
                        </div>
                    );
                })}
                 {Object.values(result.balances).every(v => Math.abs(v) < 0.01) && (
                    <p className="text-gray-400 italic text-sm">全部已結清 (All settled)</p>
                )}
            </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Send className="w-5 h-5 mr-2 text-indigo-600" />
                結算方案 (Who pays Whom)
            </h2>
        </div>
        <div className="divide-y divide-gray-100">
            {result.transactions.length === 0 ? (
                <div className="p-8 text-center text-green-600 font-medium bg-green-50">
                    🎉 無需轉帳，條數已平！ (No transactions needed)
                </div>
            ) : (
                result.transactions.map((t, idx) => {
                    const fromUser = users.find(u => u.id === t.fromId);
                    const toUser = users.find(u => u.id === t.toId);
                    return (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center flex-1">
                                <span className="font-bold text-gray-800 w-1/3 text-right">{fromUser?.name}</span>
                                <div className="mx-4 flex flex-col items-center text-gray-400">
                                    <span className="text-xs mb-1">給 (Pay)</span>
                                    <ArrowRight className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="font-bold text-gray-800 w-1/3 text-left">{toUser?.name}</span>
                            </div>
                            <div className="text-xl font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                ${t.amount.toFixed(2)}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center text-yellow-300">
                <Sparkles className="w-5 h-5 mr-2" />
                AI 智能總結助手
            </h2>
            <span className="text-xs bg-gray-700 px-2 py-1 rounded border border-gray-600">Powered by Gemini</span>
        </div>
        
        {!aiMessage ? (
            <div className="text-center py-6">
                <p className="text-gray-300 mb-4 text-sm">
                    覺得 Cap 圖太麻煩？讓 AI 幫你寫一段禮貌又清楚的 WhatsApp 訊息發給朋友吧！
                </p>
                <button
                    onClick={handleGenerateAi}
                    disabled={isLoadingAi}
                    className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-600 text-white px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/30 flex items-center mx-auto"
                >
                    {isLoadingAi ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isLoadingAi ? '正在生成...' : '生成分享訊息'}
                </button>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-sm leading-relaxed whitespace-pre-wrap font-mono border border-gray-700">
                    {aiMessage}
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => setAiMessage('')}
                        className="text-gray-400 hover:text-white text-sm px-3 py-1"
                    >
                        重試 / 清除
                    </button>
                    <button
                        onClick={() => copyToClipboard(aiMessage)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        複製文字
                    </button>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};
