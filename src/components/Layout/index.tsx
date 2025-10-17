import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar';
import { HamburgerMenu } from '../HamburgerMenu';

export function Layout() {
  const location = useLocation();
  const hideNavBar = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavBar && <HamburgerMenu />}
      <div className="pb-16 pt-16"> {/* Espaço para a BottomNavBar e UserProfile */}
        <Outlet />
      </div>
      {!hideNavBar && <BottomNavBar />} {/* Esconde a BottomNavBar apenas nas páginas de login e cadastro */}
    </div>
  );
}
