import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Rankings from './pages/Rankings';
import Features from './pages/Features';
import Analysis from './pages/Analysis';
import Login from './pages/Login';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Solutions from './pages/Solutions';
import ForgotPassword from './pages/ForgotPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

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
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/rankings" className="nav-link">Rankings</Link>
          <Link to="/analysis" className="nav-link">Análise</Link>
          <Link to="/solutions" className="nav-link">Análise de Mãos</Link>
          <Link to="/features" className="nav-link">Funcionalidades</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {auth.user ? (
              <>
                {/* User badge premium */}
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
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 10,
                      background: (auth.user as any)?.usosRestantes === -1 || (auth.user as any)?.usosRestantes === null
                        ? 'linear-gradient(135deg, #10b981, #34d399)'
                        : 'linear-gradient(135deg, #0ea5e9, #60a5fa)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.3px',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    }}>
                      <span>💎</span>
                      {(auth.user as any)?.usosRestantes === -1 || (auth.user as any)?.usosRestantes === null ? 'Ilimitado' : ((auth.user as any)?.usosRestantes ?? auth.user.credits)}
                      <span style={{ opacity: 0.9 }}>usos</span>
                    </span>
                  </div>
                </Link>
                {!auth.user.premium && (((auth.user as any).usosRestantes === undefined) ? (typeof auth.user.credits === 'number' && auth.user.credits <= 0) : ((auth.user as any).usosRestantes <= 0 && (auth.user as any).usosRestantes !== -1)) && (
                  <button onClick={() => navigate('/premium')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', border: 'none' }}>
                    ⚡ Upgrade
                  </button>
                )}
                <button onClick={() => navigate('/premium')} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
                  💳 Planos
                </button>
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
    <div style={{ paddingTop: 20 }}>
      {/* Welcome Banner para usuários não logados */}
      {!auth.user && (
        <div style={{
          marginBottom: 40,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          borderRadius: 20,
          padding: '32px 40px',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h60v60H0z" fill="none"/%3E%3Cpath d="M30 0v60M0 30h60" stroke="rgba(255,255,255,0.1)" stroke-width="1"/%3E%3C/svg%3E")',
            opacity: 0.3,
          }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>
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

      {/* Hero Section - Orientado a Ação */}
      <div style={{ 
        marginBottom: 60, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        borderRadius: 24,
        padding: '60px 24px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🎯</div>
        <h1 style={{ fontSize: 42, marginBottom: 12, fontWeight: 900, lineHeight: 1.2 }}>
          PokerWizard
          <span style={{ 
            display: 'block',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginTop: 8
          }}>
            AI Poker Trainer by Pokio
          </span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Receba feedback imediato, descubra leaks ocultos e evolua seu jogo em minutos — não em meses.
        </p>
        
        {/* CTA Principal */}
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 16,
          padding: '20px 24px',
          maxWidth: 500,
          margin: '0 auto 24px'
        }}>
          <p style={{ fontSize: 14, color: '#10b981', fontWeight: 600, marginBottom: 12 }}>
            🎯 COMECE POR AQUI
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Analise suas mãos de poker com IA em menos de 1 minuto.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/solutions')}
              className="btn btn-success" 
              style={{ padding: '14px 24px', fontSize: 15, fontWeight: 700 }}
            >
              📊 Analisar Mão Agora
            </button>
            <button 
              onClick={() => navigate('/rankings')}
              className="btn btn-ghost" 
              style={{ padding: '14px 24px', fontSize: 15 }}
            >
              🏆 Ver Rankings
            </button>
          </div>
        </div>
        
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          ✓ 5 análises grátis • ✓ Sem cartão de crédito • ✓ Resultado imediato
        </p>
      </div>

      {/* Feature Principal Destacada */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 20,
          padding: 32,
          border: '2px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Badge Destaque */}
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: 'white'
          }}>
            ⭐ MAIS USADO
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: 'white' }}>
                Análise de Mãos com IA
              </h2>
              <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
                <strong style={{ color: '#10b981' }}>Análise completa e profissional</strong> das suas mãos. A IA avalia ranges, equity e sugere as melhores jogadas baseadas em GTO.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {['Análise GTO completa', 'Cálculo de equity e ranges', 'Feedback detalhado e acionável'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: '#cbd5e1', fontSize: 14 }}>
                    <span style={{ color: '#10b981' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/solutions')}
                className="btn btn-primary" 
                style={{ padding: '16px 32px', fontSize: 16, fontWeight: 700 }}
              >
                Analisar Mão Agora →
              </button>
            </div>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              borderRadius: 16, 
              padding: 24,
              border: '1px solid rgba(139, 92, 246, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎯</div>
              <p style={{ color: '#a78bfa', fontSize: 14, fontWeight: 600 }}>Análise GTO profissional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Secundárias */}
      <div style={{ marginBottom: 60 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 12, fontSize: 28, fontWeight: 700 }}>
          Ferramentas para evoluir seu jogo
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text-secondary)', fontSize: 15 }}>
          Cada ferramenta foi projetada para resolver um problema específico do seu jogo.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Card 1 - Análise de Mãos */}
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 24,
            minHeight: 280,
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>📊</div>
                <span style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#10b981', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 600 
                }}>
                  GRATUITO
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Análise de Mãos</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Cole sua mão e receba análise instantânea. Descubra se você jogou certo ou errado.
              </p>
            </div>
            <button 
              onClick={() => navigate('/solutions')}
              className="btn btn-ghost" 
              style={{ width: '100%', padding: '12px' }}
            >
              Testar Agora →
            </button>
          </div>

          {/* Card 2 - Rankings */}
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 24,
            minHeight: 280,
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>🏆</div>
                <span style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#10b981', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 600 
                }}>
                  GRATUITO
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Rankings Globais</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Veja como você se compara aos melhores. Acompanhe sua evolução no ranking.
              </p>
            </div>
            <button 
              onClick={() => navigate('/rankings')}
              className="btn btn-ghost" 
              style={{ width: '100%', padding: '12px' }}
            >
              Ver Rankings →
            </button>
          </div>

          {/* Card 3 - Premium */}
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 24,
            minHeight: 280,
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>👑</div>
                <span style={{ 
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                  color: '#000', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 700 
                }}>
                  PREMIUM
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Acesso Ilimitado</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                Treinos ilimitados, análise avançada da IA e relatórios completos de evolução.
              </p>
              <p style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>
                R$ 5,90/mês • Cancele quando quiser
              </p>
            </div>
            <button 
              onClick={() => navigate('/premium')}
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '12px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#000',
                fontWeight: 700
              }}
            >
              Assinar Premium →
            </button>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="card" style={{ 
        marginBottom: 60, 
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(6, 182, 212, 0.08))',
        textAlign: 'center',
        padding: '48px 24px'
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 32 }}>
          Jogadores que já evoluíram com PokerWizard
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 32 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 4 }}>
              500+
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Treinos Gerados</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-green)', marginBottom: 4 }}>
              89%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Satisfação</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-secondary)', marginBottom: 4 }}>
              24/7
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Disponível</div>
          </div>
        </div>
      </div>

      {/* CTA Final - Conversão */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 60,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 20,
        padding: '48px 24px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          🔥 Pronto para evoluir seu jogo?
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 450, margin: '0 auto 28px' }}>
          Analise suas mãos com IA e receba feedback profissional. É grátis.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/solutions')}
            className="btn btn-success" 
            style={{ padding: '16px 32px', fontSize: 16, fontWeight: 700 }}
          >
            📊 Analisar Mão Agora
          </button>
          <button 
            onClick={() => navigate('/rankings')}
            className="btn btn-primary" 
            style={{ padding: '16px 32px', fontSize: 16 }}
          >
            🏆 Ver Rankings
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 32, paddingBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>PokerWizard — AI Poker Trainer</p>
        <p style={{ marginBottom: 12 }}>Construído para jogadores que querem resultados reais.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12 }}>
          <span>© 2025</span>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Powered by Pokio</span>
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
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/features" element={<Features />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/profile" element={<Profile />} />
          
          </Routes>
        </Layout>
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
  );
}
