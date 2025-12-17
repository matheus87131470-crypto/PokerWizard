/**
 * Hook para gerenciar estado de usos e paywall premium
 * 
 * NOVO MODELO: 7 créditos GLOBAIS compartilhados entre TODAS as features
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

// Limite de créditos gratuitos
const FREE_CREDITS_LIMIT = 7;

interface UsageStatus {
  isPremium: boolean;
  statusPlano: 'free' | 'premium';
  // NOVO: contador global único
  freeCredits: number;  // -1 = ilimitado (premium)
  freeCreditsLimit: number;
  blocked: boolean;
  message: string;
  features: string[];
  // Compatibilidade
  totalRemaining: number;
  anyBlocked: boolean;
  allBlocked: boolean;
}

interface UsePaywallReturn {
  usageStatus: UsageStatus | null;
  loading: boolean;
  error: string | null;
  showPaywall: boolean;
  blockedFeature: string | null;
  freeCredits: number;           // Contador de créditos para exibir
  freeCreditsLimit: number;      // Limite total
  isPremium: boolean;            // Se é premium
  checkAndProceed: (feature: 'trainer' | 'analise' | 'jogadores', action: () => void) => Promise<void>;
  closePaywall: () => void;
  refreshUsage: () => Promise<void>;
  handleUpgrade: () => void;
  handleViewPlans: () => void;
}

export function usePaywall(token: string | null): UsePaywallReturn {
  const navigate = useNavigate();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<string | null>(null);

  // Buscar status de usos
  const refreshUsage = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/auth/usage-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Falha ao buscar status de usos');
      }
      
      const data = await res.json();
      setUsageStatus(data);
    } catch (err: any) {
      setError(err.message);
      console.error('[usePaywall] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Buscar status ao montar
  useEffect(() => {
    if (token) {
      refreshUsage();
    }
  }, [token, refreshUsage]);

  // Verificar se pode usar uma feature e executar ação
  const checkAndProceed = useCallback(async (
    feature: 'trainer' | 'analise' | 'jogadores',
    action: () => void
  ) => {
    if (!usageStatus) {
      await refreshUsage();
      return;
    }

    // Premium pode sempre
    if (usageStatus.isPremium) {
      action();
      return;
    }

    // Verificar créditos GLOBAIS
    if (usageStatus.blocked || usageStatus.freeCredits <= 0) {
      setBlockedFeature('Análises');
      setShowPaywall(true);
      return;
    }

    // Pode prosseguir
    action();
  }, [usageStatus, refreshUsage]);

  // Fechar paywall
  const closePaywall = useCallback(() => {
    setShowPaywall(false);
    setBlockedFeature(null);
  }, []);

  // Ir para página de upgrade
  const handleUpgrade = useCallback(() => {
    closePaywall();
    navigate('/premium');
  }, [navigate, closePaywall]);

  // Ir para página de planos
  const handleViewPlans = useCallback(() => {
    closePaywall();
    navigate('/planos');
  }, [navigate, closePaywall]);

  // Valores derivados para fácil acesso
  const freeCredits = usageStatus?.freeCredits ?? FREE_CREDITS_LIMIT;
  const isPremium = usageStatus?.isPremium ?? false;

  return {
    usageStatus,
    loading,
    error,
    showPaywall,
    blockedFeature,
    freeCredits,
    freeCreditsLimit: FREE_CREDITS_LIMIT,
    isPremium,
    checkAndProceed,
    closePaywall,
    refreshUsage,
    handleUpgrade,
    handleViewPlans
  };
}

/**
 * Interceptor para tratar erros 403 de limite de usos
 */
export function handleApiError(
  error: any,
  onNoCredits: (feature: string, message: string) => void
): boolean {
  if (error?.status === 403 || error?.response?.status === 403) {
    const data = error?.data || error?.response?.data;
    if (data?.error === 'no_credits') {
      onNoCredits(
        data.featureName || data.feature || 'esta funcionalidade',
        data.message || 'Limite de usos atingido'
      );
      return true;
    }
  }
  return false;
}

export default usePaywall;
