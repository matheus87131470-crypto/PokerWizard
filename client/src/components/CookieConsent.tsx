import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verifica se já aceitou os cookies
    const consent = localStorage.getItem('pokerwizard_cookie_consent');
    if (!consent) {
      // Pequeno delay para não aparecer imediatamente
      setTimeout(() => setShowBanner(true), 1500);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('pokerwizard_cookie_consent', 'all');
    localStorage.setItem('pokerwizard_cookie_date', new Date().toISOString());
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('pokerwizard_cookie_consent', 'necessary');
    localStorage.setItem('pokerwizard_cookie_date', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 1) 100%)',
      borderTop: '1px solid rgba(139, 92, 246, 0.3)',
      padding: '20px 24px',
      zIndex: 9999,
      boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        {/* Texto */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 15, 
            fontWeight: 700,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            🍪 Valorizamos sua privacidade
          </h4>
          <p style={{ 
            margin: 0, 
            fontSize: 13, 
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            Se você 'Aceitar todos os Cookies', você concorda com o uso de cookies e tecnologias semelhantes 
            para nos ajudar a melhorar sua experiência, análise e marketing.{' '}
            <a 
              href="/privacy" 
              style={{ 
                color: '#a78bfa', 
                textDecoration: 'underline',
                fontWeight: 500,
              }}
            >
              Política de Privacidade
            </a>
          </p>
        </div>

        {/* Botões */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <button
            onClick={acceptNecessary}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            Apenas Necessários
          </button>
          
          <button
            onClick={acceptAll}
            style={{
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
            }}
          >
            ✓ Aceitar Todos os Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
