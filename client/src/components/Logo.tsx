import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'default' | 'compact';
}

export default function Logo({ variant = 'default' }: LogoProps) {
  // Variação 1: Gráfico + Carta (Principal)
  const LogoVariant1 = () => (
    <Link 
      to="/" 
      style={{ 
        textDecoration: 'none', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        cursor: 'pointer', 
        transition: 'all 0.3s ease' 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.6))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'none';
      }}
    >
      {/* Ícone: Cérebro + Carta */}
      <div style={{
        width: 42,
        height: 42,
        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
        position: 'relative',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="white" fillOpacity="0.95"/>
          <path d="M12 7L13.5 10.5L17 11L14.5 13.5L15 17L12 15L9 17L9.5 13.5L7 11L10.5 10.5L12 7Z" fill="#8b5cf6"/>
        </svg>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          PokerWizard
        </div>
        <div style={{ fontSize: 9, color: 'rgba(168, 123, 250, 0.7)', fontWeight: 500, letterSpacing: '0.5px' }}>
          AI POKER TRAINER
        </div>
      </div>
    </Link>
  );

  // Variação 2: Chip + Gráfico (Alternativa mais técnica)
  const LogoVariant2 = () => (
    <Link 
      to="/" 
      style={{ 
        textDecoration: 'none', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        cursor: 'pointer', 
        transition: 'all 0.3s ease' 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.6))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'none';
      }}
    >
      {/* Ícone: Chip com gráfico interno */}
      <div style={{
        width: 42,
        height: 42,
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
        position: 'relative',
        border: '3px solid rgba(255, 255, 255, 0.2)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gráfico de linha ascendente minimalista */}
          <path d="M3 17L8 12L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="21" cy="7" r="2" fill="#10b981"/>
        </svg>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          PokerWizard
        </div>
        <div style={{ fontSize: 9, color: 'rgba(99, 102, 241, 0.7)', fontWeight: 500, letterSpacing: '0.5px' }}>
          GTO ANALYTICS
        </div>
      </div>
    </Link>
  );

  return variant === 'compact' ? <LogoVariant2 /> : <LogoVariant1 />;
}
