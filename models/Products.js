/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  Insha Allah 
By his marcy,  I will gain success
*/


import mongoose from 'mongoose';



const productschema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    default: () => Math.floor((Date.now() + Date.now()) * (Math.random() * 1000))
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  cetegory: {
    type: String,
  },
  thumb: {
    type: String,
    default: "https://"
  },
  images: [String],
  date: {
    type: String,
  },
  selling_style: {
    type: String,
  },
  price: {
    type: String,
  },
  size_and_price: [{
    size: String,
    price: String,//price in usd
  }],
  size: String,
});

export const Product = mongoose.model('products', productschema); 