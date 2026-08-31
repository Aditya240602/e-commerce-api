import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../models/Products.js', () => ({
    Product: { create: jest.fn(), find: jest.fn(), findById: jest.fn() }
}));

describe('GET /products (public)', () => {
    let Product, app;
    beforeAll(async () => {
        jest.unstable_mockModule('../middleware/auth.js', () => ({
            requireAuth: (req, res, next) => { req.user_info = { _id: 'u1', isAdmin: false }; next(); },
            requireAdmin: (req, res, next) => next()
        }));
        Product = (await import('../models/Products.js')).Product;
        app = (await import('../app.js')).default;
    });

    it('returns the product list', async () => {
        Product.find.mockResolvedValue([{ name: 'A' }, { name: 'B' }]);
        const res = await request(app).get('/products');
        expect(res.status).toBe(200);
        expect(res.body.products).toHaveLength(2);
    });
});

describe('POST /products (admin only)', () => {
    it('rejects a non-admin user with 403', async () => {
        jest.resetModules();
        jest.unstable_mockModule('../middleware/auth.js', () => ({
            requireAuth: (req, res, next) => { req.user_info = { _id: 'u1', isAdmin: false }; next(); },
            requireAdmin: (req, res, next) => res.status(403).json({ error: { type: 'forbidden' } })
        }));
        const { default: appNonAdmin } = await import('../app.js');
        const res = await request(appNonAdmin).post('/products').send({ name: 'Shirt', price: '19.99' });
        expect(res.status).toBe(403);
    });

    it('creates a product when an admin sends valid data', async () => {
        jest.resetModules();
        jest.unstable_mockModule('../middleware/auth.js', () => ({
            requireAuth: (req, res, next) => { req.user_info = { _id: 'admin1', isAdmin: true }; next(); },
            requireAdmin: (req, res, next) => next()
        }));
        jest.unstable_mockModule('../models/Products.js', () => ({
            Product: {
                create: jest.fn().mockResolvedValue({ _id: 'p1', name: 'Shirt', price: '19.99' }),
                find: jest.fn()
            }
        }));
        const { default: appAdmin } = await import('../app.js');
        const res = await request(appAdmin).post('/products').send({ name: 'Shirt', price: '19.99' });
        expect(res.status).toBe(201);
        expect(res.body.product.name).toBe('Shirt');
    });

    it('rejects missing required fields with 400', async () => {
        jest.resetModules();
        jest.unstable_mockModule('../middleware/auth.js', () => ({
            requireAuth: (req, res, next) => { req.user_info = { _id: 'admin1', isAdmin: true }; next(); },
            requireAdmin: (req, res, next) => next()
        }));
        const { default: appAdmin } = await import('../app.js');
        const res = await request(appAdmin).post('/products').send({});
        expect(res.status).toBe(400);
    });
});