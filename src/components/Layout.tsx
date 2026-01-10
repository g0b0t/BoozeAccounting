import React from 'react';
import { BottomTabs } from './BottomTabs';

export function Layout({ title, children, mode }: { title?: string; children: React.ReactNode; mode?: 'NORMAL' | 'DRUNK' | 'SAFETY' }) {
  return (
    <div className={`app ${mode ? `mode-${mode.toLowerCase()}` : ''}`}>
      <header className="topbar">
        <h1>{title ?? 'Booze Crew'}</h1>
      </header>
      <main className="content">{children}</main>
      {mode !== 'SAFETY' ? <BottomTabs /> : null}
    </div>
  );
}
