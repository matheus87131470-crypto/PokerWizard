import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
}

export default function CustomSelect({ value, onChange, options, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'block' }}>{label}</label>}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: isOpen ? '#ffffff' : 'rgba(255,255,255,0.04)',
          color: isOpen ? '#0b1220' : 'var(--text-primary)',
          fontSize: 14,
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          fontWeight: 500,
        }}
      >
        <span>{value}</span>
        <span style={{ fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 1000,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: value === opt ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: '#0b1220',
                fontSize: 14,
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease',
                borderBottom: idx < options.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = value === opt ? 'rgba(124,58,237,0.15)' : 'transparent';
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
