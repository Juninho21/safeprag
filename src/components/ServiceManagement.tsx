import React, { useState } from 'react';
import { ServiceScheduler } from './ServiceScheduler';
import ServiceOrderList from './ServiceOrderList';

interface ServiceManagementProps {
  onTabChange?: (tab: string) => void;
  onOSStart?: () => void;
  onApproveOS?: (orderId: string) => void;
}

const ServiceManagement: React.FC<ServiceManagementProps> = ({ 
  onTabChange, 
  onOSStart,
  onApproveOS 
}) => {
  const [activeView, setActiveView] = useState<'schedule' | 'orders'>('schedule');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs de navegação */}
      <div className="flex mb-4 bg-white shadow-sm">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeView === 'schedule'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('schedule')}
        >
          Atividades
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeView === 'orders'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('orders')}
        >
          Ordens de Serviço
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto">
        {activeView === 'schedule' ? (
          <ServiceScheduler 
            onTabChange={onTabChange} 
            onOSStart={onOSStart}
          />
        ) : (
          <ServiceOrderList 
            onTabChange={onTabChange}
            onApproveOS={onApproveOS}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceManagement;
