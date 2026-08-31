import express from 'express';
import { Product } from '../models/Products.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import catchError from '../utils/catcherror.js';
import { createProductSchema, validateBody } from '../utils/validation.js';
import NodeCache from 'node-cache';

const router = express.Router();

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
const cache = new NodeCache({ stdTTL: 60 });
router.get('/', async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const cacheKey = `products:${page}:${limit}`;

        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json(cached);

        const products = await Product.find().lean().skip((page - 1) * limit).limit(limit);
        const result = { products, page, limit };
        cache.set(cacheKey, result);
        return res.status(200).json(result);
    } catch (error) {
        catchError(res, error);
    }
});

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