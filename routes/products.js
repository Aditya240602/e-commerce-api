import express from 'express';
import zlib from 'node:zlib';
import { Product } from '../models/Products.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import catchError from '../utils/catcherror.js';
import { createProductSchema, updateProductSchema, validateBody } from '../utils/validation.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60 });

/**
 * GET /products is cached per page/limit combo for 60s (see below). Any
 * route that creates, edits, or deletes a product needs to clear that
 * cache — otherwise a change can take up to a minute to show up, which
 * looks exactly like the write silently failed.
 *
 * We don't know every page/limit combo a client may have cached, so we
 * just clear every `products:*` key rather than trying to guess which
 * ones are now stale.
 */
function clearProductsCache() {
    const staleKeys = cache.keys().filter((key) => key.startsWith('products:'));
    if (staleKeys.length) cache.del(staleKeys);
}

router.post('/', requireAuth, requireAdmin, express.json(), async function (req, res) {
    try {
        const body = validateBody(createProductSchema, req.body, res);
        if (!body) return;

        const product = await Product.create(body);
        clearProductsCache();
        return res.status(201).json({ product });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * PERFORMANCE NOTE:
 * The global `compression()` middleware in app.js gzips every response as
 * it goes out — including cache hits. That means the same handful of
 * cached JSON payloads were being re-gzipped on EVERY single request that
 * hit them (thousands of times under load), even though the bytes never
 * changed within the 60s TTL window. Gzip is CPU-bound, and on a single
 * Node process that repeated work was the main thing capping throughput
 * once traffic passed a few hundred concurrent connections.
 *
 * Fix: gzip the payload ONCE, right when it's computed, and cache both the
 * plain JSON and the pre-gzipped buffer. Every cache hit afterward just
 * writes the already-compressed bytes straight to the socket — no
 * JSON.stringify, no gzip, on the hot path. Setting Content-Encoding
 * ourselves also makes the `compression()` middleware skip this response
 * (it never double-compresses a response that already declares an
 * encoding), so we're not paying for compression twice.
 */
router.get('/', async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const cacheKey = `products:${page}:${limit}`;
        const acceptsGzip = (req.headers['accept-encoding'] || '').includes('gzip');

        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('Content-Type', 'application/json; charset=utf-8');
            if (acceptsGzip) {
                res.set('Content-Encoding', 'gzip');
                return res.status(200).send(cached.gzip);
            }
            return res.status(200).send(cached.json);
        }

        const products = await Product.find().lean().skip((page - 1) * limit).limit(limit);
        const result = { products, page, limit };

        const json = JSON.stringify(result);
        const gzip = zlib.gzipSync(json);
        cache.set(cacheKey, { json, gzip });

        res.set('Content-Type', 'application/json; charset=utf-8');
        if (acceptsGzip) {
            res.set('Content-Encoding', 'gzip');
            return res.status(200).send(gzip);
        }
        return res.status(200).send(json);
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

/**
 * PATCH /products/:id
 * Admin-only partial update. Uses the same createProductSchema fields
 * (all made optional by updateProductSchema) so it stays in sync with
 * whatever fields POST / accepts — add a field to createProductSchema
 * and it's automatically editable here too.
 */
router.patch('/:id', requireAuth, requireAdmin, express.json(), async function (req, res) {
    try {
        const body = validateBody(updateProductSchema, req.body, res);
        if (!body) return;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: { type: 'not_found', message: 'Product not found' } });
        }

        clearProductsCache();
        return res.status(200).json({ product });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * DELETE /products/:id
 * Admin-only.
 */
router.delete('/:id', requireAuth, requireAdmin, async function (req, res) {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: { type: 'not_found', message: 'Product not found' } });
        }

        clearProductsCache();
        return res.status(200).json({ product });
    } catch (error) {
        catchError(res, error);
    }
});

export default router;