/**
 * Payment Routes - Mercado Pago Integration
 * 
 * SEGURANÇA MÁXIMA:
 * - Premium só é ativado via webhook oficial do Mercado Pago
 * - Webhook valida assinatura
 * - Verifica pagamento direto na API do MP antes de liberar
 * - Frontend NÃO pode confirmar pagamento
 */

import express, { Response, Request } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUserById, setPremium } from '../services/userService';
import {
  initMercadoPago,
  createPixPayment,
  getPaymentById,
  getPaymentByMPId,
  validateWebhookSignature,
  verifyPaymentWithMercadoPago,
  markPaymentAsApproved,
  getAllPayments,
  PREMIUM_PRICE,
  PREMIUM_DAYS,
} from '../services/mercadoPagoService';

const router = express.Router();

// Inicializa Mercado Pago na carga do módulo
initMercadoPago();

/**
 * POST /payments/create-pix
 * Cria novo pagamento PIX via Mercado Pago
 */
router.post('/create-pix', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }

    // Verificar se já é premium
    if (user.premium && user.premiumUntil && new Date(user.premiumUntil) > new Date()) {
      return res.status(400).json({ 
        ok: false, 
        error: 'already_premium',
        message: 'Você já possui Premium ativo!',
        premiumUntil: user.premiumUntil,
      });
    }

    // Criar pagamento no Mercado Pago
    const payment = await createPixPayment(req.userId, user.email);

    return res.json({
      ok: true,
      payment: {
        id: payment.id,
        mpPaymentId: payment.mpPaymentId,
        amount: PREMIUM_PRICE,
        qrCode: payment.qrCode,           // Código PIX copia-cola
        qrCodeBase64: payment.qrCodeBase64, // QR Code em base64
        ticketUrl: payment.ticketUrl,
        status: payment.status,
        expiresIn: 1800, // 30 minutos
      },
    });

  } catch (err: any) {
    console.error('[Payments] Erro ao criar PIX:', err.message);
    return res.status(500).json({ 
      ok: false, 
      error: 'create_pix_failed', 
      message: err.message 
    });
  }
});

/**
 * GET /payments/status/:paymentId
 * Consulta status do pagamento (para polling do frontend)
 */
router.get('/status/:paymentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { paymentId } = req.params;
    const payment = getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ ok: false, error: 'payment_not_found' });
    }

    if (payment.userId !== req.userId) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }

    // Buscar usuário para verificar se Premium foi ativado
    const user = await getUserById(req.userId);

    return res.json({
      ok: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount / 100,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
      },
      user: user ? {
        premium: user.premium,
        premiumUntil: user.premiumUntil,
      } : null,
    });

  } catch (err: any) {
    return res.status(500).json({ ok: false, error: 'status_failed', message: err.message });
  }
});

/**
 * POST /payments/confirm
 * ❌ DESABILITADO - Confirmação manual removida por segurança
 */
router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  return res.status(403).json({ 
    ok: false,
    error: 'forbidden', 
    message: 'Confirmação manual desabilitada. O pagamento será confirmado automaticamente pelo Mercado Pago.' 
  });
});

/**
 * POST /payments/webhook/mercadopago
 * 🔐 WEBHOOK OFICIAL DO MERCADO PAGO
 * 
 * Este é o endpoint que o Mercado Pago chama quando um pagamento é processado.
 * 
 * Headers esperados:
 * - x-signature: assinatura HMAC do payload
 * - x-request-id: ID único da requisição
 * 
 * Body (IPN):
 * {
 *   "action": "payment.created" | "payment.updated",
 *   "api_version": "v1",
 *   "data": { "id": "123456789" },
 *   "date_created": "2024-01-01T00:00:00.000-04:00",
 *   "id": "...",
 *   "live_mode": true,
 *   "type": "payment",
 *   "user_id": "..."
 * }
 */
router.post('/webhook/mercadopago', async (req: Request, res: Response) => {
  try {
    console.log('[Webhook MP] Recebido:', JSON.stringify(req.body));
    
    const { type, data, action } = req.body;

    // Responder 200 imediatamente para o MP não reenviar
    // Processar em background

    // Ignorar eventos que não são de pagamento
    if (type !== 'payment') {
      console.log(`[Webhook MP] Tipo ignorado: ${type}`);
      return res.status(200).json({ ok: true, ignored: true });
    }

    const mpPaymentId = data?.id;
    if (!mpPaymentId) {
      console.error('[Webhook MP] ❌ ID do pagamento não encontrado');
      return res.status(200).json({ ok: true, error: 'no_payment_id' });
    }

    // Validar assinatura do webhook
    const xSignature = req.headers['x-signature'] as string | undefined;
    const xRequestId = req.headers['x-request-id'] as string | undefined;
    
    const isValidSignature = validateWebhookSignature(
      xSignature,
      xRequestId,
      String(mpPaymentId)
    );

    if (!isValidSignature) {
      console.error('[Webhook MP] ❌ Assinatura inválida');
      // Retorna 200 para não ficar reenviando, mas loga o erro
      return res.status(200).json({ ok: false, error: 'invalid_signature' });
    }

    // 🔐 SEGURANÇA: Buscar pagamento DIRETO no Mercado Pago
    const verification = await verifyPaymentWithMercadoPago(Number(mpPaymentId));

    if (!verification.verified) {
      console.error(`[Webhook MP] ❌ Não foi possível verificar pagamento ${mpPaymentId}`);
      return res.status(200).json({ ok: false, error: 'verification_failed' });
    }

    console.log(`[Webhook MP] Pagamento ${mpPaymentId}: status=${verification.status}, amount=${verification.amount}`);

    // Só processa se aprovado
    if (verification.status !== 'approved') {
      console.log(`[Webhook MP] Status não aprovado: ${verification.status}`);
      return res.status(200).json({ ok: true, status: verification.status });
    }

    // 🔐 SEGURANÇA: Verificar valor
    if (verification.amount !== PREMIUM_PRICE) {
      console.error(`[Webhook MP] ❌ Valor incorreto: esperado ${PREMIUM_PRICE}, recebido ${verification.amount}`);
      return res.status(200).json({ ok: false, error: 'invalid_amount' });
    }

    // Buscar pagamento interno
    let payment = getPaymentByMPId(Number(mpPaymentId));
    
    // Se não encontrou por MP ID, tentar por external_reference
    if (!payment && verification.externalReference) {
      payment = getPaymentById(verification.externalReference);
    }

    if (!payment) {
      console.error(`[Webhook MP] ❌ Pagamento interno não encontrado para MP ${mpPaymentId}`);
      return res.status(200).json({ ok: false, error: 'payment_not_found' });
    }

    // Evitar processamento duplicado
    if (payment.status === 'approved') {
      console.log(`[Webhook MP] ⚠️ Pagamento ${payment.id} já processado anteriormente`);
      return res.status(200).json({ ok: true, already_processed: true });
    }

    // ✅ ATIVAR PREMIUM
    await markPaymentAsApproved(payment.id);
    
    try {
      await setPremium(payment.userId, PREMIUM_DAYS);
      console.log(`[Webhook MP] ✅ Premium ativado para usuário ${payment.userId} por ${PREMIUM_DAYS} dias`);
    } catch (premiumErr: any) {
      console.error(`[Webhook MP] ❌ Erro ao ativar premium:`, premiumErr.message);
      // Mesmo com erro, retorna 200 para não reprocessar
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Premium ativado com sucesso',
      paymentId: payment.id,
      userId: payment.userId,
    });

  } catch (err: any) {
    console.error('[Webhook MP] ❌ Erro:', err.message);
    // Sempre retorna 200 para webhook não ficar reenviando
    return res.status(200).json({ ok: false, error: err.message });
  }
});

/**
 * Admin: Verificar configuração
 */
router.get('/admin/config', async (req: any, res: Response) => {
  const secret = process.env.ADMIN_SECRET;
  const provided = (req.headers['x-admin-secret'] || '') as string;
  
  if (!secret || provided !== secret) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  return res.json({
    ok: true,
    config: {
      mpConfigured: !!process.env.MP_ACCESS_TOKEN,
      webhookSecretConfigured: !!process.env.MP_WEBHOOK_SECRET,
      webhookUrl: process.env.WEBHOOK_URL || 'não configurado',
      premiumPrice: PREMIUM_PRICE,
      premiumDays: PREMIUM_DAYS,
    }
  });
});

/**
 * Admin: Listar todos pagamentos
 */
router.get('/admin/payments', async (req: any, res: Response) => {
  const secret = process.env.ADMIN_SECRET;
  const provided = (req.headers['x-admin-secret'] || '') as string;
  
  if (!secret || provided !== secret) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const payments = getAllPayments();
  return res.json({ ok: true, payments, total: payments.length });
});

/**
 * Admin: Forçar confirmação (emergência)
 */
router.post('/admin/force-confirm', async (req: any, res: Response) => {
  const secret = process.env.ADMIN_SECRET;
  const provided = (req.headers['x-admin-secret'] || '') as string;
  
  if (!secret || provided !== secret) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const { paymentId, userId } = req.body;
  
  if (!paymentId && !userId) {
    return res.status(400).json({ ok: false, error: 'paymentId ou userId obrigatório' });
  }

  try {
    let targetUserId = userId;

    if (paymentId) {
      const payment = getPaymentById(paymentId);
      if (payment) {
        await markPaymentAsApproved(paymentId);
        targetUserId = payment.userId;
      }
    }

    if (targetUserId) {
      await setPremium(targetUserId, PREMIUM_DAYS);
      console.log(`[Admin] Premium forçado para usuário ${targetUserId}`);
      return res.json({ ok: true, message: `Premium ativado para ${targetUserId}` });
    }

    return res.status(404).json({ ok: false, error: 'not_found' });

  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
