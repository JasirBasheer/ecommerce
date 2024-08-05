const mongoose = require('mongoose')

const singleProductOfferSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String
    },
    offerPercentage: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }




})

const categoryOfferSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    categoryName: {
        type: String,
        required: true
    },
    offerPercentage: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
    


})

const SingleProductOffer = mongoose.model('SingleProductOffer', singleProductOfferSchema);
const CategoryOffer = mongoose.model('CategoryOffer', categoryOfferSchema);


module.exports = {
    SingleProductOffer,
    CategoryOffer
};