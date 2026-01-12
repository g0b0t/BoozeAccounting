import React from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        {title ? (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
