import { verifyToken } from '../utils/auth.js';
import { User } from '../models/user.js';

/**
 * Requires a valid JWT in the Authorization header ("Bearer <token>").
 * Replaces the old `User.findOne({})` placeholder — now req.user_info
 * is always the ACTUAL logged-in user, not a random one from the DB.
 */
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({
                error: { type: 'unauthorized', message: 'No token provided' }
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                error: { type: 'unauthorized', message: 'Invalid or expired token' }
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                error: { type: 'unauthorized', message: 'User no longer exists' }
            });
        }

        req.user_info = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: { type: 'server_error', message: 'Auth check failed' }
        });
    }
}

/**
 * Requires the logged-in user to be an admin. Always use AFTER requireAuth.
 * This is what was missing from /activate, /create-products, /create-user.
 */
export function requireAdmin(req, res, next) {
    if (!req.user_info || !req.user_info.isAdmin) {
        return res.status(403).json({
            error: { type: 'forbidden', message: 'Admin access required' }
        });
    }
    next();
}
