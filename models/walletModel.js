const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true    
    },
    totalAmount :{
        type:Number,
        default:0
    },
    pendingAmount:{
        type:Number,
        default:0
    },
    transactions: [
        {
            amount: { type: Number },
            status: { type: String },
            date: { type: Date, default: Date.now },
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' } 
        }
    ],


})

module.exports= mongoose.model('Wallet',walletSchema)