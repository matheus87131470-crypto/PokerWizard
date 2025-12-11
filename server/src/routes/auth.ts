import express, { Request, Response } from 'express';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { createUser, getUserByEmail, getUserById, verifyPassword, updatePassword } from '../services/userService';
import { canCreateAccount, registerAccount, getRealIP } from '../services/antiFraud';
import { createResetToken, verifyResetCode, invalidateResetToken } from '../services/passwordResetService';
import { sendPasswordResetEmail } from '../services/emailService';
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

/**
 * POST /auth/forgot-password
 * Solicita recuperação de senha - envia código por email
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email é obrigatório',
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return res.json({
        ok: true,
        message: 'Se o email existir em nossa base, você receberá um código de recuperação.',
      });
    }

    // Gera código de 6 dígitos
    const code = createResetToken(email);

    // Envia email com o código
    await sendPasswordResetEmail(email, code, user.name);

    return res.json({
      ok: true,
      message: 'Código de recuperação enviado para seu email.',
    });
  } catch (err: any) {
    console.error('[forgot-password] Error:', err);
    return res.status(500).json({
      error: 'email_failed',
      message: 'Erro ao enviar email de recuperação. Tente novamente.',
    });
  }
});

/**
 * POST /auth/verify-reset-code
 * Verifica se o código de recuperação está correto
 */
router.post('/verify-reset-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email e código são obrigatórios',
      });
    }

    const isValid = verifyResetCode(email, code);

    if (!isValid) {
      return res.status(400).json({
        error: 'invalid_code',
        message: 'Código inválido ou expirado',
      });
    }

    return res.json({
      ok: true,
      message: 'Código verificado com sucesso',
    });
  } catch (err: any) {
    console.error('[verify-reset-code] Error:', err);
    return res.status(500).json({
      error: 'verification_failed',
      message: 'Erro ao verificar código',
    });
  }
});

/**
 * POST /auth/reset-password
 * Redefine a senha usando o código verificado
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email, código e nova senha são obrigatórios',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'weak_password',
        message: 'A senha deve ter pelo menos 6 caracteres',
      });
    }

    // Verifica o código novamente
    const isValid = verifyResetCode(email, code);
    if (!isValid) {
      return res.status(400).json({
        error: 'invalid_code',
        message: 'Código inválido ou expirado',
      });
    }

    // Atualiza a senha
    await updatePassword(email, newPassword);

    // Invalida o token após uso
    invalidateResetToken(email);

    return res.json({
      ok: true,
      message: 'Senha redefinida com sucesso',
    });
  } catch (err: any) {
    console.error('[reset-password] Error:', err);
    return res.status(500).json({
      error: 'reset_failed',
      message: err.message || 'Erro ao redefinir senha',
    });
  }
});

export default router;
