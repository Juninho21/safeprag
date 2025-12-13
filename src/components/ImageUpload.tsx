import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  currentImageUrl?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onFileSelect,
  currentImageUrl,
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes
  useEffect(() => {
    console.log('🖼️ ImageUpload recebeu URL:', currentImageUrl);
    if (currentImageUrl) {
      console.log('🖼️ Definindo preview URL:', currentImageUrl);
      setPreviewUrl(currentImageUrl);
    } else {
      console.log('🖼️ Nenhuma URL recebida, limpando preview');
      setPreviewUrl('');
    }
  }, [currentImageUrl]);

  // Função para redimensionar a imagem
  const resizeImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
      setIsResizing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Verificar se a imagem precisa ser redimensionada
          let width = img.width;
          let height = img.height;
          // Calcular novas dimensões mantendo a proporção
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          } else {
            // Se a imagem já estiver dentro dos limites e for menor que 5MB, retornar o arquivo original
            if (file.size <= 5 * 1024 * 1024) {
              setIsResizing(false);
              resolve(file);
              return;
            }
          }
          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsResizing(false);
            reject(new Error('Não foi possível criar o contexto do canvas'));
            return;
          }
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para blob
          canvas.toBlob((blob) => {
            if (!blob) {
              setIsResizing(false);
              reject(new Error('Falha ao converter canvas para blob'));
              return;
            }
            // Criar novo arquivo
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            console.log(`🖼️ Imagem redimensionada: ${width}x${height}, ${(resizedFile.size / 1024).toFixed(2)}KB`);
            setIsResizing(false);
            resolve(resizedFile);
          }, file.type, quality);
        };
        img.onerror = () => {
          setIsResizing(false);
          reject(new Error('Erro ao carregar a imagem'));
        };
      };
      reader.onerror = () => {
        setIsResizing(false);
        reject(new Error('Erro ao ler o arquivo'));
      };
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar o tipo do arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      try {
        let finalFile = file;
        // Se o arquivo for maior que 5MB, redimensionar automaticamente
        if (file.size > 5 * 1024 * 1024) {
          console.log(`🖼️ Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB), redimensionando...`);
          finalFile = await resizeImage(file);
        }

        // Criar preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(finalFile);

        // Chamar callback com o arquivo original ou redimensionado
        onFileSelect(finalFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        alert('Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
      }
    }
  };

  const handleClick = () => {
    // Em alguns WebViews móveis (Android/iOS), disparar click()
    // em inputs com display:none pode ser bloqueado.
    // Mantemos o gesture handler, mas garantimos que o input
    // esteja presente e acessível na árvore para compatibilidade.
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors ${className}`}
      onClick={handleClick}>
      {/*
        No Android WebView, inputs com display:none podem não abrir
        o seletor de arquivos via click(). Para melhor compatibilidade,
        mantemos o input visível para o navegador, porém invisível ao usuário
        (opacity-0) e ocupando toda a área clicável.
      */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        // Tornar acessível ao motor de renderização, mas invisível ao usuário
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {isResizing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="bg-white p-3 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm">Redimensionando imagem...</p>
          </div>
        </div>
      )}
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-32 mx-auto object-contain"
            onError={(e) => {
              console.error('Erro ao carregar imagem no preview:', previewUrl);
              e.currentTarget.style.display = 'none'; // Oculta a imagem quebrada
              // Opcional: Mostrar mensagem de erro ou resetar preview
              // setPreviewUrl(''); 
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleClick}
          >
            <span className="text-white bg-black bg-opacity-60 rounded px-2 py-1 text-xs">Trocar logo</span>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-4"
        >
          <span className="font-semibold text-gray-500 border border-dashed border-gray-300 rounded px-4 py-2">Logo da empresa</span>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB (redimensionamento automático)</p>
        </div>
      )}
    </div>
  );
};
