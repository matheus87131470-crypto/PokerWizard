/**
 * GoogleSuccess - Página de callback do login com Google
 * 
 * Recebe o token via query string e faz o login automático
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function GoogleSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processGoogleLogin = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setErrorMsg('Token não recebido do Google');
        return;
      }

      try {
        // Salvar o token e buscar dados do usuário
        await auth.loginWithToken(token);
        setStatus('success');
        
        // Redirecionar para home após 1.5s
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Erro ao processar login com Google');
      }
    };

    processGoogleLogin();
  }, [searchParams, auth, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="card" style={{ 
        maxWidth: 420, 
        width: '100%', 
        textAlign: 'center',
        padding: 40,
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20, animation: 'pulse 1.5s infinite' }}>
              🔄
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              Conectando com Google...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Aguarde enquanto processamos seu login
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>
              ✅
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#22c55e' }}>
              Login realizado!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Redirecionando para a página inicial...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>
              ❌
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#ef4444' }}>
              Erro no login
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Voltar ao Login
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
