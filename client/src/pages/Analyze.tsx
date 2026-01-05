/**
 * Analyze - Analisar UMA mão completa
 * 
 * Intenção: Usuário cola histórico de mão e recebe análise GTO detalhada
 * Similar ao "Hand History" do GTO Wizard
 * 
 * Usa PaywallOverlay como wrapper para soft paywall
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PaywallOverlay from '../components/PaywallOverlay';
import CreditWarningBanner from '../components/CreditWarningBanner';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'https://pokerwizard-api.onrender.com';

export default function Analyze() {
  const auth = useAuth();
  const navigate = useNavigate();
  const token = auth.token;
  const user = auth.user;
  const refreshUser = auth.refreshUser;

  // Estados
  const [handHistory, setHandHistory] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar créditos (usosAnalise específico para essa página)
  const isPremium = user?.premium || (user as any)?.statusPlano === 'premium';
  const usosAnalise = (user as any)?.usosAnalise ?? 5;
  const canUse = isPremium || usosAnalise > 0;

  // Analisar mão
  const handleAnalyze = async () => {
    if (!handHistory.trim()) {
      setAnalysis('⚠️ Cole o histórico da mão para analisar!');
      return;
    }

    // PaywallOverlay já bloqueia se não tiver créditos
    if (!canUse) {
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setAnalysis('🤖 Analisando sua mão com IA...');

    try {
      const response = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          history: handHistory,
          fileName: 'manual_input',
        }),
      });

      const data = await response.json();

      if (data.error === 'no_credits') {
        // PaywallOverlay detecta automaticamente após refresh
        setAnalysis(null);
        if (refreshUser) await refreshUser();
        return;
      }

      if (data.ok && data.analysis) {
        setAnalysis(data.analysis);
        if (refreshUser) await refreshUser();
      } else {
        setAnalysis(data.error || '❌ Erro ao analisar. Tente novamente.');
      }
    } catch (error) {
      console.error('Analyze error:', error);
      setAnalysis('❌ Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  // Limpar
  const handleClear = () => {
    setHandHistory('');
    setAnalysis(null);
  };

  // Exemplos de histórico
  const exampleHands = [
    {
      title: 'Cash Game - 3bet pot',
      text: `NL50 6-max Cash Game
UTG raises to 2.5bb
Hero (BTN) com As Kh 3-bets para 8bb
UTG calls

Flop: Kc 7d 2s (pot: 17bb)
UTG checks
Hero bets 6bb
UTG calls

Turn: 4h (pot: 29bb)
UTG checks
Hero?`
    },
    {
      title: 'MTT - Bubble spot',
      text: `MTT $55 - Bubble (15 players to money)
Blinds 1000/2000 ante 200
Hero (CO) 25bb stack com Jc Jd
UTG (40bb) raises to 4.5bb
Folds to Hero
Hero?`
    },
  ];

  return (
    <PaywallOverlay requiredCredits={1} creditType="analise">
      <div className="analyze-page" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Banner de Créditos Baixos */}
        <CreditWarningBanner 
        credits={usosAnalise}
        isPremium={isPremium}
        onUpgrade={() => navigate('/premium')}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>🔍 Analyze</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cole o histórico de uma mão e receba análise GTO completa
          </p>
        </div>

        {/* Status de créditos */}
        {user && (
          <div style={{
            padding: '10px 16px',
            background: isPremium
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
            border: `1px solid ${isPremium ? 'rgba(16, 185, 129, 0.4)' : 'rgba(139, 92, 246, 0.3)'}`,
            borderRadius: 10,
            fontSize: 13,
          }}>
            {isPremium ? (
              <span style={{ color: '#34d399', fontWeight: 700 }}>👑 Premium • Ilimitado</span>
            ) : (
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                📊 {usosAnalise} análises restantes
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Principal - Full Width */}
      <div style={{ padding: '48px 5%', marginBottom: 32, width: '100%' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, textAlign: 'center', color: '#f8fafc', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
          📋 Histórico da Mão
        </h3>

        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <textarea
          value={handHistory}
          onChange={(e) => setHandHistory(e.target.value)}
          placeholder={`Cole aqui o histórico da sua mão...

Exemplo:
NL100 Cash Game 6-max
Hero (BTN) com Ah Qd
UTG raises to 3bb, Hero 3-bets to 9bb...`}
          style={{
            width: '100%',
            minHeight: 200,
            padding: 16,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'monospace',
            resize: 'vertical',
            outline: 'none',
          }}
        />

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={handleAnalyze}
            disabled={loading || !handHistory.trim() || !canUse}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: loading || !handHistory.trim() || !canUse
                ? 'linear-gradient(135deg, #4b5563, #374151)'
                : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !handHistory.trim() || !canUse ? 'not-allowed' : 'pointer',
              boxShadow: loading || !handHistory.trim() || !canUse
                ? 'none'
                : '0 4px 20px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Analisando...' : !canUse ? '🔒 Sem créditos' : '⚡ Analisar com IA'}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🗑️ Limpar
          </button>
        </div>

        {/* Botão Premium se sem créditos */}
        {!canUse && user && (
          <button
            onClick={() => navigate('/premium')}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            👑 Assinar Premium - Análises Ilimitadas
          </button>
        )}
        </div>
      </div>

      {/* Resultado da Análise - Full Width */}
      {analysis && (
        <div style={{ padding: '48px 5%', marginBottom: 32, width: '100%' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, textAlign: 'center', color: '#f8fafc', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
            🎯 Análise GTO
          </h3>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            padding: 20,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 12,
            whiteSpace: 'pre-wrap',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-primary)',
          }}>
            {analysis}
          </div>
          </div>
        </div>
      )}

      {/* Exemplos de Mãos - Full Width */}
      <div style={{ padding: '48px 5%', width: '100%' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, textAlign: 'center', color: '#f8fafc', textShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
          💡 Exemplos de Mãos
        </h3>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
          Clique em um exemplo para carregar:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {exampleHands.map((example, i) => (
            <button
              key={i}
              onClick={() => setHandHistory(example.text)}
              style={{
                padding: 16,
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 10,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
              }}
            >
              <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
                {example.title}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {example.text.split('\n')[0]}...
              </div>
            </button>
          ))}
        </div>
        </div>
      </div>
    </div>
    </PaywallOverlay>
  );
}
