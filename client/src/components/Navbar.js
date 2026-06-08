'use client';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search } from 'lucide-react';

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  hr: 'bg-green-100 text-green-700',
  employee: 'bg-gray-100 text-gray-700',
};

export default function Navbar({ title }) {
  const { userData, role } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userData?.name || 'User'}</p>
            <span className={`badge ${ROLE_COLORS[role] || ROLE_COLORS.employee} text-xs capitalize`}>
              {role}
            </span>
          </div>
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {(userData?.name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
