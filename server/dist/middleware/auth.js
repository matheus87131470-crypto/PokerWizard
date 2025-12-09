"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// JWT secret from environment or fallback (MUST be changed in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/**
 * Generate a signed JWT token for a user
 * Token expires in 30 days
 *
 * @param userId - The user ID to encode in the token
 * @returns Signed JWT token string
 */
function generateToken(userId) {
    if (!userId) {
        throw new Error('userId is required to generate token');
    }
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, {
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
function verifyToken(token) {
    if (!token) {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            algorithms: ['HS256']
        });
        return decoded;
    }
    catch (err) {
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
function authMiddleware(req, res, next) {
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
    }
    catch (err) {
        return res.status(401).json({
            error: 'auth_error',
            message: 'Authentication failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}
//# sourceMappingURL=auth.js.map