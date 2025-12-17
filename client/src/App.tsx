import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Features from './pages/Features';
import Analysis from './pages/Analysis';
import Analyze from './pages/Analyze';
import Ranges from './pages/Ranges';
import PlayerAnalysis from './pages/PlayerAnalysis';
import Login from './pages/Login';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Solutions from './pages/Solutions';
import ForgotPassword from './pages/ForgotPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Trainer from './pages/Trainer';
import GoogleSuccess from './pages/GoogleSuccess';
import CookieConsent from './components/CookieConsent';
import CreditCounter from './components/CreditCounter';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePaywall } from './hooks/usePaywall';

function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  
  // Hook para obter créditos do usuário (freeCredits global)
  const { freeCredits, freeCreditsLimit, isPremium, refreshUsage } = usePaywall(auth.token);
  
  // Atualizar créditos quando usuário mudar
  useEffect(() => {
    if (auth.token) {
      refreshUsage();
    }
  }, [auth.token, refreshUsage]);

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div>
      <header className="app-header" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 80px rgba(139, 92, 246, 0.1)',
        padding: '18px 40px',
      }}>
        {/* Logo Premium Ultra Profissional */}
        <Link to="/" style={{ 
          textDecoration: 'none', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 14, 
          cursor: 'pointer', 
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '8px 16px',
          borderRadius: '12px',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
            e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.3)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
            e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Ícone Premium: Chip + AI Spark */}
          <div style={{
            position: 'relative',
            width: 46,
            height: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Anel externo girante */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#8b5cf6',
              borderRightColor: '#ec4899',
              opacity: 0.4,
              animation: 'spin 3s linear infinite',
            }}></div>
            
            {/* Chip principal */}
            <div style={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
            }}>
              {/* Símbolo AI + Spade */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15 9L22 9L16 14L19 21L12 16L5 21L8 14L2 9L9 9L12 2Z" fill="white" fillOpacity="0.95"/>
                <circle cx="12" cy="12" r="2" fill="#8b5cf6"/>
              </svg>
            </div>
          </div>
          
          {/* Texto Premium */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 140 }}>
            <div style={{
              fontSize: 20,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #e9d5ff 0%, #f5d0fe 50%, #fae8ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.3px',
              lineHeight: 1,
              textShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
            }}>
              PokerWizard
            </div>
            <div style={{ 
              fontSize: 10, 
              color: 'rgba(168, 123, 250, 0.8)', 
              fontWeight: 600, 
              letterSpacing: '1.2px',
              marginTop: 4,
              textTransform: 'uppercase',
            }}>
              AI Poker Pro
            </div>
          </div>
        </Link>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <nav className="app-nav">
          {/* Navegação Principal - Modelo GTO Wizard */}
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
          <NavLink to="/trainer" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🎯 Practice</NavLink>
          <NavLink to="/analyze" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🔍 Analyze</NavLink>
          <NavLink to="/ranges" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📊 Ranges</NavLink>
          <NavLink 
            to="/player-analysis" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{ position: 'relative' }}
          >
            🔍 Análise de Jogadores
            <span style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              color: 'white',
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 10,
              fontWeight: 700
            }}>
              EM BREVE
            </span>
          </NavLink>
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {auth.user ? (
              <>
                {/* Contador de créditos global */}
                <CreditCounter
                  freeCredits={freeCredits}
                  freeCreditsLimit={freeCreditsLimit}
                  isPremium={isPremium}
                />
                
                {/* User badge */}
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.12))',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.18)',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 14, color: '#e9d5ff', fontWeight: 700 }}>👤 {auth.user.name}</span>
                  </div>
                </Link>
                {/* Botão Assina Premium quando zerou */}
                {!isPremium && freeCredits <= 0 && (
                    <button 
                      onClick={() => navigate('/premium')} 
                      style={{ 
                        padding: '10px 20px', 
                        fontSize: 13, 
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        border: 'none',
                        borderRadius: 10,
                        color: '#000',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
                        transition: 'all 0.2s',
                      }}
                    >
                      👑 Assinar Premium
                    </button>
                )}
                <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
                  Sair
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => navigate('/premium')} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
                  💳 Planos
                </button>
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13, background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', border: 'none' }}>
                  Entrar
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
      <div className="container">{children}</div>

      {/* login route handles sign in */}
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const user = {
        email,
        name: email.split('@')[0]
      };
      localStorage.setItem('user', JSON.stringify(user));
      onSuccess(user);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="search-input"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="search-input"
        required
      />
      <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
        Entrar
      </button>
    </form>
  );
}

function Home() {
  const navigate = useNavigate();
  const auth = useAuth();
  
  return (
    <div style={{ 
      paddingTop: 20,
      position: 'relative',
    }}>
      {/* Background Neon Graph Effect - Inspirado na imagem de referência */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 1200,
        height: 400,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="neonLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="1"/>
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0"/>
            </radialGradient>
          </defs>
          
          {/* Grid Lines */}
          {[...Array(20)].map((_, i) => (
            <line key={`v-${i}`} x1={i * 60} y1="0" x2={i * 60} y2="400" stroke="rgba(168, 85, 247, 0.1)" strokeWidth="1" />
          ))}
          {[...Array(10)].map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 40} x2="1200" y2={i * 40} stroke="rgba(168, 85, 247, 0.1)" strokeWidth="1" />
          ))}
          
          {/* Main Neon Line - Growth Chart */}
          <path 
            d="M 0 350 Q 100 340 200 300 T 400 250 T 600 200 T 800 150 T 1000 80 T 1200 50"
            stroke="url(#neonLineGradient)"
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
            style={{ 
              animation: 'lineGlow 2s ease-in-out infinite',
            }}
          />
          
          {/* Glow Area Under Line */}
          <path 
            d="M 0 350 Q 100 340 200 300 T 400 250 T 600 200 T 800 150 T 1000 80 T 1200 50 L 1200 400 L 0 400 Z"
            fill="url(#neonLineGradient)"
            opacity="0.08"
          />
          
          {/* Data Points */}
          {[[200, 300], [400, 250], [600, 200], [800, 150], [1000, 80]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="12" fill="url(#pointGlow)" opacity="0.5" />
              <circle cx={x} cy={y} r="6" fill="#f472b6" filter="url(#glow)" />
              <circle cx={x} cy={y} r="3" fill="white" />
            </g>
          ))}
        </svg>
      </div>
      
      {/* Welcome Banner para usuários não logados */}
      {!auth.user && (
        <div style={{
          marginBottom: 40,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
          borderRadius: 20,
          padding: '32px 40px',
          boxShadow: '0 8px 40px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.2)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
        }}>
          {/* Animated Grid Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            animation: 'gridMove 15s linear infinite',
          }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12, textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
              👋 Bem-vindo ao PokerWizard
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
              Plataforma profissional de análise de poker com IA. Comece agora gratuitamente.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  padding: '14px 32px',
                  background: 'white',
                  color: '#8b5cf6',
                  fontWeight: 700,
                  fontSize: 15,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                🚀 Começar Grátis
              </button>
              <button 
                onClick={() => navigate('/solutions')}
                style={{
                  padding: '14px 32px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                📊 Analisar Mão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Futuristic Neon Style */}
      <div className="hero" style={{ 
        marginBottom: 60, 
        textAlign: 'center',
        background: 'linear-gradient(145deg, rgba(10, 15, 36, 0.95) 0%, rgba(5, 8, 22, 0.9) 100%)',
        borderRadius: 24,
        padding: '60px 24px',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(168, 85, 247, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        {/* Decorative Glow Orbs */}
        <div style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        
        <div style={{ fontSize: 56, marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))' }}>🎯</div>
        <h1 style={{ 
          fontSize: 42, 
          marginBottom: 12, 
          fontWeight: 900, 
          lineHeight: 1.2,
          background: 'linear-gradient(135deg, #f8fafc 0%, #c084fc 50%, #f472b6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
        }}>
          PokerWizard
          <span style={{ 
            display: 'block',
            fontSize: 24,
            fontWeight: 600,
            background: 'linear-gradient(90deg, #c084fc, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: 8
          }}>
            AI Poker Trainer by Pokio
          </span>
        </h1>
        <p style={{ fontSize: 18, color: '#c4b5fd', maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Receba feedback imediato, descubra leaks ocultos e evolua seu jogo em minutos — não em meses.
        </p>
        
        {/* CTA Principal - Neon Style */}
        <div style={{ 
          background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))', 
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 16,
          padding: '20px 24px',
          maxWidth: 500,
          margin: '0 auto 24px',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(16, 185, 129, 0.2)',
        }}>
          <p style={{ fontSize: 14, color: '#10b981', fontWeight: 600, marginBottom: 12, textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
            🎯 COMECE POR AQUI
          </p>
          <p style={{ fontSize: 15, color: '#c4b5fd', marginBottom: 16 }}>
            Analise suas mãos de poker com IA em menos de 1 minuto.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/trainer')}
              className="btn btn-success" 
              style={{ padding: '14px 24px', fontSize: 15, fontWeight: 700 }}
            >
              🎯 Começar a Treinar
            </button>
            <button 
              onClick={() => navigate('/analyze')}
              className="btn btn-ghost" 
              style={{ padding: '14px 24px', fontSize: 15 }}
            >
              🔍 Analisar Mão
            </button>
          </div>
        </div>
        
        <p style={{ fontSize: 13, color: '#a78bfa' }}>
          ✓ 5 análises grátis • ✓ Sem cartão de crédito • ✓ Resultado imediato
        </p>

        {/* Contador de Créditos Grátis - apenas para usuários logados não premium */}
        {auth.user && !auth.user.premium && (
          <div style={{
            marginTop: 24,
            padding: '16px 24px',
            background: (() => {
              const totalUsosRestantes = ((auth.user as any)?.usosTrainer ?? 0) + 
                                         ((auth.user as any)?.usosAnalise ?? 0) + 
                                         ((auth.user as any)?.usosJogadores ?? 0);
              return totalUsosRestantes > 0 
                ? 'rgba(139, 92, 246, 0.1)' 
                : 'rgba(251, 191, 36, 0.1)';
            })(),
            border: (() => {
              const totalUsosRestantes = ((auth.user as any)?.usosTrainer ?? 0) + 
                                         ((auth.user as any)?.usosAnalise ?? 0) + 
                                         ((auth.user as any)?.usosJogadores ?? 0);
              return totalUsosRestantes > 0 
                ? '1px solid rgba(139, 92, 246, 0.3)' 
                : '1px solid rgba(251, 191, 36, 0.4)';
            })(),
            borderRadius: 12,
            display: 'inline-block',
          }}>
            {(() => {
              const usosTrainer = (auth.user as any)?.usosTrainer ?? 0;
              const usosAnalise = (auth.user as any)?.usosAnalise ?? 0;
              const usosJogadores = (auth.user as any)?.usosJogadores ?? 0;
              const totalUsosRestantes = usosTrainer + usosAnalise + usosJogadores;
              
              if (totalUsosRestantes > 0) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, color: '#a78bfa', fontWeight: 600 }}>
                      🎯 Créditos grátis restantes:
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Trainer: <strong style={{ color: '#a78bfa' }}>{usosTrainer}/5</strong>
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Análise: <strong style={{ color: '#22d3ee' }}>{usosAnalise}/5</strong>
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Jogadores: <strong style={{ color: '#34d399' }}>{usosJogadores}/5</strong>
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, color: '#fbbf24', fontWeight: 600 }}>
                      🚫 Créditos grátis esgotados
                    </span>
                    <button
                      onClick={() => navigate('/premium')}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      👑 Ver Planos
                    </button>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Badge Premium para usuários premium */}
        {auth.user && auth.user.premium && (
          <div style={{
            marginTop: 24,
            padding: '12px 24px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 12,
            display: 'inline-block',
          }}>
            <span style={{ fontSize: 14, color: '#10b981', fontWeight: 700 }}>
              ♾️ PREMIUM ATIVO — Uso ilimitado de todas as ferramentas
            </span>
          </div>
        )}
      </div>

      {/* Feature Principal Destacada - Futuristic Neon */}
      <div style={{ marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(10, 15, 36, 0.98) 0%, rgba(5, 8, 22, 0.95) 100%)',
          borderRadius: 20,
          padding: 32,
          border: '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.15), 0 0 100px rgba(236, 72, 153, 0.08), inset 0 1px 0 rgba(168, 85, 247, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Corner Glows */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          
          {/* Badge Destaque - Neon Style */}
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'linear-gradient(135deg, #c084fc, #a855f7)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
            zIndex: 2,
          }}>
            ⭐ MAIS USADO
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))' }}>🎯</div>
              <h2 style={{ 
                fontSize: 28, 
                fontWeight: 800, 
                marginBottom: 12, 
                background: 'linear-gradient(135deg, #f8fafc, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Trainer GTO Premium
              </h2>
              <p style={{ fontSize: 16, color: '#c4b5fd', lineHeight: 1.7, marginBottom: 20 }}>
                <strong style={{ color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}>Treine como os profissionais.</strong> Pratique situações reais de poker com feedback instantâneo baseado em ranges GTO.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {['Ranges GTO por posição', 'Feedback visual instantâneo', 'Gráfico de evolução em tempo real'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: '#c4b5fd', fontSize: 14 }}>
                    <span style={{ color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/trainer')}
                className="btn btn-primary" 
                style={{ padding: '16px 32px', fontSize: 16, fontWeight: 700 }}
              >
                Começar Treino →
              </button>
            </div>
            <div style={{ 
              background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.08))', 
              borderRadius: 16, 
              padding: 24,
              border: '1px solid rgba(168, 85, 247, 0.3)',
              textAlign: 'center',
              boxShadow: 'inset 0 0 30px rgba(168, 85, 247, 0.1)',
            }}>
              <div style={{ fontSize: 64, marginBottom: 12, filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.5))' }}>🃏</div>
              <p style={{ color: '#c084fc', fontSize: 14, fontWeight: 600 }}>Treinamento GTO profissional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Secundárias - Neon Cards */}
      <div style={{ marginBottom: 60, position: 'relative', zIndex: 1 }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: 12, 
          fontSize: 28, 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f8fafc, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Ferramentas para evoluir seu jogo
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 32, color: '#c4b5fd', fontSize: 15 }}>
          Cada ferramenta foi projetada para resolver um problema específico do seu jogo.
        </p>
        
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Card 1 - Practice (Trainer) - Neon Purple */}
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 24,
            minHeight: 280,
            justifyContent: 'space-between',
            background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.12), rgba(10, 15, 36, 0.95))',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(168, 85, 247, 0.2)',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}>🎯</div>
                <span style={{ 
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)', 
                  color: '#fff', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 700,
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
                }}>
                  PRACTICE
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Practice</h3>
              <p style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6, marginBottom: 16 }}>
                Treine decisões pré-flop com cenários GTO. Tome decisões e receba feedback instantâneo.
              </p>
            </div>
            <button 
              onClick={() => navigate('/trainer')}
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '12px',
                background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
              }}
            >
              Treinar Agora →
            </button>
          </div>

          {/* Card 2 - Analyze - Neon Pink */}
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 24,
            minHeight: 280,
            justifyContent: 'space-between',
            background: 'linear-gradient(145deg, rgba(236, 72, 153, 0.12), rgba(10, 15, 36, 0.95))',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            boxShadow: '0 0 40px rgba(236, 72, 153, 0.1), inset 0 1px 0 rgba(236, 72, 153, 0.2)',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))' }}>🔍</div>
                <span style={{ 
                  background: 'linear-gradient(135deg, #ec4899, #f472b6)', 
                  color: '#fff', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 700,
                  boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)',
                }}>
                  ANALYZE
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Analyze</h3>
              <p style={{ fontSize: 14, color: '#f9a8d4', lineHeight: 1.6, marginBottom: 16 }}>
                Cole o histórico de uma mão e receba análise GTO completa com IA.
              </p>
            </div>
            <button 
              onClick={() => navigate('/analyze')}
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '12px',
                background: 'linear-gradient(135deg, #ec4899, #f472b6)',
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)',
              }}
            >
              Analisar Mão →
            </button>
          </div>

          {/* Card 3 - Ranges - Neon Cyan/Green */}
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 24,
            minHeight: 280,
            justifyContent: 'space-between',
            background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(10, 15, 36, 0.95))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(16, 185, 129, 0.2)',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' }}>📊</div>
                <span style={{ 
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)', 
                  color: '#fff', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 700,
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                }}>
                  STUDY
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Ranges</h3>
              <p style={{ fontSize: 14, color: '#6ee7b7', lineHeight: 1.6, marginBottom: 16 }}>
                Estude ranges de abertura GTO por posição. Visualize e memorize os ranges corretos.
              </p>
            </div>
            <button 
              onClick={() => navigate('/ranges')}
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '12px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              Estudar Ranges →
            </button>
          </div>

          {/* Card 4 - Análise de Jogadores - EM BREVE - Neon Cyan */}
          <div 
            className="card" 
            onClick={() => navigate('/player-analysis')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 24,
              minHeight: 280,
              justifyContent: 'space-between',
              background: 'linear-gradient(145deg, rgba(6, 182, 212, 0.12), rgba(10, 15, 36, 0.95))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(6, 182, 212, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Badge "Em Breve" no canto - Neon Style */}
            <div style={{
              position: 'absolute',
              top: 16,
              right: -30,
              background: 'linear-gradient(135deg, #06b6d4, #38bdf8)',
              padding: '6px 40px',
              fontSize: 10,
              fontWeight: 700,
              color: 'white',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
            }}>
              EM BREVE
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }}>🔍</div>
                <span style={{ 
                  background: 'rgba(6, 182, 212, 0.2)', 
                  color: '#38bdf8', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 600,
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
                }}>
                  SHARKSCOPE
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Análise de Jogadores</h3>
              <p style={{ fontSize: 14, color: '#7dd3fc', lineHeight: 1.6, marginBottom: 16 }}>
                Descubra os leaks dos seus oponentes. Análise completa de tendências e padrões de jogo.
              </p>
            </div>
            <button 
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '12px',
                background: 'linear-gradient(135deg, #06b6d4, #38bdf8)',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
              }}
            >
              Ver Preview →
            </button>
          </div>
        </div>
      </div>

      {/* Social Proof - Neon Stats */}
      <div className="card" style={{ 
        marginBottom: 60, 
        background: 'linear-gradient(145deg, rgba(10, 15, 36, 0.98), rgba(5, 8, 22, 0.95))',
        textAlign: 'center',
        padding: '48px 24px',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}>
        <h3 style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          marginBottom: 32,
          background: 'linear-gradient(135deg, #f8fafc, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Jogadores que já evoluíram com PokerWizard
        </h3>
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 32 }}>
          <div>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #a855f7, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4,
              textShadow: 'none',
              filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.5))',
            }}>
              500+
            </div>
            <div style={{ color: '#c4b5fd', fontSize: 13 }}>Treinos Gerados</div>
          </div>
          <div>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4,
              filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))',
            }}>
              89%
            </div>
            <div style={{ color: '#6ee7b7', fontSize: 13 }}>Satisfação</div>
          </div>
          <div>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #06b6d4, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4,
              filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.5))',
            }}>
              24/7
            </div>
            <div style={{ color: '#7dd3fc', fontSize: 13 }}>Disponível</div>
          </div>
        </div>
      </div>

      {/* CTA Final - Neon Style */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 60,
        background: 'linear-gradient(145deg, rgba(10, 15, 36, 0.98), rgba(5, 8, 22, 0.95))',
        borderRadius: 20,
        padding: '48px 24px',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.15), 0 0 100px rgba(236, 72, 153, 0.08)',
        position: 'relative',
        zIndex: 1,
      }}>
        <h2 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          marginBottom: 12,
          background: 'linear-gradient(135deg, #f8fafc, #c084fc, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          🔥 Pronto para evoluir seu jogo?
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 450, margin: '0 auto 28px' }}>
          Treine com cenários GTO e análise de mãos com IA. É grátis para começar.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/trainer')}
            className="btn btn-success" 
            style={{ padding: '16px 32px', fontSize: 16, fontWeight: 700 }}
          >
            🎯 Começar a Treinar
          </button>
          <button 
            onClick={() => navigate('/analyze')}
            className="btn btn-primary" 
            style={{ padding: '16px 32px', fontSize: 16 }}
          >
            🔍 Analisar Mão
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 32, paddingBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>PokerWizard — AI Poker Trainer</p>
        <p style={{ marginBottom: 12 }}>Construído para jogadores que querem resultados reais.</p>
        
        {/* Link de doação */}
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          Gostou do PokerWizard? Apoie o projeto{' '}
          <a 
            href="https://mpago.la/2soAEN3" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#c084fc',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(192, 132, 252, 0.15)',
              transition: 'all 0.2s',
            }}
          >
            💜 R$ 0,50
          </a>
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12 }}>
          <span>© 2025</span>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Powered by Pokio</span>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <NavLink to="/privacy" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Privacidade</NavLink>
          <NavLink to="/terms" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Termos</NavLink>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Modelo GTO Wizard - 3 intenções claras */}
            <Route path="/trainer" element={<Trainer />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/ranges" element={<Ranges />} />
            <Route path="/player-analysis" element={<PlayerAnalysis />} />
            {/* Outras páginas */}
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/features" element={<Features />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/google-success" element={<GoogleSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          
          </Routes>
        </Layout>
        <CookieConsent />
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
  );
}
