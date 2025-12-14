import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  // Detectar ambiente automaticamente
  function getApiBase(): string {
    if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) {
      return (import.meta as any).env.VITE_API_BASE;
    }
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      return 'https://pokerwizard.onrender.com';
    }
    return 'http://localhost:3000';
  }
  const API_BASE = getApiBase();
  
  const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devCode, setDevCode] = useState('');
  const navigate = useNavigate();

  // ETAPA 1: Solicitar código de recuperação
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDevCode('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao solicitar recuperação de senha');
      }

      // Se recebeu código diretamente (modo desenvolvimento)
      if (data.devCode) {
        setDevCode(data.devCode);
        setCode(data.devCode); // Auto-preenche
        setSuccess('⚠️ Modo de desenvolvimento: Código gerado diretamente (email não configurado)');
        setTimeout(() => {
          setStep('code');
        }, 1500);
      } else {
        setSuccess('Código de recuperação enviado para seu email! Verifique sua caixa de entrada.');
        setTimeout(() => {
          setStep('code');
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 2: Verificar código
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido ou expirado');
      }

      setSuccess('Código verificado! Agora defina sua nova senha.');
      setTimeout(() => {
        setStep('newPassword');
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 3: Redefinir senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha');
      }

      setSuccess('✅ Senha redefinida com sucesso! Redirecionando para login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
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
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px',
            }}
          >
            🔐 Recuperar Senha
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {step === 'email' && 'Digite seu email para receber o código de recuperação'}
            {step === 'code' && 'Digite o código de 6 dígitos enviado para seu email'}
            {step === 'newPassword' && 'Defina sua nova senha'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '20px',
              color: '#86efac',
              fontSize: '14px',
            }}
          >
            {success}
          </div>
        )}

        {/* ETAPA 1: Solicitar código */}
        {step === 'email' && (
          <form onSubmit={handleRequestCode}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
                placeholder="seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? 'rgba(102, 126, 234, 0.5)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        )}

        {/* ETAPA 2: Verificar código */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                Código de Verificação
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: 700,
                  outline: 'none',
                }}
                placeholder="000000"
              />
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px' }}>
                Código enviado para: {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                background:
                  loading || code.length !== 6
                    ? 'rgba(102, 126, 234, 0.5)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ← Voltar
            </button>
          </form>
        )}

        {/* ETAPA 3: Nova senha */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 50px 12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                Confirmar Nova Senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
                placeholder="Digite a senha novamente"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? 'rgba(102, 126, 234, 0.5)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Lembrou sua senha?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{
              color: '#667eea',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Fazer Login
          </span>
        </div>
      </div>
    </div>
  );
}
