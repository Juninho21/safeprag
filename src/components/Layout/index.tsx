import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar';
import { UserProfile } from '../UserProfile';
import { HamburgerMenu } from '../HamburgerMenu';

export function Layout() {
  const location = useLocation();
  const hideNavBar = location.pathname === '/login' || location.pathname === '/cadastro';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavBar && <HamburgerMenu />}
      {!hideNavBar && (
        <div className="fixed top-0 right-0 p-4 z-50">
          <UserProfile />
        </div>
      )}
      <div className="pb-16 pt-16"> {/* Espaço para a BottomNavBar e UserProfile */}
        <Outlet />
      </div>
      {!hideNavBar && <BottomNavBar />} {/* Esconde a BottomNavBar apenas nas páginas de login e cadastro */}
    </div>
  );
}
