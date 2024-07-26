const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')






const loadSinglePage = async(req,res,next)=>{
    try {
        const id = req.query.id
        const userId = req.session.user_id
        const product = await Product.findOne({_id:id})
        const relatedProducts = await Product.find({productCategory:product.productCategory})
        const cart = await Cart.findOne({userId:userId})

          product.viewCount +=1;
          await product.save()


        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        console.log(cartCount+"sdfasdfasdf");
        res.render('singlepage',{product, relatedProducts, id, cartCount ,userId})
    } catch (error) {
        next(error);
    }
}




const filterCategory = async(req,res,next) => {
    try {
        const categoryName = req.query.id;
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
        res.render('index', { categories, products, categoryName ,recentProducts,cartCount,userId});
    } catch (error) {
        next(error);
    }
};





const filterProdcutByCategory = async(req,res,next)=>{
    try {
        const category = req.query.id
        console.log(category);
        const categories = await Category.find({})
        const userId = req.session.user_id
        const products = await Product.find({productCategory:category})
         console.log(products);


        res.render('shop',{products,categories,userId ,selectedCategory: category})

    } catch (error) {
        next(error);
    }
}


const filter = async(req,res,next)=>{
    try {
        const category = req.query.category
        const sort = req.query.sort
        const userId = req.session.user_id
        const categories = await Category.find({})
        if(sort== "All"){
            res.redirect('/shop')
        }

        
        if(category== "All"){
            if(sort =="priceDesc"){
                const products = await Product.find().sort({ productPrice: -1 });
                res.render('shop',{products,categories,userId ,selectedCategory: category, selectedfilter:sort})   
            }else if(sort == "priceAsc"){
                const products = await Product.find().sort({ productPrice: 1 });
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort})   
            }else if(sort == "nameAsc"){
                let products = await Product.find({}).collation({locale: "en"}).sort({productName: 1})
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort})   
            }else if(sort == "nameDesc"){
                const products = await Product.find({}).collation({locale: "en"}).sort({productName:-1})
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort})   
            }else if(sort == "popularity"){
                const products = await Product.find({ viewCount: { $gt: 5 } })
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort}) 
            }

        }else if(category!="All"){
            if(sort =="priceDesc"){
                const products = await Product.find({productCategory:category}).sort({ productPrice: -1 });
                res.render('shop',{products,categories,userId ,selectedCategory: category, selectedfilter:sort})   
            }else if(sort == "priceAsc"){
                const products = await Product.find({productCategory:category}).sort({ productPrice: 1 });
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort})   
            }else if(sort == "nameAsc"){
                let products = await Product.find({productCategory:category}).collation({locale: "en"}).sort({productName: 1})
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort})   
            }else if(sort == "nameDesc"){
                const products = await Product.find({productCategory:category}).collation({locale: "en"}).sort({productName:-1})
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort})   
            }else if(sort == "popularity"){
                const products = await Product.find({ productCategory:category,viewCount: { $gt: 5 } })
                res.render('shop',{products,categories,userId ,selectedCategory: category,  selectedfilter:sort}) 
            }
        }
        
        console.log(category,sort);


    } catch (error) {
        next(error);
    }
}









module.exports ={
    loadSinglePage,
    filterCategory,
    filterProdcutByCategory,
    filter,
}