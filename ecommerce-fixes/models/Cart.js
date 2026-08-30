import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    // NOTE: ref must be 'products' (lowercase) — that's the name your
    // Products.js model was registered under: mongoose.model('products', ...)
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
});

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema]
}, { timestamps: true });

export const Cart = mongoose.model('Cart', cartSchema);
