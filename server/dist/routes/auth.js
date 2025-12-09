"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const userService_1 = require("../services/userService");
const passport_1 = __importDefault(require("passport"));
const router = express_1.default.Router();
/**
 * POST /auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req, res) => {
    try {
        const { email, name, password, price } = req.body;
        if (!email || !name || !password) {
            return res.status(400).json({
                error: 'invalid_request',
                message: 'Email, name, and password required'
            });
        }
        const user = await (0, userService_1.createUser)(email, name, password, undefined, price);
        const token = (0, auth_1.generateToken)(user.id);
        return res.status(201).json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                credits: user.credits,
                premium: user.premium,
                price: user.price,
            },
            token,
        });
    }
    catch (err) {
        return res.status(400).json({ error: 'register_failed', message: err.message });
    }
});
/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'invalid_request',
                message: 'Email and password required'
            });
        }
        const user = await (0, userService_1.getUserByEmail)(email);
        if (!user) {
            return res.status(401).json({
                error: 'invalid_credentials',
                message: 'Invalid email or password'
            });
        }
        const isValid = await (0, userService_1.verifyPassword)(email, password);
        if (!isValid) {
            return res.status(401).json({
                error: 'invalid_credentials',
                message: 'Invalid email or password'
            });
        }
        const token = (0, auth_1.generateToken)(user.id);
        return res.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                credits: user.credits,
                premium: user.premium,
                price: user.price,
            },
            token,
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'login_failed', message: err.message });
    }
});
/**
 * GET /auth/me
 * Protected route
 */
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const user = await (0, userService_1.getUserById)(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'user_not_found' });
        }
        return res.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                credits: user.credits,
                premium: user.premium,
                premiumUntil: user.premiumUntil,
                price: user.price,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'me_failed', message: err.message });
    }
});
/**
 * GOOGLE LOGIN REDIRECT
 * /api/auth/google
 */
router.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email']
}));
/**
 * GOOGLE CALLBACK
 * /api/auth/google/callback
 */
router.get('/google/callback', passport_1.default.authenticate('google', { session: false }), async (req, res) => {
    const user = req.user;
    const token = (0, auth_1.generateToken)(user.id);
    return res.redirect(`${process.env.CLIENT_URL}/google-success?token=${token}`);
});
exports.default = router;
//# sourceMappingURL=auth.js.map