import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = user.displayName || user.email || 'Usuário';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
        {displayName?.charAt(0)?.toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">{displayName}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-red-600 hover:text-red-700"
        >
          Sair
        </button>
      </div>
    </div>
  );
}