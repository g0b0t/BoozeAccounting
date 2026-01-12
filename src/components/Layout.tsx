import React from 'react';
import { BottomTabs } from './BottomTabs';

export function Layout({ title, children, mode }: { title?: string; children: React.ReactNode; mode?: 'NORMAL' | 'DRUNK' | 'SAFETY' }) {
  return (
    <div className={`app ${mode ? `mode-${mode.toLowerCase()}` : ''}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <h1 className="topbar-title">{title ?? 'Booze Crew'}</h1>
        </div>
      </header>
      <main className="content">{children}</main>
      {mode !== 'SAFETY' ? <BottomTabs /> : null}
    </div>
  );
}
