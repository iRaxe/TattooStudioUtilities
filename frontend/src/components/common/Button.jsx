import React from 'react';

export default function Button({ children, variant = 'primary', onClick, disabled = false, className = '', ...props }) {
  const baseClass = 'btn';
  
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      case 'ghost':
        return 'btn-ghost';
      default:
        return 'btn-primary';
    }
  };
  
  const variantClass = getVariantClass();
  const disabledClass = disabled ? 'btn-disabled' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}