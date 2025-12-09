import React from 'react';
import { Link } from 'react-router-dom';

export default function Features() {
  const features = [
    {
      icon: '📊',
      title: 'Estatísticas do Jogador',
      desc: 'Análise completa de ROI, Win Rate, VPIP, PFR e tendências de lucro',
      badge: 'Premium'
    },
    {
      icon: '🎯',
      title: 'Encontrar um Torneio',
      desc: 'Busque e encontre torneios pelo nome, sala, país e tipo de jogo',
      badge: 'Gratuito'
    },
    {
      icon: '🏆',
      title: 'Tournament Selector',
      desc: 'Comparador de torneios com análise de lucratividade e dificuldade',
      badge: 'Premium'
    },
    {
      icon: '💻',
      title: 'SharkScope Desktop & HUD',
      desc: 'Integração com HUD em tempo real para acompanhar opponents ao vivo',
      badge: 'Premium'
    },
    {
      icon: '📱',
      title: 'Aplicativo Móvel SharkScope',
      desc: 'Acesse suas estatísticas e busque jogadores em qualquer lugar',
      badge: 'Premium'
    },
    {
      icon: '🧠',
      title: 'IA Análise de Mãos',
      desc: 'Inteligência artificial analisa suas mãos jogadas e sugere melhorias',
      badge: 'Premium'
    },
    {
      icon: '📈',
      title: 'Tabelas de Líderes',
      desc: 'Ranking global de jogadores por lucro, ROI, volume e winrate',
      badge: 'Gratuito'
    },
    {
      icon: '🎓',
      title: 'Tutoriais SharkScope',
      desc: 'Vídeos e guias sobre como aproveitar ao máximo a plataforma',
      badge: 'Gratuito'
    },
    {
      icon: '🎲',
      title: 'Guia de SNG',
      desc: 'Estratégias específicas para Sit & Go tournaments',
      badge: 'Premium'
    },
    {
      icon: '⚙️',
      title: 'Optar / Optar não participar',
      desc: 'Controle completo sobre privacidade de seu perfil e dados',
      badge: 'Gratuito'
    },
    {
      icon: '💹',
      title: 'Dados de Mercado',
      desc: 'Análise de tendências de mercado e preços de buy-in',
      badge: 'Premium'
    },
    {
      icon: '🔒',
      title: 'Sistema de Créditos',
      desc: '3 testes gratuitos, depois R$1 por teste ou premium mensal',
      badge: 'Modelo'
    }
  ];

  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <div style={{ marginBottom: 50, textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, marginBottom: 16 }}>🚀 Funcionalidades Completas</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
          Explorar todas as ferramentas e recursos disponíveis para dominar o poker
        </p>
      </div>

      {/* Filter Tags */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Todos</button>
        <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>Gratuito</button>
        <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>Premium</button>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 50 }}>
        {features.map((feature, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 32, lineHeight: 1 }}>{feature.icon}</div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: feature.badge === 'Gratuito' ? 'rgba(16, 185, 129, 0.2)' : feature.badge === 'Premium+' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                  color: feature.badge === 'Gratuito' ? 'var(--accent-green)' : feature.badge === 'Premium+' ? 'var(--accent-red)' : 'var(--accent-primary)',
                }}
              >
                {feature.badge}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{feature.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
            <button className="btn btn-ghost" style={{ width: '100%', padding: '10px', fontSize: 13, marginTop: 'auto' }}>
              Saiba Mais →
            </button>
          </div>
        ))}
      </div>

      {/* Pricing Section */}
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>💰 Planos de Preço</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto' }}>
          {/* Free Plan */}
          <div className="card" style={{ borderColor: 'var(--accent-green)', borderWidth: 2, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Gratuito</h3>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>R$0<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/mês</span></div>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Rankings globais</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Busca de torneios</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Tutoriais</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ 3 testes gratuitos</li>
            </ul>
            <button className="btn btn-ghost" style={{ width: '100%', padding: '12px' }}>Começar</button>
          </div>

          {/* Premium Plan */}
          <div className="card" style={{ borderColor: 'var(--accent-primary)', borderWidth: 2, display: 'flex', flexDirection: 'column', gap: 20, background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, right: 0, padding: '4px 12px', background: 'var(--accent-primary)', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>POPULAR</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Premium</h3>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>R$5,90<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/mês</span></div>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Tudo do Gratuito</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Estatísticas completas</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Análises ilimitadas</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ IA Análise de Mãos</li>
              <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>✅ Histórico completo</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600 }}>Assinar Agora</button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(6, 182, 212, 0.1))', borderRadius: 16, marginBottom: 40 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Comece sua jornada agora</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
          3 testes gratuitos. Sem cartão de crédito necessário. Cancele quando quiser.
        </p>
        <Link to="/search" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>Explorar Agora 🚀</button>
        </Link>
      </div>
    </div>
  );
}
