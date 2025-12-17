import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isDisposableEmail } from '../utils/deviceFingerprint';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // Email ou Username
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // Para registro
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  // Validação de e-mail em tempo real (só no registro)
  const handleEmailChange = (value: string) => {
    setIdentifier(value);
    setEmailError('');
    
    if (!isLogin && value) {
      if (!isValidEmail(value)) {
        setEmailError('E-mail inválido');
      } else if (isDisposableEmail(value)) {
        setEmailError('E-mails temporários não são permitidos');
      }
    }
  };

  // LOGIN / REGISTRO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login aceita email ou username
        await auth.login(identifier, password);
      } else {
        // Registro precisa de email válido
        if (!isValidEmail(identifier)) {
          throw new Error('Por favor, use um e-mail válido');
        }
        if (isDisposableEmail(identifier)) {
          throw new Error('E-mails temporários não são permitidos. Use um e-mail permanente.');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        if (!name.trim()) {
          throw new Error('Por favor, informe seu nome');
        }
        
        await auth.register(identifier, name.trim(), password, username.trim() || undefined);
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
        padding: 20,
        overflowY: 'auto'
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>♠️♣️♦️♥️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>PokerWizard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>AI Poker Trainer by Pokio</p>
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

          {/* Campo de username só no registro */}
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
                Nome de Usuário <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="seu_usuario"
                className="search-input"
                style={{ padding: '12px 14px' }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Usado para login. Apenas letras, números e _
              </p>
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
              {isLogin ? 'E-mail ou Usuário' : 'E-mail'}
            </label>
            <input
              type={isLogin ? 'text' : 'email'}
              value={identifier}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={isLogin ? 'email@exemplo.com ou usuario' : 'seu@email.com'}
              className="search-input"
              style={{ 
                padding: '12px 14px',
                borderColor: emailError ? '#ef4444' : undefined
              }}
              required
            />
            {emailError && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {emailError}
              </div>
            )}
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="search-input"
                style={{ padding: '12px 14px', paddingRight: 48 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                  color: 'var(--text-muted)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
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

        {/* Divisor */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          gap: 12
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(168, 85, 247, 0.2)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
            {isLogin ? 'ou entre com' : 'ou cadastre-se com'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(168, 85, 247, 0.2)' }} />
        </div>

        {/* Botão Login com Google */}
        <button
          type="button"
          onClick={() => {
            // Redirecionar para o endpoint de Google OAuth do backend
            const apiBase = window.location.hostname.includes('localhost')
              ? 'http://localhost:3000'
              : 'https://pokerwizard.onrender.com';
            window.location.href = `${apiBase}/api/auth/google`;
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.95))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 12,
            color: '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
          }}
        >
          {/* Google Logo SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

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
