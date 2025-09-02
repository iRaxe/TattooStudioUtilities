import React from 'react';
import Button from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '500px',
  className = '',
  showCloseButton = true,
  ...props 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '4px',
          padding: '2rem',
          maxWidth,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        className={className}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(title || showCloseButton) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            {title && (
              <h3 
                id="modal-title"
                style={{
                  color: '#f9fafb',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: 0
                }}
              >
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                variant="secondary"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Chiudi modale"
              >
                ×
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;