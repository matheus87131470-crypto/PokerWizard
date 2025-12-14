import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        padding: '16px 20px',
        borderRadius: 12,
        background: bgColors[type],
        color: 'white',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        maxWidth: 400,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 18 }}>{icons[type]}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: 18,
          padding: 0,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        ×
      </button>
    </div>
  );
}
