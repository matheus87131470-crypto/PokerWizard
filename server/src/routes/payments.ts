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

    // Create payment (R$ 5,90 = 590 cents)
    const payment = await createPixPayment(req.userId, 590);

    return res.json({
      ok: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        brCode: payment.brCode,
        pixKey: 'ae927522-3cf8-44b1-9e65-1797ca2ce670',
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
 * Confirm payment (manual verification)
 */
router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'invalid_request', message: 'Payment ID required' });
    }

    const payment = await confirmPixPayment(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'payment_not_found' });
    }

    if (payment.userId !== req.userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Activate premium for 30 days
    await setPremium(req.userId, 30);

    const user = await getUserById(req.userId);

    return res.json({
      ok: true,
      message: 'Premium ativado por 30 dias!',
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        premium: user?.premium,
        premiumUntil: user?.premiumUntil,
        credits: user?.credits,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'confirm_failed', message: err.message });
  }
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

    // If payment is confirmed, activate premium and return confirmed status
    if (payment.status === 'completed' && !payment.confirmedAt) {
      // Auto-confirm if status is already completed but not confirmed in DB
      await confirmPixPayment(paymentId);
      try {
        await setPremium(req.userId, 30);
      } catch (err) {
        console.error('Failed to set premium after status check', err);
      }
    }

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
 * Webhook simulation endpoint (public)
 * POST /payments/webhook
 * Body: { paymentId: string, status?: 'completed' | 'pending' | 'expired' }
 * This endpoint is for testing and will mark the payment accordingly.
 */
router.post('/webhook', async (req: any, res: Response) => {
  try {
    const { paymentId, status } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });

    const payment = await getPaymentStatus(paymentId);
    if (!payment) return res.status(404).json({ error: 'payment_not_found' });

    // If status is completed (or omitted), confirm the payment
    if (!status || status === 'completed') {
      const confirmed = await confirmPixPayment(paymentId);
      if (!confirmed) return res.status(500).json({ error: 'confirm_failed' });

      // Activate premium for the user (best-effort)
      try {
        await setPremium(confirmed.userId, 30);
      } catch (err) {
        console.error('Webhook: failed to set premium', err);
      }

      return res.json({ ok: true, payment: confirmed });
    }

    // Otherwise just set the status (for testing)
    (payment as any).status = status;
    return res.json({ ok: true, payment });
  } catch (err: any) {
    return res.status(500).json({ error: 'webhook_failed', message: err.message });
  }
});

/**
 * POST /payments/webhook
 * Simulated webhook for testing: body { paymentId }
 * This endpoint does NOT require admin secret and is intended for local testing only.
 */
router.post('/webhook', async (req: any, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });

    const payment = await confirmPixPayment(paymentId);
    if (!payment) return res.status(404).json({ error: 'payment_not_found' });

    try {
      await setPremium(payment.userId, 30);
    } catch (err) {
      console.error('Webhook: failed to set premium for user', payment.userId, err);
    }

    return res.json({ ok: true, message: 'webhook processed', payment });
  } catch (err: any) {
    return res.status(500).json({ error: 'webhook_failed', message: err.message });
  }
});
