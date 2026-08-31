import mongoose from "mongoose";
import { MONGODB_URI } from "../env.js";
import { log } from "string-player";

export default async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, { maxPoolSize: 100 });
        log('database connected...')
    } catch (error) {
        console.error(error);
    }
}