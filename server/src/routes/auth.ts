import express, { Request, Response } from 'express';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { createUser, getUserByEmail, getUserById, verifyPassword } from '../services/userService';
import { canCreateAccount, registerAccount, getRealIP } from '../services/antiFraud';
import passport from 'passport';

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user with email and password
 * Includes anti-fraud protection
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, price, deviceInfo } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email, name, and password required'
      });
    }

    // Anti-fraude: verificar se pode criar conta
    const fraudCheck = canCreateAccount(req, email, deviceInfo);
    if (!fraudCheck.allowed) {
      return res.status(403).json({
        error: 'account_creation_blocked',
        message: fraudCheck.reason,
        waitTime: fraudCheck.waitTime
      });
    }

    const user = await createUser(email, name, password, undefined, price);
    
    // Registrar conta criada para controle anti-fraude
    registerAccount(req, email, deviceInfo);
    
    const token = generateToken(user.id);

    return res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        usosRestantes: (user as any).usosRestantes ?? user.credits,
        statusPlano: (user as any).statusPlano ?? (user.premium ? 'premium' : 'free'),
        premium: user.premium,
        price: user.price ?? 5.9,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'register_failed', message: err.message });
  }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email and password required'
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    const isValid = await verifyPassword(email, password);
    if (!isValid) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id);

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        usosRestantes: (user as any).usosRestantes ?? user.credits,
        statusPlano: (user as any).statusPlano ?? (user.premium ? 'premium' : 'free'),
        premium: user.premium,
        price: user.price ?? 5.9,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'login_failed', message: err.message });
  }
});

/**
 * GET /auth/me
 * Protected route
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const user = await getUserById(req.userId);
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
        usosRestantes: (user as any).usosRestantes ?? user.credits,
        statusPlano: (user as any).statusPlano ?? (user.premium ? 'premium' : 'free'),
        premium: user.premium,
        premiumUntil: user.premiumUntil,
        price: user.price ?? 5.9,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'me_failed', message: err.message });
  }
});

/**
 * GOOGLE LOGIN REDIRECT
 * /api/auth/google
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * GOOGLE CALLBACK
 * /api/auth/google/callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req: any, res: Response) => {
    const user = req.user;

    const token = generateToken(user.id);

    return res.redirect(`${process.env.CLIENT_URL}/google-success?token=${token}`);
  }
);

export default router;
