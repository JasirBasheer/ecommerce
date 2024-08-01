const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required:true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer:{
    type:String,
    required:true
  },
  phone:{
    type:Number,
    required:true
  },
  address: {
    type: String,    
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered','Cancelled','Returned'],
    default: 'Pending'
  },
  paymentMethod:{
    type: String,
    default:'Pending'
  }, 
  shippingPrice:{
    type:Number,
    default: 0
  },
  createdAt: {
    type: Date,
    required:true     
  },
  addresss: {
    fullName:{type:String,required:true},
    number:{type:Number,required:true},
    house:{type:String,required:true},
    street:{type:String,required:true},
    landMark:{type:String,required:true},
    city:{type:String,required:true},
    state:{type:String,required:true},
    pincode:{type:Number,required:true},
  },
  applyedCoupon:{
    type:String,
    default:""
  },
  applyedDiscount:{
    type:Number,
    default:0
  }
});

module.exports= mongoose.model('Order',orderSchema);