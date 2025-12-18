/**
 * GoogleSuccess - Página de callback do login com Google
 * Lê o token da URL, salva no localStorage e redireciona para home
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("GoogleSuccess montou");

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    console.log("Token recebido:", token ? "sim" : "não");

    if (token) {
      // Salvar token no localStorage
      localStorage.setItem('pokerwizard_token', token);
      
      // Buscar dados do usuário
      const apiBase = window.location.hostname.includes('localhost')
        ? 'http://localhost:3000'
        : 'https://pokerwizard.onrender.com';
        
      fetch(apiBase + '/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          console.log("Dados do usuário:", data);
          if (data.user) {
            localStorage.setItem('pokerwizard_user', JSON.stringify(data.user));
          }
          // Redirecionar para home
          window.location.href = '/';
        })
        .catch((err) => {
          console.error("Erro ao buscar usuário:", err);
          // Mesmo com erro, redireciona
          window.location.href = '/';
        });
    } else {
      // Sem token, volta pro login
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      color: '#fff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
        <h2>Finalizando login...</h2>
        <p style={{ color: '#94a3b8' }}>Aguarde um momento</p>
      </div>
    </div>
  );
}
