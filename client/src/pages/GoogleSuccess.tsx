/**
 * GoogleSuccess - Página de callback do login com Google
 * Lê o token da URL, salva no localStorage e redireciona para home
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Salvar token no localStorage
      localStorage.setItem('pokerwizard_token', token);
      
      // Buscar dados do usuário
      fetch(getApiBase() + '/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem('pokerwizard_user', JSON.stringify(data.user));
          }
          // Redirecionar para home
          window.location.href = '/';
        })
        .catch(() => {
          // Mesmo com erro, redireciona (o AuthContext vai tentar de novo)
          window.location.href = '/';
        });
    } else {
      // Sem token, volta pro login
      navigate('/login');
    }
  }, [navigate]);

  // Função para obter a URL base da API
  function getApiBase() {
    if (window.location.hostname.includes('localhost')) {
      return 'http://localhost:3000';
    }
    return 'https://pokerwizard.onrender.com';
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Conectando...
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          Aguarde enquanto processamos seu login
        </p>
      </div>
    </div>
  );
}
