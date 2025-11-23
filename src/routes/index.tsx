import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '../components/Layout';
import App from '../App';
import { AdminPage } from '../components/AdminPage';
// import { SupabaseIntegration } from '../pages/Admin/SupabaseIntegration';
import { Login } from "../components/Login";
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RequireRole } from '../components/Auth/RequireRole';
import DownloadsManagement from '../components/ServiceOrders/DownloadsManagement';

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
            path: 'downloads',
            element: (
              <RequireRole allow={["admin", "controlador", "cliente"]}>
                <DownloadsManagement />
              </RequireRole>
            )
          },
          // Plano Mensal agora está dentro de Configurações do Sistema (AdminPage)
          {
            path: 'configuracoes',
            element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>,
            children: [
              {
                index: true,
                element: <Navigate to="/configuracoes/empresa" replace />
              },
              {
                path: 'empresa',
                element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>
              },
              {
                path: 'usuarios',
                element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>
              },
              {
                path: 'produtos',
                element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>
              },

              {
                path: 'clientes',
                element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>
              },
              {
                path: 'downloads',
                element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>
              },
              {
                path: 'backup',
                element: <RequireRole allow={["admin"]}><AdminPage /></RequireRole>
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
