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
    applyedDiscount:{
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
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending'
        },
        offerPercentage:{
          type:Number,
          default:0
        },
        originalAmount:{
            type:Number,
            default:0,

        }
      
      }]

})

module.exports = mongoose.model('Cart',cartSchema)