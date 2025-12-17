/**
 * Middleware de Validação de Usos - Paywall Premium
 * 
 * NOVO MODELO: 7 créditos GLOBAIS compartilhados entre TODAS as features
 * 
 * - Trainer GTO
 * - Análise de Mãos
 * - Análise de Jogadores
 * 
 * Todos consomem do mesmo contador: freeCredits
 * 
 * Retorna HTTP 403 se o usuário excedeu o limite gratuito.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getUserById, canUseFeature, getFreeCredits, FeatureType } from '../services/userService';

// Limite de créditos gratuitos
const FREE_CREDITS_LIMIT = 7;

interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  isPremium: boolean;
  feature: FeatureType;
  message?: string;
}

/**
 * Verifica se o usuário pode usar uma funcionalidade
 * Não consome créditos, apenas verifica
 * 
 * NOTA: Agora usa contador GLOBAL (freeCredits)
 */
export async function checkUsage(userId: string, feature: FeatureType): Promise<UsageCheckResult> {
  const user = await getUserById(userId);
  
  if (!user) {
    return {
      allowed: false,
      remaining: 0,
      isPremium: false,
      feature,
      message: 'Usuário não encontrado'
    };
  }
  
  // Premium tem acesso ilimitado
  const isPremium = user.statusPlano === 'premium' || user.premium === true;
  if (isPremium) {
    return {
      allowed: true,
      remaining: -1, // -1 = ilimitado
      isPremium: true,
      feature
    };
  }
  
  // Verificar créditos GLOBAIS restantes
  const remaining = user.freeCredits ?? user.usosRestantes ?? FREE_CREDITS_LIMIT;
  
  return {
    allowed: remaining > 0,
    remaining,
    isPremium: false,
    feature,
    message: remaining <= 0 
      ? `Você atingiu o limite de ${FREE_CREDITS_LIMIT} análises gratuitas. Assine o Premium para continuar.`
      : undefined
  };
}

/**
 * Retorna o nome amigável da funcionalidade
 */
function getFeatureName(feature: FeatureType): string {
  switch (feature) {
    case 'trainer': return 'Trainer GTO';
    case 'analise': return 'Análise de Mãos';
    case 'jogadores': return 'Análise de Jogadores';
    default: return 'esta funcionalidade';
  }
}

/**
 * Cria um middleware que bloqueia acesso se não tiver usos disponíveis
 * @param feature - Tipo da funcionalidade a ser verificada
 */
export function requireUsage(feature: FeatureType) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          ok: false,
          error: 'unauthorized',
          message: 'Faça login para acessar esta funcionalidade'
        });
      }
      
      const check = await checkUsage(userId, feature);
      
      if (!check.allowed) {
        return res.status(403).json({
          ok: false,
          error: 'no_credits',
          feature,
          featureName: getFeatureName(feature),
          remaining: check.remaining,
          isPremium: check.isPremium,
          message: check.message || `Limite de usos gratuitos atingido para ${getFeatureName(feature)}`,
          upgradeUrl: '/premium',
          // Informações extras para o frontend
          blockedFeatures: ['trainer', 'analise', 'jogadores']
        });
      }
      
      // Adiciona informações de uso na request para o controller usar
      (req as any).usageInfo = {
        feature,
        remaining: check.remaining,
        isPremium: check.isPremium
      };
      
      next();
    } catch (err: any) {
      console.error('[usageGuard] Erro na verificação:', err);
      return res.status(500).json({
        ok: false,
        error: 'internal',
        message: 'Erro ao verificar permissões'
      });
    }
  };
}

/**
 * Endpoint para verificar status de usos do usuário
 * 
 * NOVO MODELO: Retorna contador GLOBAL compartilhado (7 créditos)
 */
export async function getUsageStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }
    
    const isPremium = user.statusPlano === 'premium' || user.premium === true;
    
    // Créditos globais únicos
    const freeCredits = user.freeCredits ?? user.usosRestantes ?? FREE_CREDITS_LIMIT;
    
    const status = {
      ok: true,
      isPremium,
      statusPlano: user.statusPlano,
      // NOVO: Contador único global
      freeCredits: isPremium ? -1 : freeCredits,
      freeCreditsLimit: FREE_CREDITS_LIMIT,
      blocked: !isPremium && freeCredits <= 0,
      // Mensagem amigável
      message: isPremium 
        ? '👑 Acesso Premium Ilimitado' 
        : freeCredits > 0
          ? `Você tem ${freeCredits} de ${FREE_CREDITS_LIMIT} análises grátis restantes`
          : `Você usou suas ${FREE_CREDITS_LIMIT} análises gratuitas. Assine o Premium!`,
      // Features que consomem do mesmo contador
      features: ['trainer', 'analise', 'jogadores'],
      // Para compatibilidade com frontend antigo
      totalRemaining: isPremium ? -1 : freeCredits,
      anyBlocked: !isPremium && freeCredits <= 0,
      allBlocked: !isPremium && freeCredits <= 0
    };
    
    return res.json(status);
  } catch (err: any) {
    console.error('[usageGuard] Erro ao obter status:', err);
    return res.status(500).json({
      ok: false,
      error: 'internal',
      message: 'Erro ao obter status de usos'
    });
  }
}

export default { requireUsage, checkUsage, getUsageStatus };
