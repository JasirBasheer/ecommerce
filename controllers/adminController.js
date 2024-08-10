require('dotenv').config(); 
const User = require('../models/userModel')
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const {addProductImages,addCategoryImage, editCategoryImage, editproductImages} = require('../helpers/sharp')
const Order = require('../models/orderModel');
const { default: mongoose } = require('mongoose');
const Coupon = require('../models/couponModel');
const moment = require('moment');
const Offer = require('../models/offerModel')
const Wallet = require('../models/walletModel')



const loadAdminLoginPage = async(req,res,next)=>{
    try {
        res.render('adminlogin')
        
    } catch (error) {
        next(error);
    }
}



const loadAdminDashboard = async(req,res,next)=>{
    try {      
        
        let totalNumberSales = 0;
        const topSellingProducts = await Product.find({})
        .sort({ salesCount: -1 }) 
        .limit(10);

        const topSellingCategories = await Product.aggregate([
            {
                $group: {
                    _id: "$productCategory", 
                    totalSales: { $sum: "$salesCount" } 
                }
            },
            { $sort: { totalSales: -1 } }, 
            { $limit: 10 }])


            const userCount = await User.find({}).countDocuments()


          let orders = await Order.find({
                orderStatus: { $in: [ 'Delivered'] }
              });
            
        
      
              orders.forEach(orderItem => {
                if (orderItem.items && Array.isArray(orderItem.items) && orderItem.totalPrice != 0) {
                  orderItem.items.forEach(item => {
                    if (item.orderStatus === "Delivered") {
                      totalNumberSales += item.quantity;
                    }
                  });
                }
              });
        
            const total = orders.reduce((acc, cur) => {
                if (cur.orderStatus === "Delivered") {
                    return acc + cur.totalPrice;
                }
                return acc;
            }, 0);
            
 

        res.render('admindashboard',{topSellingProducts,userCount,total,totalNumberSales,topSellingCategories})
        
    } catch (error) {
        next(error);
    }
}



const loadSalesReport = async (req, res, next) => {
    try {
      let orders;
      let totalNumberSales = 0;
  
      if (req.query.startDate && req.query.endDate) {

        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
  
        orders = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: [ 'Delivered'] }
        });
      } else {
        orders = await Order.find({
          orderStatus: { $in: [ 'Delivered'] }
        });
      }
  

      orders.forEach(orderItem => {
        if (orderItem.items && Array.isArray(orderItem.items) && orderItem.totalPrice!=0) {
          orderItem.items.forEach(item => {
            if(item.orderStatus =="Delivered")
                    totalNumberSales += item.quantity; 

                
          });
        }
      });
  
      const total = orders.reduce((acc, cur) => acc + cur.totalPrice, 0); 
  

      orders = orders.map(order => ({
        ...order.toObject(),
        orderDate: moment(order.createdAt).format('DD/MM/YYYY')
      }));
  
      res.render('salesreport', { orders, total, totalNumberSales, moment });
  
    } catch (error) {
      next(error);
    }
  };
  

const loadOrderedList = async (req,res,next) => {
    try {
     
        const orders = await Order.find({}).sort({ createdAt: -1 });
        const returnProducts = await Order.find({
            'items.orderStatus': { $in: ['Return-Pending','Returned'] }
          }).sort({ createdAt: -1 });
        console.log(returnProducts);

        res.render('orderslist', { orders,returnProducts })
        
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
        
        const checkDuplicate = await Product.findOne({
            
            productName:{$regex: new RegExp(req.body.productName.trim(),'i')}
        })
        
        
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
        const newProductPrice = parseFloat(req.body.productPrice.trim());


      
if (newProductPrice === existingProduct.originalAmount) {

    existingProduct.productPrice = newProductPrice; 
    existingProduct.originalAmount = newProductPrice; 
} else {

    const discountPercentage = existingProduct.offerPercentage || 0;

    if (discountPercentage !== 0) {

        const discountAmount = (newProductPrice * discountPercentage) / 100;


        const discountedPrice = newProductPrice - discountAmount;


        existingProduct.productPrice = Math.round(discountedPrice ) 
    } else {

        existingProduct.productPrice = newProductPrice; 
    }


    existingProduct.originalAmount = Math.round(newProductPrice )  
}
        
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

        
        const categoryExist = await Category.findOne({
            categoryName: { $regex: new RegExp(categoryName, 'i') }
          });

        
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

        const checkDuplicate = await Category.findOne({
            categoryName: { $regex: new RegExp(req.body.categoryName.trim(), 'i') }
          });

        
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


   
        const checkproduct = await Product.findOne({
            
            productName:{$regex: new RegExp(productname,'i')}
        })
        
        if(checkproduct){
            const dup ="prdouct alreay exists"
             return res.status(200).json({dup})
        }

        const productimages = req.files

    
        const imagePaths = await addProductImages(productimages);
      
        const newProduct = new Product({
            productName: productname,
            productCategory: categoryName,
            productDescription: productDescription,
            productPrice: productPrice,
            originalAmount: productPrice,
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
            return res.status(200).json({ success: false, error: 'Product not found' });
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
            return res.status(200).json({ success: false, error: 'Product not found' });
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
            return res.status(200).json({ success: false, error: 'Product not found' });
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
            return res.status(200).json({ success: false, error: 'Product not found' });
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
            foreignField: "customerId",
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
            "orderDetails.addresss.fullName": 1,
            "orderDetails.addresss.number": 1,
            "orderDetails.addresss.house": 1,
            "orderDetails.addresss.street": 1,
            "orderDetails.addresss.landMark": 1,
            "orderDetails.addresss.city": 1,
            "orderDetails.addresss.state": 1,
            "orderDetails.addresss.pincode": 1,
            

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
        },
       
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


const  updateOrderStatus = async(req,res,next)=>{
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
                if (order.items[i].orderStatus == "Delivered") {
                    const productId = order.items[i].productId; 
                    await Product.findByIdAndUpdate(productId, {
                        $inc: { salesCount: order.items[i].quantity } 
                    });
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



const loadCouponList = async(req,res,next)=>{
    try {
        const coupons = await Coupon.find({})
     res.render('couponslist',{coupons})   
    } catch (error) {
        next(error)
    }
}

const loadAddCoupon = async(req,res,next)=>{
    try {
        res.render('addcoupon')
    } catch (error) {
        next(error)
    }
}


function createRandomNumber(length) {
    const randomNumber = Math.floor(Math.random() * Math.pow(10, length));
    return randomNumber.toString().padStart(length, '0');
}



const AddCoupon = async(req,res,next)=>{
    try {
        const couponName = req.body.couponName.trim()
        const discount = req.body.discount.trim()
        const minimumPur = req.body.minimumPur.trim()
        const maximum = req.body.maximum.trim()
        const expiryDate = req.body.expiryDate.trim()

        console.log('Coupon Name:', couponName);
        console.log('Discount Percentage:', discount);
        console.log('Minimum Purchase:', minimumPur);
        console.log('Maximum Discount:', maximum);
        console.log('Expiry Date:', expiryDate);

        const randomNumber = createRandomNumber(3);


        const newCoupon = `${couponName.toUpperCase()}${randomNumber}`;

        const coupon = new Coupon({
            couponName:newCoupon,
            discount:discount,
            minimumPurchase:minimumPur,
            limit:maximum,
            expiryDate:expiryDate,
            createdAt:Date.now()

        })
        const createCoupon = await coupon.save()
        if(createCoupon){
            return res.status(200).json({success:"coupon created successfully"})
        }else{
            return res.status(200).json({error:"Error creating coupon"})
        }


    } catch (error) {
        next(error)
    }
}





const loadOrdersStatus = async(req,res,next)=>{
    try {
      const startDate = new Date(new Date().getFullYear(),0,1);
      const endDate = new Date(new Date().getFullYear(),11,31,23,59,59,999);
      const pipeline = [
        {
          $match:{
            createdAt:{
              $gte:startDate,
              $lte:endDate
            }
          }
        },
        {
          $group:{
            _id:'$orderStatus',
            count: {$sum:1}
          }
        }
      ];
      const result = await Order.aggregate(pipeline);    
      res.json(result);
    } catch (error) {
      next(error);
    }
  }







const loadMonthlyChart = async(req,res,next)=>{
    try {
      const startDate = new Date(new Date().getFullYear(),0,1);
      const endDate = new Date(new Date().getFullYear(),11,31,23,59,59,999);
      const monthlySales = await Order.aggregate([
        {
          $match: {
            createdAt :{$gte: startDate, $lte: endDate},
            orderStatus:{$in:['Shipped','Delivered']}
          }
        },
        {
          $group: {
            _id:{
              month: {$month:{$toDate:"$createdAt"}},
              year: {$year:{$toDate:"$createdAt"}}
            },
            totalSales:{$sum:"$totalPrice"},
            totalOrder:{$sum: 1}
          }
        },
        {
          $sort: {'_id.year':1, '_id.month':1}
        }      
      ]);    
      res.json(monthlySales);
    } catch (error) {
      next(error);
    }
  }





  const loadYearlyChart = async (req, res, next) => {
    try {
      const yearlySales = await Order.aggregate([
        {
          $match: {
            orderStatus: { $in: ['Shipped', 'Delivered'] }
          }
        },
        {
          $group: {
            _id: { year: { $year: { $toDate: "$createdAt" } } },
            totalSales: { $sum: "$totalPrice" },
            totalOrder: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1 }
        }
      ]);
  
      res.json(yearlySales);
    } catch (error) {
      next(error);
    }
  };
  
  

  const loadWeeklyChart = async (req, res, next) => {
    try {
      const startDate = new Date(); // Current date
      const firstDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999); // End of the current month
  
      // Get the total sales per week for the current month
      const weeklySales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
            orderStatus: { $in: ['Shipped', 'Delivered'] }
          }
        },
        {
          $group: {
            _id: {
              week: { $subtract: [ { $week: { $toDate: "$createdAt" } }, { $week: { $toDate: firstDayOfMonth } }] }, // Adjust to get week of the month
              year: { $year: { $toDate: "$createdAt" } }
            },
            totalSales: { $sum: "$totalPrice" },
            totalOrder: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.week': 1 }
        }
      ]);
  
      // Prepare response for the current month
      const filledWeeklySales = Array.from({ length: 5 }, (_, i) => { // Expecting 5 weeks in a month
        const weekNum = i; // Week numbers start from 0
        const weekData = weeklySales.find(sale => sale._id.week === weekNum && sale._id.year === firstDayOfMonth.getFullYear());
        return {
          _id: { week: weekNum + 1, year: firstDayOfMonth.getFullYear() }, // Adjusting week number for display
          totalSales: weekData ? weekData.totalSales : 0,
        };
      });
  
      res.json(filledWeeklySales);
    } catch (error) {
      next(error);
    }
  };
  
  



  const loadAddSingleProductOffer = async(req,res,next)=>{
    try {
        const products = await Product.find({is_blocked:false})
        console.log(products);
        res.render('addproductoffer',{products})
        
    } catch (error) {
        next(error)
    }
  }



  const AddSingleProductOffer = async(req,res,next)=>{
    try {
        const {offerName,product,discount}=req.body
        console.log(product);
        const productId = new mongoose.Types.ObjectId(req.body.product)
        console.log(productId);
        const findprodcut = await Product.findOne({_id:productId})
        const productName =findprodcut.productName

              
        const offer = new Offer.SingleProductOffer({
            offerName:offerName,
            productId: productId,
            offerPercentage:discount,
            productName:productName
        })

        const saveOffer = await offer.save()
        if(saveOffer){
            const findProduct = await Product.findById(product)
            
            console.log(findProduct);

            const offeredPrice = findProduct.originalAmount - (findProduct.originalAmount * discount/100)


            findProduct.productPrice =Math.round(offeredPrice)
            findProduct.offerPercentage = discount

            await findProduct.save()
            return res.status(200).json({success:true})
            

        }

    } catch (error) {
        next(error)
    }
  }




  const loadAddCategoryOffer = async(req,res,next)=>{
    try {
        console.log('sdfas');
        const category = await Category.find({is_blocked:false})
        res.render('addcategoryoffer',{category})
        
    } catch (error) {
        next(error)
    }
  }


const activateProductoffer = async (req, res, next) => {
    try {
        
        const offerId = req.body.productOfferId;
        if (!offerId) {
            return res.status(400).json({ message: "productOfferId is required" });
        }

        const offer = await Offer.SingleProductOffer.findById(offerId);
        const findProduct = await Product.findById(offer.productId);


        if (findProduct.offerPercentage == 0) {
            offer.isActive = true;
            await offer.save();

            const offeredPrice = findProduct.originalAmount - (findProduct.originalAmount * offer.offerPercentage / 100);
            findProduct.productPrice = Math.round(offeredPrice);
            findProduct.offerPercentage = offer.offerPercentage;

            await findProduct.save();

            console.log(findProduct);
            return res.status(200).json({ success:true,message: "Product offer activated successfully" });
        } else {
            return res.status(400).json({ message: "Product already has an active offer" });
        }
    } catch (error) {
        next(error);
    }
};



const deactivateProductoffer = async (req, res, next) => {
    console.log("here");
    try {
        const offerId = req.body.productOfferId;
        const offer = await Offer.SingleProductOffer.findById(offerId);
        const findProduct = await Product.findById(offer.productId);
        

        if (findProduct.offerPercentage !== 0) {
            offer.isActive = false;
            await offer.save();

            findProduct.productPrice = findProduct.originalAmount; 
            findProduct.offerPercentage = 0;

            await findProduct.save();

            console.log(findProduct);
            return res.status(200).json({ success:true, message: "Product offer deactivated successfully" });
        } else {
            return res.status(400).json({ message: "Product has no active offer to deactivate" });
        }
    } catch (error) {
        next(error);
    }
};





const deleteProductOffer = async (req, res, next) => {
    try {
        const offerId = req.body.productOfferId;
        console.log(offerId);
        const offer = await Offer.SingleProductOffer.findOne({_id:new mongoose.Types.ObjectId(offerId)});
        const findProduct = await Product.findById(offer.productId);


        if (findProduct) {

            findProduct.productPrice = findProduct.originalAmount; 
            findProduct.offerPercentage = 0;

            await findProduct.save();

            await Offer.SingleProductOffer.findOneAndDelete({_id:new mongoose.Types.ObjectId(offerId)})

            return res.status(200).json({ success: "Product offer deactivated successfully" });

        } else {
            return res.status(400).json({ error: "Product no offer fount to  deactivate" });
        }


        
    } catch (error) {
        next(error);
    }
};






  const AddCategoryOffer = async (req, res, next) => {
    try {
        const offerName = req.body.offerName.trim();
        const category = req.body.product.trim();
        const discount = parseFloat(req.body.discount.trim()); 
        console.log(category, offerName, discount);

        
        const offer = new Offer.CategoryOffer({
            offerName: offerName,
            categoryName: category,
            offerPercentage: discount,
        });
        await offer.save();


        const updateCategory = await Category.findOne({ categoryName: category });
        if (!updateCategory) {
            return res.status(200).json({ error: "Category not found" });
        }

        updateCategory.categoryOfferPercentage = discount;
        await updateCategory.save();


        const findProducts = await Product.find({ productCategory: category});

        console.log(findProducts);

            if (!Array.isArray(findProducts)) {
            return res.status(200).json({ error: "Error retrieving products" });
        }


        const savePromises = findProducts.map(async (product) => {

            const singleoffer = await Offer.SingleProductOffer.findOne({productId:product._id})

            if(singleoffer){
                singleoffer.isActive=false
                await singleoffer.save()
            }


            const offeredPrice = product.originalAmount - (product.originalAmount * (discount / 100));
            console.log(offeredPrice);

            product.productPrice = Math.round(offeredPrice);
            product.offerPercentage = discount;

            return product.save();
        });

        await Promise.all(savePromises);


        res.status(200).json({ success: "Category offer added successfully" });
    } catch (error) {
        next(error);
    }
};



const activateCategoryOffer = async (req, res, next) => {
    try {
        const offerId = req.body.categoryOfferId; 
        const offer = await Offer.CategoryOffer.findOne({_id:new mongoose.Types.ObjectId(offerId)}); 

        console.log(offer);
      

        const category = offer.categoryName; 
        const findProducts = await Product.find({ productCategory: category });

        if (!findProducts.length) {
            return res.status(200).json({ message: "No products found in this category" });
        }

        const savePromises = findProducts.map(async (product) => {
           
            const singleoffer = await Offer.SingleProductOffer.findOne({productId:product._id})

            if(singleoffer){
                singleoffer.isActive=false
                await singleoffer.save()
            }


                const offeredPrice = product.originalAmount - (product.originalAmount * offer.offerPercentage / 100);
                product.productPrice = Math.round(offeredPrice);
                product.offerPercentage = offer.offerPercentage;

                await product.save();
      
        });

        await Promise.all(savePromises);

        offer.isActive = true;
        await offer.save();

        return res.status(200).json({ success: true,message: "Category offer activated successfully" });
    } catch (error) {
        next(error);
    }
};



const deactivateCategoryOffer = async (req, res, next) => {
    try {
        const offerId = req.body.categoryOfferId;
        const offer = await Offer.CategoryOffer.findOne({_id:new mongoose.Types.ObjectId(offerId)}); 
        console.log(offerId);
        const category = offer.categoryName; 
        const findProducts = await Product.find({ productCategory: category });
        console.log(findProducts);

        const savePromises = findProducts.map(async (product) => {
            if (product.offerPercentage !== 0) {
                product.productPrice = product.originalAmount; 
                product.offerPercentage = 0;

                await product.save();
            }
        });

        await Promise.all(savePromises);

        offer.isActive = false;
        await offer.save();

        return res.status(200).json({success: true, message: "Category offer deactivated successfully" });
    } catch (error) {
        next(error);
    }
};


const deleteCategoryOffer = async (req, res, next) => {
    try {
        const offerId = req.body.categoryofferId;
        const offer = await Offer.CategoryOffer.findOne({_id:new mongoose.Types.ObjectId(offerId)}); 
        console.log(offer);
        const category = offer.categoryName; 
        const update = await Category.findOneAndUpdate({ categoryName: category },{ $set:{ categoryOfferPercentage: 0 } },{ new: true });     
         const findProducts = await Product.find({ productCategory: category });
        console.log(findProducts);

        const savePromises = findProducts.map(async (product) => {
            if (product.offerPercentage !== 0) {                
                product.productPrice = product.originalAmount; 
                product.offerPercentage = 0;

                await product.save();
            }
        });

        await Promise.all(savePromises);

        await Offer.CategoryOffer.findOneAndDelete({_id:new mongoose.Types.ObjectId(offerId)})

        return res.status(200).json({ success: "Category offer deactivated successfully" });
    } catch (error) {
        next(error);
    }
};











const loadOffersList = async (req,res,next)=>{
    try {
        const productOffers = await Offer.SingleProductOffer.find()
        const categoryOffers = await Offer.CategoryOffer.find()

        res.render('offerslist',{productOffers,categoryOffers})
        
    } catch (error) {
        next(error)
    }
}


const loadEditCoupon = async(req, res, next)=>{
    try {
        const couponId = req.query.id

        const coupon = await Coupon.findOne({_id:new mongoose.Types.ObjectId(couponId)})
        console.log(coupon);
        res.render('editcoupon',{coupon})
        
    } catch (error) {
        next(error)
    }
}

const editCoupon = async (req, res, next) => {
    try {
        const findCoupon = await Coupon.findOne({ _id: req.body.id });

        const duplicateCoupon = await Coupon.findOne({ 
            couponName: { $regex: new RegExp('^' + req.body.couponName + '$', 'i') }
        });
        
        if (duplicateCoupon && duplicateCoupon._id != req.body.id) {
            return res.status(409).json({ message: "Coupon already exists" });
        }

        
        if (findCoupon) {
            if (findCoupon._id.toString() === req.body.id) {
                findCoupon.couponName = req.body.couponName;
                findCoupon.discount = req.body.discount;
                findCoupon.minimumPurchase = req.body.minimumPur;
                findCoupon.limit = req.body.maximum;
                findCoupon.expiryDate = req.body.expiryDate;
                
                await findCoupon.save(); 

                return res.status(200).json({ success: "Coupon updated successfully" });
            } else {
                return res.status(200).json({ message: "Coupon already exists" });
            }
        } else {
            return res.status(200).json({ message: "Coupon not found" });
        }
    } catch (error) {
        next(error);
    }
};



const blockCoupon = async (req,res,next)=>{
    try {
        const couponId = req.body.couponId;
        const coupon = await Coupon.findOne({_id:couponId})
        console.log(coupon);

        if(coupon){
            coupon.isActive=false
            await coupon.save()
            return res.status(200).json({success:"blocked"})
        }else{
            return res.status(200).json({error:"coupon not found"})
            
        }

        
    } catch (error) {
        
    }
}


const unBlockCoupon = async (req,res,next)=>{
    try {
        const couponId = req.body.couponId;
        const coupon = await Coupon.findOne({_id:couponId})
        console.log(coupon);

        if(coupon){
            coupon.isActive=true
            await coupon.save()
            return res.status(200).json({success:"blocked"})
        }else{
            return res.status(200).json({error:"coupon not found"})
            
        }

    } catch (error) {
        
    }
}




const loadEditproductOffer = async (req,res,next)=>{
    try {
        const id = req.query.id

        const offer = await Offer.SingleProductOffer.findOne({_id:id})
        const products = await Product.find()

        res.render('editproductoffer',{products,offer,id:offer.productId})

        
        
    } catch (error) {
        next(error)
        
    }
}



const editproductOffer = async (req,res,next)=>{
    try {
        const id = req.body.id
        const offerid = req.body.offerid
        const productId = req.body.product
        console.log(productId)
        console.log(id)

        const offer = await Offer.SingleProductOffer.findOne({_id:offerid})
        const product = await Product.findOne({_id:productId})
        const oldProduct = await Product.findOne({_id:id})
        console.log(offer);


        oldProduct.offerPercentage = 0
        oldProduct.productPrice = oldProduct.originalAmount
        await oldProduct.save()



        if (productId !== offer.productId.toString() && product.offerPercentage !== 0) {
            return res.status(200).json({ error: 'Offer already exists for this product' });
          }


          


        if(offer.isActive){

            offer.offerName =req.body.offerName
            offer.productId = req.body.product
            offer.productName = product.productName
            offer.offerPercentage = req.body.discount

            const updateOffer = await offer.save()

            const findProduct =await Product.findOne({_id:updateOffer.productId})
            console.log(updateOffer);
            console.log(findProduct);


              const offeredPrice = findProduct.originalAmount - (findProduct.originalAmount * offer.offerPercentage / 100);
              findProduct.productPrice = Math.round(offeredPrice);
             findProduct.offerPercentage = offer.offerPercentage;

        await findProduct.save();


        return res.status(200).json({success:true})

        }else{
            offer.offerName =req.body.offerName
            offer.productId = req.body.product
            offer.productName = product.productName
            offer.offerPercentage = req.body.discount

            await offer.save();

            return res.status(200).json({success:true})
    
        }
        
     
    } catch (error) {
        next(error)
        
    }
}







const loadEditCategoryOffer = async (req,res,next)=>{
    try {
        const id = req.query.id

        const offer = await Offer.CategoryOffer.findOne({_id:id})
        const category = await Category.find()

        console.log(id);
        res.render('editcategoryoffer',{category,offer,id:offer.categoryName})

        
        
    } catch (error) {
        next(error)
        
    }
}





const EditCategoryOffer = async (req, res, next) => {
    try {
        const { id, offerid, offerName, category, discount } = req.body;
        console.log(req.body);


        const oldOffer = await Offer.CategoryOffer.findOne({ categoryName: id });
        if (oldOffer) {
            oldOffer.offerPercentage = 0;
            await oldOffer.save();
        }

        const oldCategory = await Category.findOne({ categoryName: id });
        if (oldCategory) {
            oldCategory.categoryOfferPercentage = 0;
            await oldCategory.save();
        }


        const offer = await Offer.CategoryOffer.findOne({ _id: new mongoose.Types.ObjectId(offerid) });
        if (!offer) {
            return res.status(404).json({ error: "Offer not found" });
        }


        const duplicateOffer = await Offer.CategoryOffer.findOne({
            offerName: { $regex: new RegExp('^' + offerName + '$', 'i') },
            _id: { $ne: offerid }
        });

        if (duplicateOffer) {
            return res.status(200).json({ error: "Offer already exists" });
        }


        offer.offerName = offerName;
        offer.categoryName = category;
        offer.offerPercentage = discount;
        await offer.save();


        const updateCategory = await Category.findOne({ categoryName: category });
        if (updateCategory) {
            updateCategory.categoryOfferPercentage = discount;
            await updateCategory.save();
        }


        const oldProducts = await Product.find({ productCategory: id });
        const oldProductsPromises = oldProducts.map(async (product) => {
            const singleoffer = await Offer.SingleProductOffer.findOne({ productId: product._id });
            if (singleoffer) {
                singleoffer.isActive = false;
                await singleoffer.save();
            }

            product.productPrice = product.originalAmount;
            product.offerPercentage = 0;
            await product.save();
        });
        await Promise.all(oldProductsPromises);


        const findProducts = await Product.find({ productCategory: category });
        const savePromises = findProducts.map(async (product) => {
            const singleoffer = await Offer.SingleProductOffer.findOne({ productId: product._id });
            if (singleoffer) {
                singleoffer.isActive = false;
                await singleoffer.save();
            }

            const offeredPrice = product.originalAmount - (product.originalAmount * discount / 100);
            product.productPrice = Math.round(offeredPrice);
            product.offerPercentage = discount;
            await product.save();
        });
        await Promise.all(savePromises);

        return res.status(200).json({ success: "Category offer updated successfully" });
    } catch (error) {
        next(error);
    }
};








const approveReturn = async (req, res, next) => {
    try {
        const orderId = req.body.orderId;
        const productId = req.body.productId;
        const originalProduct = await Product.findOne({_id:new mongoose.Types.ObjectId(productId)})

        const order = await Order.findOne({_id:orderId})
        const wallet = await Wallet.findOne({userId:new mongoose.Types.ObjectId(order.customerId)})
        
        const findProduct = wallet.transactions.find((item) => {
            return item.productId.toString() === productId.toString();
        });


        const transctionIndex = wallet.transactions.findIndex(p => p.productId.equals(productId) && p.status == "pending");
        if (transctionIndex !== -1) {
            console.log(transctionIndex);
            console.log(findProduct);
            const amount = wallet.transactions[transctionIndex].amount
            console.log(wallet.transactions[transctionIndex].amount);
            wallet.totalAmount+=amount;
            wallet.pendingAmount-=amount;
            order.markModified('transactions');
            wallet.transactions[transctionIndex].status = "approved"
            originalProduct.num_of_stocks += wallet.transactions[transctionIndex].quantity
            originalProduct.salesCount -=1 
            await originalProduct.save()
            await wallet.save()     

            const findIndex = order.items.findIndex(p=> p.productId.equals(productId))
            if(findIndex !== -1){
                order.items[findIndex].orderStatus = "Returned"
            }

            console.log(amount);

            order.totalPrice -=amount
            order.markModified('items');

            await order.save() 



            const allReturned = order.items.every(item => item.orderStatus === 'Returned');
            if (allReturned) {
                console.log('enetertd');
              
              order.orderStatus = 'Returned'; 
            }
            order.markModified('items');
            
            await order.save();
    
        }
        


        res.status(200).json({ success: "Product returned successfully", updatedOrder: order });
    } catch (error) {
        next(error);
    }
};









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
    updateOrderStatus,
    loadCouponList,
    loadAddCoupon,
    AddCoupon,
    loadOrdersStatus,

    loadMonthlyChart,
    loadYearlyChart,
    loadWeeklyChart,
    


    loadAddSingleProductOffer,AddSingleProductOffer,

    loadAddCategoryOffer,AddCategoryOffer,

    loadOffersList,activateProductoffer,deactivateProductoffer,deactivateCategoryOffer,activateCategoryOffer,
    deleteCategoryOffer,deleteProductOffer,loadEditCoupon,editCoupon,blockCoupon,unBlockCoupon,loadEditproductOffer,editproductOffer,
    loadEditCategoryOffer,EditCategoryOffer,approveReturn
}