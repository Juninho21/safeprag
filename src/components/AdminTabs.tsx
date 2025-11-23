import React from 'react';
import { Building2, Users, Package, Database, Download, ChevronDown, Pen, FileText, ShieldCheck } from 'lucide-react';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      {/* Layout para telas pequenas (dropdown) */}
      <div className="sm:hidden w-full mb-4">
        <label htmlFor="admin-tab-select" className="sr-only">Selecione uma aba</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {(() => {
              const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Building2;
              return <ActiveIcon className="h-5 w-5 text-blue-500" />;
            })()}
          </div>
          <select
            id="admin-tab-select"
            value={activeTab}
            onChange={(e) => {
              onTabChange(e.target.value);
            }}
            className="block appearance-none w-full bg-white border border-gray-300 text-gray-900 py-3 pl-10 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium transition-all cursor-pointer"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Layout para telas grandes (abas horizontais) */}
      <div className="hidden sm:flex flex-wrap space-x-2 sm:space-x-4 mb-2 sm:mb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${isActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                } `}
            >
              <Icon className="w-4 h-4 mr-1.5 sm:mr-2 sm:w-5 sm:h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Botão Supabase para ambos os layouts (ajustado para telas pequenas) */}
      {/*
      <Link
        to="/supabase"
        className="flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
      >
        <Cloud className="w-4 h-4 mr-1.5 sm:mr-2 sm:w-5 sm:h-5" />
        Integração Supabase
      </Link>
      */}
    </div>
  );
};
