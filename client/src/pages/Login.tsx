import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useAuth();

  // LOGIN / REGISTRO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await auth.login(email, password);
      } else {
        // Validações básicas
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        if (!name.trim()) {
          throw new Error('Por favor, informe seu nome');
        }
        
        await auth.register(email, name.trim(), password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>♠️♣️♦️♥️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>PokerWizard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {isLogin ? 'Acesse sua conta' : 'Crie uma nova conta'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 12, color: 'var(--accent-red)' }}>{error}</div>
        )}

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {!isLogin && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-muted)'
                }}
              >
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="search-input"
                style={{ padding: '12px 14px' }}
                required
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-muted)'
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="search-input"
              style={{ padding: '12px 14px' }}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-muted)'
              }}
            >
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="search-input"
              style={{ padding: '12px 14px' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {loading ? '⏳ Processando...' : isLogin ? '🔓 Entrar' : '✅ Criar Conta'}
          </button>
        </form>

        {/* Alternar Login ↔ Registro */}
        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 14
          }}
        >
          {isLogin ? (
            <p>
              Não tem conta?{' '}
              <span
                style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsLogin(false)}
              >
                Criar conta
              </span>
            </p>
          ) : (
            <p>
              Já possui conta?{' '}
              <span
                style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsLogin(true)}
              >
                Entrar
              </span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
