import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { KeepAliveProvider } from './contexts/KeepAliveContext';
import { SchedulingProvider } from './contexts/SchedulingContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { autoRestoreOnStartup } from './services/autoRestore';

// Aguarda a auto-restauração antes de renderizar a aplicação
(async () => {
  try {
    await autoRestoreOnStartup();
  } catch (err) {
    console.warn('[Startup] Falha ao executar auto-restauração:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AuthProvider>
        <KeepAliveProvider>
          <SchedulingProvider>
            <RouterProvider router={router} />
          </SchedulingProvider>
        </KeepAliveProvider>
      </AuthProvider>
    </React.StrictMode>
  );
})();
