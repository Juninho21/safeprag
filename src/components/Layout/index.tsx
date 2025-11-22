import React, { useMemo, useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar';
import { HamburgerMenu } from '../HamburgerMenu';
import { Calendar, Activity, Settings, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const hideNavBar = location.pathname === '/login';

  const itemsAll = useMemo(() => ([
    { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/?tab=schedule' },
    { id: 'atividade', label: 'Atividade', icon: Activity, path: '/?tab=activity' },
    { id: 'downloads', label: 'Downloads', icon: Download, path: '/downloads' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' },
  ]), []);

  const allowedByRole: Record<string, string[]> = {
    admin: ['agenda', 'atividade', 'downloads', 'configuracoes'],
    controlador: ['agenda', 'atividade', 'downloads'],
    cliente: ['agenda', 'downloads']
  };

  const items = useMemo(() => {
    const allowed = allowedByRole[role || 'cliente'] || ['downloads'];
    return itemsAll.filter(i => allowed.includes(i.id));
  }, [itemsAll, role]);

  const deriveActive = (pathname: string, search: string) => {
    if (pathname.startsWith('/configuracoes')) return 'configuracoes';
    if (pathname.startsWith('/downloads')) return 'downloads';
    const params = new URLSearchParams(search || '');
    const tab = params.get('tab');
    if (tab === 'activity') return 'atividade';
    if (tab === 'schedule') return 'agenda';
    return 'agenda';
  };

  const [activeTab, setActiveTab] = useState<string>(deriveActive(location.pathname, location.search));

  useEffect(() => {
    setActiveTab(deriveActive(location.pathname, location.search));
  }, [location.pathname, location.search]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const target = itemsAll.find(i => i.id === tabId);
    if (target) navigate(target.path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavBar && <HamburgerMenu />}
      <div className="pb-16 pt-16">
        <Outlet />
      </div>
      {!hideNavBar && user && (
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          items={items.map(i => ({ id: i.id, label: i.label, icon: i.icon }))}
        />
      )}
    </div>
  );
}
