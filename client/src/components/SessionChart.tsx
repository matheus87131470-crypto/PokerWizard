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
  const [hoveredPoint, setHoveredPoint] = useState<{ 
    index: number; 
    accumulated: number; 
    sessionNet: number;
    sessionNumber: number;
    date: string;
  } | null>(null);
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
  const sessions = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);
  
  // LÓGICA BRIEFING: 1 ponto por sessão, lucro acumulado real
  const chartData = sessions.map((session, index) => {
    const accumulated = sessions
      .slice(0, index + 1)
      .reduce((acc, s) => acc + s.net, 0);
    
    return {
      sessionNumber: index + 1,
      date: session.date,
      sessionNet: session.net,
      accumulated,
      isSignificant: Math.abs(session.net) > 500 // Marcar sessões > R$ 500
    };
  });

  const totalProfit = chartData[chartData.length - 1]?.accumulated || 0;

  // Range do gráfico (baseado em acumulado)
  const values = chartData.map(d => d.accumulated);
  const dataMax = Math.max(...values, 100);
  const dataMin = Math.min(...values, -100);
  
  const padding = Math.max(Math.abs(dataMax), Math.abs(dataMin)) * 0.1;
  const maxValue = dataMax + padding;
  const minValue = dataMin - padding;
  const range = maxValue - minValue;

  // Função Y (baseline implícita em zero)
  const getY = (value: number) => ((maxValue - value) / range) * 100;
  const zeroY = getY(0);

  // Pontos do gráfico (1 por sessão)
  const points = chartData.map((d, i) => ({
    x: chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 100,
    y: getY(d.accumulated),
    data: d
  }));

  // Path da linha (sem suavização artificial)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Área preenchida
  const areaPath = `M 0 ${zeroY} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L 100 ${zeroY} Z`;

  // Labels do eixo Y (valores de lucro acumulado)
  const yLabels = [
    { value: maxValue, y: 0 },
    { value: maxValue * 0.5, y: 25 },
    { value: 0, y: zeroY },
    { value: minValue * 0.5, y: 75 },
    { value: minValue, y: 100 }
  ].filter(l => Math.abs(l.value) > 10);

  // Labels do eixo X (número de sessões)
  const totalSessions = chartData.length;
  const xLabels = [
    { label: '1', x: 0 },
    { label: Math.floor(totalSessions * 0.25).toString(), x: 25 },
    { label: Math.floor(totalSessions * 0.5).toString(), x: 50 },
    { label: Math.floor(totalSessions * 0.75).toString(), x: 75 },
    { label: totalSessions.toString(), x: 100 }
  ];

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
              {chartData.length} {chartData.length === 1 ? 'sessão' : 'sessões'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
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
        border: '1px solid rgba(71, 85, 105, 0.15)',
        display: 'flex',
        gap: 8
      }}>
        {/* Labels do eixo Y (esquerda) */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          paddingTop: 30,
          paddingBottom: 20,
          minWidth: 60
        }}>
          {yLabels.map((label, i) => (
            <div 
              key={i}
              style={{ 
                fontSize: 9, 
                color: '#64748b', 
                fontWeight: 500,
                textAlign: 'right'
              }}
            >
              {label.value >= 0 ? '+' : ''}{label.value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          ))}
        </div>

        {/* Área do gráfico */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Lucro Acumulado (por jogo)
          </div>
        
        <svg 
          width="100%" 
          height="220"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ display: 'block' }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={totalProfit >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity="0.25" />
              <stop offset="50%" stopColor={totalProfit >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity="0.1" />
              <stop offset="100%" stopColor={totalProfit >= 0 ? "#3b82f6" : "#ef4444"} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid horizontal sutil (estilo SharkScope) */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="rgba(100, 116, 139, 0.08)" 
              strokeWidth="0.2"
            />
          ))}

          {/* Linha de referência zero (destaque) */}
          <line 
            x1="0" 
            y1={zeroY} 
            x2="100" 
            y2={zeroY} 
            stroke="rgba(148, 163, 184, 0.3)" 
            strokeWidth="0.4" 
            strokeDasharray="1,1"
          />

          {/* Área preenchida */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Linha principal - sem suavização */}
          <path
            d={linePath}
            fill="none"
            stroke={totalProfit >= 0 ? "#3b82f6" : "#ef4444"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Pontos especiais (sessões significativas > R$ 500) */}
          {points.map((p, i) => {
            if (!p.data.isSignificant) return null;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="2"
                  fill={p.data.sessionNet > 0 ? "#10b981" : "#ef4444"}
                  stroke="#fff"
                  strokeWidth="0.6"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="none"
                  stroke={p.data.sessionNet > 0 ? "#10b981" : "#ef4444"}
                  strokeWidth="0.3"
                  opacity="0.5"
                />
              </g>
            );
          })}

          {/* Ponto de hover */}
          {hoveredPoint && (
            <circle
              cx={points[hoveredPoint.index].x}
              cy={points[hoveredPoint.index].y}
              r="2"
              fill={hoveredPoint.accumulated >= 0 ? "#3b82f6" : "#ef4444"}
              stroke="#fff"
              strokeWidth="0.5"
            />
          )}

          {/* Área invisível para capturar hover */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseMove={(e) => {
              const svg = e.currentTarget.ownerSVGElement;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              
              const closestIndex = Math.round((x / 100) * (points.length - 1));
              const clampedIndex = Math.max(0, Math.min(closestIndex, points.length - 1));
              const point = points[clampedIndex];
              
              if (point) {
                setHoveredPoint({ 
                  index: clampedIndex, 
                  accumulated: point.data.accumulated,
                  sessionNet: point.data.sessionNet,
                  sessionNumber: point.data.sessionNumber,
                  date: point.data.date
                });
              }
            }}
          />
        </svg>

        {/* Labels do eixo X (embaixo) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: 8,
          paddingLeft: 2,
          paddingRight: 2
        }}>
          {xLabels.map((label, i) => (
            <div 
              key={i}
              style={{ 
                fontSize: 9, 
                color: '#64748b', 
                fontWeight: 500
              }}
            >
              {label.label}
            </div>
          ))}
        </div>

        <div style={{ 
          fontSize: 8, 
          color: '#64748b', 
          textAlign: 'center',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Nº de Sessões
        </div>

        {/* Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: `${(hoveredPoint.index / Math.max(points.length - 1, 1)) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 36, 0.98)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Sessão */}
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
              Sessão #{hoveredPoint.sessionNumber} • {hoveredPoint.date}
            </div>
            
            {/* Resultado da sessão */}
            <div style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: hoveredPoint.sessionNet >= 0 ? '#10b981' : '#ef4444',
              marginBottom: 6
            }}>
              {hoveredPoint.sessionNet >= 0 ? '+' : ''}{hoveredPoint.sessionNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              <span style={{ fontSize: 9, color: '#64748b', marginLeft: 6 }}>
                (sessão)
              </span>
            </div>

            {/* Total acumulado */}
            <div style={{ 
              fontSize: 12, 
              color: hoveredPoint.accumulated >= 0 ? '#3b82f6' : '#ef4444',
              paddingTop: 6,
              borderTop: '1px solid rgba(71, 85, 105, 0.3)'
            }}>
              <span style={{ fontSize: 9, color: '#94a3b8', marginRight: 6 }}>Acumulado:</span>
              <strong>
                {hoveredPoint.accumulated >= 0 ? '+' : ''}{hoveredPoint.accumulated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
