import express from 'express';
import { Product } from '../models/Products.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import catchError from '../utils/catcherror.js';
import { createProductSchema, validateBody } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /products - create a new product (admin only)
 */
router.post('/', requireAuth, requireAdmin, express.json(), async function (req, res) {
    try {
        const body = validateBody(createProductSchema, req.body, res);
        if (!body) return;

        const product = await Product.create(body);
        return res.status(201).json({ product });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * GET /products - list all products (public)
 * Handy for grabbing a real _id to use when testing the cart.
 */
router.get('/', async function (req, res) {
    try {
        const products = await Product.find();
        return res.status(200).json({ products });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * GET /products/:id - get one product by its Mongo _id
 */
router.get('/:id', async function (req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: { type: 'not_found', message: 'Product not found' } });
        }
        return res.status(200).json({ product });
    } catch (error) {
        catchError(res, error);
    }
});

export default router;