# What changed and why

## New files
- `utils/auth.js` — password hashing (bcrypt) + JWT sign/verify helpers
- `middleware/auth.js` — `requireAuth` (real logged-in user, not `User.findOne({})`) and `requireAdmin`
- `models/Cart.js` — a real Cart model tied to a user
- `routes/auth.js` — `POST /auth/signup` and `POST /auth/login` (replaces the old `/create-user` debug route; passwords are now hashed)
- `routes/cart.js` — `GET /cart`, `POST /cart/items`, `DELETE /cart/items/:productId`

## Fixed in `index.js`
1. **`/checkout` no longer randomizes order data.** It now reads the logged-in user's real cart and builds the order from actual selected products/quantities.
2. **`/checkout` and `/activate` now require real authentication** via `requireAuth`. `/activate` also requires `requireAdmin`.
3. **Removed the JSON file write** (`orderData.json`) — MongoDB is now the single source of truth.
4. **Fixed the reversed `catchError(req, res)` bug** in the Stripe route — it's now called consistently as `catchError(res, error)` everywhere.
5. **Removed `/create-products` and `/create-user`** debug routes (open GET endpoints with no auth, plaintext passwords). Signup is now a proper `POST /auth/signup`.
6. **Orders and payment lookups are now scoped to the logged-in user** (`Orders.findOne({ id, user: req.user_info._id })`) instead of being fetchable by anyone who guesses an order id.
7. Removed the unfamiliar `string-player` package dependency from `index.js` (validation now happens with plain JS / your own logic) — worth doing the same in your other files so nothing unexplainable shows up in a code review.

## Update: integrated against your real schemas
Now that I've seen your actual `models/user.js`, `models/Products.js`, and `models/order.js`, here's what got corrected:

1. **`models/user.js`** — added `isAdmin: { type: Boolean, default: false }`. It didn't exist before, so `requireAdmin` had nothing to check. **You'll need to manually set `isAdmin: true` on one user in your database** (via MongoDB Atlas/Compass) to test the admin-only `/activate` route.
2. **`models/Cart.js`** — fixed `ref: 'Product'` → `ref: 'products'`, matching how your Products model is actually registered (`mongoose.model('products', ...)`).
3. **`index.js` checkout** — your `Orders` schema doesn't have a top-level `user` field; the real reference to the logged-in user is `order.buyer.id`. Checkout now sets `buyer.id`, `buyer.email`, `buyer.phone` directly from `req.user_info`, overriding anything `CheckOut.giveReciverData()` might set — so an order can never be tied to the wrong person.
4. **`index.js` checkout** — `Product.price` is stored as a **String** in your schema, so it's now wrapped in `Number()` before being used in shipping/order math.
5. **`/order/paypal` and `/order/stripe`** — order lookups now correctly query `'buyer.id': req.user_info._id` instead of a nonexistent `user` field, so users can only fetch their own orders.
6. **`routes/auth.js` signup** — your `User` schema requires `name`, `first_name`, `last_name`, `email`, `phone`, `password`, and `country` (no defaults), plus `phone` is unique. Signup now validates all of these explicitly and returns a clean 400 error instead of letting a raw Mongoose validation error leak out. `gender` defaults to `'male'` per your schema if not provided.

## Update: added Zod validation
Replaced manual `if (!field)` checks with proper schema validation:
- **New file: `utils/validation.js`** — holds `signupSchema`, `loginSchema`, `addToCartSchema`, `activateOrderSchema`, plus a `validateBody()` helper that runs `.safeParse()` and sends a consistent 400 error shape on failure.
- **`routes/auth.js`** — signup and login now validate `req.body` through `signupSchema` / `loginSchema` before touching the database. Phone numbers are coerced from string to Number automatically by the schema.
- **`routes/cart.js`** — `POST /cart/items` validates through `addToCartSchema` (auto-defaults `quantity` to 1, coerces to an integer ≥ 1).
- **`index.js`** — `PUT /activate` validates through `activateOrderSchema` (coerces `id` and `shipping_cost` to numbers, rejects negative shipping cost).

**Install this new dependency:**
```bash
npm install zod
```


1. **`utils/checkout.js`, `utils/catcherror.js`, `utils/connectDatabase.js`, `utils/paypal.js`, `utils/stripe.js`** — send these over so I can confirm `CheckOut.giveReciverData()` / `giveProductData()` return shapes that match what `index.js` expects, and that `catchError(res, error)` signature is right everywhere.
2. **Install new dependencies:**
   ```bash
   npm install bcryptjs jsonwebtoken
   ```
3. **Add `JWT_SECRET`** to your `.env` / `env.js` (a long random string).
4. **Manually flip `isAdmin: true`** on one test user in the database so you can test `/activate`.

## Suggested next steps (in order)
1. Send me your actual model files so I can double check the field names line up exactly.
2. Add a `Product` admin route (`POST /products`, `PUT /products/:id`) protected with `requireAuth` + `requireAdmin`, replacing the old open `/create-products`.
3. Build a simple frontend (or Postman collection) to actually exercise signup → add to cart → checkout, so you can screen-record a demo for your README.
4. Deploy (Render/Railway for the API + MongoDB Atlas for the DB) and write a proper README with setup instructions and a demo link/GIF.
