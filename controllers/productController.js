const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const mongoose = require('mongoose'); 



const getWishlistCount = async (userId) => {
    try {
        const wishlist = await Wishlist.findOne({ userId:userId });

        if (wishlist) {
            return wishlist.products.length;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error fetching wishlist count:', error);
        return 0; 
    }
};



const loadSinglePage = async(req,res,next)=>{
    try {
        const id = req.query.id
        const userId = req.session.user_id
        const product = await Product.findOne({_id:id})
        if(!product){
            return res.render('productNotFound')
        }


        const relatedProducts = await Product.find({productCategory:product.productCategory})
        const cart = await Cart.findOne({userId:userId})
        const wishlist = await Wishlist.findOne({userId:userId})

        

          product.viewCount +=1;
          await product.save()


        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }
        let wishlistCount =0;
        if(wishlist){
            wishlistCount = wishlist.products.length
        }


        
        
        res.render('singlepage',{product, relatedProducts, id, cartCount ,userId,wishlistCount})
    } catch (error) {
        next(error);
    }
}




const filterCategory = async(req,res,next) => {
    try {
        const categoryName = req.query.id;
        console.log(categoryName);
        const categories = await Category.find({}); 
        const recentProducts = await Product.find({});
        const userId = req.session.user_id
        const cart = await Cart.findOne({userId:userId})

        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        let products;
        if (categoryName) {
            products = await Product.find({ productCategory: categoryName }); 
        } else {
            products = await Product.find({}); 

        }
        console.log(products);
        res.render('index', { categories, products, categoryName ,recentProducts,cartCount,userId,search:""});
    } catch (error) {
        next(error);
    }
};





const filterProdcutByCategory = async(req,res,next)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 11;

        const category = req.query.id
        console.log(category);

        const categories = await Category.find({})
       

        const userId = req.session.user_id || 0
        const products = await Product.find({productCategory:category}).limit(limit).skip((page - 1) * limit).exec();
        const count = await Product.find({productCategory:category}).countDocuments();


        let wishlistCount ;
        if(userId){
         wishlistCount =  await getWishlistCount(userId._id);
        }else{
            wishlist =0
        }


        res.render('shop',{products,wishlistCount,categories,search:"",userId ,selectedCategory: category,totalPages: Math.ceil(count / limit),currentPage: page,url:`/filterprodcutbycategory?id=${category}&`})

    } catch (error) {
        next(error);
    }
}



const filter = async(req, res, next) => {
    try {
        const category = req.query.category;
        const sort = req.query.sort;
        const page = parseInt(req.query.page) || 1;
        const limit = 11;
        const userId = req.session.user_id || null
        const categories = await Category.find({});
        const query = category && category !== "All" ? { productCategory: category } : {};
        let Findproducts = Product.find(query);

        let wishlistCount ;
        if(userId){
         wishlistCount =  await getWishlistCount(userId._id);
        }else{
            wishlist =0
        }
        

        if (sort === "priceDesc") {
            Findproducts = Findproducts.sort({ productPrice: -1 });
        } else if (sort === "priceAsc") {
            Findproducts = Findproducts.sort({ productPrice: 1 });
        } else if (sort === "nameAsc") {
            Findproducts = Findproducts.collation({ locale: "en" }).sort({ productName: 1 });
        } else if (sort === "nameDesc") {
            Findproducts = Findproducts.collation({ locale: "en" }).sort({ productName: -1 });
        } else if (sort === "popularity") {
            Findproducts = Findproducts.find({ viewCount: { $gt: 5 } });
        }

        const products = await Findproducts.limit(limit).skip((page - 1) * limit).exec();
        const count = await Product.countDocuments(query);

        res.render('shop', {products,categories,wishlistCount,userId,selectedCategory: category,selectedfilter: sort,totalPages: Math.ceil(count / limit),currentPage: page,search:"",url: `/filter?category=${category}&sort=${sort}&`});
    } catch (error) {
        next(error);
    }
};

const searchProducts = async (req, res, next) => {
    try {
        const searchTerm = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 11;

        const query = { $text: { $search: searchTerm } };

        const products = await Product.find(query).limit(limit).skip((page - 1) * limit).exec();
        const count = await Product.countDocuments(query);
        const categories = await Category.find({});
        
        const userId = req.session.user_id; 
        let cartCount = 0;


        if (userId) {
            try {
                const cart = await Cart.findOne({ userId: mongoose.Types.ObjectId(userId) }); 
                if (cart) {
                    cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
            }
        }

        let wishlistCount = 0; 
        if (userId) {
            wishlistCount = await getWishlistCount(userId); 
        }

        res.render('shop', {products,categories,cartCount,wishlistCount,userId,totalPages: Math.ceil(count / limit),currentPage: page,search: searchTerm,url: `/search?search=${encodeURIComponent(searchTerm)}&` 
        });
    } catch (error) {
        next(error);
    }
};









module.exports ={
    loadSinglePage,
    filterCategory,
    filterProdcutByCategory,
    filter,
    searchProducts,
}