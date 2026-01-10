import React from 'react';
import { NavLink } from 'react-router-dom';

export function BottomTabs() {
  const tabs = [
    { to: '/main', label: 'Пить', icon: '🍺' },
    { to: '/stats', label: 'Статы', icon: '📊' },
    { to: '/crew', label: 'Crew', icon: '👥' }
  ];
  return (
    <nav className="bottom-tabs">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
