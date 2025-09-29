import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface SignatureCanvasProps {
  disabled?: boolean;
  onSignatureChange: (signature: string) => void;
}

export interface SignatureCanvasRef {
  clear: () => void;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(({
  disabled = false,
  onSignatureChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar o tamanho do canvas para preencher o contêiner pai
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Reconfigurar o contexto após redimensionar
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Configurar o canvas inicialmente
    resizeCanvas();
    setContext(ctx);

    // Adicionar listener de redimensionamento
    window.addEventListener('resize', resizeCanvas);

    // Limpar listener ao desmontar
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!context || !isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let currentPoint;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e instanceof MouseEvent) {
      currentPoint = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    } else {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.touches[0];
      currentPoint = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }

    if (lastPoint.current) {
      context.beginPath();
      context.moveTo(lastPoint.current.x, lastPoint.current.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
    }

    lastPoint.current = currentPoint;
    
    // Atualizar a assinatura
    onSignatureChange(canvas.toDataURL());
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.nativeEvent instanceof MouseEvent) {
      lastPoint.current = {
        x: (e.nativeEvent.clientX - rect.left) * scaleX,
        y: (e.nativeEvent.clientY - rect.top) * scaleY
      };
    } else {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      const touch = e.nativeEvent.touches[0];
      lastPoint.current = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clear = () => {
    if (!context || !canvasRef.current) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onSignatureChange('');
  };

  useImperativeHandle(ref, () => ({
    clear
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevenir scroll em dispositivos touch
      draw(e);
    };

    if (!disabled) {
      canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', (e) => e.preventDefault());
    };
  }, [isDrawing, disabled]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        style={{
          touchAction: 'none', // Desabilitar comportamentos touch padrão
          width: '100%',
          height: 'auto'
        }}
        className={`border border-gray-300 rounded cursor-${disabled ? 'not-allowed' : 'crosshair'}`}
      />
    </div>
  );
});
