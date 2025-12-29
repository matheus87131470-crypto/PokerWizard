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
        console.warn('[usePaywall] API retornou status', res.status);
        throw new Error('Falha ao buscar status de usos');
      }
      
      const data = await res.json();
      console.log('[usePaywall] ✅ Dados carregados da API:', data);
      setUsageStatus(data);
    } catch (err: any) {
      console.error('[usePaywall] ❌ Erro na API:', err.message);
      console.log('[usePaywall] 🔄 Usando fallback do localStorage');
      setError(err.message);
      
      // Criar usageStatus baseado no localStorage como fallback
      const isLocalPremium = checkLocalStoragePremium();
      if (isLocalPremium) {
        console.log('[usePaywall] ✅ Usuário identificado como PRO via localStorage');
        setUsageStatus({
          isPremium: true,
          statusPlano: 'premium',
          freeCredits: -1,
          freeCreditsLimit: FREE_CREDITS_LIMIT,
          blocked: false,
          message: 'Premium ativo (offline)',
          features: [],
          totalRemaining: -1,
          anyBlocked: false,
          allBlocked: false
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Função auxiliar para verificar localStorage
  const checkLocalStoragePremium = useCallback((): boolean => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('🔍 [localStorage] user string:', userStr);
      
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('🔍 [localStorage] user parsed:', user);
        console.log('🔍 [localStorage] isPremium:', user?.isPremium);
        console.log('🔍 [localStorage] statusPlano:', user?.statusPlano);
        
        const result = user?.isPremium === true || user?.statusPlano === 'premium';
        console.log('🔍 [localStorage] result:', result);
        return result;
      }
    } catch (err) {
      console.error('[usePaywall] Erro ao ler localStorage:', err);
    }
    return false;
  }, []);

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
  
  // Se usageStatus não carregou, verificar localStorage
  const isPremium = usageStatus 
    ? usageStatus.isPremium 
    : checkLocalStoragePremium();

  // Debug
  useEffect(() => {
    console.log('🔍 [usePaywall] Status:', {
      hasUsageStatus: !!usageStatus,
      apiIsPremium: usageStatus?.isPremium,
      localStoragePremium: checkLocalStoragePremium(),
      finalIsPremium: isPremium,
      error
    });
  }, [usageStatus, isPremium, error, checkLocalStoragePremium]);

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
