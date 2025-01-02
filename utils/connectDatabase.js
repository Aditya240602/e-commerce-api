
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import mongoose from "mongoose";
import { DATABASE } from "../env.js";
import { log } from "string-player";

export default async function connectDB() {
    try {
        await mongoose.connect(DATABASE);
        log('database connected...')
    } catch (error) {
        console.error(error);
    }
}