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
  const BASE = import.meta.env.BASE_URL || '/';
  
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch(`${BASE}latest-backup.json`, { cache: 'no-store' });
        if (!res.ok) {
          setLogoUrl(`${BASE}safeprag_logo.png`);
          return;
        }
        const data = await res.json();
        const url = data?.COMPANY?.logo_url;
        setLogoUrl(typeof url === 'string' && url.length > 0 ? url : `${BASE}safeprag_logo.png`);
      } catch {
        // Falha ao buscar (arquivo inexistente, rede, etc). Mantém fallback silencioso.
        setLogoUrl(`${BASE}safeprag_logo.png`);
      }
    };
    loadLogo();
  }, []);

  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
    '2xl': 'h-32 w-auto'
  } as const;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Em caso de erro no logo do JSON, usar o logo padrão Safeprag
    // Em caso de erro no logo do JSON, usar o logo padrão Safeprag
    if (logoUrl !== `${BASE}safeprag_logo.png`) {
      setLogoUrl(`${BASE}safeprag_logo.png`);
    }
  };

  // Se não há logo carregado ainda, exibir logo padrão Safeprag
  if (!logoUrl) {
    return (
      <div className={`text-center ${className}`}>
        <img
          className={`mx-auto ${sizeClasses[size]}`}
          src={`${BASE}safeprag_logo.png`}
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