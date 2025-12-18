import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Página Premium - Focada em CONVERSÃO
 * 
 * Estrutura:
 * 1. Hero com continuidade emocional (do paywall)
 * 2. Comparação clara FREE vs PRO
 * 3. Benefícios práticos
 * 4. Prova social leve
 * 5. CTA final + Pagamento
 */

interface PaymentData {
  id: string;
  mpPaymentId: number;
  amount: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
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
          
          // Redireciona para página de sucesso
          setTimeout(() => {
            setPayment(null);
            navigate('/upgrade-success');
          }, 1500);
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
      background: 'linear-gradient(180deg, #0b0f1a 0%, #11162a 100%)',
      paddingBottom: 60,
    }}>
      {/* Banner de pagamento confirmado */}
      {paidBanner && (
        <div style={{ 
          padding: 16,
          background: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          color: '#10b981',
          borderRadius: 12,
          margin: '20px auto',
          maxWidth: 600,
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
        // ========== PÁGINA DE VENDAS ==========
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
          
          {/* 🔥 HERO - Continuidade emocional */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              marginBottom: 16,
              color: '#f8fafc',
              lineHeight: 1.3,
            }}>
              Continue no seu melhor ritmo de estudo
            </h1>
            <p style={{ 
              fontSize: 16, 
              color: '#94a3b8', 
              lineHeight: 1.6,
              maxWidth: 500,
              margin: '0 auto 32px',
            }}>
              O plano PRO remove limites, acelera seu aprendizado e transforma cada sessão em progresso real.
            </p>
            <button
              onClick={createPix}
              disabled={loading}
              style={{
                padding: '16px 40px',
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? 'Gerando...' : 'Desbloquear acesso PRO'}
            </button>
          </div>

          {/* 📊 COMPARAÇÃO FREE vs PRO */}
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            borderRadius: 16, 
            padding: 32,
            marginBottom: 48,
            border: '1px solid rgba(100, 116, 139, 0.2)',
          }}>
            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              marginBottom: 24, 
              textAlign: 'center',
              color: '#f8fafc',
            }}>
              FREE vs PRO
            </h2>
            
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { feature: 'Análises por dia', free: '5 limitadas', pro: '♾️ Ilimitadas' },
                { feature: 'Trainer GTO', free: '5 sessões', pro: '♾️ Ilimitado' },
                { feature: 'Análise detalhada', free: '❌', pro: '✅' },
                { feature: 'Análise de jogadores', free: '❌', pro: '✅' },
                { feature: 'Evolução contínua', free: '❌', pro: '✅' },
                { feature: 'Interrupções', free: '⚠️ Diárias', pro: '✅ Nunca' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 16,
                  padding: '12px 16px',
                  background: i % 2 === 0 ? 'rgba(15, 23, 42, 0.5)' : 'transparent',
                  borderRadius: 8,
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#d1d5db', fontSize: 14 }}>{row.feature}</span>
                  <span style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>{row.free}</span>
                  <span style={{ color: '#a78bfa', fontSize: 14, textAlign: 'center', fontWeight: 600 }}>{row.pro}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 🚀 BENEFÍCIOS PRÁTICOS */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              marginBottom: 20, 
              textAlign: 'center',
              color: '#f8fafc',
            }}>
              O que muda no seu dia a dia
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: 16 
            }}>
              {[
                { icon: '🎯', text: 'Estuda quando quiser, sem travas' },
                { icon: '⚡', text: 'Mantém foco e ritmo de estudo' },
                { icon: '📈', text: 'Aprende mais por sessão' },
                { icon: '🚀', text: 'Evolui mais rápido no poker' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: 12,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <span style={{ color: '#d1d5db', fontSize: 14 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 🧠 PROVA SOCIAL LEVE */}
          <div style={{
            textAlign: 'center',
            padding: '24px 20px',
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: 12,
            marginBottom: 48,
          }}>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: 14, 
              lineHeight: 1.6,
              margin: 0,
            }}>
              Jogadores que usam o PRO analisam mais mãos e constroem decisões melhores com mais consistência.
            </p>
          </div>

          {/* 💳 CTA FINAL + PREÇO */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <p style={{ 
              fontSize: 14, 
              color: '#94a3b8', 
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Plano PRO
            </p>
            <p style={{ 
              fontSize: 40, 
              fontWeight: 800, 
              color: '#a78bfa',
              marginBottom: 8,
            }}>
              R$ 3,50<span style={{ fontSize: 16, fontWeight: 400, color: '#6b7280' }}>/mês</span>
            </p>
            <p style={{ 
              fontSize: 13, 
              color: '#6b7280', 
              marginBottom: 24,
            }}>
              Menos que um café ☕
            </p>

            {/* Erro */}
            {error && (
              <div style={{ 
                padding: 14, 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', 
                borderRadius: 10, 
                marginBottom: 16, 
                fontSize: 13,
                fontWeight: 500
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={createPix}
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px 32px',
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: 12,
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span style={{ 
                    width: 16, 
                    height: 16, 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: 'white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  Gerando PIX...
                </span>
              ) : (
                'Começar PRO agora'
              )}
            </button>

            <p style={{ 
              fontSize: 12, 
              color: '#6b7280',
              margin: 0,
            }}>
              Cancelamento simples • Sem pegadinhas
            </p>
          </div>
        </div>
      ) : (
        // ========== ESTADO: PAGAMENTO PIX ==========
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 20,
            padding: 32,
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#f8fafc' }}>💰 Complete seu Pagamento</h2>

            {/* Info do pagamento */}
            <div style={{ padding: 16, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 12, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>Valor</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>
                    R$ {payment.amount?.toFixed(2) || '3,50'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>Expira em</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>{formatTime(timeLeft)}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>(até {getExpirationTime()})</div>
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
                    style={{ width: 220, height: 220, borderRadius: 8 }}
                  />
                ) : payment.qrCode ? (
                  <img
                    alt="QR Code PIX"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payment.qrCode)}`}
                    style={{ width: 220, height: 220, borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    Carregando...
                  </div>
                )}
              </div>
            </div>

            {/* Código Copia e Cola */}
            {payment.qrCode && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>CÓDIGO PIX (Copia e Cola)</p>
                <div
                  onClick={copyToClipboard}
                  style={{
                    padding: 12,
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: '#d1d5db',
                    maxHeight: 80,
                    overflow: 'auto',
                  }}
                >
                  {payment.qrCode}
                </div>
                <button
                  onClick={copyToClipboard}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '12px 16px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 8,
                    color: '#a78bfa',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? '✅ Copiado!' : '📋 Copiar Código PIX'}
                </button>
              </div>
            )}

            {/* Instruções */}
            <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, marginBottom: 24, textAlign: 'left' }}>
              <h4 style={{ marginBottom: 12, color: '#f8fafc', fontSize: 14 }}>📱 Como Pagar</h4>
              <ol style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Abra o app do seu banco</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            {/* Status */}
            <div style={{ 
              padding: 16, 
              background: 'rgba(139, 92, 246, 0.1)', 
              borderRadius: 12, 
              marginBottom: 16,
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ 
                  width: 20, 
                  height: 20, 
                  border: '3px solid rgba(139, 92, 246, 0.3)', 
                  borderTopColor: '#a78bfa',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                  Aguardando pagamento...
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 0, textAlign: 'center' }}>
                Verificando automaticamente {pollCount > 0 && `• ${pollCount} verificações`}
              </p>
            </div>

            {/* Cancelar */}
            <button
              onClick={() => { setPayment(null); setError(null); setPollCount(0); }}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: 8,
                color: '#6b7280',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
              ⚠️ Premium ativado automaticamente após confirmação
            </p>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
