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
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; value: number; date: string } | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

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

  // Dados do gráfico: resultado POR SESSÃO
  const chartData = sessions.map(s => ({ ...s, value: s.net }));

  // Range do gráfico
  const values = chartData.map(d => d.value);
  const dataMax = Math.max(...values, 500);
  const dataMin = Math.min(...values, -500);
  
  const padding = Math.max(Math.abs(dataMax), Math.abs(dataMin)) * 0.2;
  const maxValue = dataMax + padding;
  const minValue = dataMin - padding;
  const range = maxValue - minValue;

  // Período
  const firstDate = new Date(chartData[0].date.split('/').reverse().join('-'));
  const lastDate = new Date(chartData[chartData.length - 1].date.split('/').reverse().join('-'));
  const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / dayMs);

  // Função Y
  const getY = (value: number) => ((maxValue - value) / range) * 100;
  const zeroY = getY(0);

  // Pontos
  const points = chartData.map((d, i) => ({
    x: chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 100,
    y: getY(d.value),
    data: d
  }));

  // Paths
  const positivePath = points.map((p, i) => {
    const y = p.data.value >= 0 ? p.y : zeroY;
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${y}`;
  }).join(' ') + ` L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;

  const negativePath = points.map((p, i) => {
    const y = p.data.value < 0 ? p.y : zeroY;
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${y}`;
  }).join(' ') + ` L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

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
              {daysDiff === 0 ? 'Hoje' : `${daysDiff}d`}
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
          Resultado por Sessão
        </div>
        
        <svg 
          width="100%" 
          height="140"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ display: 'block' }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="areaPositive" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="areaNegative" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line 
            x1="0" 
            y1={zeroY} 
            x2="100" 
            y2={zeroY} 
            stroke="rgba(148, 163, 184, 0.25)" 
            strokeWidth="0.4" 
            strokeDasharray="4,4"
          />

          <path d={positivePath} fill="url(#areaPositive)" />
          <path d={negativePath} fill="url(#areaNegative)" />

          <path
            d={linePath}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => {
            const isHovered = hoveredPoint?.index === i;
            const isPositive = p.data.value >= 0;
            
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isHovered ? 1.2 : 0.7}
                fill={isPositive ? '#3b82f6' : '#ef4444'}
                stroke="#fff"
                strokeWidth="0.3"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={() => setHoveredPoint({ index: i, value: p.data.value, date: p.data.date })}
              />
            );
          })}
        </svg>

        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: `${(hoveredPoint.index / Math.max(points.length - 1, 1)) * 100}%`,
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
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{hoveredPoint.date}</div>
          </div>
        )}
      </div>
    </div>
  );
};
