import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Activity, Settings } from 'lucide-react';
// Removido: import do supabase
import { handleLogout as authLogout } from '../../services/authService';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    path: '/',
    label: 'Início',
    icon: Home
  },
  {
    path: '/atividades',
    label: 'Atividades',
    icon: Activity
  },
  {
    path: '/configuracoes',
    label: 'Configurações',
    icon: Settings
  }
];

export function HamburgerMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Modo offline - simular usuário logado
    const offlineUser = {
      id: 'offline-user',
      email: 'usuario@offline.local',
      user_metadata: { name: 'Usuário Offline' }
    };
    setUser(offlineUser as any);
  }, []);

  const handleLogout = async () => {
    // Usar a função de logout do serviço de autenticação
    await authLogout();
    setIsOpen(false);
    // Logout desabilitado - não redireciona para login
    // navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <>
      {/* Botão do menu hamburger */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-md p-2 flex items-center justify-center"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

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
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
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
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 w-full text-left"
              >
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>


      </div>
    </>
  );
}