"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pixService_1 = require("../services/pixService");
const userService_1 = require("../services/userService");
const router = express_1.default.Router();
/**
 * POST /payments/create-pix
 * Create a new PIX payment (generates QR Code)
 */
router.post('/create-pix', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const user = await (0, userService_1.getUserById)(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'user_not_found' });
        }
        // Create payment (R$ 5,90 = 590 cents)
        const payment = await (0, pixService_1.createPixPayment)(req.userId, 590);
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
    }
    catch (err) {
        return res.status(500).json({ error: 'create_pix_failed', message: err.message });
    }
});
/**
 * POST /payments/confirm
 * Confirm payment (manual verification)
 */
router.post('/confirm', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const { paymentId } = req.body;
        if (!paymentId) {
            return res.status(400).json({ error: 'invalid_request', message: 'Payment ID required' });
        }
        const payment = await (0, pixService_1.confirmPixPayment)(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'payment_not_found' });
        }
        if (payment.userId !== req.userId) {
            return res.status(403).json({ error: 'forbidden' });
        }
        // Activate premium for 30 days
        await (0, userService_1.setPremium)(req.userId, 30);
        const user = await (0, userService_1.getUserById)(req.userId);
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
    }
    catch (err) {
        return res.status(500).json({ error: 'confirm_failed', message: err.message });
    }
});
/**
 * GET /payments/status/:paymentId
 * Check payment status
 */
router.get('/status/:paymentId', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const { paymentId } = req.params;
        const payment = await (0, pixService_1.getPaymentStatus)(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'payment_not_found' });
        }
        if (payment.userId !== req.userId) {
            return res.status(403).json({ error: 'forbidden' });
        }
        return res.json({
            ok: true,
            payment: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount / 100,
                createdAt: payment.createdAt,
                confirmedAt: payment.confirmedAt,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'status_failed', message: err.message });
    }
});
exports.default = router;
/**
 * Admin endpoints (protected by ADMIN_SECRET header)
 * Header: x-admin-secret: <value>
 */
function checkAdminSecret(req, res) {
    const secret = process.env.ADMIN_SECRET;
    const provided = (req.headers['x-admin-secret'] || '');
    if (!secret)
        return false;
    return provided === secret;
}
// List all payments (admin)
router.get('/admin/payments', async (req, res) => {
    try {
        if (!checkAdminSecret(req, res)) {
            return res.status(403).json({ error: 'forbidden', message: 'Admin secret required' });
        }
        const payments = (0, pixService_1.getAllPayments)();
        return res.json({ ok: true, payments });
    }
    catch (err) {
        return res.status(500).json({ error: 'admin_list_failed', message: err.message });
    }
});
// Force confirm payment (admin)
router.post('/admin/confirm', async (req, res) => {
    try {
        if (!checkAdminSecret(req, res)) {
            return res.status(403).json({ error: 'forbidden', message: 'Admin secret required' });
        }
        const { paymentId } = req.body;
        if (!paymentId)
            return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });
        const payment = await (0, pixService_1.confirmPixPayment)(paymentId);
        if (!payment)
            return res.status(404).json({ error: 'payment_not_found' });
        try {
            await (0, userService_1.setPremium)(payment.userId, 30);
        }
        catch (err) {
            // ignore setPremium failure but log
            console.error('Failed to set premium for user after admin confirm', payment.userId, err);
        }
        return res.json({ ok: true, payment });
    }
    catch (err) {
        return res.status(500).json({ error: 'admin_confirm_failed', message: err.message });
    }
});
/**
 * Webhook simulation endpoint (public)
 * POST /payments/webhook
 * Body: { paymentId: string, status?: 'completed' | 'pending' | 'expired' }
 * This endpoint is for testing and will mark the payment accordingly.
 */
router.post('/webhook', async (req, res) => {
    try {
        const { paymentId, status } = req.body;
        if (!paymentId)
            return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });
        const payment = await (0, pixService_1.getPaymentStatus)(paymentId);
        if (!payment)
            return res.status(404).json({ error: 'payment_not_found' });
        // If status is completed (or omitted), confirm the payment
        if (!status || status === 'completed') {
            const confirmed = await (0, pixService_1.confirmPixPayment)(paymentId);
            if (!confirmed)
                return res.status(500).json({ error: 'confirm_failed' });
            // Activate premium for the user (best-effort)
            try {
                await (0, userService_1.setPremium)(confirmed.userId, 30);
            }
            catch (err) {
                console.error('Webhook: failed to set premium', err);
            }
            return res.json({ ok: true, payment: confirmed });
        }
        // Otherwise just set the status (for testing)
        payment.status = status;
        return res.json({ ok: true, payment });
    }
    catch (err) {
        return res.status(500).json({ error: 'webhook_failed', message: err.message });
    }
});
/**
 * POST /payments/webhook
 * Simulated webhook for testing: body { paymentId }
 * This endpoint does NOT require admin secret and is intended for local testing only.
 */
router.post('/webhook', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId)
            return res.status(400).json({ error: 'invalid_request', message: 'paymentId required' });
        const payment = await (0, pixService_1.confirmPixPayment)(paymentId);
        if (!payment)
            return res.status(404).json({ error: 'payment_not_found' });
        try {
            await (0, userService_1.setPremium)(payment.userId, 30);
        }
        catch (err) {
            console.error('Webhook: failed to set premium for user', payment.userId, err);
        }
        return res.json({ ok: true, message: 'webhook processed', payment });
    }
    catch (err) {
        return res.status(500).json({ error: 'webhook_failed', message: err.message });
    }
});
//# sourceMappingURL=payments.js.map