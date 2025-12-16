/**
 * Middleware de Validação de Usos - Paywall Premium
 * 
 * Este middleware verifica se o usuário tem usos disponíveis
 * para a funcionalidade específica antes de permitir o acesso.
 * 
 * Retorna HTTP 403 se o usuário excedeu o limite gratuito.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getUserById, getFeatureUsage, FeatureType } from '../services/userService';

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
  
  // Verificar usos restantes
  const remaining = await getFeatureUsage(userId, feature);
  
  return {
    allowed: remaining > 0,
    remaining,
    isPremium: false,
    feature,
    message: remaining <= 0 
      ? `Você atingiu o limite de usos gratuitos para ${getFeatureName(feature)}. Assine o Premium para continuar.`
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
 * Retorna informações sobre todas as funcionalidades
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
    
    const status = {
      ok: true,
      isPremium,
      statusPlano: user.statusPlano,
      features: {
        trainer: {
          name: 'Trainer GTO',
          remaining: isPremium ? -1 : (user.usosTrainer ?? 5),
          limit: 5,
          blocked: !isPremium && (user.usosTrainer ?? 5) <= 0
        },
        analise: {
          name: 'Análise de Mãos',
          remaining: isPremium ? -1 : (user.usosAnalise ?? 5),
          limit: 5,
          blocked: !isPremium && (user.usosAnalise ?? 5) <= 0
        },
        jogadores: {
          name: 'Análise de Jogadores',
          remaining: isPremium ? -1 : (user.usosJogadores ?? 5),
          limit: 5,
          blocked: !isPremium && (user.usosJogadores ?? 5) <= 0
        }
      },
      // Total de usos restantes (soma de todas as features)
      totalRemaining: isPremium ? -1 : (
        (user.usosTrainer ?? 5) + 
        (user.usosAnalise ?? 5) + 
        (user.usosJogadores ?? 5)
      ),
      // Se alguma feature está bloqueada
      anyBlocked: !isPremium && (
        (user.usosTrainer ?? 5) <= 0 ||
        (user.usosAnalise ?? 5) <= 0 ||
        (user.usosJogadores ?? 5) <= 0
      ),
      // Todas bloqueadas
      allBlocked: !isPremium && (
        (user.usosTrainer ?? 5) <= 0 &&
        (user.usosAnalise ?? 5) <= 0 &&
        (user.usosJogadores ?? 5) <= 0
      )
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
