require('dotenv').config(); 
const User = require('../models/userModel')
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const {addProductImages,addCategoryImage, editCategoryImage, editproductImages} = require('../helpers/sharp')
const Order = require('../models/orderModel');
const { default: mongoose } = require('mongoose');


const loadAdminLoginPage = async(req,res,next)=>{
    try {
        res.render('adminlogin')
        
    } catch (error) {
        next(error);
    }
}



const loadAdminDashboard = async(req,res,next)=>{
    try {
        res.render('admindashboard')
        
    } catch (error) {
        next(error);
    }
}



const loadSalesReport = async(req,res,next)=>{
    try {
        res.render('salesreport')
        
    } catch (error) {
        next(error);
    }
}

const loadOrderedList = async (req,res,next) => {
    try {
        const pipeline =[{$lookup:{from:"orders",localField:"_id",foreignField:"customer",as:"orderDetails"}},{$unwind:"$orderDetails"},{$project:{name:1,phone:1,"orderDetails.totalPrice":1,"orderDetails.orderStatus":1,"orderDetails.paymentMethod":1,"orderDetails.createdAt":1,"orderDetails._id":1,address:1}}]



        const orders = await User.aggregate(pipeline);

        // console.log(orders);

        res.render('orderslist', { orders })
        
    } catch (error) {
        next(error);
    }
}

const loadProductsList = async(req,res,next)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;

        const products = await Product.find({}).limit(limit*2).skip((page-1)*limit).exec()
        const count = await Product.find({}).countDocuments()
        res.render('productslist',{products,totalPages:Math.ceil(count/limit),currentPage:page})
        
    } catch (error) {
        next(error);
    }
}

const loadUserLists = async(req,res,next)=>{
    try {
        const users = await User.find({})
        res.render('userslist',{users})
        
    } catch (error) {
        next(error);
    }
}

const loadCategoryList = async(req,res,next)=>{
    try {
        const categories = await Category.find({})
        console.log(categories);
        res.render('categorylist',{categories})
        
    } catch (error) {
        next(error);
    }
}

const loadAddCategory = async(req,res,next)=>{
    try {
        res.render('addcategory')
        
    } catch (error) {
        next(error);
    }
}

const loadProductsLists = async(req,res,next)=>{
    try {
       

                res.render('productlists')
        
    } catch (error) {
        next(error);
    }
}

const loadAddProduct = async(req,res,next)=>{
    try {
        const category = await Category.find({})
        res.render('addproduct',{category})
        
    } catch (error) {
        next(error);
    }
}


const loadEditProduct = async(req,res,next)=>{
    try {
        const id = req.query.id
        const product = await Product.findOne({_id:id})
        const categories = await Category.find({})
        res.render('editproduct',{product,categories})
        
    } catch (error) {
        next(error);
    }
}


const editProduct = async (req,res,next) => {
    try {
       
        const productId = req.body.id; 
        const product = await Product.findOne({_id:productId})
        const categories = await Category.find({})
       
        const existingProduct = await Product.findById(productId);
        if (req.body.productName.trim() === "") {
            return res.render('editproduct', { product, categories, message: 'Enter a valid name' });
        }
        if (req.body.productDescription.trim() === "") {
            return res.render('editproduct', { product, categories, message: 'Enter a valid Description' });
        }
        
        if (req.files.length>0&& req.files.length<3) {
            return res.render('editproduct',{product,categories,message:'required 3 images minimum '});
        }

        const checkDuplicate = await Product.findOne({productName:req.body.productName.trim()})
        if(checkDuplicate && checkDuplicate.id.toString() !== productId){
            return res.render('editproduct', { product, categories, message: 'Product already exists' });

        }

        let newImages = [];
        if (req.files && req.files.length > 0) {

           newImages = await editproductImages(req.files)


        } else {
            newImages = existingProduct.images;
        }

        existingProduct.productName = req.body.productName.trim();
        existingProduct.productCategory = req.body.productCategory;
        existingProduct.productPrice = req.body.productPrice.trim();
        existingProduct.num_of_stocks = req.body.productStocks;
        existingProduct.productDescription = req.body.productDescription;
        existingProduct.images = newImages;

        const updatedProduct = await existingProduct.save();
        if (updatedProduct) {
          
            req.flash("success","Product successfuly edited")
            res.redirect('/admin/productslist')
        } else {
            res.status(500).send('Failed to update product.');
        }

    } catch (error) {
        next(error);
        res.status(500).send('Error updating product.');
    }
};





const verifyAdmin =  async(req,res,next)=>{
    try {
        const {email,password} = req.body
        console.log(email);
        console.log(password);
        if(email == process.env.ADMIN_EMAIL){
            if(password == process.env.ADMIN_PASSWORD){
                req.session.admin_id = email
                res.redirect('/admin/')
            }else{
                res.render('adminlogin',{message:"password is wrong"})
            }

        }else{
            res.render('adminlogin',{message:"Admin does not exists"})
        }
        
    } catch (error) {
        next(error);
    }
}

const logout = async(req,res,next)=>{
    try {
        req.session.destroy()
        res.redirect('/admin')
        
    } catch (error) {
        next(error);
    }
}

const unBlockUser = async(req,res,next)=>{
    try {
        const userId =req.body.userId
        const userdata = await User.findOne({_id:userId})
        if(userdata){
            var resp = await User.updateOne({_id:userId},{$set:{is_blocked:0}})
        }else{
            console.log("something went wrong");
        }
      
       

        
    } catch (error) {
        next(error);

    }
}


const BlockUser = async(req,res,next)=>{
    try {
        const userId =req.body.userId
        const userdata = await User.findOne({_id:userId})
        if(userdata){
            var resp = await User.updateOne({_id:userId},{$set:{is_blocked:1}})
        }else{
            console.log("something went wrong");
        }
      
        
    } catch (error) {
        next(error);
    }
}



const addCategory = async (req,res,next) => {
    try {
        const categoryName = req.body.categoryName;
        const categoryExist = await Category.findOne({ categoryName: categoryName });

        
        if (req.body.categoryName.trim() === "") {
            return res.render('addcategory', { message: 'Enter a valid name' });
        }
        
        if (!categoryExist) {
            if (!req.files || req.files.length === 0) {
                return res.send('An image is required.');
            }
            const databasePath = await addCategoryImage(req.files)

            const newCategory = new Category({
                categoryName: categoryName,
                image: [databasePath],
                is_blocked:false
            });

            const category = await newCategory.save();
            if (category) {
                req.flash("success","New category successfuly added")
                res.redirect('/admin/categorylist')
            } else {
                res.end('Error: Category not created');
            }
        } else {
            res.render('addcategory',{message:'Category already exists'});
        }
    } catch (error) {
        next(error);
        res.status(500).send('Error adding category.');
    }
};
const loadEditCategory = async(req,res,next)=>{
    try {
        const id = req.query.id
        const category = await Category.findById(id)

        res.render('editcategory',{category})
    } catch (error) {
        next(error);
    }
}

const editCategory = async (req,res,next) => {
    try {
        const categoryId = req.body.id;
        const existingCategory = await Category.findById(categoryId);

          
        if (req.body.categoryName.trim() === "") {
            return res.render('editcategory', { category:existingCategory,message: 'Enter a valid name' });
        }

        if (!existingCategory) {
            req.flash("error","Category Not found")
            res.redirect('/admin/categorylist')
        }
        const checkDuplicate = await Category.findOne({ categoryName: req.body.categoryName.trim() });

        
        if(checkDuplicate && checkDuplicate._id.toString() !== categoryId){
            return res.render('editcategory', { category:existingCategory,message: 'Category already exists' });
        }

        let newImage;
        if (req.file) {

           newImage = await editCategoryImage(req.file)    
        } else {
            newImage = existingCategory.image[0];
        }

        existingCategory.categoryName = req.body.categoryName.trim();
        existingCategory.image = [newImage];

        const updatedCategory = await existingCategory.save();
        if (updatedCategory) {
            req.flash("success","Category successfuly edited")
            res.redirect('/admin/categorylist')
        } else {
            res.status(500).send('Failed to update category.');
        }

        
    } catch (error) {
        next(error);
        res.status(500).send('Error updating category.');
    }
};





const addProduct = async(req,res,next)=>{
    try {
        const productname = req.body.productName.trim()
        const categoryName = req.body.productCategory.trim()
        const productPrice = req.body.productPrice.trim()
        const productStocks = req.body.productStocks.trim()
        const productDescription = req.body.productDescription.trim()
        const category = await Category.find({})
   
        const checkproduct = await Product.findOne({productName:productname})
        
        if(checkproduct){
            const dup ="prdouct alreay exists"
            res.status(200).json({dup})
        }

        const productimages = req.files

    
        const imagePaths = await addProductImages(productimages);
      
        const newProduct = new Product({
            productName: productname,
            productCategory: categoryName,
            productDescription: productDescription,
            productPrice: productPrice,
            num_of_stocks: productStocks,
            images: imagePaths,
            is_blocked:false,
            viewCount:0
        });

        const suc = await newProduct.save();

        if (suc) {
          req.flash("success","New Product successfuly added")
            res.status(200).json({suc})
            } else {
            res.end('Error saving product.');
        }


       
        
    } catch (error) {
        next(error);
    }
}



const blockProduct = async(req,res,next)=>{
    try {
        const productId = req.body.productId
        const product = await Product.findByIdAndUpdate(
            productId, 
            { is_blocked: true }, 
            { new: true }
          );       
          
          if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
          }


        
    } catch (error) {
        next(error);
    }
}




const unBlockProduct = async(req,res,next)=>{
    try {
        const productId = req.body.productId
        const product = await Product.findByIdAndUpdate(
            productId, 
            { is_blocked: false }, 
            { new: true }
          );       
          
          if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
          }


        
    } catch (error) {
        next(error);
    }
}







const blockCategory = async(req,res,next)=>{
    try {
        const categoryId = req.body.categoryId
        const blockcategory = await Category.findByIdAndUpdate(
            categoryId, 
            { is_blocked: true }, 
            { new: true }
          );       
          
          if (!blockcategory) {
            return res.status(404).json({ success: false, error: 'Product not found' });
          }


        
    } catch (error) {
        next(error);
    }
}




const unblockCategory = async(req,res,next)=>{
    try {
        const categoryId = req.body.categoryId
        const unblockcategory = await Category.findByIdAndUpdate(
            categoryId, 
            { is_blocked: false }, 
            { new: true }
          );       
          
          if (!unblockcategory) {
            return res.status(404).json({ success: false, error: 'Product not found' });
          }


        
    } catch (error) {
        next(error);
    }
}



const deleteCategory = async (req,res,next) => {
    try {
        const categoryId = req.query.id;

        const deletecategory = await Category.findByIdAndDelete(categoryId);
        if (deletecategory) {
            req.flash("warning","category successfully deleted")
            res.redirect('/admin/categorylist')
        } else {
            req.flash("error","Category not deleted")
            res.redirect('/admin/categorylist')
        }
    } catch (error) {
        next(error);
        res.status(500).send('Error deleting category');
    }
}


const deleteProductImage = async(req,res,next)=>{
    try {
        const productId = req.body.productId
        const productImage = req.body.image
        console.log(productImage);

        const product = await Product.findOne({_id:productId})
        if(product){
            if(product.images.length<4){
                return res.status(200).json({error:"need at least 3 images"})

            }else{
                product.images = product.images.filter(image => image !== productImage)

                await product.save()

                res.status(200).json({success:"Product image successfuly deleted"})

                
            }
        }else{

            req.flash("error","Product not found")
            res.redirect('/admin/productslist')

        }
        
    } catch (error) {
        next(error);
    }
}


const loadOrderview = async(req,res,next)=>{
    try {
        const orderId = req.query.id

      const pipeline = [
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "customer",
            as: "orderDetails"
          }
        },
        {
          $unwind: "$orderDetails"
        },
        {
          $lookup: {
            from: "products",
            localField: "orderDetails.items.productId",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        {
          $unwind: "$productDetails"
        },
        {
          $project: {
            name: 1,
            phone: 1,
            address: 1,
            "orderDetails.totalPrice": 1,
            "orderDetails.orderStatus": 1,
            "orderDetails.items.productId": 1,
            "orderDetails.items.quantity": 1,
            "orderDetails.items.orderStatus": 1,
            "orderDetails.paymentMethod": 1,
            "orderDetails.createdAt": 1,
            "orderDetails._id": 1,
            "productDetails.productName": 1,
            "productDetails._id": 1,
            "productDetails.productPrice": 1,
            "productDetails.productCategory": 1,
            "productDetails.productDescription": 1,
            "productDetails.images": 1
          }
        }
      ];
      
      const results = await User.aggregate(pipeline);

      const filteredOrders = results.filter(order => order.orderDetails._id.toString() === orderId);


      console.log(filteredOrders);
      console.log(filteredOrders[0].orderDetails);


        res.render('orderview',{filteredOrders})
        
    } catch (error) {
        next(error);
    }
}


const updateOrderStatus = async(req,res,next)=>{
    try {
        const orderId = req.body.orderId
        const orderStatus = req.body.orderStatus

        const order = await Order.findOne({_id:orderId})

        if (order) {
            
            order.orderStatus = orderStatus;

            let itemsModified = false;
            for (let i = 0; i < order.items.length; i++) {
                if (order.items[i].orderStatus !== "Cancelled") {
                    order.items[i].orderStatus = orderStatus;
                    itemsModified = true;
                }
            }

            if (itemsModified) {
                order.markModified('items');
            }


            const result = await order.save();

           if(result){
            console.log("saved successfully");
            return res.status(200).json({orderstatus:"orderstatuschanged successfully"})
           }
        }
        
    } catch (error) {
        next(error)
        
    }
}

module.exports ={
    loadAdminDashboard,
    loadAdminLoginPage,
    loadSalesReport,
    loadProductsList,
    loadUserLists,
    loadCategoryList,
    loadAddCategory,
    loadProductsLists,
    loadAddProduct,
    loadOrderedList,
    verifyAdmin,
    logout,
    unBlockUser,
    BlockUser,
    addCategory,
    addProduct,
    blockProduct,
    unBlockProduct,
    loadEditProduct,
    editProduct,
    editCategory,
    loadEditCategory,
    blockCategory,
    unblockCategory,
    deleteCategory,
    deleteProductImage,
    loadOrderview,
    updateOrderStatus
}