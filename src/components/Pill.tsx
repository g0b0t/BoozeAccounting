import React from 'react';

export function Pill({ text, variant = 'neutral' }: { text: string; variant?: 'neutral' | 'success' | 'danger' }) {
  return <span className={`pill pill-${variant}`}>{text}</span>;
}
