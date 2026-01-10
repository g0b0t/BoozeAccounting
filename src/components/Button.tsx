import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  full?: boolean;
}

export function Button({ variant = 'primary', full, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${full ? 'btn-full' : ''} ${className}`}
      {...props}
    />
  );
}
