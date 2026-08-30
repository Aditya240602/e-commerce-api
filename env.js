import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// ESM has no built-in __dirname (that's a CommonJS global), so it's
// reconstructed here from import.meta.url and exported for index.js to use.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
    MONGODB_URI,
    JWT_SECRET,
    BASE_URL,
    PORT,
    T_PAYPAL_CLIENT_ID,
    T_PAYPAL_SECRET,
    STRIPE_SECRET_KEY
} = process.env;

// Fail fast and loudly if critical env vars are missing, instead of
// letting the app start in a broken state and fail confusingly later.
const required = { MONGODB_URI, JWT_SECRET, BASE_URL };
for (const [key, value] of Object.entries(required)) {
    if (!value) {
        console.error(`Missing required environment variable: ${key}. Check your .env file.`);
        process.exit(1);
    }
}

export {
    __dirname,
    MONGODB_URI,
    JWT_SECRET,
    BASE_URL,
    PORT,
    T_PAYPAL_CLIENT_ID,
    T_PAYPAL_SECRET,
    STRIPE_SECRET_KEY
};