import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types/role';

interface RequireRoleProps {
  allow: Role[];
  children: React.ReactNode;
}

export function RequireRole({ allow, children }: RequireRoleProps) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Superusuário e Dono têm acesso total
  if (role === 'superuser' || role === 'owner') {
    return <>{children}</>;
  }

  if (!role || !allow.includes(role)) {
    return <div className="p-6 text-center text-red-600">Acesso não autorizado</div>;
  }

  return <>{children}</>;
}