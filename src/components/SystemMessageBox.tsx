import React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './ui/button';

type Variant = 'warning' | 'error' | 'info';

interface Action {
  label: string;
  onClick: () => void;
}

interface SystemMessageBoxProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: Variant;
  primaryAction?: Action;
  secondaryAction?: Action;
}

export const SystemMessageBox: React.FC<SystemMessageBoxProps> = ({
  isOpen,
  onClose,
  title = 'Atenção',
  message,
  variant = 'warning',
  primaryAction,
  secondaryAction,
}) => {
  const iconClasses = {
    warning: 'text-orange-500',
    error: 'text-red-600',
    info: 'text-blue-600',
  }[variant];

  const Icon = variant === 'error' ? AlertCircle : variant === 'warning' ? AlertTriangle : AlertCircle;

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <div className="relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <Icon className={`h-6 w-6 ${iconClasses}`} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-gray-700">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          <Button variant={variant === 'error' ? 'destructive' : variant === 'warning' ? 'warning' : 'default'} onClick={primaryAction?.onClick || onClose}>
            {primaryAction?.label || 'Ok'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};