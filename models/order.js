
import mongoose from 'mongoose';

const
    extraDatas = {
        order_status: {
            type: String,
            required: true,
            default: "pending"
        },
        isCancelled: {
            type: Boolean,
            required: true,
            default: false
        },
        cancelReason: {
            type: String
        },
        activated: {
            type: Boolean,
            default: false,
            required: true
        },
        trash: {
            default: false,
            type: Boolean
        },
        reciever_notes: {
            type: String,
            required: true
        }
    },
    reciever = {
        name: String,
        phone:String,
        email:String,
    },
    buyer={
        id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone:{
            type: String,
        }
    },
    shiping_items= [{
        _id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'products',
            required: true
        },
        item_name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        per_price: {
            type: Number,
            required: true
        },
        size: {
            type: String,
            required: true
        },
        total_price: {
            type: Number,
            required: true
        }
    }],
    reciever_address={
        country: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        postcode: {
            type: Number,
            required: true
        }
    },
    amountData={
        total :{
            type: String,
            required: true
        },
        total_product_price:{
            type: String,
            required: true
        },
        shipping_cost: {
            type: String,
            required: true
        }
    };


const schema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        default: Date.now
    },
    date: {
        type: String,
        required: true ,
        default:(e => new Date())
    },
    buyer:buyer,
    reciever :reciever,
    reciever_address :reciever_address,
    shiping_items:shiping_items,
    amountData :amountData,
    ...extraDatas
});



export const Orders = mongoose.model('orders', schema);
export default Orders;

