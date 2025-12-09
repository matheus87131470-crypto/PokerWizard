import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT secret from environment or fallback (MUST be changed in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Extended Express Request interface that includes userId and user data
 * Used in protected routes to access authenticated user information
 */
export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * Type-safe JWT payload interface
 */
interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a signed JWT token for a user
 * Token expires in 30 days
 * 
 * @param userId - The user ID to encode in the token
 * @returns Signed JWT token string
 */
export function generateToken(userId: string): string {
  if (!userId) {
    throw new Error('userId is required to generate token');
  }
  
  return jwt.sign({ userId } as TokenPayload, JWT_SECRET, { 
    expiresIn: '30d',
    algorithm: 'HS256'
  });
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 * 
 * @param token - The JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as TokenPayload;
    return decoded;
  } catch (err: any) {
    // Log token verification errors in debug mode
    if (process.env.DEBUG === 'true') {
      console.log(`[auth] Token verification failed: ${err.message}`);
    }
    return null;
  }
}

/**
 * Express middleware for JWT authentication
 * Validates Bearer token in Authorization header
 * Attaches userId to request object for protected routes
 * 
 * Usage: router.post('/protected', authMiddleware, (req: AuthRequest, res) => { ... })
 * 
 * @param req - Express request (extends AuthRequest)
 * @param res - Express response
 * @param next - Express next middleware function
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): any {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'missing_token',
        message: 'Authorization header is required'
      });
    }

    // Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'invalid_auth_format',
        message: 'Authorization header must be in format "Bearer <token>"'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7).trim();
    
    if (!token) {
      return res.status(401).json({ 
        error: 'missing_token',
        message: 'Token is empty'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ 
        error: 'invalid_token',
        message: 'Invalid or expired token'
      });
    }

    // Attach userId to request for use in route handlers
    req.userId = decoded.userId;
    
    // Continue to next middleware/route handler
    next();
  } catch (err: any) {
    return res.status(401).json({ 
      error: 'auth_error',
      message: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
