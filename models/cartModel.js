const mongoose = require('mongoose')


const cartSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    Coupon:{
      type:Number,
      default:0
    },
    applyedCoupon:{
      type:String,
      default:""
    },
    appliedReffreal:{
      type:String,
      default:""
    },
    applyedDiscount:{
      type:Number,
      default:0
    },
    shippingCharge:{
      type:Number,
      default:0
    },
    
    products : [{
        productId:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity:{
          type: Number,
          required: true
        },
        productName:{
          type:String,
          required:true
        },
        productPrice:{
          type:Number,
          required:true
        },
        orderStatus:{
          type: String,
      enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned',"Return-Pending","Return-Rejected"],
      default: 'Placed'
        },
        offerPercentage:{
          type:Number,
          default:0
        },
        originalAmount:{
            type:Number,
            default:0,

        },
        returnReason:{
          type:String
        }
      
      }]

})

module.exports = mongoose.model('Cart',cartSchema)