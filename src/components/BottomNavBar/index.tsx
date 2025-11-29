import React from 'react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  items: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export function BottomNavBar({ activeTab, onTabChange, items }: BottomNavBarProps) {
  const handleClick = (itemId: string) => {
    onTabChange(itemId);
  };

  // Verificação de segurança para evitar erro quando items é undefined
  if (!items || !Array.isArray(items)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 shadow-lg z-40">
      <div className="h-full max-w-screen-xl mx-auto px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around h-full items-center">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            const baseClasses = 'flex flex-col items-center justify-center px-4 py-2 rounded-md transition-all duration-200 cursor-pointer';
            const activeClasses = 'bg-blue-50 shadow text-blue-600';
            const inactiveClasses = 'text-gray-600 hover:text-blue-600 hover:bg-gray-100';

            return (
              <div
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              >
                {React.createElement(item.icon, { className: 'w-6 h-6 mb-1' })}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
