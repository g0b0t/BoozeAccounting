import React from 'react';

interface BigTapButtonProps {
  emoji: string;
  label: string;
  onTap: () => void;
  sub?: string;
}

export function BigTapButton({ emoji, label, onTap, sub }: BigTapButtonProps) {
  return (
    <button className="big-tap" onClick={onTap}>
      <span className="big-tap-emoji">{emoji}</span>
      <span className="big-tap-label">{label}</span>
      {sub ? <span className="big-tap-sub">{sub}</span> : null}
    </button>
  );
}
