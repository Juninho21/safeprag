import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SchedulingPage } from '../pages/Scheduling';
import App from '../App';
import { AdminPage } from '../components/AdminPage';
// import { SupabaseIntegration } from '../pages/Admin/SupabaseIntegration';
import { Login } from "../components/Login";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Componente para layout principal (sem autenticação)
const MainLayout = () => {
  return <Outlet />;
};

// Componente RequireAuth: protege rotas quando não autenticado
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Carregando...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <RequireAuth><Layout /></RequireAuth>,
        children: [
          {
            index: true,
            element: <App />
          },
          {
            path: 'configuracoes',
            element: <AdminPage />,
            children: [
              {
                index: true,
                element: <Navigate to="/configuracoes/empresa" replace />
              },
              {
                path: 'empresa',
                element: <AdminPage />
              },
              {
                path: 'usuarios',
                element: <AdminPage />
              },
              {
                path: 'produtos',
                element: <AdminPage />
              },
              {
                path: 'assinaturas',
                element: <AdminPage />
              },
              {
                path: 'downloads',
                element: <AdminPage />
              },
              {
                path: 'backup',
                element: <AdminPage />
              }
            ]
          },

        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
