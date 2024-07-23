const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  createdAt: {
    type: Date,
    required:true     
  }
});
module.exports= mongoose.model('Order',orderSchema);