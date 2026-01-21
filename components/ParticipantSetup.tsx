import React, { useState } from 'react';
import { User } from '../types';
import { Trash2, UserPlus, Heart, Cake } from 'lucide-react';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const ParticipantSetup: React.FC<Props> = ({ users, setUsers }) => {
  const [newName, setNewName] = useState('');

  const addUser = () => {
    if (!newName.trim()) return;
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      isBirthday: false,
      linkedPayerId: null
    };
    setUsers([...users, newUser]);
    setNewName('');
  };

  const removeUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const toggleBirthday = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isBirthday: !u.isBirthday } : u));
  };

  const updateLinkedPayer = (userId: string, payerId: string | null) => {
    setUsers(users.map(u => u.id === userId ? { ...u, linkedPayerId: payerId === "none" ? null : payerId } : u));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
          參加者 (Participants)
        </h2>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUser()}
            placeholder="輸入名字 (e.g. Jason)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={addUser}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            新增
          </button>
        </div>

        <div className="space-y-3">
            {users.length === 0 && (
                <p className="text-center text-gray-400 py-4">暫時未有參加者</p>
            )}
            {users.map(user => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.isBirthday ? 'bg-pink-500' : 'bg-indigo-400'}`}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        {user.linkedPayerId && (
                            <p className="text-xs text-gray-500 flex items-center">
                                <Heart className="w-3 h-3 mr-1 text-red-400" />
                                依附於: {users.find(u => u.id === user.linkedPayerId)?.name || 'Unknown'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Birthday Toggle */}
                    <button
                        onClick={() => toggleBirthday(user.id)}
                        className={`p-2 rounded-full transition-colors ${user.isBirthday ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-pink-400 hover:bg-pink-50'}`}
                        title="生日主角 (Birthday)"
                    >
                        <Cake className="w-5 h-5" />
                    </button>

                    {/* Couple / Linked Payer Select */}
                    <div className="relative">
                        <select
                            value={user.linkedPayerId || "none"}
                            onChange={(e) => updateLinkedPayer(user.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pl-7 pr-8 py-1.5 bg-white border"
                            style={{maxWidth: '150px'}}
                        >
                            <option value="none">獨立付款</option>
                            {users.filter(u => u.id !== user.id).map(payer => (
                                <option key={payer.id} value={payer.id}>
                                    由 {payer.name} 付款
                                </option>
                            ))}
                        </select>
                        <Heart className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => removeUser(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="移除"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            ))}
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
        <p className="font-bold mb-1">💡 小貼士 (Tips):</p>
        <ul className="list-disc pl-5 space-y-1">
            <li>如果有 <b>Couple</b> (e.g. A & B)，假設 A 負責比錢，請在 B 的選項中選擇 "由 A 付款"。系統會將 B 應付的金額算在 A 的帳上，計數時 B 不需要轉錢給 A。</li>
            <li>如果是 <b>生日主角</b>，點擊蛋糕圖示 🎂。之後新增項目時，系統會預設不預佢一份 (可手動更改)。</li>
        </ul>
      </div>
    </div>
  );
};
