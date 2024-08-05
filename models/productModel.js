const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productCategory: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    originalAmount:{
        type:Number,
        default:0
    },
    offerPercentage:{
        type:Number,
        default:0
    },
    num_of_stocks: {
        type: Number,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    is_blocked: {
        type: Boolean
    }
    ,
    reviews: {
        type: [String]
    },
    viewCount:{
        type:Number,
        default: 0
    }


})
productSchema.index({ productName: 'text', productDescription: 'text',productCategory: 'text' });


module.exports = mongoose.model('Product', productSchema)