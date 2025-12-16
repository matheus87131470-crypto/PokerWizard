import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createPixPayment, confirmPixPayment, getPaymentStatus, getAllPayments } from '../services/pixService';
import { getUserById, setPremium } from '../services/userService';

const router = express.Router();

/**
 * POST /payments/create-pix
 * Create a new PIX payment (generates QR Code)
 */
router.post('/create-pix', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    // Create payment (R$ 3,50 = 350 cents)
    const payment = await createPixPayment(req.userId, 350);

    return res.json({
      ok: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        brCode: payment.brCode,
        pixKey: '+5531985388459',
        pixName: 'Matheus Alves Cordeiro',
        expiresIn: payment.expiresIn,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'create_pix_failed', message: err.message });
  }
});

/**
 * POST /payments/confirm
 * DESABILITADO - Confirmação manual removida por segurança
 * Premium só pode ser ativado via admin ou webhook
 */
router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  // SEGURANÇA: Usuários NÃO podem confirmar pagamentos manualmente
  // Apenas admin ou webhook podem confirmar
  return res.status(403).json({ 
    ok: false,
    error: 'forbidden', 
    message: 'Confirmação manual desabilitada. Aguarde a confirmação automática do pagamento.' 
  });
});

/**
 * GET /payments/status/:paymentId
 * Check payment status (for polling from frontend)
 */
router.get('/status/:paymentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { paymentId } = req.params;
    const payment = await getPaymentStatus(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'payment_not_found' });
    }

    if (payment.userId !== req.userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // SEGURANÇA: NÃO auto-confirmar pagamentos
    // Premium só é ativado via admin ou webhook com verificação real

    return res.json({
      ok: true,
      status: payment.status,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount / 100,
        createdAt: payment.createdAt,
        confirmedAt: payment.confirmedAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'status_failed', message: err.message });
  }
});

export default router;

/**
 * Admin endpoints (protected by ADMIN_SECRET header)
 * Header: x-admin-secret: <value>
 */
function checkAdminSecret(req: any, res: Response) {
  const secret = process.env.ADMIN_SECRET;
  const provided = (req.headers['x-admin-secret'] || '') as string;
  if (!secret) return false;
  return provided === secret;
}

// List all payments (admin)
router.get('/admin/payments', async (req: any, res: Response) => {
  try {
    if (!checkAdminSecret(req, res)) {
      return res.status(403).json({ error: 'forbidden', message: 'Admin secret required' });
    }

    const payments = getAllPayments();
    return res.json({ ok: true, payments });
  } catch (err: any) {
    return res.status(500).json({ error: 'admin_list_failed', message: err.message });
  }
});

// Force confirm payment (admin)
router.post('/admin/confirm', async (req: any, res: Response) => {
  try {
    if (!checkAdminSecret(req, res)) {
      return res.status(403).json({ error: 'forbidden', message: 'Admin secret required' });
    }

    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });

    const payment = await confirmPixPayment(paymentId);
    if (!payment) return res.status(404).json({ error: 'payment_not_found' });

    try {
      await setPremium(payment.userId, 30);
    } catch (err) {
      // ignore setPremium failure but log
      console.error('Failed to set premium for user after admin confirm', payment.userId, err);
    }

    return res.json({ ok: true, payment });
  } catch (err: any) {
    return res.status(500).json({ error: 'admin_confirm_failed', message: err.message });
  }
});

/**
 * POST /payments/webhook
 * Webhook endpoint PROTEGIDO para confirmar pagamentos
 * REQUER: x-webhook-secret header OU ADMIN_SECRET
 * Body: { paymentId: string }
 */
router.post('/webhook', async (req: any, res: Response) => {
  try {
    // SEGURANÇA: Verificar webhook secret ou admin secret
    const webhookSecret = process.env.WEBHOOK_SECRET || process.env.ADMIN_SECRET;
    const providedSecret = (req.headers['x-webhook-secret'] || req.headers['x-admin-secret'] || '') as string;
    
    if (!webhookSecret || providedSecret !== webhookSecret) {
      console.warn('[SECURITY] Unauthorized webhook attempt from', req.ip);
      return res.status(403).json({ 
        ok: false,
        error: 'forbidden', 
        message: 'Webhook secret inválido ou não fornecido' 
      });
    }

    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });

    const payment = await getPaymentStatus(paymentId);
    if (!payment) return res.status(404).json({ error: 'payment_not_found' });

    // Confirmar pagamento
    const confirmed = await confirmPixPayment(paymentId);
    if (!confirmed) return res.status(500).json({ error: 'confirm_failed' });

    // Ativar premium
    try {
      await setPremium(confirmed.userId, 30);
      console.log(`[WEBHOOK] Premium ativado para usuário ${confirmed.userId}`);
    } catch (err) {
      console.error('Webhook: failed to set premium', err);
    }

    return res.json({ ok: true, payment: confirmed });
