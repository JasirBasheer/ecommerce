const Wishlist = require('../models/wishlistModel')
const Product = require('../models/productModel');
const mongoose = require('mongoose');






const loadWishlist = async(req,res,next)=>{
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id);
        const pipeline =[
            {
                $match:{userId}
            },
            {
                $unwind: "$products" 
            },
            {
                $lookup:{
                    from:"products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "items",
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$_id",
                    items: { $push: "$items" }
                }
            },
            {
                $project: {
                    items: 1
                }
            }
        ]

        const wishlist = await Wishlist.aggregate(pipeline)
        if (wishlist.length === 0) {
            return res.render('wishlist', { products: [], userId });
        }

        res.render('wishlist',{products:wishlist[0].items,userId})

        
    } catch (error) {
        next(error)
    }
}



const addToWishlist = async(req,res,next)=>{
    try {
        const productId = req.body.productId
        const findProduct = await Product.findOne({_id:productId})
        const user = req.session.user_id._id

        if(user){
            const checkWishlist = await Wishlist.findOne({userId:user})
            if(checkWishlist){
                const productIndex = checkWishlist.products.findIndex(p => p.productId.equals(productId))

                if(productIndex === -1){
                    checkWishlist.products.push({productId:findProduct._id})
                    await checkWishlist.save()
                      const wishlistCount = checkWishlist.products.length

                    return res.status(200).json({success:"Product added to cart",wishlistCount})
                }else{
                    return res.status(200).json({alreadyinwishlist:"Product already in wishlist"})

                }

                
            }else{

                const saveToWishlist =new Wishlist({
                    userId:user,
                    products: [{ productId: findProduct._id }]

                    
                })

                await saveToWishlist.save()
                const wishlistCount = saveToWishlist.products.length

                return res.status(200).json({success:"Product added to cart",wishlistCount})


            }
        }

    } catch (error) {
        next(error)
    }
}



const removeFromWishlist = async(req,res,next)=>{
    try {
        const productId = req.body.productId
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id);
        const wishlist = await Wishlist.findOne({userId:userId})
        if (!wishlist) {
            return res.status(404).json({ message: "Wishlist not found" });
        }

        wishlist.products = wishlist.products.filter((product) => !product.productId.equals(productId));

        await wishlist.save();
        return res.status(200).json({success:"item removed"})

    } catch (error) {
        next(error)
    }
}


module.exports={
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
}