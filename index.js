
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
            let buyerandreciverInfo=giveReciverData(req);
            let shippingProdData=giveProductData(req);

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



function giveReciverData(req) {
    let { fname, lname, email, number, country, city, district, road_no, zipcode, notes } = req.body;
    if (validate.isAllNotEmty([fname, lname, email, number, country, city, district, road_no, zipcode, notes]) === false) namedErrorCatching('perameter error', 'their are some perameters are emty');
    if (!validate.isNum(Number(number))) namedErrorCatching('perameter error', 'number is not a Number');
    if (!validate.isNum(Number(zipcode))) namedErrorCatching('perameter error', 'zipcode is not a Number');
    if (!tobe.minMax(fname, 3, 15)) namedErrorCatching('perameter error', 'fname should be min 5 and max 12');
    if (!tobe.minMax(lname, 3, 15)) namedErrorCatching('perameter error', 'lname should be min 5 and max 12');
    if (!validate.isEmail(email)) namedErrorCatching('perameter error', 'email is not a email');
    if (!tobe.minMax(city, 3, 15)) namedErrorCatching('perameter error', 'city should be min 5 and max 12');
    if (!tobe.minMax(country, 3, 15)) namedErrorCatching('perameter error', 'country should be min 5 and max 12');
    if (!tobe.minMax(district, 3, 15)) namedErrorCatching('perameter error', 'district should be min 5 and max 12');
    if (!tobe.minMax(road_no, 3, 15)) namedErrorCatching('perameter error', 'road_no should be min 5 and max 12');
    if (!tobe.minMax(district, 3, 15)) namedErrorCatching('perameter error', 'district should be min 5 and max 12');
    if (!tobe.max(notes, 2000)) namedErrorCatching('perameter error', "notes can not be bigger than 2000 charecters");
    [fname, lname, country, city, district, notes, road_no] = repleCrAll([fname, lname, country, city, district, notes, road_no]);

    return ({
        buyer:{
            id:req.user_info._id,
            email :req.user_info.email,
            phone :String(req.user_info.phone)
        } ,
        reciever_address :{
            country: country,
            district:district,
            city: city,
            street:road_no,
            postcode:zipcode
        },
        reciever :{
            name :`${fname} ${lname}`,
            phone : String(number),
            email :email
        },
        reciever_notes :notes
    });
}

function giveProductData(req) {
    let items=req.body.items, total_product_price =0;
    if (validate.isNotA.array(items)) namedErrorCatching('perameter error', 'items is not a Array');
    for (let i = 0; i < items.length; i++) {
        if (validate.isNotA.object(items[i])) namedErrorCatching('perameter error' , 'items['+i+'] is not a object');
        log(typeof items[i]._id);
        if (validate.isEmty(items[i]._id) || validate.isNotA.string(items[i]._id)) throw namedErrorCatching('perameter error' , `_id is emty or not a string in items array index no ${i}`);
        if (validate.isEmty(items[i].item_name) || validate.isNotA.string(items[i].item_name)) throw namedErrorCatching('perameter error' , `item_name is emty or not a string in items array index no ${i}`);
        if (validate.isEmty(items[i].size) || validate.isNotA.string(items[i].size)) throw namedErrorCatching('perameter error' , `item_name is emty or not a string in items array index no ${i}`);
        if (validate.isNotA.num(items[i].quantity)) throw namedErrorCatching('perameter error' , `quantity is not a number in items array index no ${i}`);
        if (validate.isNotA.num(items[i].per_price)) throw namedErrorCatching('perameter error' , `per_price is not a number in items array index no ${i}`);
        total_product_price =items[i].quantity*items[i].per_price;
        items[i].total_price = total_product_price;
    }
    return ({
        shiping_items :items,
        amountData : {
            total_product_price: String(total_product_price)
        }
    })

}

app.listen(3000, () =>log('alhamdulillah , server working...'));
