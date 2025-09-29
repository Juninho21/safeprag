import React from 'react';
import ReactModal from 'react-modal';

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onRequestClose,
  children,
  className = 'modal-content',
  overlayClassName = 'modal-overlay',
}) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className={`${className} bg-white rounded-lg shadow-xl max-w-2xl mx-auto mt-20 outline-none`}
      overlayClassName={`${overlayClassName} fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center`}
      ariaHideApp={false}
    >
      {children}
    </ReactModal>
  );
};
