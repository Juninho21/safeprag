import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Home, Activity, Settings, Download, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Os itens do menu serão definidos conforme o papel do usuário

export function HamburgerMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, role } = useAuth();

  const displayName = (user?.displayName || user?.email || 'Usuário') as string;
  const displayInitial = displayName?.charAt(0)?.toUpperCase();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Itens de navegação conforme papel do usuário
  const allItems: NavItem[] = [
    { path: '/', label: 'Início', icon: Home },
    // Usamos '/' para Atividades pois a navegação por abas ocorre dentro do App
    { path: '/', label: 'Atividades', icon: Activity },
    { path: '/downloads', label: 'Downloads', icon: Download },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
    { path: '/superuser', label: 'Super User', icon: Shield },
  ];

  const allowedByRole: Record<string, string[]> = {
    admin: ['/', 'Atividades', '/downloads', '/configuracoes'],
    controlador: ['/', 'Atividades', '/downloads'],
    cliente: ['/', '/downloads']
  };

  const navigationItems: NavItem[] = allItems.filter(item => {
    // Superusuário e Dono têm acesso a tudo
    if (role === 'superuser' || role === 'owner' || user?.email === 'juninhomarinho22@gmail.com') {
      return true;
    }

    const allowed = allowedByRole[role || 'cliente'] || ['/downloads'];
    // Como 'Atividades' também aponta para '/', usamos label para diferenciar
    if (item.label === 'Atividades') {
      return allowed.includes('Atividades');
    }
    return allowed.includes(item.path);
  });

  if (!user) return null;

  return (
    <>
      {/* Botão do menu hamburger (oculto quando aberto) */}
      {!isOpen && (
        <button
          onClick={toggleMenu}
          className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-md p-2 flex items-center justify-center"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* Overlay para fechar o menu ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Painel lateral do menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Cabeçalho com usuário e ação de sair */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {displayInitial}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{displayName}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={`${item.path}-${item.label}`}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
                  }
                >
                  {React.createElement(item.icon, { className: 'w-5 h-5' })}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>


      </div>
    </>
  );
}