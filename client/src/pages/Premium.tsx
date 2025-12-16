import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Premium com Mercado Pago
 * 
 * SEGURANÇA:
 * - QR Code gerado dinamicamente via Mercado Pago
 * - Polling verifica status do pagamento
 * - Premium ativado APENAS via webhook do MP (backend)
 * - Frontend NÃO pode confirmar pagamento
 */

interface PaymentData {
  id: string;
  mpPaymentId: number;
  amount: number;
  qrCode: string | null;       // Código PIX copia-cola
  qrCodeBase64: string | null; // QR Code em base64
  ticketUrl: string | null;
  status: string;
  expiresIn: number;
}

export default function Premium() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [pollCount, setPollCount] = useState(0);
  const [paidBanner, setPaidBanner] = useState<string | null>(null);

  // Detectar ambiente
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

  // Timer de expiração
  function getExpirationTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Contagem regressiva
  useEffect(() => {
    if (!payment || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [payment, timeLeft]);

  // Polling para verificar pagamento
  useEffect(() => {
    if (!payment) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments/status/${payment.id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${auth.token}` },
        });
        const j = await res.json();
        
        // Verificar se pagamento foi aprovado
        if (j.payment?.status === 'approved' || j.user?.premium) {
          // Atualizar user no localStorage
          if (j.user) {
            try { 
              localStorage.setItem('pokerwizard_user', JSON.stringify(j.user)); 
            } catch (e) {}
          }
          
          setPaidBanner('✅ Pagamento confirmado! Premium ativado. Redirecionando...');
          clearInterval(pollInterval);
          
          setTimeout(() => {
            setPayment(null);
            navigate('/');
          }, 2500);
        }
      } catch (err) {
        // Ignora erros de polling
      }
      setPollCount(p => p + 1);
    }, 2000); // Poll a cada 2 segundos

    return () => clearInterval(pollInterval);
  }, [payment, auth.token, navigate, API_BASE]);

  // Criar pagamento PIX
  async function createPix() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-pix`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${auth.token}` 
        },
      });
      
      const j = await res.json();
      
      if (!j.ok) {
        if (j.error === 'user_not_found') {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        if (j.error === 'already_premium') {
          throw new Error('Você já possui Premium ativo!');
        }
        throw new Error(j.message || j.error || 'Falha ao criar pagamento');
      }
      
      setPayment(j.payment);
      setTimeLeft(j.payment.expiresIn || 1800);
      
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar pagamento');
    } finally {
      setLoading(false);
    }
  }

  // Copiar código PIX
  function copyToClipboard() {
    if (!payment?.qrCode) return;
    navigator.clipboard.writeText(payment.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Formatar tempo
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Não logado
  if (!auth.token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 500, textAlign: 'center' }}>
          <h2>Premium</h2>
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Você precisa estar logado para acessar.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Entrar / Registrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 20, 
      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(6, 182, 212, 0.05))' 
    }}>
      <div className="card" style={{ maxWidth: 500, width: '100%' }}>
        
        {/* Banner de pagamento confirmado */}
        {paidBanner && (
          <div style={{ 
            padding: 16,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontWeight: 700
          }}>
            <span style={{ fontSize: 24 }}>🎉</span>
            <span>{paidBanner}</span>
          </div>
        )}

        {!payment ? (
          // Estado: Antes de gerar pagamento
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>🚀 Ative Premium</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>PokerWizard by Pokio</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Análises ilimitadas, histórico completo e prioridade na IA
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 24 }}>
              R$ 3,50/mês
            </p>
            
            {/* Benefícios */}
            <div style={{ padding: 16, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 12, marginBottom: 24 }}>
              <ul style={{ textAlign: 'left', color: 'var(--text-secondary)', lineHeight: 2, listStyle: 'none', padding: 0, margin: 0 }}>
                <li>✅ Análises ilimitadas</li>
                <li>✅ Histórico completo</li>
                <li>✅ Prioridade na IA</li>
                <li>✅ Sem anúncios</li>
                <li>✅ Cancelar quando quiser</li>
              </ul>
            </div>

            {/* Erro */}
            {error && (
              <div style={{ 
                padding: 14, 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)', 
                borderRadius: 10, 
                marginBottom: 16, 
                fontSize: 13,
                fontWeight: 500
              }}>
                <span style={{ marginRight: 8 }}>⚠️</span>
                {error}
              </div>
            )}

            {/* Botão Pagar */}
            <button
              onClick={createPix}
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                padding: 16, 
                fontSize: 16, 
                fontWeight: 700,
                transition: 'all 0.3s'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Gerando QR Code...
                </span>
              ) : (
                '💳 Pagar com PIX'
              )}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              💡 Pagamento seguro via Mercado Pago • Confirmação automática
            </p>
          </div>
        ) : (
          // Estado: QR Code gerado, aguardando pagamento
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 24 }}>💰 Complete seu Pagamento</h2>

            {/* Info do pagamento */}
            <div style={{ padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Valor</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    R$ {payment.amount?.toFixed(2) || '3,50'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Expira em</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{formatTime(timeLeft)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>(até {getExpirationTime()})</div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'white', borderRadius: 12 }}>
                {payment.qrCodeBase64 ? (
                  <img
                    alt="QR Code PIX"
                    src={`data:image/png;base64,${payment.qrCodeBase64}`}
                    style={{ width: 250, height: 250, borderRadius: 8 }}
                  />
                ) : payment.qrCode ? (
                  <img
                    alt="QR Code PIX"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payment.qrCode)}`}
                    style={{ width: 250, height: 250, borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    Carregando QR Code...
                  </div>
                )}
              </div>
            </div>

            {/* Código Copia e Cola */}
            {payment.qrCode && (
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
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: 'var(--text-primary)',
                    maxHeight: 80,
                    overflow: 'auto',
                  }}
                >
                  {payment.qrCode}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 8, fontSize: 13 }}
                >
                  {copied ? '✅ Copiado!' : '📋 Copiar Código PIX'}
                </button>
              </div>
            )}

            {/* Instruções */}
            <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12, marginBottom: 24, textAlign: 'left' }}>
              <h4 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>📱 Como Pagar</h4>
              <ol style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Abra o app do seu banco</li>
                <li><strong>Opção 1:</strong> Escaneie o QR Code</li>
                <li><strong>Opção 2:</strong> Copie o código e cole no Pix</li>
                <li>Confirme o pagamento de R$ 3,50</li>
              </ol>
            </div>

            {/* Status */}
            <div style={{ 
              padding: 16, 
              background: 'rgba(124, 58, 237, 0.1)', 
              borderRadius: 12, 
              marginBottom: 16,
              border: '2px solid var(--accent-primary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ 
                  width: 20, 
                  height: 20, 
                  border: '3px solid rgba(124, 58, 237, 0.3)', 
                  borderTopColor: 'var(--accent-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Aguardando pagamento...
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
                Verificando automaticamente • {pollCount > 0 && `Verificações: ${pollCount}`}
              </p>
            </div>

            {/* Cancelar */}
            <button
              onClick={() => { setPayment(null); setError(null); setPollCount(0); }}
              className="btn btn-ghost"
              style={{ width: '100%', padding: 12, fontSize: 14 }}
            >
              Cancelar
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>
              ⚠️ O Premium será ativado automaticamente após a confirmação do Mercado Pago
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
