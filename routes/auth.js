import express from 'express';
import { User } from '../models/user.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import catchError from '../utils/catcherror.js';
import { signupSchema, loginSchema, validateBody } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /auth/signup
 * Replaces the old /create-user debug route (plain text password, GET request).
 * Body validated with Zod (see utils/validation.js) instead of manual `if` checks.
 */
router.post('/signup', express.json(), async function (req, res) {
    try {
        const body = validateBody(signupSchema, req.body, res);
        if (!body) return; // validateBody already sent the 400 response

        const { name, first_name, last_name, email, phone, password, country, city, district, date_of_birth, gender } = body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                error: { type: 'conflict', message: 'A user with this email already exists' }
            });
        }

        // phone is unique + type Number on the schema
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({
                error: { type: 'conflict', message: 'A user with this phone number already exists' }
            });
        }

        const hashed = await hashPassword(password);

        const user = await User.create({
            name, first_name, last_name, email,
            phone, // already coerced to a Number by the Zod schema
            country, city, district, date_of_birth,
            gender: gender || 'male', // schema default
            password: hashed,
            isRegistered: true,
            isAdmin: false
        });

        const token = generateToken(user);
        const { password: _omit, ...safeUser } = user.toObject();

        return res.status(201).json({ user: safeUser, token });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * POST /auth/login
 */
router.post('/login', express.json(), async function (req, res) {
    try {
        const body = validateBody(loginSchema, req.body, res);
        if (!body) return;

        const { email, password } = body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                error: { type: 'unauthorized', message: 'Invalid email or password' }
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: { type: 'unauthorized', message: 'Invalid email or password' }
            });
        }

        const token = generateToken(user);
        const { password: _omit, ...safeUser } = user.toObject();

        return res.status(200).json({ user: safeUser, token });
    } catch (error) {
        catchError(res, error);
    }
});

export default router;
