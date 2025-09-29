import React, { useEffect } from 'react';

export function KeepAlive() {
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
            } catch (err) {
              console.log('Wake Lock não pôde ser ativado:', err);
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
      }
    };

    // Previne que a página fique inativa
    const keepAlive = () => {
      const interval = setInterval(() => {
        // Atualiza o timestamp do localStorage para manter a sessão ativa
        localStorage.setItem('lastActivity', new Date().toISOString());
      }, 30000); // A cada 30 segundos

      return () => clearInterval(interval);
    };

    // Previne que a página entre em modo de economia de energia
    const preventPowerSaving = () => {
      const powerSavingEvents = ['mousemove', 'keydown', 'touchstart', 'scroll'];
      
      const handleActivity = () => {
        localStorage.setItem('lastActivity', new Date().toISOString());
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

    // Inicia todos os mecanismos de manutenção da atividade
    const cleanupKeepScreenOn = keepScreenOn();
    const cleanupKeepAlive = keepAlive();
    const cleanupPowerSaving = preventPowerSaving();

    // Limpa todos os listeners quando o componente é desmontado
    return () => {
      cleanupKeepAlive();
      cleanupPowerSaving();
    };
  }, []);

  return null; // Este componente não renderiza nada visualmente
}
