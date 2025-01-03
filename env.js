
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
config();

export const DATABASE=process.env.DATABASE;
export const require=createRequire(import.meta.url);
export const __dirname=path.dirname(fileURLToPath(import.meta.url));
export const T_PAYPAL_CLIENT_ID=process.env.T_PAYPAL_CLIENT_ID;
export const T_PAYPAL_SECRET=process.env.T_PAYPAL_SECRET;
export const PAYPAL_LINK=process.env.PAYPAL_LINK;
export const BASE_URL=process.env.BASE_URL;
export const T_STRIPE_KEY=process.env.T_STRIPE_KEY;