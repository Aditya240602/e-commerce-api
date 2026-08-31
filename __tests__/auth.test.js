import { jest } from '@jest/globals';
import request from 'supertest';

// Mock the User model BEFORE importing app.js, so the route picks up
// the mock instead of hitting a real database.
jest.unstable_mockModule('../models/user.js', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

// Mock password hashing / token generation so tests don't depend on
// real bcrypt cost or a real JWT secret.
jest.unstable_mockModule('../utils/auth.js', () => ({
    hashPassword: jest.fn(async (pw) => `hashed:${pw}`),
    comparePassword: jest.fn(async (pw, hash) => hash === `hashed:${pw}`),
    generateToken: jest.fn((user) => `token-for-${user._id || user.email}`),
    verifyToken: jest.fn(() => ({ id: 'fake-user-id' }))
}));

const { User } = await import('../models/user.js');
const { default: app } = await import('../app.js');

describe('POST /auth/signup', () => {
    beforeEach(() => {
        User.findOne.mockReset();
        User.create.mockReset();
    });

    const validBody = {
        name: 'Aditya Kumar',
        first_name: 'Aditya',
        last_name: 'Kumar',
        email: 'a@b.com',
        phone: 9876543210,
        password: 'password123',
        country: 'India'
    };

    it('rejects a request missing required fields', async () => {
        const res = await request(app).post('/auth/signup').send({});
        expect(res.status).toBe(400);
        expect(res.body.error.type).toBe('validation_error');
    });

    it('rejects signup if the email already exists', async () => {
        User.findOne.mockResolvedValueOnce({ email: validBody.email }); // email check

        const res = await request(app).post('/auth/signup').send(validBody);

        expect(res.status).toBe(409);
        expect(User.findOne).toHaveBeenCalledWith({ email: validBody.email });
    });

    it('rejects signup if the phone number already exists', async () => {
        User.findOne
            .mockResolvedValueOnce(null)                       // email check passes
            .mockResolvedValueOnce({ phone: validBody.phone }); // phone check fails

        const res = await request(app).post('/auth/signup').send(validBody);

        expect(res.status).toBe(409);
    });

    it('creates a new user and returns 201 with a token', async () => {
        User.findOne
            .mockResolvedValueOnce(null) // email check
            .mockResolvedValueOnce(null); // phone check
        User.create.mockResolvedValue({
            _id: 'fake123',
            ...validBody,
            password: 'hashed:password123',
            toObject() {
                const { password, ...rest } = this;
                return rest;
            }
        });

        const res = await request(app).post('/auth/signup').send(validBody);

        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe(validBody.email);
        expect(res.body.user.password).toBeUndefined(); // never leak the hash
        expect(res.body.token).toBeTruthy();
    });
});

describe('POST /auth/login', () => {
    beforeEach(() => {
        User.findOne.mockReset();
    });

    it('rejects a request missing email/password', async () => {
        const res = await request(app).post('/auth/login').send({});
        expect(res.status).toBe(400);
    });

    it('returns 401 if the user does not exist', async () => {
        User.findOne.mockResolvedValue(null);
        const res = await request(app).post('/auth/login').send({ email: 'nope@b.com', password: 'x' });
        expect(res.status).toBe(401);
    });

    it('returns 401 on a wrong password', async () => {
        User.findOne.mockResolvedValue({ email: 'a@b.com', password: 'hashed:correctpassword' });
        const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'wrongpassword' });
        expect(res.status).toBe(401);
    });

    it('logs in successfully with the right password', async () => {
        User.findOne.mockResolvedValue({
            _id: 'fake123',
            email: 'a@b.com',
            password: 'hashed:correctpassword',
            toObject() {
                const { password, ...rest } = this;
                return rest;
            }
        });

        const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'correctpassword' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
    });
});