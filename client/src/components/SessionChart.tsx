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
  let periodStartDate: Date | null = null;

  if (period === '7d') {
    filteredData = data.filter(s => s.timestamp >= now - 7 * dayMs);
    periodStartDate = new Date(now - 7 * dayMs);
  } else if (period === '30d') {
    filteredData = data.filter(s => s.timestamp >= now - 30 * dayMs);
    periodStartDate = new Date(now - 30 * dayMs);
  }

  // Ordem cronológica
  const sessions = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);
  
  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <p style={{ fontSize: 14 }}>Nenhuma sessão neste período</p>
      </div>
    );
  }
  
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
  
  // PREENCHER GAPS: Adicionar todos os dias do período, mesmo sem sessões
  let firstDate: Date;
  let lastDate: Date;
  
  if (periodStartDate) {
    // Se tem período definido (7d/30d), começar do início do período
    firstDate = new Date(periodStartDate);
    lastDate = new Date(now);
  } else {
    // Se é "all", usar primeiro e último dia com dados
    firstDate = new Date(dailySessions[0].timestamp);
    lastDate = new Date(dailySessions[dailySessions.length - 1].timestamp);
  }
  
  // Normalizar para início do dia
  firstDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  
  // Gerar array com TODOS os dias do período
  const allDays: Array<{
    date: string;
    timestamp: number;
    totalNet: number;
    totalGains: number;
    totalLosses: number;
    sessionCount: number;
  }> = [];
  
  const currentDate = new Date(firstDate);
  while (currentDate <= lastDate) {
    const dateStr = currentDate.toLocaleDateString('pt-BR');
    const existingDay = dailySessions.find(d => d.date === dateStr);
    
    if (existingDay) {
      allDays.push(existingDay);
    } else {
      // Dia sem sessões: manter saldo acumulado (net = 0)
      allDays.push({
        date: dateStr,
        timestamp: currentDate.getTime(),
        totalNet: 0,
        totalGains: 0,
        totalLosses: 0,
        sessionCount: 0
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log('📅 Dias preenchidos:', allDays.length, '(gaps preenchidos:', allDays.length - dailySessions.length, ')');
  
  // LÓGICA SHARKSCOPE: 1 ponto por dia, lucro acumulado REAL evento por evento
  const chartData = allDays.map((day, index) => {
    const accumulated = allDays
      .slice(0, index + 1)
      .reduce((acc, d) => acc + d.totalNet, 0);
    
    return {
      dayNumber: index + 1,
      date: day.date,
      dayNet: day.totalNet, // Profit daquele dia (pode ser +120, -50, +85...)
      dayGains: day.totalGains,
      dayLosses: day.totalLosses,
      sessionCount: day.sessionCount,
      accumulated, // Soma acumulada até aqui (zig-zag real)
      isSignificant: Math.abs(day.totalNet) > 500
    };
  });

  // DEBUG: Ver formato dos dados (SharkScope style)
  console.log('📊 Dados do gráfico (cada ponto):', chartData.map(d => ({
    dia: d.dayNumber,
    profit: d.dayNet,
    accumulated: d.accumulated,
    hasNull: d.accumulated === null || isNaN(d.accumulated)
  })));

  // VALIDAÇÃO: Garantir que não há null/undefined/NaN nos dados
  const validChartData = chartData.filter(d => 
    d.accumulated !== null && 
    d.accumulated !== undefined && 
    !isNaN(d.accumulated) &&
    d.dayNet !== null &&
    d.dayNet !== undefined &&
    !isNaN(d.dayNet)
  );

  if (validChartData.length !== chartData.length) {
    console.warn('⚠️ Dados inválidos removidos:', chartData.length - validChartData.length);
  }

  const totalProfit = validChartData[validChartData.length - 1]?.accumulated || 0;

  // Range do gráfico (comportamento financeiro com baseline em zero)
  const values = validChartData.map(d => d.accumulated);
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

  // Pontos do gráfico REAIS com micro-variações naturais (textura visual delicada)
  const dataPoints = validChartData.map((d, i) => {
    const baseX = validChartData.length === 1 ? 100 : ((i + 1) / validChartData.length) * 100;
    const baseY = getY(d.accumulated);
    
    // VALIDAÇÃO: Garantir que baseY é um número válido
    if (isNaN(baseY) || baseY === null || baseY === undefined) {
      console.error('❌ Y inválido no ponto', i, ':', { accumulated: d.accumulated, baseY });
      return null; // Marcar como inválido
    }
    
    // Adicionar micro-ondulação sutil (±1.5% do range) para textura visual
    // Isso cria movimento natural sem alterar a tendência real
    const microVariation = Math.sin((i * 2.3) + (i * 0.7)) * (range * 0.015);
    const visualY = Math.max(0, Math.min(100, getY(d.accumulated - microVariation)));
    
    return {
      x: baseX,
      y: isNaN(visualY) ? baseY : visualY, // Fallback se visualY der NaN
      baseY: baseY, // Guardar Y real para referência
      data: d
    };
  }).filter(p => p !== null); // Remover pontos inválidos

  // VALIDAÇÃO: Verificar se há pontos com coordenadas inválidas
  const invalidPoints = dataPoints.filter(p => 
    isNaN(p.x) || isNaN(p.y) || p.x === null || p.y === null
  );
  
  if (invalidPoints.length > 0) {
    console.error('❌ Pontos inválidos detectados:', invalidPoints);
  }

  // DEBUG: Ver coordenadas do path SVG
  console.log('📈 Coordenadas SVG (cada ponto na linha):', dataPoints.map((p, i) => ({
    index: i + 1,
    x: p.x.toFixed(2),
    y: p.y.toFixed(2),
    accumulated: p.data.accumulated,
    isValid: !isNaN(p.x) && !isNaN(p.y)
  })));

  // Combinar ponto inicial + dados reais
  const points = [initialPoint, ...dataPoints];

  // VALIDAÇÃO FINAL: Garantir que todos os pontos são válidos antes de gerar o path
  const validPoints = points.filter(p => 
    p && 
    p.x !== null && 
    p.y !== null && 
    !isNaN(p.x) && 
    !isNaN(p.y) &&
    isFinite(p.x) &&
    isFinite(p.y)
  );

  if (validPoints.length < points.length) {
    console.warn('⚠️ Pontos removidos do path:', points.length - validPoints.length);
  }

  // Path da linha com CURVAS SUAVES (quadratic bezier) para movimento orgânico
  // GARANTINDO CONTINUIDADE: Todos os pontos conectados sem quebras
  let linePath = `M ${validPoints[0].x.toFixed(2)} ${validPoints[0].y.toFixed(2)}`;
  
  for (let i = 1; i < validPoints.length; i++) {
    const prev = validPoints[i - 1];
    const curr = validPoints[i];
    
    // Usar curva quadrática para suavizar transições
    const controlX = (prev.x + curr.x) / 2;
    const controlY = (prev.y + curr.y) / 2;
    
    // IMPORTANTE: Garantir que todos os valores são finitos
    if (isFinite(controlX) && isFinite(controlY) && isFinite(curr.x) && isFinite(curr.y)) {
      linePath += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    } else {
      // Fallback: linha reta se a curva falhar
      console.warn('⚠️ Usando linha reta no ponto', i);
      linePath += ` L ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
  }
  
  console.log('🎨 Path SVG gerado (comprimento):', linePath.length, 'caracteres');

  // Área preenchida (usando pontos válidos)
  const areaPath = dataMin >= 0 
    ? `M 0 100 ${dataPoints.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} L 100 100 Z`
    : dataMax <= 0
    ? `M 0 0 ${dataPoints.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} L 100 0 Z`
    : `M 0 ${zeroY.toFixed(2)} ${dataPoints.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} L 100 ${zeroY.toFixed(2)} Z`;

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
  const totalDays = validChartData.length;
  let xLabels: Array<{ label: string; x: number }>;
  
  if (totalDays === 0) {
    xLabels = [];
  } else if (totalDays === 1) {
    xLabels = [{ label: validChartData[0].date, x: 50 }];
  } else if (totalDays <= 4) {
    // Poucos pontos: mostrar todas as datas
    xLabels = validChartData.map((d, i) => ({
      label: d.date.substring(0, 5), // DD/MM
      x: ((i + 1) / totalDays) * 100
    }));
  } else {
    // Muitos pontos: 4 marcadores estratégicos
    const first = validChartData[0];
    const third = validChartData[Math.floor(totalDays / 3)];
    const twoThirds = validChartData[Math.floor((totalDays * 2) / 3)];
    const last = validChartData[totalDays - 1];
    
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
              {validChartData.length} {validChartData.length === 1 ? 'dia' : 'dias'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
              {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Neon 3D com Dados Reais (SharkScope + Premium Design) */}
      <div style={{ 
        position: 'relative', 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 15, 50, 0.9) 50%, rgba(50, 15, 70, 0.85) 100%)',
        padding: '24px',
        borderRadius: 12, 
        border: '1px solid rgba(168, 85, 247, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(168, 85, 247, 0.1)',
        overflow: 'hidden',
        display: 'flex',
        gap: 12
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

        {/* Eixo Y - Valores Reais */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingBottom: 20,
          minWidth: 70,
          zIndex: 1
        }}>
          {yLabels.map((label, i) => (
            <div 
              key={i}
              style={{ 
                fontSize: 10, 
                color: '#e879f9', 
                fontWeight: 600,
                textAlign: 'right',
                textShadow: '0 0 10px rgba(232, 121, 249, 0.6)'
              }}
            >
              {label.value === 0 ? 'R$ 0' : (label.value > 0 ? '+' : '') + label.value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          ))}
        </div>

        {/* Área do Gráfico */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ 
            fontSize: 10, 
            color: '#c084fc', 
            marginBottom: 8, 
            fontWeight: 600, 
            textTransform: 'uppercase', 
            letterSpacing: '0.8px',
            textShadow: '0 0 10px rgba(192, 132, 252, 0.5)'
          }}>
            Evolução do Lucro
          </div>

        {/* Gráfico SVG com Linha Real */}
        <svg 
          width="100%" 
          height="240"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          style={{ display: 'block', position: 'relative', zIndex: 1 }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Gradiente Neon Rosa/Roxo */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>

            {/* Glow Filter Forte */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur3"/>
              <feMerge>
                <feMergeNode in="blur3"/>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid horizontal futurista */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="rgba(168, 85, 247, 0.12)" 
              strokeWidth="0.15"
              strokeDasharray="1,1"
            />
          ))}

          {/* Linha de referência zero */}
          <line 
            x1="0" 
            y1={zeroY} 
            x2="100" 
            y2={zeroY} 
            stroke="rgba(232, 121, 249, 0.4)" 
            strokeWidth="0.3" 
            strokeDasharray="2,2"
          />

          {/* Área preenchida neon */}
          <path 
            d={areaPath} 
            fill="url(#neonGradient)" 
          />

          {/* Linha principal NEON - Dados Reais */}
          <path
            d={linePath}
            fill="none"
            stroke="#f0abfc"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />
          
          {/* Linha adicional para intensificar glow */}
          <path
            d={linePath}
            fill="none"
            stroke="#e879f9"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
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
              
              const closestIndex = Math.round((x / 100) * (validPoints.length - 1));
              const clampedIndex = Math.max(0, Math.min(closestIndex, validPoints.length - 1));
              const point = validPoints[clampedIndex];
              
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

        {/* Eixo X - Progressão Real (estilo SharkScope) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          padding: '0 4px'
        }}>
          {xLabels.slice(0, 5).map((label, i) => (
            <div 
              key={i}
              style={{ 
                fontSize: 9, 
                color: '#c084fc',
                fontWeight: 600,
                textShadow: '0 0 8px rgba(192, 132, 252, 0.5)'
              }}
            >
              {label.label}
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 8,
          color: '#a855f7',
          textAlign: 'center',
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 600,
          textShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
        }}>
          Dias / Sessões
        </div>
        </div>

        {/* Tooltip Neon Premium */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: hoveredPoint.index < validPoints.length / 3 
              ? '10%'  // Se está no início, alinha à esquerda
              : hoveredPoint.index > (validPoints.length * 2) / 3
              ? '90%'  // Se está no fim, alinha à direita
              : `${(hoveredPoint.index / Math.max(validPoints.length - 1, 1)) * 100}%`, // No meio, centraliza
            transform: hoveredPoint.index < validPoints.length / 3 
              ? 'translateX(0)'
              : hoveredPoint.index > (validPoints.length * 2) / 3
              ? 'translateX(-100%)'
              : 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(20, 10, 30, 0.98) 100%)',
            border: '2px solid #f0abfc',
            padding: '16px 22px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 0 40px rgba(240, 171, 252, 0.8), 0 0 80px rgba(168, 85, 247, 0.5), 0 8px 32px rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            maxWidth: '90%'
          }}>
            {/* Dia */}
            <div style={{ 
              fontSize: 11, 
              color: '#fff', 
              marginBottom: 8, 
              fontWeight: 700,
              textShadow: '0 0 20px rgba(240, 171, 252, 1)'
            }}>
              Dia #{hoveredPoint.dayNumber} • {hoveredPoint.date}
            </div>
            
            {/* Resultado do dia */}
            <div style={{ 
              fontSize: 16, 
              fontWeight: 800, 
              color: '#f0abfc',
              marginBottom: 8,
              textShadow: '0 0 20px rgba(240, 171, 252, 1), 0 0 40px rgba(232, 121, 249, 0.8)'
            }}>
              {hoveredPoint.dayNet >= 0 ? '+' : ''}{hoveredPoint.dayNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              <span style={{ fontSize: 10, color: '#c084fc', marginLeft: 8, fontWeight: 600 }}>
                ({hoveredPoint.sessionCount} {hoveredPoint.sessionCount === 1 ? 'sessão' : 'sessões'})
              </span>
            </div>

            {/* Total acumulado */}
            <div style={{ 
              fontSize: 13, 
              color: '#fff',
              paddingTop: 8,
              borderTop: '2px solid rgba(240, 171, 252, 0.4)',
              fontWeight: 700
            }}>
              <span style={{ fontSize: 10, color: '#e879f9', marginRight: 8 }}>Acumulado:</span>
              <strong style={{ 
                color: '#f0abfc',
                textShadow: '0 0 15px rgba(240, 171, 252, 0.9)' 
              }}>
                {hoveredPoint.accumulated >= 0 ? '+' : ''}{hoveredPoint.accumulated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
