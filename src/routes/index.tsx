import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SchedulingPage } from '../pages/Scheduling';
import App from '../App';
import { AdminPage } from '../components/AdminPage';
// import { SupabaseIntegration } from '../pages/Admin/SupabaseIntegration';
import { Login } from "../components/Login";
import { Register } from '../components/Register';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

// Componente para layout principal (sem autenticação)
const MainLayout = () => {
  return <Outlet />;
};

// Componente RequireAuth desabilitado temporariamente
function RequireAuth({ children }: { children: ReactNode }) {
  // Autenticação desabilitada - sempre permite acesso
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/cadastro',
    element: <Register />,
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
