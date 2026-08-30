import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // set this in your .env / env.js
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a plain text password before saving a user.
 */
export async function hashPassword(plainPassword) {
    const saltRounds = 10;
    return bcrypt.hash(plainPassword, saltRounds);
}

/**
 * Compare a plain text password against the stored hash.
 */
export async function comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Sign a JWT for a given user id + role.
 */
export function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, isAdmin: !!user.isAdmin },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * Verify a token and return its decoded payload, or null if invalid.
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}
