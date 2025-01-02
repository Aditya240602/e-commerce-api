
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import path from 'path';
import {require,__dirname} from './env.js'
const express =require('express');
import { breakJsonData, log, repleCrAll, tobe, validate } from 'string-player'
import catchError, { namedErrorCatching } from './utils/catcherror.js';
import Orders from './models/order.js';
import connectDB from './utils/connectDatabase.js';
import { User } from './models/user.js';
const app=express();
import fs from 'fs'
import { Product } from './models/Products.js';
import CheckOut from './utils/checkout.js';

app.use('/pages', express.static(path.resolve(__dirname, './pages')));


await connectDB();


app.post('/checkout',
    express.urlencoded({ extended: false }),
    async function (req, res, next) {
        try {
            let user = await User.findOne();
            req.user_info = user;
            next();
        } catch (error) {
            console.error(error);
        }
    },
    async function (req, res, next) {
        let array=await Product.find({});
        let shiping_items=[];
        for (let i = 0; i < array.length; i++) {
            shiping_items[i]={};
            shiping_items[i]['_id']=String(array[i]._id);
            shiping_items[i]['item_name']=array[i].name;
            shiping_items[i]['size']='hello';
            shiping_items[i]['quantity']=Math.floor(Math.random()*8);
            shiping_items[i]['per_price']=Math.floor(Math.random()*800);
        }
        req.body.items=shiping_items;
        return next();
    }
    ,
    function (req, res) {
        try {
            let buyerandreciverInfo=CheckOut.giveReciverData(req); 
            let shippingProdData=CheckOut.giveProductData(req);

            let order=new Orders({
                ...shippingProdData,
                ...buyerandreciverInfo
            });

            fs.writeFileSync(path.resolve(__dirname , './orderData.json'), breakJsonData(order));
            return res.status(201).json({
                order
            })
        } catch (error) {
            catchError(res, error)
        }
    }
);


app.put('/activate',async function (req, res) {
    try {
        let {shipping_cost,id}=req.body;
        if (validate.isEmty(id)) namedErrorCatching('perameter error' , 'id is emty ');
        if (validate.isEmty(shipping_cost)) namedErrorCatching('perameter error' , 'shipping_cost is emty ');
        if (!validate.isNum(shipping_cost)   ) namedErrorCatching('perameter error' ,'shipping cost is not a number' );
        if (!validate.isNum(id)) namedErrorCatching('perameter error' , 'id us not a number');
        let order=await Orders.findOne({id});
        if (validate.isNull(order) ) {
            return res.status(400).json({
                error :{
                    type :"notFound",
                    message :"No data was found of order , please try again"
                }
            })
        }
        order.adminApproved?.activationTime=new Date();
        order.adminApproved?.status=true;
        order.amountData?.shipping_cost=String(shipping_cost);
        order.amountData?.total =shipping_cost+Number(order.amountData?.total_product_price);
        order.order_status='approved'
        await order.save();
        return res.sendStatus(200);
    } catch (error) {
        catchError(res,error)
    }
})


app.get('/order/paypal', function (req,res) {
    
});



app.listen(3000, () =>log('alhamdulillah , server working...'));
