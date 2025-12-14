import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Features() {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: '🧠',
      title: 'Training Lab',
      desc: 'Treino GTO com feedback da IA em tempo real',
      badge: 'Popular',
      action: () => navigate('/trainer')
    },
    {
      icon: '📊',
      title: 'GTO Solutions',
      desc: 'Análise instantânea de qualquer mão',
      badge: 'Grátis',
      action: () => navigate('/solutions')
    },
    {
      icon: '🏆',
      title: 'Rankings',
      desc: 'Compare seu desempenho com outros jogadores',
      badge: 'Grátis',
      action: () => navigate('/rankings')
    },
    {
      icon: '👑',
      title: 'Premium',
      desc: 'Acesso ilimitado a todas as ferramentas',
      badge: 'R$5,90/mês',
      action: () => navigate('/premium')
    }
  ];

  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, marginBottom: 12, fontWeight: 800 }}>
          Ferramentas
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
          Tudo que você precisa para evoluir seu jogo
        </p>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="card" 
            onClick={feature.action}
            style={{ 
              cursor: 'pointer',
              padding: 24,
              textAlign: 'center',
              transition: 'all 0.2s ease',
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{feature.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{feature.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
              {feature.desc}
            </p>
            <span style={{
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: feature.badge === 'Grátis' ? 'rgba(16, 185, 129, 0.15)' : 
                         feature.badge === 'Popular' ? 'rgba(139, 92, 246, 0.15)' : 
                         'rgba(251, 191, 36, 0.15)',
              color: feature.badge === 'Grátis' ? '#10b981' : 
                     feature.badge === 'Popular' ? '#a78bfa' : 
                     '#fbbf24'
            }}>
              {feature.badge}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Simples */}
      <div style={{ 
        textAlign: 'center', 
        padding: '32px 24px', 
        background: 'rgba(139, 92, 246, 0.08)', 
        borderRadius: 16,
        border: '1px solid rgba(139, 92, 246, 0.15)'
      }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Comece agora, é grátis
        </p>
        <button 
          onClick={() => navigate('/trainer')}
          className="btn btn-primary" 
          style={{ padding: '14px 32px', fontSize: 15 }}
        >
          ⚡ Gerar Treino GTO
        </button>
      </div>
    </div>
  );
}
