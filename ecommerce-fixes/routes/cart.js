import express from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Products.js';
import { requireAuth } from '../middleware/auth.js';
import catchError from '../utils/catcherror.js';
import { addToCartSchema, validateBody } from '../utils/validation.js';

const router = express.Router();

// All cart routes require a logged-in user
router.use(requireAuth);

/**
 * GET /cart - view the current user's cart, populated with product details
 */
router.get('/', async function (req, res) {
    try {
        let cart = await Cart.findOne({ user: req.user_info._id }).populate('items.product');
        if (!cart) {
            cart = await Cart.create({ user: req.user_info._id, items: [] });
        }
        return res.status(200).json({ cart });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * POST /cart/items - add a product to the cart (or increase quantity if already present)
 * body: { productId, quantity }
 */
router.post('/items', express.json(), async function (req, res) {
    try {
        const body = validateBody(addToCartSchema, req.body, res);
        if (!body) return;

        const { productId, quantity } = body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: { type: 'not_found', message: 'Product not found' } });
        }

        let cart = await Cart.findOne({ user: req.user_info._id });
        if (!cart) {
            cart = new Cart({ user: req.user_info._id, items: [] });
        }

        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        return res.status(200).json({ cart });
    } catch (error) {
        catchError(res, error);
    }
});

/**
 * DELETE /cart/items/:productId - remove a product from the cart
 */
router.delete('/items/:productId', async function (req, res) {
    try {
        const cart = await Cart.findOne({ user: req.user_info._id });
        if (!cart) {
            return res.status(404).json({ error: { type: 'not_found', message: 'Cart not found' } });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
        await cart.save();
        return res.status(200).json({ cart });
    } catch (error) {
        catchError(res, error);
    }
});

export default router;
