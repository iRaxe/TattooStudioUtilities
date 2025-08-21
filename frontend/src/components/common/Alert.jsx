import React from 'react';

export default function Alert({ children, type = 'info', className = '', ...props }) {
  return (
    <div className={`alert alert-${type} ${className}`} {...props}>
      {children}
    </div>
  );
}