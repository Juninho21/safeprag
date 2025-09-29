import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { KeepAliveProvider } from './contexts/KeepAliveContext';
import { SchedulingProvider } from './contexts/SchedulingContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KeepAliveProvider>
      <SchedulingProvider>
        <RouterProvider router={router} />
      </SchedulingProvider>
    </KeepAliveProvider>
  </React.StrictMode>
);
