import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../models/Cart.js', () => ({
    Cart: { findOne: jest.fn(), create: jest.fn() }
}));
jest.unstable_mockModule('../models/Products.js', () => ({
    Product: { findById: jest.fn(), find: jest.fn(), create: jest.fn() }
}));
jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => { req.user_info = { _id: 'test-user-id', isAdmin: false }; next(); },
    requireAdmin: (req, res, next) => next()
}));

const { Cart } = await import('../models/Cart.js');
const { Product } = await import('../models/Products.js');
const { default: app } = await import('../app.js');

describe('POST /cart/items', () => {
    beforeEach(() => {
        Cart.findOne.mockReset();
        Cart.create.mockReset();
        Product.findById.mockReset();
    });

    it('rejects a missing productId', async () => {
        const res = await request(app).post('/cart/items').send({ quantity: 2 });
        expect(res.status).toBe(400);
    });

    it('404s when the product does not exist', async () => {
        Product.findById.mockResolvedValue(null);
        const res = await request(app).post('/cart/items').send({ productId: 'abc123', quantity: 1 });
        expect(res.status).toBe(404);
    });

    it('adds a new item to an existing empty cart', async () => {
        Product.findById.mockResolvedValue({ _id: 'abc123', name: 'Test product' });
        const saveMock = jest.fn().mockResolvedValue();
        Cart.findOne.mockResolvedValue({ items: [], save: saveMock });

        const res = await request(app).post('/cart/items').send({ productId: 'abc123', quantity: 3 });

        expect(res.status).toBe(200);
        expect(saveMock).toHaveBeenCalled();
    });

    it('increments quantity if the item is already in the cart', async () => {
        Product.findById.mockResolvedValue({ _id: 'abc123' });
        const saveMock = jest.fn().mockResolvedValue();
        Cart.findOne.mockResolvedValue({
            items: [{ product: { toString: () => 'abc123' }, quantity: 2 }],
            save: saveMock
        });

        const res = await request(app).post('/cart/items').send({ productId: 'abc123', quantity: 5 });

        expect(res.status).toBe(200);
        expect(res.body.cart.items[0].quantity).toBe(7);
    });
});

describe('DELETE /cart/items/:productId', () => {
    it('404s if the user has no cart', async () => {
        Cart.findOne.mockResolvedValue(null);
        const res = await request(app).delete('/cart/items/abc123');
        expect(res.status).toBe(404);
    });

    it('removes the item and saves', async () => {
        const saveMock = jest.fn().mockResolvedValue();
        Cart.findOne.mockResolvedValue({
            items: [{ product: { toString: () => 'abc123' } }, { product: { toString: () => 'xyz789' } }],
            save: saveMock
        });

        const res = await request(app).delete('/cart/items/abc123');

        expect(res.status).toBe(200);
        expect(saveMock).toHaveBeenCalled();
    });
});