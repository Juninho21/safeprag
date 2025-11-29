/**
 * Utilitários para manipulação e otimização de imagens
 */

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSIONS = 800; // 800x800px máximo
const WEBP_QUALITY = 0.85; // 85% de qualidade

/**
 * Valida o tamanho do arquivo de imagem
 */
export const validateImageSize = (file: File): void => {
    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`Imagem muito grande. Tamanho máximo: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
    }
};

/**
 * Comprime e redimensiona uma imagem
 * @param file Arquivo de imagem original
 * @param maxSize Tamanho máximo em pixels (largura ou altura)
 * @param quality Qualidade de compressão (0.0 a 1.0)
 * @returns Blob da imagem otimizada em WebP
 */
export const compressImage = async (
    file: File,
    maxSize: number = MAX_DIMENSIONS,
    quality: number = WEBP_QUALITY
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
        }

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calcular novas dimensões mantendo aspect ratio
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height / width) * maxSize);
                    width = maxSize;
                } else {
                    width = Math.round((width / height) * maxSize);
                    height = maxSize;
                }
            }

            // Configurar canvas
            canvas.width = width;
            canvas.height = height;

            // Desenhar imagem redimensionada
            ctx.fillStyle = '#FFFFFF'; // Fundo branco para transparências
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Converter para WebP
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Falha ao gerar imagem comprimida'));
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Falha ao carregar imagem'));
        };

        // Carregar imagem do arquivo
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Converte um Blob para File
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: blob.type });
};

/**
 * Otimiza uma imagem (valida, comprime e converte para WebP)
 * @param file Arquivo de imagem original
 * @returns File otimizado em WebP
 */
export const optimizeImage = async (file: File): Promise<File> => {
    // Validar tamanho
    validateImageSize(file);

    // Comprimir e converter para WebP
    const compressedBlob = await compressImage(file);

    // Criar novo nome de arquivo com extensão .webp
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const optimizedFile = blobToFile(compressedBlob, `${originalName}.webp`);

    console.log(`✅ Imagem otimizada: ${file.size} bytes → ${optimizedFile.size} bytes (${Math.round((1 - optimizedFile.size / file.size) * 100)}% de redução)`);

    return optimizedFile;
};

/**
 * Gera preview de uma imagem
 */
export const generateImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error('Falha ao gerar preview'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Obtém informações sobre uma imagem
 */
export const getImageInfo = (file: File): Promise<{ width: number; height: number; size: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height,
                size: file.size
            });
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            reject(new Error('Falha ao carregar imagem'));
            URL.revokeObjectURL(img.src);
        };

        img.src = URL.createObjectURL(file);
    });
};
