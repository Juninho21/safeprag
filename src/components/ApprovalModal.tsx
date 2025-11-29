import React, { useState, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { SignatureCanvas, SignatureCanvasRef } from './SignatureCanvas';
import { saveClientSignature } from '../services/pdfService';
// import { useNotification } from '../contexts/NotificationContext'; // Removido
import { useEffect } from 'react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onSave?: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emails, setEmails] = useState<string[]>(['']);
  const [signature, setSignature] = useState('');
  const [isWritingDisabled, setIsWritingDisabled] = useState(false);

  const signatureRef = useRef<SignatureCanvasRef>(null);
  // const { showNotification } = useNotification(); // Removido

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: name,
        phone: phone,
        emails: emails,
        signature,
        contato: name,
      };

      // Salvar no localStorage
      localStorage.setItem('client_signature_data', JSON.stringify(data));

      if (onSave) {
        onSave();
      }

      // Limpar campos
      setName('');
      setPhone('');
      setEmails(['']);
      setSignature('');
      setIsWritingDisabled(false);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    if (newEmails.length === 0) {
      setEmails(['']);
    } else {
      setEmails(newEmails);
    }
  };

  // Efeito para ajustar o scroll quando o modal é aberto em dispositivos móveis
  useEffect(() => {
    if (isOpen) {
      // Previne o scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden';
      
      // Restaura o scroll quando o modal é fechado
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-lg shadow-xl max-h-[95vh] overflow-y-auto">
        {/* Cabeçalho do modal */}
        <div className="flex justify-between items-center mb-3 sm:mb-6 sticky top-0 bg-white pt-1 pb-2 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Aprovação de Serviço
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="mb-3 sm:mb-6">
          <p className="text-gray-800 text-sm sm:text-base font-medium leading-relaxed">
            Estou de acordo com o serviço realizado e tenho ciência sobre as informações contidas
            neste relatório.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Confirmação dos Dados</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full p-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Digite seu telefone"
              className="w-full p-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              autoComplete="tel"
            />
          </div>

          {emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="Digite seu e-mail"
                  className="w-full p-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  autoComplete="email"
                />
              </div>
            </div>
          ))}

          <div className="pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
              <label className="block text-sm font-semibold text-gray-800">
                Assinatura
              </label>
              <button
                type="button"
                onClick={() => setIsWritingDisabled(!isWritingDisabled)}
                className={`px-3 py-2 ${
                  isWritingDisabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white text-sm rounded-md transition-colors font-medium w-full sm:w-auto`}
              >
                {isWritingDisabled ? 'Habilitar Escrita' : 'Desabilitar Escrita'}
              </button>
            </div>
            <div className="border border-gray-300 rounded-md bg-white h-40 sm:h-48 touch-none">
              <SignatureCanvas
                ref={signatureRef}
                disabled={isWritingDisabled}
                onSignatureChange={setSignature}
              />
            </div>
            
            {/* Botões de ação fixos na parte inferior em dispositivos móveis */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3 justify-between sticky bottom-0 bg-white pt-2 pb-1 border-t border-gray-100 sm:border-0">
              <button
                type="button"
                onClick={handleClearSignature}
                className="px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                Limpar Assinatura
              </button>
              <button
                type="submit"
                className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
