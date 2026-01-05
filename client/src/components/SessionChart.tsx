import { useState } from 'react';

interface SessionResult {
  id: string;
  date: string;
  gains: number;
  losses: number;
  net: number;
  timestamp: number;
}

interface SessionChartProps {
  data: SessionResult[];
  isBlurred: boolean;
}

export const SessionChart = ({ data, isBlurred }: SessionChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; value: number; gameNumber: number } | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('all');

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <p style={{ fontSize: 14 }}>Adicione sessões para ver o gráfico de evolução</p>
      </div>
    );
  }

  // Filtrar por período
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let filteredData = data;

  if (period === '7d') {
    filteredData = data.filter(s => s.timestamp >= now - 7 * dayMs);
  } else if (period === '30d') {
    filteredData = data.filter(s => s.timestamp >= now - 30 * dayMs);
  }

  // Ordem cronológica
  const sessions = [...filteredData].reverse();
  
  // Saldo total (para header)
  const totalProfit = sessions.reduce((acc, s) => acc + s.net, 0);

  // LÓGICA SHARKSCOPE: Simular jogos individuais dentro de cada sessão
  // Cada sessão vira múltiplos pontos (jogos) com lucro acumulado
  const games: Array<{ gameNumber: number; accumulated: number }> = [];
  let accumulated = 0;
  let gameCounter = 0;

  sessions.forEach(session => {
    // Simular 10-20 jogos por sessão (densidade alta)
    const gamesInSession = Math.max(10, Math.floor(Math.random() * 11) + 10);
    const resultPerGame = session.net / gamesInSession;
    
    for (let i = 0; i < gamesInSession; i++) {
      accumulated += resultPerGame;
      gameCounter++;
      games.push({ gameNumber: gameCounter, accumulated });
    }
  });

  const chartData = games;

  // Range do gráfico (baseado em acumulado)
  const values = chartData.map(d => d.accumulated);
  const dataMax = Math.max(...values, 100);
  const dataMin = Math.min(...values, -100);
  
  const padding = Math.max(Math.abs(dataMax), Math.abs(dataMin)) * 0.1;
  const maxValue = dataMax + padding;
  const minValue = dataMin - padding;
  const range = maxValue - minValue;

  // Período
  const firstDate = new Date(sessions[0].date.split('/').reverse().join('-'));
  const lastDate = new Date(sessions[sessions.length - 1].date.split('/').reverse().join('-'));
  const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / dayMs);

  // Função Y (baseline implícita em zero)
  const getY = (value: number) => ((maxValue - value) / range) * 100;
  const zeroY = getY(0);

  // Pontos (alta densidade)
  const points = chartData.map((d, i) => ({
    x: chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 100,
    y: getY(d.accumulated),
    data: d
  }));

  // Path da linha (sem suavização artificial)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Área preenchida tipo SharkScope
  const areaPath = `M 0 ${zeroY} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L 100 ${zeroY} Z`;

  return (
    <div style={{ position: 'relative', filter: isBlurred ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}>
      
      {/* Header - Saldo Total */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.25)',
        borderRadius: 8,
        border: '1px solid rgba(71, 85, 105, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
            Saldo Total
          </div>
          <strong style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: totalProfit >= 0 ? '#3b82f6' : '#ef4444'
          }}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(15, 23, 42, 0.5)', padding: 3, borderRadius: 6 }}>
            {(['7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '5px 12px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: period === p ? '#fff' : '#94a3b8',
                  background: period === p ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  border: period === p ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  borderRadius: 5,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {p === 'all' ? 'Tudo' : p.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, fontWeight: 500 }}>
              {chartData.length} jogos
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
              {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ 
        position: 'relative', 
        background: 'rgba(15, 23, 42, 0.15)', 
        padding: '16px',
        borderRadius: 8, 
        border: '1px solid rgba(71, 85, 105, 0.15)'
      }}>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Lucro Acumulado (por jogo)
        </div>
        
        <svg 
          width="100%" 
          height="180"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ display: 'block' }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={totalProfit >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity="0.15" />
              <stop offset="100%" stopColor={totalProfit >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Linha de referência zero */}
          <line 
            x1="0" 
            y1={zeroY} 
            x2="100" 
            y2={zeroY} 
            stroke="rgba(148, 163, 184, 0.2)" 
            strokeWidth="0.3" 
            strokeDasharray="2,2"
          />

          {/* Área preenchida */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Linha principal - sem suavização */}
          <path
            d={linePath}
            fill="none"
            stroke={totalProfit >= 0 ? "#3b82f6" : "#ef4444"}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />

          {/* Ponto de hover */}
          {hoveredPoint && (
            <circle
              cx={points[hoveredPoint.index].x}
              cy={points[hoveredPoint.index].y}
              r="1"
              fill={totalProfit >= 0 ? "#3b82f6" : "#ef4444"}
              stroke="#fff"
              strokeWidth="0.4"
            />
          )}

          {/* Área invisível para capturar hover */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="transparent"
            onMouseMove={(e) => {
              const svg = e.currentTarget.ownerSVGElement;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const closestIndex = Math.round((x / 100) * (points.length - 1));
              const point = points[closestIndex];
              if (point) {
                setHoveredPoint({ 
                  index: closestIndex, 
                  value: point.data.accumulated,
                  gameNumber: point.data.gameNumber
                });
              }
            }}
          />
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: `${(hoveredPoint.index / (points.length - 1)) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: hoveredPoint.value >= 0 ? '#3b82f6' : '#ef4444',
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            {hoveredPoint.value >= 0 ? '+' : ''}{hoveredPoint.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Jogo #{hoveredPoint.gameNumber}</div>
          </div>
        )}
      </div>
    </div>
  );
};
