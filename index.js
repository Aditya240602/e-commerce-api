
/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import path from 'path';
import {require,__dirname, T_PAYPAL_CLIENT_ID, T_PAYPAL_SECRET, BASE_URL} from './env.js'
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
import PaypalPayment from './utils/paypal.js';
import crypto from 'crypto'
import StripePay from './utils/stripe.js';

app.use('/pages', express.static(path.resolve(__dirname, './pages')));


await connectDB();


app.post('/checkout',
    express.urlencoded({ extended: false }),
    async function (req, res, next) {
        try {
            let user = await User.findOne({});
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
    async function (req, res) {
        try {
            let buyerandreciverInfo=CheckOut.giveReciverData(req); 
            let shippingProdData=CheckOut.giveProductData(req);

            let order=new Orders({
                ...shippingProdData,
                ...buyerandreciverInfo
            });

            fs.writeFileSync(path.resolve(__dirname , './orderData.json'), breakJsonData(order));

            await order.save();
            return res.status(201).json({
                order
            });
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
        order.adminApproved.activationTime=new Date();
        order.adminApproved.status=true;
        order.amountData.shipping_cost=String(shipping_cost);
        order.amountData.total =shipping_cost+Number(order.amountData?.total_product_price);
        order.order_status='approved'
        await order.save();
        return res.sendStatus(200);
    } catch (error) {
        catchError(res,error)
    }
})




app.get('/order/paypal', async function (req, res) {
    try {
        if (!validate.isNum( Number(req.query.order_id)) || validate.isNaN( Number(req.query.order_id))) namedErrorCatching('perameter_error',"there is no such order in the id of "+ req.query.order_id);
        let order= await Orders.findOne({id : req.query.order_id});
       
        if (validate.isNull(order)) namedErrorCatching('perameter_error',"there is no such order in the id of "+ req.query.order_id);
  
        let paypal = new PaypalPayment({
            client_id: T_PAYPAL_CLIENT_ID,
            client_secret: T_PAYPAL_SECRET,
            success_url: BASE_URL + '/order/paypal/success',
            cancel_url: BASE_URL + '/order/paypal/cancel',
            brand_name: 'Gojushinryu International Martial Arts'
        });
        let data = await paypal.checkOutWithShipping({
            items: [
                {
                    name: 'Current Product',
                    quantity: 1,
                    unit_amount: {
                        currency_code: 'USD',
                        value: '50.00'
                    }
                }
            ],
            shipping: 20,
        });

        order.paymentInfo.payment_method='paypal',
        order.paymentInfo.paypal_token=data.token;
        await order.save()

        res.redirect(data.link)
    } catch (error) {
        catchError(res,error)
    }
});


app.get('/order/paypal/success',async function (req,res) {
    return res.json(req.query);
})

app.get('/order/paypal/cancel',async function (req,res) {
    return res.json(req.query);
})



app.get('/create-products', async function (req, res) {
    try {
        let prod= await Product.create({
            name :'test product name' +Math.floor(Math.random() * 10000) ,
            description : 'test product description' +Math.floor(Math.random() * 10000) ,
            selling_style:'per_price',
            price :1000+Math.floor(Math.random() * 10000),
            size :'M',
            cetegory :'clothing'
        });
        res.status(201).json({prod});
    } catch (error) {
        catchError(res,error)
    }
})


app.get('/create-user', async function (req, res) {
    let user= await User.create({
        name :"Muhammad Mubtasim",
        first_name :"Muhammad",
        last_name :"Mubtasim",
        email :crypto.getRandomValues(new Uint8Array(32)).toString('base64')+'@gmail.com',
        phone :"+8801" + Math.floor(Math.random()*100000000),
        country :'Bangladesh',
        city:"Cittagong",
        district :"Cittagong",
        date_of_birth :new Date(),
        age:18,
        isRegistered :true,
        password :crypto.getRandomValues(new Uint8Array(10)).join('%#^^&').toLocaleUpperCase()
    })
    res.status(201).json(user)
})


app.get('/order/stripe',async function (req,res) {
    try {
        if (!validate.isNum(Number(req.query.order_id)) || validate.isNaN(Number(req.query.order_id))) namedErrorCatching('perameter_error', "there is no such order in the id of " + req.query.order_id);
        let order = await Orders.findOne({ id: req.query.order_id });
        

        
        if (validate.isNull(order)) namedErrorCatching('perameter error', 'their is no order');
        
        const stripe=new StripePay({
            success_url:BASE_URL+'/order/stripe/success',
            cancel_url : BASE_URL+'/order/stripe/failed',
        });

        let paymentdata=await stripe.checkOut({
            line_items:[],
            shipping_amount :1000*100
        })

    } catch (error) {
        catchError(req,res)
    }
})
app.get('/order/stripe/success',async function (req,res) {
    res.json(req.query)
})
app.get('/order/stripe/failed',async function (req,res) {
    res.json(req.query)
})



app.listen(3000, () => log('alhamdulillah , server working...'));
