import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Rankings from './pages/Rankings';
import Features from './pages/Features';
import Trainer from './pages/TrainerNew';
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
      <header className="app-header">
        <div className="brand"><span className="dot" />PokerWizard</div>
        <nav className="app-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/rankings" className="nav-link">Rankings</Link>
          <Link to="/analysis" className="nav-link">Análise</Link>
          <Link to="/trainer" className="nav-link">🧪 Training Lab</Link>
          <Link to="/solutions" className="nav-link">🎯 GTO Solutions</Link>
          <Link to="/features" className="nav-link">Funcionalidades</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {auth.user ? (
              <>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500 }}>👤 {auth.user.name}</span>
                </Link>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  💎 {(auth.user as any)?.usosRestantes === -1 || (auth.user as any)?.usosRestantes === null ? 'Ilimitado' : ((auth.user as any)?.usosRestantes ?? auth.user.credits)} usos
                </div>
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
  return (
    <div style={{ paddingTop: 20 }}>
      {/* Hero Section */}
      <div style={{ marginBottom: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>♠️♣️♦️♥️</div>
        <h1 style={{ fontSize: 48, marginBottom: 16, fontWeight: 900 }}>
          PokerWizard PRO
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8, maxWidth: 600, margin: '0 auto 24px' }}>
          A plataforma analítica mais poderosa para jogadores de poker. Rastreie resultados, analise estatísticas e domine o jogo.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <Link to="/search" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 16 }}>
              🔍 Buscar Jogadores
            </button>
          </Link>
          <Link to="/rankings" style={{ textDecoration: 'none' }}>
            <button className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>
              🏆 Ver Rankings
            </button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ marginBottom: 60 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 40, fontSize: 32, fontWeight: 700 }}>
          Por que escolher PokerWizard?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Feature 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Análise Profunda</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Estatísticas detalhadas de ROI, Win Rate, VPIP, PFR e muito mais. Entenda seu desempenho com precisão.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Rastreamento de Resultados</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Registre todos os seus torneios e cash games. Acompanhe tendências de lucro ao longo do tempo.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Rankings Globais</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Veja como você se compara com outros jogadores. Suba na classificação e ganhe reconhecimento.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>3 Testes Gratuitos</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Teste a plataforma sem custo. Depois, apenas R$1 por teste com acesso completo ao banco de dados.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Seguro e Privado</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Seus dados estão protegidos. Controle total sobre quem vê seu perfil e estatísticas.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Rápido & Confiável</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Busca de jogadores instantânea. Interface responsiva otimizada para todos os dispositivos.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="card" style={{ marginBottom: 60, background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(6, 182, 212, 0.1))' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, padding: '40px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 8, fontFamily: 'Space Mono' }}>
              8+
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Jogadores Ativos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-secondary)', marginBottom: 8, fontFamily: 'Space Mono' }}>
              2K+
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Resultados Registrados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-green)', marginBottom: 8, fontFamily: 'Space Mono' }}>
              R$50K+
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Lucro Rastreado</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
          Pronto para começar?
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
          Explore agora e descubra como você pode melhorar seu jogo com análises poderosas.
        </p>
        <Link to="/search" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
            🚀 Explorar Agora
          </button>
        </Link>
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 40, color: 'var(--text-muted)', fontSize: 13 }}>
        <p style={{ marginBottom: 8 }}>PokerWizard © 2025 - Todos os direitos reservados</p>
        <p>Construído para jogadores profissionais que querem dominar o jogo.</p>
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
            <Route path="/trainer" element={<Trainer />} />
            <Route path="/features" element={<Features />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/profile" element={<Profile />} />
          
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
