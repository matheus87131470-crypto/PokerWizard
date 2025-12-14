import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Premium() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutos em segundos
  const [pollCount, setPollCount] = useState(0);

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

  // Gera data de expiração (30 minutos a partir de agora)
  function getExpirationTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Timer de contagem regressiva
  useEffect(() => {
    if (!payment || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [payment, timeLeft]);

  // Poll para verificar se pagamento foi confirmado
  useEffect(() => {
    if (!payment) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments/status/${payment.id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${auth.token}` },
        });
        const j = await res.json();
        
        if (j.status === 'confirmed') {
          // Pagamento confirmado!
          try { if (j.user) { localStorage.setItem('pokerwizard_user', JSON.stringify(j.user)); } } catch (e) {}
          setPayment(null);
          alert('✅ Pagamento confirmado! Premium ativado!');
          navigate('/');
        }
      } catch (err) {
        // Falha silenciosa, continua polando
      }
      setPollCount(p => p + 1);
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(pollInterval);
  }, [payment, auth.token]);

  async function createPix() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
      });
      
      let j: any = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        j = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Erro ao gerar QR Code');
      }
      
      if (!j.ok) {
        // Traduzir erros técnicos para mensagens amigáveis
        if (j.error === 'user_not_found') {
          throw new Error('Sessão expirada. Por favor, faça logout e login novamente.');
        }
        throw new Error(j.error || 'Falha ao criar PIX');
      }
      setPayment(j.payment);
      setTimeLeft(30 * 60);
    } catch (err: any) {
      setError(err?.message || String(err) || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  async function confirmManually() {
    if (!payment) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      
      let j: any = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        j = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Erro ao confirmar');
      }
      
      if (!j.ok) throw new Error(j.error || 'Falha ao confirmar pagamento');
      
      // Update local stored user info
      try { if (j.user) { localStorage.setItem('pokerwizard_user', JSON.stringify(j.user)); } } catch (e) {}
      
      alert('✅ Pagamento confirmado! Premium ativado!');
      setPayment(null);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!payment?.brCode) return;
    navigator.clipboard.writeText(payment.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Formata tempo restante (MM:SS)
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!auth.token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 500, textAlign: 'center' }}>
          <h2>Premium</h2>
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Você precisa estar logado para acessar este plano.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Entrar / Registrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(6, 182, 212, 0.05))' }}>
      <div className="card" style={{ maxWidth: 500, width: '100%' }}>
        {!payment ? (
          // Estado: Antes de gerar QR Code
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>🚀 Ative Premium</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>PokerWizard by Pokio</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Análises ilimitadas, histórico completo e prioridade na IA</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 24 }}>R$ 5,90/mês</p>
            
            <div style={{ padding: 16, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 12, marginBottom: 24 }}>
              <ul style={{ textAlign: 'left', color: 'var(--text-secondary)', lineHeight: 2 }}>
                <li>✅ Análises ilimitadas</li>
                <li>✅ Histórico completo</li>
                <li>✅ Prioridade na IA</li>
                <li>✅ Sem anúncios</li>
                <li>✅ Cancelar quando quiser</li>
              </ul>
            </div>

            {error && (
              <div style={{ 
                padding: 14, 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)', 
                borderRadius: 10, 
                marginBottom: 16, 
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontWeight: 500
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <span>{error}</span>
                </div>
                {error.includes('Sessão expirada') && (
                  <button
                    onClick={() => {
                      auth.logout();
                      navigate('/login');
                    }}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: 8,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🔄 Fazer Login Novamente
                  </button>
                )}
              </div>
            )}

            <button
              onClick={createPix}
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                padding: 16, 
                fontSize: 16, 
                fontWeight: 700,
                position: 'relative',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span>
                  Gerando QR Code...
                </span>
              ) : (
                '💳 Pagar com PIX'
              )}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              💡 Pagamento seguro • Processado instantaneamente • Sem taxas extras
            </p>
          </div>
        ) : (
          // Estado: QR Code gerado, aguardando pagamento
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 24 }}>💰 Complete seu Pagamento</h2>

            {/* Informações de Pagamento */}
            <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, marginBottom: 24 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>INFORMAÇÕES DE PAGAMENTO</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Valor a Pagar</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)' }}>R$ 5,90</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Prazo</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {formatTime(timeLeft)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>(até {getExpirationTime()})</div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'white', borderRadius: 12 }}>
                <img
                  alt="QR Code PIX"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payment.brCode || '')}`}
                  style={{ width: 250, height: 250, borderRadius: 8 }}
                  onError={(e) => {
                    console.error('QR Code failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Código Copia e Cola */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>CÓDIGO PIX (Copia e Cola)</p>
              <div
                onClick={copyToClipboard}
                style={{
                  padding: 12,
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  userSelect: 'all',
                }}
              >
                {payment.brCode}
              </div>
              <button
                onClick={copyToClipboard}
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: 8, fontSize: 13 }}
              >
                {copied ? '✅ Copiado!' : '📋 Copiar Código PIX'}
              </button>
            </div>

            {/* Instruções */}
            <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12, marginBottom: 24, textAlign: 'left' }}>
              <h4 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>📱 Como Pagar</h4>
              <ol style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Abra o aplicativo do seu banco</li>
                <li><strong>Opção 1:</strong> Aponte a câmera para o QR Code acima</li>
                <li><strong>Opção 2:</strong> Clique no botão "Copiar Código PIX" e cole no app do banco</li>
                <li>Confirme o pagamento de R$ 5,90</li>
              </ol>
            </div>

            {/* Avisos */}
            <div style={{ padding: 12, background: 'rgba(251, 191, 36, 0.1)', borderRadius: 8, marginBottom: 24, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>⏱️ O pagamento pode levar até <strong>1 minuto</strong> para ser confirmado.</p>
              <p style={{ margin: '8px 0 0 0' }}>🔄 Permaneça nesta página — você será <strong>redirecionado automaticamente</strong> após o pagamento.</p>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={confirmManually}
                disabled={loading}
                className="btn btn-success"
                style={{ 
                  padding: 12, 
                  fontSize: 14, 
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span>
                    Verificando...
                  </span>
                ) : (
                  '✅ Já Paguei'
                )}
              </button>
              <button
                onClick={() => { setPayment(null); setError(null); }}
                className="btn btn-ghost"
                style={{ padding: 12, fontSize: 14 }}
              >
                Cancelar
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>
              Status: Aguardando pagamento • {pollCount > 0 && `Verificações: ${pollCount}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
