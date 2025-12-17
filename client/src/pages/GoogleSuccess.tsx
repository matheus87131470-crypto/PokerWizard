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
  const [debugInfo, setDebugInfo] = useState('Iniciando...');

  useEffect(() => {
    const processGoogleLogin = async () => {
      const token = searchParams.get('token');
      
      setDebugInfo(`Token: ${token ? 'Recebido (' + token.substring(0, 20) + '...)' : 'NÃO RECEBIDO'}`);
      
      if (!token) {
        setStatus('error');
        setErrorMsg('Token não recebido do Google');
        return;
      }

      try {
        setDebugInfo('Salvando token e buscando usuário...');
        await auth.loginWithToken(token);
        setDebugInfo('Login realizado com sucesso!');
        setStatus('success');
        
        // Redirecionar para home após 2s
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err: any) {
        console.error('GoogleSuccess: Erro:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Erro ao processar login com Google');
        setDebugInfo(`Erro: ${err.message}`);
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div style={{ 
        maxWidth: 420, 
        width: '100%', 
        textAlign: 'center',
        padding: 40,
        background: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 16,
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>
              ⏳
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
              Conectando com Google...
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
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
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
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
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{ 
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voltar ao Login
            </button>
          </>
        )}

        {/* Debug info */}
        <p style={{ 
          marginTop: 24, 
          fontSize: 11, 
          color: '#64748b',
          fontFamily: 'monospace',
        }}>
          {debugInfo}
        </p>
      </div>
    </div>
  );
}
