import React from 'react';

const Textarea = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`glass-input ${className}`}
      {...props}
    />
  );
};

export default Textarea;