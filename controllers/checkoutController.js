const User = require('../models/userModel');
const mongoose = require('mongoose'); 
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');




const loadCheckout = async (req,res,next) => {
    try {
        const user = req.session.user_id;
        const userId = new mongoose.Types.ObjectId(user._id);
        const cart = await Cart.findOne({ userId });
        let cartCount = 0;

        let userDetails = null;
        let grandTotal = 0;

    

        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }
        if(!cart || cart.products.length ==0){
            return res.render('cart',{message:"Please add something to cart to checkout"})
        }
       

        if (user) {
            userDetails = await User.findById(user._id);


            const pipeline = [
                { $match: { userId } },
                { $unwind: "$products" },
                {
                    $project: {
                        product: "$products.productId",
                        quantity: "$products.quantity",
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "product",
                        foreignField: "_id",
                        as: "items",
                    },
                },
                { $unwind: "$items" }, 
                {
                    $project: {
                        productId: "$items._id",
                        productName: "$items.productName",
                        productCategory: "$items.productCategory",
                        productDescription: "$items.productDescription",
                        productPrice: "$items.productPrice",
                        num_of_stocks: "$items.num_of_stocks",
                        images: "$items.images",
                        is_blocked: "$items.is_blocked",
                        reviews: "$items.reviews",
                        quantity: "$quantity",
                        totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },
    
                    }
                }
            ];


            const TotalPricePipeline = [
                { $match: { userId } },
                { $unwind: "$products" },
                {
                    $project: {
                        product: "$products.productId",
                        quantity: "$products.quantity",
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "product",
                        foreignField: "_id",
                        as: "items",
                    },
                },
                { $unwind: "$items" },
                {
                    $project: {
                        productId: "$items._id",
                        productName: "$items.productName",
                        productCategory: "$items.productCategory",
                        productDescription: "$items.productDescription",
                        productPrice: "$items.productPrice",
                        num_of_stocks: "$items.num_of_stocks",
                        images: "$items.images",
                        is_blocked: "$items.is_blocked",
                        reviews: "$items.reviews",
                        quantity: "$quantity",
                        totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        grandTotal: { $sum: "$totalPrice" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        grandTotal: 1,
                    },
                },
            ];
            const findProducts = await Cart.aggregate(pipeline);
            const totalPriceResult = await Cart.aggregate(TotalPricePipeline);
            subTotal = totalPriceResult[0]?.grandTotal || 0;


            let outoffstock = false;
            let returnProductId;
            console.log("before");
            let grandTotal = subTotal - cart.applyedDiscount
            let coupon = cart.applyedDiscount
        
            for (let i = 0; i < cart.products.length; i++) {
              const checkQuantity = await Product.findOne({ _id: cart.products[i].productId });
              if (checkQuantity && checkQuantity.num_of_stocks == 0) {
                outoffstock = true;
                console.log("hereree");
                returnProductId = new mongoose.Types.ObjectId(cart.products[i].productId);
                
                break;
              }
            }
              
    
                 if(outoffstock){
                    console.log(returnProductId+"something");
                     return res.render('cart', { products: findProducts ,cartCount,userId:user , grandTotal, returnProductId} );

            
                 }
            
            res.render('checkout', { user, userDetails, products: findProducts , grandTotal,cartCount,subTotal,coupon });

        }


    } catch (error) {
        next(error);
    }
};


function randomOrderID() {
    return Math.floor(100000 + Math.random() * 900000);
  }
  



const generateOrderID = async () => {
    let orderid = randomOrderID();

    const checkOrderId = await Order.findOne({orderId:orderid});
    if (!checkOrderId) {
       return orderid

    }else{
        generateOrderID();

    }
  };
  

  



const orderSuccess =  async(req,res,next)=>{
    try {
        const { ObjectId } = require('mongoose').Types;
        const method = req.query.method
        const userId = req.session.user_id._id
        const order = await Order.findOne({customerId:userId})
        const cart = await Cart.findOne({userId:userId})
        const user = await User.findOne({ _id: userId, "address.isActive": true });
        let grandTotal = 0;
        if(!cart){
            return res.redirect('/shop')
        }
   
        

    
        const TotalPricePipeline = [
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: "$products" },
            {
                $project: {
                    product: "$products.productId",
                    quantity: "$products.quantity",
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "items",
                },
            },
            { $unwind: "$items" },
            {
                $project: {
                    totalPrice: { $multiply: ["$quantity", "$items.productPrice"] },
                },
            },
            {
                $group: {
                    _id: null,
                    grandTotal: { $sum: "$totalPrice" },
                },
            },
            {
                $project: {
                    _id: 0,
                    grandTotal: 1,
                },
            },
        ];
        
        const totalPriceResult = await Cart.aggregate(TotalPricePipeline);
        
        grandTotal = totalPriceResult[0]?.grandTotal || 0;

        if(cart.Coupon!=0){
            const coupon = await Coupon.findOne({couponName:cart.applyedCoupon})
            const minimumPur = coupon.minimumPurchase
            if (minimumPur>grandTotal) {
                cart.Coupon=0
                cart.applyedCoupon=""
                await cart.save()
                console.log("need at least purcase ");
                
            }
             Total = grandTotal

            const couoponDiscount = cart.applyedDiscount
              grandTotal = Total - couoponDiscount

             
              cart.limit-=1;
              await cart.save()

            
        }
        

  
        
        
        if(method =="COD"){
         
            if(user){
                const activeAddress = user.address.find(addr => addr.isActive);
                const orderedUserDetails = await User.findOne({"address._id":activeAddress._id})
                
               const Orderid = await generateOrderID()

             
               const applyCoupon = cart.applyedCoupon
               const applyedDiscount = cart.applyedDiscount
               const coupon = await Coupon.findOne({couponName:applyCoupon})
               if(coupon){
                let couponlimit = coupon.limit-1
               coupon.limit= couponlimit
               await coupon.save()
               }
                
             
                    

                if(activeAddress){
                    const newOrder = new Order({
                        orderId:Orderid,
                        customerId:userId,
                        customer:orderedUserDetails.name,
                        phone:orderedUserDetails.phone,
                        address:activeAddress._id,
                        items:cart.products,
                         totalPrice: grandTotal,
                         paymentMethod:"COD",
                         createdAt:Date.now() ,
                         addresss:{
                         fullName: activeAddress.fullName, 
                         number: activeAddress.number,
                         house: activeAddress.house,
                         street: activeAddress.street,
                         landMark: activeAddress.landMark,
                         city: activeAddress.city,
                         state: activeAddress.state,
                         pincode: activeAddress.pincode,
                         },
                         applyedCoupon:applyCoupon,
                         applyedDiscount:applyedDiscount
                    })
                   const SaveOrder = await newOrder.save()
                   if (SaveOrder) {
                    for (const product of cart.products) {
                        const eachProductId = product.productId;
                        const actualProduct = await Product.findById(eachProductId);

                        if (actualProduct) {
                            actualProduct.num_of_stocks -= product.quantity;
                            await actualProduct.save();
                        } else {
                            console.log(`Product with ID ${eachProductId} not found`);
                        }

                    }
                    


                         const clearCart = await Cart.findByIdAndDelete(cart._id)
                 

                    if(clearCart){
                        res.render('ordersuccess')

                        }
                }else{
                    res.end('error')
                   }
                }else{
                    return res.render('checkout',{message:"Select a valid address to continue"})

                }

            }else{
                console.log('reached here');
                return res.render('checkout',{message:"Select a valid address to continue"})

            }

           
                
            

        }

    } catch (error) {
        next(error);
    }
}



const cancelOrder = async (req,res,next) => {
    try {
      const userId = req.session.user_id._id;
      const productId = req.body.productId;
      const originalProductId = new mongoose.Types.ObjectId(req.body.originalProductId)
      const productPrice = req.body.productPrice;
      const quantity =parseInt(req.body.quantity)
      console.log(typeof quantity);
      const orderId = req.body.orderId
      const orders = await Order.findOne({_id:orderId})
      const clearCoupon = req.body.clearCoupon


    
      if(orders.applyedDiscount!=0){
        const findCoupon = await Coupon.findOne({couponName:orders.applyedCoupon})
        

        if(clearCoupon==1){

            const productpricePlusDiscount = productPrice-findCoupon.discount

             await User.findOneAndUpdate({couponName:orders.applyedCoupon},{$inc:{limit:1}})
             orders.applyedCoupon =""
             orders.applyedDiscount=0
             await orders.save()

            const updatedOrder = await Order.findOneAndUpdate(
                {
                  customerId: new mongoose.Types.ObjectId(userId),
                  "items._id": new mongoose.Types.ObjectId(productId)
                },
                {
                  $set: {
                    "items.$.orderStatus": "Cancelled",
                  },    
                  $inc: { totalPrice: - productpricePlusDiscount }
        
                },
                { new: true } 
              );
              const updateProduct = await Product.findOneAndUpdate(
                { _id: originalProductId },
                { $inc: { num_of_stocks: quantity } },
                { new: true }
              );
      
              

              if (!updatedOrder && !updateProduct) {
                console.log('Order not found');
                return res.status(404).json({ message: 'Order not found' });
              }
          
              console.log('Order item status updated successfully');
              res.status(200).json({ success: 'Order item status canceled successfully' });


        }else{
            const updatedOrder = await Order.findOneAndUpdate(
                {
                  customerId: new mongoose.Types.ObjectId(userId),
                  "items._id": new mongoose.Types.ObjectId(productId)
                },
                {
                  $set: {
                    "items.$.orderStatus": "Cancelled",
                  },    
                  $inc: { totalPrice: - productPrice }
        
                },
                { new: true } 
              );
              console.log(updatedOrder);
          
              const updateProduct = await Product.findOneAndUpdate(
                { _id: originalProductId },
                { $inc: { num_of_stocks: quantity } },
                { new: true }
              );
      
              

              if (!updatedOrder && !updateProduct) {
                console.log('Order not found');
                return res.status(404).json({ message: 'Order not found' });
              }
          
              console.log('Order item status updated successfully');
              res.status(200).json({ success: 'Order item status canceled successfully' });
        }



      }else{

        const updatedOrder = await Order.findOneAndUpdate(
            {
              customerId: new mongoose.Types.ObjectId(userId),
              "items._id": new mongoose.Types.ObjectId(productId)
            },
            {
              $set: {
                "items.$.orderStatus": "Cancelled",
              },    
              $inc: { totalPrice: - productPrice }
    
            },
            { new: true } 
          );
          console.log(updatedOrder);
      

          const updateProduct = await Product.findOneAndUpdate(
            { _id: originalProductId },
            { $inc: { num_of_stocks: quantity } },
            { new: true }
          );
  
              

          if (!updatedOrder && !updateProduct) {
            console.log('Order not found');
            return res.status(404).json({ message: 'Order not found' });
          }
      
          console.log('Order item status updated successfully');
          res.status(200).json({ success: 'Order item status canceled successfully' });


      }

      

      
  
    
  
      
    } catch (error) {
        next(error);

    }
  };
  
  

const recentOrders = async(req,res,next)=>{
    try {
        const user = req.session.user_id;
        let orders = [];
        if (user) {
            var userDetails = await User.findById(user._id);
            const userId = new mongoose.Types.ObjectId(user._id);



            const pipeline = [
                { $match: { customerId: userId } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails",
                    },
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        orderId: 1,
                        customerId: 1,
                        customer: 1,
                        phone: 1,
                        address: 1,
                        totalPrice: 1,
                        orderStatus: 1,
                        paymentMethod: 1,
                        createdAt: 1,
                        addresss: 1,
                        applyedCoupon: 1,
                        applyedDiscount: 1,
                        "items.productId": "$productDetails._id",
                        "items.quantity": "$items.quantity",
                        "items.orderStatus": "$items.orderStatus", 
                        "items._id": "$items._id",
                        "items.images": "$productDetails.images",
                        "items.productName": "$productDetails.productName",
                        "items.productPrice": "$productDetails.productPrice"
                    },
                },
                {
                    $group: {
                        _id: "$_id",
                        orderId: { $first: "$orderId" },
                        customerId: { $first: "$customerId" },
                        customer: { $first: "$customer" },
                        phone: { $first: "$phone" },
                        address: { $first: "$address" },
                        totalPrice: { $first: "$totalPrice" },
                        orderStatus: { $first: "$orderStatus" },
                        paymentMethod: { $first: "$paymentMethod" },
                        createdAt: { $first: "$createdAt" },
                        addresss: { $first: "$addresss" },
                        applyedCoupon: { $first: "$applyedCoupon" },
                        applyedDiscount: { $first: "$applyedDiscount" },
                        items: { $push: "$items" },
                    },
                },
            ];


            orders = await Order.aggregate(pipeline);
        }
        res.render('recentorders', { user, userDetails, orders });
        
    } catch (error) {
        next(error);

    }
}










const addNewAddress = async(req,res,next)=>{
    try {
        const {fullName , number, house, street, landMark, city, state, pincode, id } = req.body
        const page = req.query.page

        const user = await User.findById(id);


        if(user){
            if (!user.address || user.address.length === 0) {
                const newAddress = {
                    fullName,
                    number,
                    house,
                    street,
                    landMark,
                    city,
                    state,
                    pincode,
                    isActive:true
                };
                console.log("address not found");
                user.address.push(newAddress);


            }else{
                const newAddress = {
                    fullName,
                    number,
                    house,
                    street,
                    landMark,
                    city,
                    state,
                    pincode
                };
                user.address.push(newAddress);

            }
            


            const savedUser = await user.save();
            console.log('Updated User:', savedUser);
            if(!page){
                res.redirect('/user')
            }else{
                res.redirect('/checkout')

            }
        }

    } catch (error) {
        next(error);
    }
}


const markAddressAsActive = async (req,res,next) => {
    try {
        const { userId, addressId } = req.body;
        const user = await User.findById(userId);

        if (user) {
            user.address.forEach((address) => {
                address.isActive = address._id.toString() === addressId;
            });

            const data = await user.save();

            res.status(200).json({ data: data });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        next(error);

    }
};


const deleteAddress = async(req,res,next)=>{
    try {
        const { userId, addressId } = req.body;

        const user = await User.findById(userId);

        if (user) {
            user.address = user.address.filter(address => address._id.toString() !== addressId);
            const data = await user.save();
            
            res.status(200).json({ data });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        next(error);
    }
}


const loadEditAddress = async (req,res,next) => {
    try {
        const addressId = req.query.id;
        const page = req.query.page
        const user = await User.findOne({_id:req.session.user_id._id, "address._id": addressId });

        if (user) {
            const address = user.address.find(addr => addr._id.toString() === addressId);
            res.render('editaddress', { address,page });
        } else {
            res.status(404).json({ message: "Address not found" });
        }
    } catch (error) {
        next(error);
    }
};

const editAddress = async(req,res,next)=>{
    try {
        const {addressId, fullName, number, house, street, landMark, city, state, pincode}= req.body
        const user = await User.findOne({"address._id":addressId})
        const page = req.query.page

        if(user){

            const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
            console.log(addressIndex);
            if(addressIndex  !== -1){
                user.address[addressIndex].fullName = fullName;
                user.address[addressIndex].number = number;
                user.address[addressIndex].house = house;
                user.address[addressIndex].street = street;
                user.address[addressIndex].landMark = landMark;
                user.address[addressIndex].city = city;
                user.address[addressIndex].state = state;
                user.address[addressIndex].pincode = pincode;
                
                await user.save()
                if(!page){
                    res.redirect('/user')
                }else{
                    res.redirect('/checkout')

                }
            }

        }
    } catch (error) {
        next(error);
    }
}



const loadCreateNewAddress = async(req,res,next)=>{
    try {
        const user = req.session.user_id
        const page = req.query.id
        res.render('addnewaddress',{user,page})
    } catch (error) {
        next(error);
    }
}

const loadQuickView = async (req,res,next)=>{
    try {
        const productId = req.query.id
        const orderId = req.query.orderId
        const userId = req.session.user_id._id

        const product = await Product.findOne({_id:productId})
        const orderedDetails = await Order.findOne({_id:orderId})
        const findproductquantity = orderedDetails.items.filter((item)=>{
            if(item.productId == productId){
                return item.quantity
            }
        })
        const orderedQuantity = findproductquantity[0].quantity

        

        res.render("quickView",{product,orderedDetails,orderedQuantity,userId});
    } catch (error) {
        next(error)
    }
}





const applyCoupon = async (req,res,next)=>{
    try {
        const coupon = req.body.couponinp
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id)
        const cart = await Cart.findOne({ userId: userId });
        console.log("carttttt"+cart);

        if(cart){
            if(cart.Coupon==0){
                const findCoupon = await Coupon.findOne({couponName:coupon})
                if(!findCoupon){
                    return res.status(200).json({couponNotExists:"Coupon not exists"})
                }
                if (findCoupon.isActive) {
                const now = new Date();
                if (findCoupon.expiryDate > now && findCoupon.limit!==0) {


                    console.log(findCoupon);
               
                    const pipeline = [
                        {
                          $match: { userId: userId }
                        },
                        {
                          $unwind: "$products"
                        },
                        {
                          $lookup: {
                            from: "products",
                            localField: "products.productId",
                            foreignField: "_id",
                            as: "productDetails"
                          }
                        },
                        {
                          $unwind: "$productDetails"
                        },
                        {
                          $addFields: {
                            "productDetails.quantity": "$products.quantity",
                            "productDetails.totalPrice": {
                              $multiply: ["$products.quantity", "$productDetails.productPrice"]
                            }
                          }
                        },
                        {
                          $group: {
                            _id: null, 
                            products: { $push: "$productDetails" }, 
                            grandTotal: { $sum: "$productDetails.totalPrice" } 
                          }
                        },
                        {
                          $project: {
                            _id: 0,
                            products: 1,
                            grandTotal: 1
                          }
                        }
                      ];
    
                      const products = await Cart.aggregate(pipeline);
                      const totalPrice = products[0].grandTotal
    
    
                    if (findCoupon.minimumPurchase>totalPrice) {

                        return res.status(200).json({totalisless:"total is less than coupon requirement"})
                        
                    }
    
                    cart.Coupon = 1
                    cart.applyedCoupon = findCoupon.couponName
                    cart.applyedDiscount = findCoupon.discount
    
                    await cart.save()
    
                    return res.status(200).json({success:'coupon added successfully'})
    
    
                    


                    
                }else{
                    return res.status(200).json({couponIsExpired:"Coupon expired"})
                }
            }else{
                return res.status(200).json({couponIsNotActive:"This Coupon is not active"})

            }
                

            }else{
                return res.status(200).json({alreadyapplyed:"Coupon already applyed"})
            }
        }


    } catch (error) {
        next(error)
    }
}

const clearCoupon = async(req,res,next)=>{
    try {
        const user = req.session.user_id

        const userId = new mongoose.Types.ObjectId(user._id);

        new mongoose.Types.ObjectId
        const cart = await Cart.findOne({ userId })

        if (cart.Coupon) {
            const coupon = await Coupon.findOne({ couponName: cart.applyedCoupon });
            if (coupon) {
                    cart.Coupon = 0;
                    cart.applyedCoupon = "";
                    cart.applyedDiscount =0;
                    await cart.save();
                
            }
            res.status(200).json({success:"coupon cleared"})
        }

     



    
        
    } catch (error) {
        next(error)
    }
}



const loadOrderList = async (req, res, next) => {
    try {
        const user = req.session.user_id
        let userId
        let orderId 
        if(user){
            userId = new mongoose.Types.ObjectId(req.session.user_id._id);
         orderId = new mongoose.Types.ObjectId(req.query.id);


        }else{
         return res.redirect('/login')
        }
     

        const pipeline = [
            { $match: { customerId: userId, _id: orderId } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    orderId: 1,
                    customerId: 1,
                    customer: 1,
                    phone: 1,
                    address: 1,
                    totalPrice: 1,
                    orderStatus: 1,
                    paymentMethod: 1,
                    createdAt: 1,
                    addresss: 1,
                    applyedCoupon: 1,
                    applyedDiscount: 1,
                    "items.productId": "$productDetails._id",
                    "items.quantity": "$items.quantity",
                    "items.productPrice": "$items.productPrice",
                    "items.orderStatus": "$items.orderStatus", 
                    "items._id": "$items._id",
                    "items.images": "$productDetails.images",
                    "items.productName": "$productDetails.productName",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    orderId: { $first: "$orderId" },
                    customerId: { $first: "$customerId" },
                    customer: { $first: "$customer" },
                    phone: { $first: "$phone" },
                    address: { $first: "$address" },
                    totalPrice: { $first: "$totalPrice" },
                    orderStatus: { $first: "$orderStatus" },
                    paymentMethod: { $first: "$paymentMethod" },
                    createdAt: { $first: "$createdAt" },
                    addresss: { $first: "$addresss" },
                    applyedCoupon: { $first: "$applyedCoupon" },
                    applyedDiscount: { $first: "$applyedDiscount" },
                    items: { $push: "$items" },
                },
            },
        ];
        
        const orders = await Order.aggregate(pipeline);
        
        if (orders && orders.length > 0) {
            let discount = 0;
            let minimumPur = 0;
        
            if (orders[0].applyedDiscount != 0 && orders[0].applyedCoupon) {
                const applyCoupon = orders[0].applyedCoupon;
                const coupon = await Coupon.findOne({ couponName: applyCoupon });
                console.log(coupon);
        
                if (coupon) {
                    discount = coupon.discount;
                    minimumPur = coupon.minimumPurchase;
                } else {
                    console.log(`Coupon not found: ${applyCoupon}`);
                }
            }

            console.log(orders[0].items);

            res.render('orderedlist', { orders, discount, minimumPur });
        } else {
            console.log('No orders found or orders array is empty.');
            res.render('orderedlist', { orders: [], discount: 0, minimumPur: 0 });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};



module.exports ={
    loadCreateNewAddress,
    addNewAddress,
    markAddressAsActive,
    deleteAddress,
    loadEditAddress,
    editAddress,
    loadCheckout,
    orderSuccess,
    cancelOrder,
    recentOrders,loadQuickView,
    applyCoupon,clearCoupon,
    loadOrderList



}