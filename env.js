
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
