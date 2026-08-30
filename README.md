# Modern E-Commerce Order System

A Node.js backend for an e-commerce platform handling users, products, carts, orders, and checkout — with payment processing via **Stripe** and **PayPal**, and JWT-based authentication.

## Features

- 🔐 JWT authentication middleware
- 🛒 Cart management
- 📦 Product and order models (Mongoose)
- 💳 Stripe Checkout integration
- 💰 PayPal Checkout integration
- 🗄️ MongoDB Atlas connection
- ✅ Order status tracking (`pending`, cancellation, activation, soft-delete via `trash`)

## Tech Stack

- **Runtime:** Node.js (ESM modules)
- **Database:** MongoDB with Mongoose
- **Auth:** JSON Web Tokens (JWT)
- **Payments:** Stripe, PayPal
- **Env management:** dotenv

## Project Structure

```
modern-ecommerce-order-system/
├── index.js                  # App entry point
├── env.js                    # Centralized env var loader/validator
├── middleware/
│   └── auth.js                # JWT auth middleware
├── models/
│   ├── Cart.js
│   ├── order.js
│   ├── Products.js
│   └── user.js
├── routes/
│   ├── auth.js
│   └── cart.js
├── utils/
│   ├── auth.js
│   ├── catcherror.js
│   ├── checkout.js
│   ├── connectDatabase.js
│   ├── paypal.js
│   ├── stripe.js
│   └── validation.js
└── .env                       # Local environment variables (not committed)
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A MongoDB Atlas cluster (or local MongoDB instance)
- Stripe account (test/sandbox keys)
- PayPal Developer account (sandbox app credentials)

### Installation

```bash
git clone https://github.com/Aditya240602/e-commerce-api.git
cd modern-ecommerce-order-system
npm install
```

### Environment Variables

Create a `.env` file in the project root (see `.env.example` if provided, or use the template below). **Never commit this file.**

```dotenv
# MongoDB Atlas
MONGODB_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_long_random_secret   # generate with: openssl rand -hex 32

# Server
BASE_URL=http://localhost:3000
PORT=3000

# PayPal (sandbox credentials)
T_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
T_PAYPAL_SECRET=your_paypal_sandbox_secret
PAYPAL_LINK=https://api-m.sandbox.paypal.com

# Stripe (test key)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

> All required variables are validated on startup in `env.js` — the app will exit with a clear error message if any critical variable (`MONGODB_URI`, `JWT_SECRET`, `BASE_URL`) is missing.

### Running the App

```bash
node index.js
```

The server will start on `http://localhost:PORT` (default `3000`).

## API Overview

| Area  | Route file          | Description                          |
|-------|----------------------|---------------------------------------|
| Auth  | `routes/auth.js`     | User registration, login, JWT issuance |
| Cart  | `routes/cart.js`     | Add/update/remove cart items          |
| Checkout | `utils/checkout.js` | Orchestrates Stripe/PayPal checkout sessions |

## Models

- **User** — account details, credentials
- **Cart** — items associated with a user's cart
- **Products** — product catalog
- **Order** — order status (`pending`, cancellation flag + reason, `activated`, `trash` for soft deletion)

## Payments

- **Stripe** (`utils/stripe.js`) — creates a Stripe Checkout Session with line items and shipping.
- **PayPal** (`utils/paypal.js`) — authenticates against `PAYPAL_LINK` (sandbox or live PayPal API base URL) using `T_PAYPAL_CLIENT_ID` / `T_PAYPAL_SECRET`.

## Security Notes

- `.env` is excluded via `.gitignore` — double-check before every push that no secrets are staged.
- Rotate any credentials that may have been accidentally exposed (e.g., shared in chat logs, screenshots, or committed by mistake).

## License

Specify your license here (e.g., MIT).
