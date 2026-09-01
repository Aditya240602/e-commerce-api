import { z } from 'zod';

/**
 * Centralized request validation schemas.
 * Keeping these in one file makes it easy to see every input contract
 * the API accepts, and keeps routes free of repeated manual `if` checks.
 */

export const signupSchema = z.object({
    name: z.string().min(1, 'name is required'),
    first_name: z.string().min(1, 'first_name is required'),
    last_name: z.string().min(1, 'last_name is required'),
    email: z.string().email('a valid email is required'),
    // Schema stores phone as Number, but request bodies send strings/numbers —
    // coerce so "+8801..." style strings are accepted then normalized.
    phone: z.coerce.number({ invalid_type_error: 'phone must be a number' }),
    password: z.string().min(8, 'password must be at least 8 characters'),
    country: z.string().min(1, 'country is required'),
    city: z.string().optional(),
    district: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.string().optional()
});

export const loginSchema = z.object({
    email: z.string().email('a valid email is required'),
    password: z.string().min(1, 'password is required')
});
export const createProductSchema = z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
    cetegory: z.string().optional(),
    thumb: z.string().optional(),
    images: z.array(z.string()).optional(),
    date: z.string().optional(),
    selling_style: z.string().optional(),
    price: z.string().min(1, 'price is required'), // stored as String per your schema
    size_and_price: z.array(z.object({
        size: z.string(),
        price: z.string()
    })).optional(),
    size: z.string().optional()
});

/**
 * PATCH /products/:id
 * Same field set as createProductSchema, but every field is optional since
 * this is a partial update — the admin might only want to change the price,
 * or only the thumb, etc. `.partial()` on its own would still accept an
 * empty object ({}), so `.refine` rejects a request that changes nothing —
 * that's almost certainly a frontend bug, not a real intent to "update".
 */
export const updateProductSchema = createProductSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'at least one field must be provided to update'
    });

export const addToCartSchema = z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.coerce.number().int().min(1).default(1)
});

export const activateOrderSchema = z.object({
    id: z.coerce.number({ invalid_type_error: 'id must be a number' }),
    shipping_cost: z.coerce.number({ invalid_type_error: 'shipping_cost must be a number' }).nonnegative()
});

/**
 * Small helper so every route validates the same way and returns the
 * same error shape on failure, instead of repeating try/catch boilerplate.
 *
 * Usage:
 *   const parsed = validateBody(signupSchema, req.body, res);
 *   if (!parsed) return; // response already sent
 *   const { email, password } = parsed;
 */
export function validateBody(schema, data, res) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const message = result.error.issues.map(issue => issue.message).join(', ');
        res.status(400).json({
            error: { type: 'validation_error', message }
        });
        return null;
    }
    return result.data;
}