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
        padding: 20
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        
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
