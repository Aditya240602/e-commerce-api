
import mongoose from 'mongoose';
import { type } from 'os';

const
    extraDatas = {
        order_status: {
            type: String,
            default: "pending"
        },
        isCancelled: {
            type: Boolean,
            default: false
        },
        cancelReason: {
            type: String
        },
        activated: {
            type: Boolean,
            default: false,
        },
        trash: {
            default: false,
            type: Boolean
        },
        reciever_notes: {
            type: String,
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
        },
        email: {
            type: String,
        },
        phone:{
            type: String,
        }
    },
    shiping_items= [{
        _id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'products',
        },
        item_name: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        per_price: {
            type: Number,
        },
        size: {
            type: String,
        },
        total_price: {
            type: Number,
        }
    }],
    reciever_address={
        country: {
            type: String,
        },
        district: {
            type: String,
        },
        city: {
            type: String,
        },
        street: {
            type: String,
        },
        postcode: {
            type: Number,
        }
    },
    amountData={
        total :{
            type: String,
        },
        total_product_price:{
            type: String,
        },
        shipping_cost: {
            type: String,
        }
    },
    adminApproved ={
        activationTime :{
            type :Date,
        },
        status : {
            type :Boolean ,
            default :false,
        }
    },
    paymentInfo ={
        payment_method : {
            type :String,
            default :'none'
        },
        paypal_token :String,
        string_token :String,
        payment_done_date :{
            type :Date,
        },
        payment_status : {
            type :Boolean,
            default: false
        }
    };


const schema = new mongoose.Schema({
    id: {
        type: Number,
        default: Date.now
    },
    date: {
        type: String,
        default:(e => new Date())
    },
    buyer:buyer,
    reciever :reciever,
    reciever_address :reciever_address,
    shiping_items:shiping_items,
    amountData :amountData,
    adminApproved :adminApproved,
    paymentInfo:paymentInfo, 
    ...extraDatas
});



export const Orders = mongoose.model('orders', schema);
export default Orders;

