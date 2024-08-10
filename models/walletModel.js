const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true    
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    pendingAmount: {
        type: Number,
        default: 0
    },
    transactions: [
        {
            amount: { type: Number, required: true }, 
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            productName: { type:String,required:true },
            for:{
                type:String,
                default:"Return"
            },
            status:{
                type:String,
                default:"pending"
            },quantity:{
                type:Number,
                default:0
            },
            createdAt: {
                type: Date,
                default: Date.now 
            }
        }
    ]
});

module.exports= mongoose.model('Wallet',walletSchema)