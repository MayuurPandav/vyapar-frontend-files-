import React from 'react';
import { useApp } from '../context/AppContext';

export default function ThemeToggle({ className = '', style = {} }) {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      id="global-theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '7px 14px',
        borderRadius: '9999px',
        border: isDark 
          ? '1px solid rgba(255, 255, 255, 0.14)' 
          : '1px solid rgba(15, 23, 42, 0.12)',
        background: isDark 
          ? 'rgba(15, 23, 42, 0.75)' 
          : 'rgba(255, 255, 255, 0.9)',
        color: isDark ? '#f8fafc' : '#0f172a',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        fontSize: '12.5px',
        fontWeight: 700,
        boxShadow: isDark 
          ? '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 12px rgba(16, 185, 129, 0.2)' 
          : '0 4px 14px rgba(15, 23, 42, 0.08)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        ...style
      }}
    >
      <span 
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: isDark 
            ? 'linear-gradient(135deg, #10b981, #06b6d4)' 
            : 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#ffffff',
          fontSize: '11px',
          boxShadow: isDark 
            ? '0 0 10px rgba(16, 185, 129, 0.5)' 
            : '0 0 10px rgba(245, 158, 11, 0.4)',
          transition: 'transform 0.3s ease'
        }}
      >
        <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
      </span>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
