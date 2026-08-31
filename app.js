import path from 'path';
import { __dirname, T_PAYPAL_CLIENT_ID, T_PAYPAL_SECRET, BASE_URL } from './env.js';
import express from 'express';
import catchError, { namedErrorCatching } from './utils/catcherror.js';
import Orders from './models/order.js';
import { Cart } from './models/Cart.js';
import CheckOut from './utils/checkout.js';
import PaypalPayment from './utils/paypal.js';
import StripePay from './utils/stripe.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import productRoutes from './routes/products.js';
import { activateOrderSchema, validateBody } from './utils/validation.js';

import cors from 'cors';
// ... other imports

const app = express();
import compression from 'compression';
app.use(compression());
app.use(cors({
    origin: 'http://localhost:3001', // your frontend's dev URL — tighten this for production
    credentials: true // needed if you ever move the JWT to an httpOnly cookie
}));


app.use('/pages', express.static(path.resolve(__dirname, './pages')));
app.use('/auth', authRoutes);
app.use('/cart', cartRoutes);
app.use('/products', productRoutes);

/**
 * POST /checkout
 * FIXED: now builds the order from the logged-in user's REAL cart,
 * instead of grabbing a random user and assigning random quantities/prices
 * to every product in the database.
 */
app.post(
    '/checkout',
    requireAuth,
    express.urlencoded({ extended: false }),
    express.json(),
    async function (req, res) {
        try {
            const cart = await Cart.findOne({ user: req.user_info._id }).populate('items.product');

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    error: { type: 'empty_cart', message: 'Your cart is empty' }
                });
            }

            const shipping_items = cart.items.map(item => ({
                _id: String(item.product._id),
                item_name: item.product.name,
                size: item.product.size || 'N/A',
                quantity: item.quantity,
                // Product.price is stored as a String in your schema — convert it
                per_price: Number(item.product.price)
            }));

            req.body.items = shipping_items;

            const buyerandreciverInfo = CheckOut.giveReciverData(req);
            const shippingProdData = CheckOut.giveProductData(req);

            const order = new Orders({
                ...shippingProdData,
                ...buyerandreciverInfo,
                // The real reference to the logged-in user lives at buyer.id
                // in your Orders schema (not a top-level `user` field).
                // This OVERRIDES whatever CheckOut.giveReciverData() set,
                // guaranteeing the order is tied to whoever is actually logged in.
                buyer: {
                    ...(buyerandreciverInfo?.buyer || {}),
                    id: req.user_info._id,
                    email: req.user_info.email,
                    phone: String(req.user_info.phone)
                }
            });

            await order.save();

            // Clear the cart once the order is placed
            cart.items = [];
            await cart.save();

            return res.status(201).json({ order });
        } catch (error) {
            catchError(res, error);
        }
    }
);

/**
 * PUT /activate
 * FIXED: now requires an authenticated ADMIN, not open to anyone.
 */
app.put('/activate', requireAuth, requireAdmin, express.json(), async function (req, res) {
    try {
        const body = validateBody(activateOrderSchema, req.body, res);
        if (!body) return;

        const { shipping_cost, id } = body;

        const order = await Orders.findOne({ id });
        if (!order) {
            return res.status(404).json({
                error: { type: 'not_found', message: 'No order was found, please try again' }
            });
        }

        order.adminApproved.activationTime = new Date();
        order.adminApproved.status = true;
        order.amountData.shipping_cost = String(shipping_cost);
        order.amountData.total = shipping_cost + Number(order.amountData?.total_product_price || 0);
        order.order_status = 'approved';

        await order.save();
        return res.sendStatus(200);
    } catch (error) {
        catchError(res, error);
    }
});

app.get('/order/paypal', requireAuth, async function (req, res) {
    try {
        const orderId = Number(req.query.order_id);
        if (isNaN(orderId)) {
            return namedErrorCatching('parameter_error', 'there is no such order in the id of ' + req.query.order_id);
        }

        const order = await Orders.findOne({ id: orderId, 'buyer.id': req.user_info._id });
        if (!order) {
            return namedErrorCatching('parameter_error', 'there is no such order in the id of ' + req.query.order_id);
        }

        const paypal = new PaypalPayment({
            client_id: T_PAYPAL_CLIENT_ID,
            client_secret: T_PAYPAL_SECRET,
            success_url: BASE_URL + '/order/paypal/success',
            cancel_url: BASE_URL + '/order/paypal/cancel',
            brand_name: 'Gojushinryu International Martial Arts'
        });

        const data = await paypal.checkOutWithShipping({
            items: [
                {
                    name: 'Current Product',
                    quantity: 1,
                    unit_amount: { currency_code: 'USD', value: '50.00' }
                }
            ],
            shipping: 20
        });

        order.paymentInfo.payment_method = 'paypal';
        order.paymentInfo.paypal_token = data.token;
        await order.save();

        res.redirect(data.link);
    } catch (error) {
        catchError(res, error);
    }
});

app.get('/order/paypal/success', async function (req, res) {
    return res.json(req.query);
});

app.get('/order/paypal/cancel', async function (req, res) {
    return res.json(req.query);
});

app.get('/order/stripe', requireAuth, async function (req, res) {
    try {
        const orderId = Number(req.query.order_id);
        if (isNaN(orderId)) {
            return namedErrorCatching('parameter_error', 'there is no such order in the id of ' + req.query.order_id);
        }

        const order = await Orders.findOne({ id: orderId, 'buyer.id': req.user_info._id });
        if (!order) {
            return namedErrorCatching('parameter_error', 'there is no such order');
        }

        const stripe = new StripePay({
            success_url: BASE_URL + '/order/stripe/success',
            cancel_url: BASE_URL + '/order/stripe/failed'
        });

        const paymentdata = await stripe.checkOut({
            line_items: [],
            shipping_amount: 1000 * 100
        });

        return res.status(200).json({ paymentdata });
    } catch (error) {
        // FIXED: argument order was reversed (catchError(req, res)), which broke error handling
        catchError(res, error);
    }
});

app.get('/order/stripe/success', async function (req, res) {
    res.json(req.query);
});

app.get('/order/stripe/failed', async function (req, res) {
    res.json(req.query);
});

// NOTE: /create-products and /create-user debug routes have been REMOVED.
// Use POST /auth/signup to create real users, and manage products through
// the admin-protected /products route.

export default app;