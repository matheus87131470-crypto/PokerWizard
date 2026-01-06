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
    dayNet: number;
    dayNumber: number;
    date: string;
    sessionCount: number;
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
  
  // AGRUPAMENTO DIÁRIO: agregar sessões do mesmo dia
  const dailyData = sessions.reduce((acc, session) => {
    const dateKey = session.date; // Já está no formato DD/MM/YYYY
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        timestamp: session.timestamp,
        totalNet: 0,
        totalGains: 0,
        totalLosses: 0,
        sessionCount: 0
      };
    }
    
    acc[dateKey].totalNet += session.net;
    acc[dateKey].totalGains += session.gains;
    acc[dateKey].totalLosses += session.losses;
    acc[dateKey].sessionCount += 1;
    
    return acc;
  }, {} as Record<string, { date: string; timestamp: number; totalNet: number; totalGains: number; totalLosses: number; sessionCount: number }>);

  // Converter para array ordenado por data
  const dailySessions = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);
  
  // LÓGICA BRIEFING: 1 ponto por dia, lucro acumulado real
  const chartData = dailySessions.map((day, index) => {
    const accumulated = dailySessions
      .slice(0, index + 1)
      .reduce((acc, d) => acc + d.totalNet, 0);
    
    return {
      dayNumber: index + 1,
      date: day.date,
      dayNet: day.totalNet,
      dayGains: day.totalGains,
      dayLosses: day.totalLosses,
      sessionCount: day.sessionCount,
      accumulated,
      isSignificant: Math.abs(day.totalNet) > 500 // Marcar dias > R$ 500
    };
  });

  const totalProfit = chartData[chartData.length - 1]?.accumulated || 0;

  // Range do gráfico (comportamento financeiro com baseline em zero)
  const values = chartData.map(d => d.accumulated);
  const dataMax = Math.max(...values, 0);
  const dataMin = Math.min(...values, 0);
  
  let maxValue: number;
  let minValue: number;
  
  // Se todos os valores são positivos ou zero
  if (dataMin >= 0) {
    minValue = 0;
    const padding = dataMax * 0.1;
    maxValue = dataMax + padding;
  }
  // Se todos os valores são negativos ou zero
  else if (dataMax <= 0) {
    maxValue = 0;
    const padding = Math.abs(dataMin) * 0.1;
    minValue = dataMin - padding;
  }
  // Se há valores positivos E negativos (zero no meio, simétrico)
  else {
    const maxMagnitude = Math.max(Math.abs(dataMax), Math.abs(dataMin));
    const padding = maxMagnitude * 0.1;
    maxValue = maxMagnitude + padding;
    minValue = -(maxMagnitude + padding);
  }
  
  const range = maxValue - minValue;

  // Função Y (baseline fixa em zero)
  const getY = (value: number) => ((maxValue - value) / range) * 100;
  const zeroY = getY(0);

  // Adicionar ponto inicial no zero (x=0, accumulated=0)
  const baseY = dataMin >= 0 ? 100 : dataMax <= 0 ? 0 : zeroY;
  const initialPoint = {
    x: 0,
    y: baseY,
    data: {
      dayNumber: 0,
      date: '',
      dayNet: 0,
      dayGains: 0,
      dayLosses: 0,
      sessionCount: 0,
      accumulated: 0,
      isSignificant: false
    }
  };

  // Pontos do gráfico com ZIG-ZAG artístico (oscilações visuais)
  const dataPoints = chartData.map((d, i) => {
    const baseX = chartData.length === 1 ? 100 : ((i + 1) / chartData.length) * 100;
    const baseY = getY(d.accumulated);
    
    // Adicionar oscilação visual (zig-zag) - variação de ±3% na altura
    const oscillation = Math.sin(i * 1.7) * (range * 0.03);
    const visualY = Math.max(0, Math.min(100, getY(d.accumulated - oscillation)));
    
    return {
      x: baseX,
      y: visualY,
      data: d
    };
  });

  // Combinar ponto inicial + dados reais
  const points = [initialPoint, ...dataPoints];

  // Path da linha com ZIG-ZAG - interpolação suave entre pontos
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    // Usar curvas suaves (quadratic) para criar fluidez no zig-zag
    const controlX = (prev.x + curr.x) / 2;
    const controlY = (prev.y + curr.y) / 2 + Math.sin(i * 0.8) * 2;
    linePath += ` Q ${controlX} ${controlY}, ${curr.x} ${curr.y}`;
  }

  // Área preenchida
  const areaPath = dataMin >= 0 
    ? `M 0 100 ${dataPoints.map((p) => `L ${p.x} ${p.y}`).join(' ')} L 100 100 Z`
    : dataMax <= 0
    ? `M 0 0 ${dataPoints.map((p) => `L ${p.x} ${p.y}`).join(' ')} L 100 0 Z`
    : `M 0 ${zeroY} ${dataPoints.map((p) => `L ${p.x} ${p.y}`).join(' ')} L 100 ${zeroY} Z`;

  // Labels do eixo Y (valores de lucro acumulado) - padrão financeiro (4-5 marcadores)
  let yLabels;
  
  if (dataMin >= 0) {
    // Apenas valores positivos - zero na base
    yLabels = [
      { value: maxValue, y: 0 },
      { value: maxValue * 0.67, y: 33 },
      { value: maxValue * 0.33, y: 67 },
      { value: 0, y: 100 }
    ];
  } else if (dataMax <= 0) {
    // Apenas valores negativos - zero no topo
    yLabels = [
      { value: 0, y: 0 },
      { value: minValue * 0.33, y: 33 },
      { value: minValue * 0.67, y: 67 },
      { value: minValue, y: 100 }
    ];
  } else {
    // Valores positivos e negativos - zero no meio (5 marcadores)
    yLabels = [
      { value: maxValue, y: 0 },
      { value: maxValue * 0.5, y: (zeroY / 2) },
      { value: 0, y: zeroY },
      { value: minValue * 0.5, y: zeroY + ((100 - zeroY) / 2) },
      { value: minValue, y: 100 }
    ];
  }

  // Labels do eixo X (datas) - padrão financeiro limpo
  const totalDays = chartData.length;
  let xLabels: Array<{ label: string; x: number }>;
  
  if (totalDays === 0) {
    xLabels = [];
  } else if (totalDays === 1) {
    xLabels = [{ label: chartData[0].date, x: 50 }];
  } else if (totalDays <= 4) {
    // Poucos pontos: mostrar todas as datas
    xLabels = chartData.map((d, i) => ({
      label: d.date.substring(0, 5), // DD/MM
      x: ((i + 1) / totalDays) * 100
    }));
  } else {
    // Muitos pontos: 4 marcadores estratégicos
    const first = chartData[0];
    const third = chartData[Math.floor(totalDays / 3)];
    const twoThirds = chartData[Math.floor((totalDays * 2) / 3)];
    const last = chartData[totalDays - 1];
    
    xLabels = [
      { label: first.date.substring(0, 5), x: (1 / totalDays) * 100 },
      { label: third.date.substring(0, 5), x: ((Math.floor(totalDays / 3) + 1) / totalDays) * 100 },
      { label: twoThirds.date.substring(0, 5), x: ((Math.floor((totalDays * 2) / 3) + 1) / totalDays) * 100 },
      { label: last.date.substring(0, 5), x: 100 }
    ];
  }

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
            color: '#a855f7'
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
                  background: period === p ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  border: period === p ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
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
              {chartData.length} {chartData.length === 1 ? 'dia' : 'dias'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
              {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Neon 3D Artístico */}
      <div style={{ 
        position: 'relative', 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 15, 50, 0.9) 50%, rgba(50, 15, 70, 0.85) 100%)',
        padding: '24px',
        borderRadius: 12, 
        border: '1px solid rgba(168, 85, 247, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(168, 85, 247, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Background Grid 3D */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          background: `
            repeating-linear-gradient(0deg, rgba(168, 85, 247, 0.3) 0px, transparent 1px, transparent 30px, rgba(168, 85, 247, 0.3) 31px),
            repeating-linear-gradient(90deg, rgba(168, 85, 247, 0.3) 0px, transparent 1px, transparent 40px, rgba(168, 85, 247, 0.3) 41px)
          `,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }} />

        {/* Gráfico SVG Neon */}
        <svg 
          width="100%" 
          height="280"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ display: 'block', position: 'relative', zIndex: 1 }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Gradiente Neon Rosa/Roxo */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>

            {/* Glow Filter Forte */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur3"/>
              <feMerge>
                <feMergeNode in="blur3"/>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Gradiente das Barras 3D */}
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid horizontal futurista */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="rgba(168, 85, 247, 0.15)" 
              strokeWidth="0.1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Barras 3D Verticais */}
          {dataPoints.map((p, i) => {
            const barHeight = Math.abs(100 - p.y);
            const barWidth = 1.5;
            return (
              <g key={`bar-${i}`}>
                {/* Sombra da barra */}
                <rect
                  x={p.x - barWidth / 2 + 0.3}
                  y={p.y + 0.5}
                  width={barWidth}
                  height={barHeight}
                  fill="rgba(0, 0, 0, 0.3)"
                  rx="0.2"
                />
                {/* Barra principal */}
                <rect
                  x={p.x - barWidth / 2}
                  y={p.y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#barGradient)"
                  rx="0.2"
                  opacity="0.6"
                />
                {/* Brilho 3D no topo */}
                <rect
                  x={p.x - barWidth / 2}
                  y={p.y}
                  width={barWidth}
                  height="2"
                  fill="#f0abfc"
                  rx="0.2"
                  opacity="0.8"
                />
              </g>
            );
          })}

          {/* Área preenchida neon */}
          <path 
            d={areaPath} 
            fill="url(#neonGradient)" 
          />

          {/* Linha principal NEON com ZIG-ZAG */}
          <path
            d={linePath}
            fill="none"
            stroke="#f0abfc"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />
          
          {/* Linha adicional para intensificar glow */}
          <path
            d={linePath}
            fill="none"
            stroke="#e879f9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
            filter="url(#neonGlow)"
          />

          {/* Área invisível para hover */}
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
              
              if (point && point.data.dayNumber > 0) {
                setHoveredPoint({ 
                  index: clampedIndex, 
                  accumulated: point.data.accumulated,
                  dayNet: point.data.dayNet,
                  dayNumber: point.data.dayNumber,
                  date: point.data.date,
                  sessionCount: point.data.sessionCount
                });
              }
            }}
          />
        </svg>

        {/* Labels inferiores com visual neon */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 16,
          padding: '0 8px'
        }}>
          <div style={{ fontSize: 9, color: '#a855f7', fontWeight: 600, textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>
            {xLabels[0]?.label || ''}
          </div>
          <div style={{ fontSize: 9, color: '#a855f7', fontWeight: 600, textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>
            {xLabels[xLabels.length - 1]?.label || ''}
          </div>
        </div>

        {/* Tooltip Neon */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: `${(hoveredPoint.index / Math.max(points.length - 1, 1)) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid #f0abfc',
            padding: '14px 18px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 0 30px rgba(240, 171, 252, 0.5), 0 8px 32px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Dia */}
            <div style={{ fontSize: 10, color: '#e879f9', marginBottom: 6, fontWeight: 600 }}>
              Dia #{hoveredPoint.dayNumber} • {hoveredPoint.date}
            </div>
            
            {/* Resultado do dia */}
            <div style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#f0abfc',
              marginBottom: 6,
              textShadow: '0 0 10px rgba(240, 171, 252, 0.8)'
            }}>
              {hoveredPoint.dayNet >= 0 ? '+' : ''}{hoveredPoint.dayNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 6 }}>
                ({hoveredPoint.sessionCount} {hoveredPoint.sessionCount === 1 ? 'sessão' : 'sessões'})
              </span>
            </div>

            {/* Total acumulado */}
            <div style={{ 
              fontSize: 12, 
              color: '#c084fc',
              paddingTop: 6,
              borderTop: '1px solid rgba(240, 171, 252, 0.3)'
            }}>
              <span style={{ fontSize: 9, color: '#94a3b8', marginRight: 6 }}>Acumulado:</span>
              <strong style={{ textShadow: '0 0 10px rgba(192, 132, 252, 0.6)' }}>
                {hoveredPoint.accumulated >= 0 ? '+' : ''}{hoveredPoint.accumulated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
