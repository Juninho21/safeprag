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
      className={`${className} bg-white shadow-xl outline-none w-full sm:w-auto max-w-md sm:max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto`}
      overlayClassName={`${overlayClassName} fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4`}
      ariaHideApp={false}
    >
      {children}
    </ReactModal>
  );
};
