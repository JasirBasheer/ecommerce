const mongoose  = require('mongoose')

const couponSchema = new mongoose.Schema({
    couponName:{
        type:String,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
    minimumPurchase:{
        type:Number,
        required:true
    },
    limit:{
        type:Number,
        requried:true
    },
    expiryDate:{
        type: Date,
        required:true  
    },
    createdAt:{
        type:Date,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    }

})

module.exports = mongoose.model('Coupon',couponSchema)