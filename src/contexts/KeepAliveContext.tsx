import React, { createContext, useContext, useEffect, useState } from 'react';

interface KeepAliveContextType {
  isActive: boolean;
  lastActivity: Date | null;
}

const KeepAliveContext = createContext<KeepAliveContextType>({
  isActive: false,
  lastActivity: null,
});

export const useKeepAlive = () => useContext(KeepAliveContext);

export const KeepAliveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    // Previne que a tela escureça ou entre em modo de espera
    const keepScreenOn = async () => {
      try {
        // @ts-ignore - A API ainda é experimental
        if (navigator.wakeLock) {
          let wakeLock = null;
          const requestWakeLock = async () => {
            try {
              // @ts-ignore
              wakeLock = await navigator.wakeLock.request('screen');
              console.log('Wake Lock ativo');
              setIsActive(true);
            } catch (err) {
              console.log('Wake Lock não pôde ser ativado:', err);
              setIsActive(false);
            }
          };

          // Solicita o Wake Lock inicialmente
          await requestWakeLock();

          // Reativa o Wake Lock quando a visibilidade da página muda
          document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
              await requestWakeLock();
            }
          });
        }
      } catch (err) {
        console.log('Wake Lock não suportado:', err);
        setIsActive(false);
      }
    };

    // Previne que a página fique inativa
    const keepAlive = () => {
      const interval = setInterval(() => {
        const now = new Date();
        // Atualiza o timestamp do localStorage para manter a sessão ativa
        localStorage.setItem('lastActivity', now.toISOString());
        setLastActivity(now);
      }, 30000); // A cada 30 segundos

      return () => clearInterval(interval);
    };

    // Previne que a página entre em modo de economia de energia
    const preventPowerSaving = () => {
      const powerSavingEvents = ['mousemove', 'keydown', 'touchstart', 'scroll'];
      
      const handleActivity = () => {
        const now = new Date();
        localStorage.setItem('lastActivity', now.toISOString());
        setLastActivity(now);
      };

      powerSavingEvents.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        powerSavingEvents.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    };

    // Inicia todas as funções de keep-alive
    const cleanupScreenOn = keepScreenOn();
    const cleanupKeepAlive = keepAlive();
    const cleanupPowerSaving = preventPowerSaving();

    // Limpa todos os event listeners quando o componente é desmontado
    return () => {
      cleanupKeepAlive();
      cleanupPowerSaving();
    };
  }, []);

  return (
    <KeepAliveContext.Provider value={{ isActive, lastActivity }}>
      {children}
    </KeepAliveContext.Provider>
  );
};
