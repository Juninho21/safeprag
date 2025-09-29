import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Users, Package, FileText, ClipboardList, Database, Download, Cloud, ChevronDown } from 'lucide-react';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, onTabChange }) => {
  const location = useLocation();

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'usuarios', label: 'Assinaturas', icon: Users },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      {/* Layout para telas pequenas (dropdown) */}
      <div className="sm:hidden w-full mb-2">
        <label htmlFor="admin-tab-select" className="sr-only">Selecione uma aba</label>
        <div className="relative">
          <select
            id="admin-tab-select"
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value)}
            className="block appearance-none w-full bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <ChevronDown className="w-4 h-4" />
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
              className={`flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
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
