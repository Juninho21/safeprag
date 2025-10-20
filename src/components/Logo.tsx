import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = false 
}) => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  
  useEffect(() => {
    const controller = new AbortController();
    const loadLogo = async () => {
      try {
        const res = await fetch('/latest-backup.json', { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const url = data?.COMPANY?.logo_url;
        setLogoUrl(typeof url === 'string' && url.length > 0 ? url : '/safeprag_logo.png');
      } catch (err) {
        console.error('Erro ao buscar logo de latest-backup.json:', err);
        setLogoUrl('/safeprag_logo.png');
      }
    };
    loadLogo();
    return () => controller.abort();
  }, []);

  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
    '2xl': 'h-32 w-auto'
  } as const;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Erro ao carregar logo:', e);
    // Em caso de erro no logo do JSON, usar o logo padrão Safeprag
    if (logoUrl !== '/safeprag_logo.png') {
      setLogoUrl('/safeprag_logo.png');
    }
  };

  // Se não há logo carregado ainda, exibir logo padrão Safeprag
  if (!logoUrl) {
    return (
      <div className={`text-center ${className}`}>
        <img
          className={`mx-auto ${sizeClasses[size]}`}
          src={'/safeprag_logo.png'}
          alt="Safeprag Logo"
          onError={handleImageError}
        />
        {showText && (
          <h2 className="mt-2 text-lg font-semibold text-gray-700">
            Safeprag
          </h2>
        )}
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <img
        className={`mx-auto ${sizeClasses[size]}`}
        src={logoUrl}
        alt="Safeprag Logo"
        onError={handleImageError}
      />
      {showText && (
        <h2 className="mt-2 text-lg font-semibold text-gray-700">
          Safeprag
        </h2>
      )}
    </div>
  );
};

export default Logo;