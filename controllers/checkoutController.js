const User = require('../models/userModel');
const mongoose = require('mongoose'); 
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const Wallet = require('../models/walletModel')
const moment = require('moment')
const { jsPDF } = require("jspdf");
var fs = require('fs');




const loadCheckout = async (req,res,next) => {
    try {
        const user = req.session.user_id;
        const userId = new mongoose.Types.ObjectId(user._id);
        const cart = await Cart.findOne({ userId });
        let cartCount = 0;
        const wallet = await Wallet.findOne({userId:userId})
        
        const walletBalance = wallet.totalAmount

        let userDetails = null;
        let shippingCharge=0
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
                    },
                },
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
            const currentDate = new Date();
            const Acoupons = await Coupon.find({ 
                minimumPurchase: { $lt: subTotal }, 
                limit: { $ne: 0 }, 
                expiryDate: { $gt: currentDate } 
            });

            


            let outoffstock = false;
            let returnProductId;

            let grandTotal = subTotal - cart.applyedDiscount
            let coupon = cart.applyedDiscount
        
            for (let i = 0; i < cart.products.length; i++) {
              const checkQuantity = await Product.findOne({ _id: cart.products[i].productId });
              if (checkQuantity && checkQuantity.num_of_stocks == 0|| checkQuantity && checkQuantity.num_of_stocks < cart.products[i].quantity) {
                outoffstock = true;

                returnProductId = new mongoose.Types.ObjectId(cart.products[i].productId);
                
                break;
              }
            }

                

            shippingCharge = cart.shippingCharge
            // grandTotal-=shippingCharge

            cart.shippingCharge = 0

            await cart.save()

            if (cart.shippingCharge == 0 ) {

                let shippingCharge = (subTotal >= 2500 && subTotal !== 0) ? 0 : 200;
                

                grandTotal+=shippingCharge

                

                cart.shippingCharge=shippingCharge;
                
                await cart.save()
                
            }


                  
              
    
                 if(outoffstock){

                    return res.render('cart', { products: findProducts ,cartCount,userId:user , grandTotal, returnProductId,walletBalance,shippingCharge,Acoupons} );

            
                 }

                
            res.render('checkout', { user, userDetails, products: findProducts , grandTotal,cartCount,subTotal,coupon,walletBalance,shippingCharge,Acoupons});

        }


    } catch (error) {
        next(error);
    }
};




const generateOrderID = async () => {
    let orderid = 1 ;
    
    const checkOrderId = await Order.find().countDocuments()
    if (checkOrderId) {
        orderid= checkOrderId
        orderid++
       return orderid

    }else{
        return 1

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

        let shippingChargeAmount = (grandTotal >= 2500 && grandTotal !== 0) ? 0 : 200;

        grandTotal +=shippingChargeAmount


        

        if(cart.Coupon!=0){
            const coupon = await Coupon.findOne({couponName:cart.applyedCoupon})
            if(coupon){
                const minimumPur = coupon.minimumPurchase
                if (minimumPur>grandTotal) {
                    cart.Coupon=0
                    cart.applyedCoupon=""
                    await cart.save()

                    
                }
                 Total = grandTotal
    
                const couoponDiscount = cart.applyedDiscount
                  grandTotal = Total - couoponDiscount
    
                 
                  cart.limit-=1;
                  await cart.save()
    
            }else{
                Total = grandTotal
    
                const couoponDiscount = cart.applyedDiscount
                  grandTotal = Total - couoponDiscount

                  await cart.save()

            }
         
            
        }

        const appliedReffreal = cart.appliedReffreal
        
        
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
                
               const expectedDeliveryDate = new Date();
              expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);


              
                if(activeAddress){
                    const newOrder = new Order({
                        orderId:Orderid,
                        customerId:userId,
                        customer:orderedUserDetails.name,
                        phone:activeAddress.number,
                        address:activeAddress._id,
                        items:cart.products,
                         totalPrice: grandTotal,
                         shippingCharge:shippingChargeAmount,
                         paymentMethod:"COD",
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
                         applyedDiscount:applyedDiscount,
                         appliedReffreal:appliedReffreal,
                         expectedDeliveryDate: expectedDeliveryDate,

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

                return res.render('checkout',{message:"Select a valid address to continue"})

            }

           
                
            

        }else if(method =="wallet"){



         
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
                
               const expectedDeliveryDate = new Date();
              expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);


              
                if(activeAddress){
                    const wallet = await Wallet.findOne({userId:userId})


                    
                    if(wallet.totalAmount<grandTotal){
                        console.log("insufirant abount");

                    }else{

                        const newOrder = new Order({
                            orderId:Orderid,
                            customerId:userId,
                            customer:orderedUserDetails.name,
                            phone:activeAddress.number,
                            address:activeAddress._id,
                            items:cart.products,
                             totalPrice: grandTotal,
                             shippingCharge:shippingChargeAmount,
                             paymentMethod:"Wallet",
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
                             applyedDiscount:applyedDiscount,
                             appliedReffreal:appliedReffreal,
                             expectedDeliveryDate: expectedDeliveryDate,
    
                        })
                       const SaveOrder = await newOrder.save()
                       let productIds=[]
                       let productNames=[]
                       let i=0
                       if (SaveOrder) {
                        for (const product of cart.products) {
                            const eachProductId = product.productId;
                            const actualProduct = await Product.findById(eachProductId);
                             productIds[i]=eachProductId
                            productNames[i++]=actualProduct.productName
    
                            if (actualProduct) {
                                actualProduct.num_of_stocks -= product.quantity;
                                await actualProduct.save();
                            } else {
                                console.log(`Product with ID ${eachProductId} not found`);
                            }
    
                        }

                        wallet.totalAmount-=grandTotal
                        wallet.transactions.push({
                            amount: Math.max(grandTotal, 0),
                            for:"purchase",
                            status:"approved",
                            productId: productIds,
                            orderId: SaveOrder._id,
                            productName: productNames,
                            createdAt: new Date()
                        });
                        
                        await wallet.save()
    
    
                        
    
    
                             const clearCart = await Cart.findByIdAndDelete(cart._id)
                     
    
                        if(clearCart){
                            res.render('ordersuccess')
    
                            }
                    }else{
                        res.end('error')
                       }

                        
                    }

                  
                }else{
                    return res.render('checkout',{message:"Select a valid address to continue"})

                }

            }else{

                return res.render('checkout',{message:"Select a valid address to continue"})

            }

           
                

            

            
        }

    } catch (error) {
        next(error);
    }
}


const loadOrderSuccess = async(req,res,next)=>{
    try {

        res.render('ordersuccess')

    } catch (error) {
        next(error)
    }
}




const cancelOrder = async (req,res,next) => {
    try {
      const userId = req.session.user_id._id;
      const productId = req.body.productId;
      const originalProductId = new mongoose.Types.ObjectId(req.body.originalProductId)
      const productName = req.body.productName;
      const quantity =parseInt(req.body.quantity)
      let productPrice = req.body.productPrice;


      const orderId = req.body.orderId
      const orders = await Order.findOne({_id:orderId})
      const clearCoupon = req.body.clearCoupon
      


    
      if(orders.applyedDiscount!=0){
        const findCoupon = await Coupon.findOne({couponName:orders.applyedCoupon})
        

        if(clearCoupon==1){
  
            
            


            if(findCoupon){
                
   


                
            let productpricePlusDiscount = productPrice-findCoupon.discount

             await User.findOneAndUpdate({couponName:orders.applyedCoupon},{$inc:{limit:1}})
             orders.applyedCoupon =""
             orders.applyedDiscount=0
             await orders.save()
             findCoupon.limit++;
             await findCoupon.save()

            const updatedOrder = await Order.findOneAndUpdate(
                {
                  customerId: new mongoose.Types.ObjectId(userId),
                  "items._id": new mongoose.Types.ObjectId(productId)
                },
                {
                  $set: {
                    "items.$.orderStatus": "Cancelled",
                  }        
                },
                { new: true } 
              );
              const updateProduct = await Product.findOneAndUpdate(
                { _id: originalProductId },
                { $inc: { num_of_stocks: quantity } },
                { new: true }
              );
              

      
              const order = await Order.findOne({_id:orderId})
    

              const allCancelled = order.items.every(item => item.orderStatus === 'Cancelled');
              if (allCancelled) {
                
                order.orderStatus = 'Cancelled'; 
                
              }
              await order.save();
           
              
             
              

              if (!updatedOrder && !updateProduct) {

                return res.status(404).json({ message: 'Order not found' });
              }

              

              if(updatedOrder.paymentMethod != "COD" ){
                const findWallet = await Wallet.findOne({userId:userId}) 

            if(order.orderStatus =='Cancelled'){
                productpricePlusDiscount+=order.shippingCharge
                order.shippingCharge=0
                await order.save()
    
              }
              order.totalPrice -=productpricePlusDiscount
              await order.save()
           

                findWallet.totalAmount += parseInt(productpricePlusDiscount);
               
                findWallet.transactions.push({
                amount: Math.max(productpricePlusDiscount, 0),
                for:"Cancelled",
                status:"approved",
                productId: productId,
                orderId: orderId,
                productName: productName,
                createdAt: new Date()
            });
                findWallet.markModified('transactions')

                await findWallet.save();

                res.status(200).json({ online: 'Order item status canceled successfully.in Online' });

              }else{
                order.totalPrice -=productpricePlusDiscount
                await order.save()



                res.status(200).json({ offline: 'Order item status canceled successfully' });
              }
            }else{


                
                let itemsCount =0
                if (orders && orders.items) {
                    itemsCount = orders.items.reduce((acc, item) => {
                        const excludedStatuses = ["Cancelled", "Delivered", "Returned", "Return-Pending"];
                        if (!excludedStatuses.includes(item.orderStatus)) {
                            acc++;
                        }
                        return acc;
                    }, 0);

                } 

                
                

                if(itemsCount==1){

                    let productpricePlusDiscount = productPrice-200
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
                 }       
               },
               { new: true } 
             );
             const updateProduct = await Product.findOneAndUpdate(
               { _id: originalProductId },
               { $inc: { num_of_stocks: quantity } },
               { new: true }
             );
             

     
             const order = await Order.findOne({_id:orderId})
           
   

             const allCancelled = order.items.every(item => item.orderStatus === 'Cancelled');
             if (allCancelled) {
               
               order.orderStatus = 'Cancelled'; 
               
             }
             order.applyedDiscount =0
             await order.save();
          
             
            
             

             if (!updatedOrder && !updateProduct) {

                return res.status(404).json({ message: 'Order not found' });
             }

             if(order.orderStatus =='Cancelled'){
                productpricePlusDiscount+=order.shippingCharge
                order.shippingCharge=0
                await order.save()
    
              }

             

             if(updatedOrder.paymentMethod != "COD" ){
               const findWallet = await Wallet.findOne({userId:userId}) 
               

          

               findWallet.totalAmount += parseInt(productpricePlusDiscount);
              
               findWallet.transactions.push({
               amount: productpricePlusDiscount,
               for:"Cancelled",
               status:"approved",
               productId: productId,
               orderId: orderId,
               productName: productName,
               createdAt: new Date()
           });
               findWallet.markModified('transactions')

               await findWallet.save();
               order.totalPrice-=productpricePlusDiscount
               await order.save()

               res.status(200).json({ online: 'Order item status canceled successfully.in Online' });

             }else{
                order.totalPrice-=productpricePlusDiscount
                await order.save()



                res.status(200).json({ offline: 'Order item status canceled successfully' });
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
        
                      
                      const updateProduct = await Product.findOneAndUpdate(
                        { _id: originalProductId },
                        { $inc: { num_of_stocks: quantity } },
                        { new: true }
                      );
        
                      const order = await Order.findOne({_id:orderId})
            
        
                      const allCancelled = order.items.every(item => item.orderStatus === 'Cancelled');
                      if (allCancelled) {
                        
                        order.orderStatus = 'Cancelled'; 
                      }
                      await order.save();
        
                 
              
        
              
              
                      
        
                      if (!updatedOrder && !updateProduct) {

                        return res.status(404).json({ message: 'Order not found' });
                      }
                  
                 
        
                      if(updatedOrder.paymentMethod=="online" ){
        
        
                        const findWallet = await Wallet.findOne({userId:userId}) 
        
                        findWallet.totalAmount += parseInt(productPrice);
        
                 
                   
                       
                        findWallet.transactions.push({
                        amount: Math.max(productPrice, 0),
                        productId: productId,
                        for:"Cancelled",
                        status:"approved",
                        orderId: orderId,
                        productName: productName,
                        createdAt: new Date()
                    });
                        findWallet.markModified('transactions')
        
                        await findWallet.save();
        
                        res.status(200).json({ online: 'Order item status canceled successfully.in Online' });
        
                      }else{
        

                        res.status(200).json({ offline: 'Order item status canceled successfully' });
                      }
                }
        


            



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

              
              const updateProduct = await Product.findOneAndUpdate(
                { _id: originalProductId },
                { $inc: { num_of_stocks: quantity } },
                { new: true }
              );

              const order = await Order.findOne({_id:orderId})
    

              const allCancelled = order.items.every(item => item.orderStatus === 'Cancelled');
              if (allCancelled) {
                
                order.orderStatus = 'Cancelled'; 
              }
              await order.save();

         
      

      
      
              

              if (!updatedOrder && !updateProduct) {

                return res.status(404).json({ message: 'Order not found' });
              }
          
         

              if(updatedOrder.paymentMethod!="COD" ){


                const findWallet = await Wallet.findOne({userId:userId}) 

                findWallet.totalAmount += parseInt(productPrice);

         
           
               
                findWallet.transactions.push({
                amount: Math.max(productPrice, 0),
                productId: productId,
                for:"Cancelled",
                status:"approved",
                orderId: orderId,
                productName: productName,
                createdAt: new Date()
            });
                findWallet.markModified('transactions')

                await findWallet.save();

                res.status(200).json({ online: 'Order item status canceled successfully.in Online' });

              }else{


                res.status(200).json({ offline: 'Order item status canceled successfully' });
              }
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

          

          const updateProduct = await Product.findOneAndUpdate(
            { _id: originalProductId },
            { $inc: { num_of_stocks: quantity } },
            { new: true }
          );

      
          const order = await Order.findOne({_id:orderId})
    

          const allCancelled = order.items.every(item => item.orderStatus === 'Cancelled');
          if (allCancelled) {
            
            order.orderStatus = 'Cancelled'; 
          }
          await order.save();
  
  
              

          if (!updatedOrder && !updateProduct) {

            return res.status(404).json({ message: 'Order not found' });
            
          }
      
                    
          if(order.orderStatus == 'Cancelled'){

            order.totalPrice-=order.shippingCharge
            await order.save()

          }
  

    
          if(updatedOrder.paymentMethod != "COD" ){
           

            const findWallet = await Wallet.findOne({userId:userId}) 

            
            if(order.orderStatus =='Cancelled'){
                productPrice = parseInt(productPrice); 
                productPrice += parseInt(order.shippingCharge);

                order.shippingCharge = 0;
                await order.save();
                
            }
            findWallet.totalAmount += parseInt(productPrice);
           
            findWallet.transactions.push({
            amount: Math.max(productPrice, 0),
            productId: productId,
            for:"Cancelled",
            status:"approved",
            orderId: orderId,
            productName: productName,
            createdAt: new Date()
        });
            findWallet.markModified('transactions')

            await findWallet.save();


            res.status(200).json({ online: 'Order item status canceled successfully.in Online' });

          }else{

            order.shippingCharge = 0;
                await order.save();
 

                res.status(200).json({ offline: 'Order item status canceled successfully' });
          }


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
                
    {
        $sort: { createdAt: 1 }
    }
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
        const isreffreal = req.body.isreffreal
      
        
      

        if(cart){

            if(!isreffreal){
                if(cart.Coupon==0){
                    const findCoupon = await Coupon.findOne({couponName:coupon})
                    if(!findCoupon){
                        return res.status(200).json({couponNotExists:"Coupon not exists"})
                    }
                    if (findCoupon.isActive) {
                    const now = new Date();
                    if (findCoupon.expiryDate > now && findCoupon.limit!==0) {
    
    

                        
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

            
            }else{

                if(cart.Coupon==1){
                    return res.status(200).json({alreadyapplyed:"Coupon already applyed"})
                }
                const wallet = await Wallet.findOne({referralCode:coupon})


                if(!wallet){
                    return res.status(200).json({notAValidReffreal:"enter a valid reffreal"})
                }


                if(wallet.userId == req.session.user_id._id ){
                    return res.status(200).json({needTobeAnotherUser:"need to be the another user  to claim the reffreal offer"})
                }


                const checkfirstorder = await Order.findOne({customerId: new mongoose.Types.ObjectId(req.session.user_id._id)})

                if(checkfirstorder){
                    return res.status(200).json({onlyApplicableForFirstOrder:"need to be the first order to claim the reffreal offer"})
                }

               


                cart.Coupon = 1
                cart.appliedReffreal = coupon
                cart.applyedDiscount = 200

                await cart.save()

                return res.status(200).json({reffrealSuccess:'coupon added successfully'})


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

        if (cart) {
           
                    cart.Coupon = 0;
                    cart.applyedCoupon = "";
                    cart.appliedReffreal = "";
                    cart.applyedDiscount =0;
                    await cart.save();
                
            
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
                    shippingCharge: 1,
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
                    expectedDeliveryDate: 1,
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
                    shippingCharge: { $first: "$shippingCharge" },
                    expectedDeliveryDate: { $first: "$expectedDeliveryDate" },
                    items: { $push: "$items" },
                },
            },
        ];
        
        const orders = await Order.aggregate(pipeline);
        
        if (orders && orders.length > 0) {
            let discount = 0;
            let minimumPur = 0;
            let isrefferealApplied = 0
        
            if (orders[0].applyedDiscount != 0 && orders[0].applyedCoupon) {
                const applyCoupon = orders[0].applyedCoupon;
                const coupon = await Coupon.findOne({ couponName: applyCoupon });

                
                if (coupon) {
                    discount = coupon.discount;
                    minimumPur = coupon.minimumPurchase;
                } else {
                    console.log(`Coupon not found: ${applyCoupon}`);
                }
            }

            

            if(orders[0].applyedCoupon=="" && orders[0].applyedDiscount==200){
                isrefferealApplied=1

            }


            
            res.render('orderedlist', { orders, discount, minimumPur,moment,isrefferealApplied});
        } else {

            res.render('orderedlist', { orders: [], discount: 0, minimumPur: 0 });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};



const returnProduct = async (req, res, next) => {
    try {
        const orderId = req.body.orderId;
        const productId = req.body.productId;

        const product = await Product.findOne({ _id: new mongoose.Types.ObjectId(productId) });
        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const itemIndex = order.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Product not found in the order" });
        }

        const itemToReturn = order.items[itemIndex];
        const totalItemPrice = itemToReturn.productPrice * itemToReturn.quantity;
        const discountAmount = itemToReturn.applyedDiscount || 0;


       
        

        const totalProductPrices = order.items.reduce((sum, item) => {
            if (item.orderStatus !== 'Cancelled') {
                return sum + (item.productPrice * item.quantity);
            }
            return sum;
        }, 0);


        if (isNaN(totalProductPrices)) {
            console.error('Total Product Prices resulted in NaN');
            return res.status(500).json({ message: "Error calculating total product prices" });
        }

        const adjustedPrice = totalItemPrice - discountAmount;


        if (isNaN(adjustedPrice)) {
            console.error('Adjusted Price resulted in NaN');
            return res.status(500).json({ message: "Error calculating adjusted price" });
        }

        let refundAmount;
        if (order.applyedCoupon != 0 || order.appliedReffreal != 0 ) {
            const couponValue = order.applyedDiscount;
            const proportionalDiscount = Math.round((adjustedPrice / totalProductPrices) * couponValue * 100) / 100;
            refundAmount = Math.round(adjustedPrice - proportionalDiscount);
        } else {
            refundAmount = Math.round(adjustedPrice);
        }


        if (isNaN(refundAmount)) {
            console.error('Refund Amount resulted in NaN');
            return res.status(500).json({ message: "Error calculating refund amount" });
        }

        const wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(req.session.user_id._id) });
        


        
        wallet.pendingAmount = Math.round(wallet.pendingAmount + refundAmount);
        wallet.transactions.push({
            amount: refundAmount,
            productId: productId,
            orderId: orderId,
            productName: product.productName,
            createdAt: new Date(),
            quantity: itemToReturn.quantity
        });

        await wallet.save();

        itemToReturn.orderStatus = 'Return-Pending';
        order.markModified('items');
        await order.save();

        const allReturned = order.items.every(item => item.orderStatus === 'Return-Pending');
        if (allReturned) {
            order.orderStatus = 'Return-Pending';
        }
        await order.save();

        res.status(200).json({ success: "Product returned successfully", updatedOrder: order });
    } catch (error) {
        next(error);
    }
};



const generateInvoice = async (req, res, next) => {
    try {
      const userId = req.session.user_id._id; 
      const order = await Order.findOne({ customerId: userId }).sort({ createdAt: -1 });
      
      
  
      if (!order) {
        throw new Error('Order not found');
      }
  

      const discount = order.applyedDiscount || 0;
      const subtotal = order.totalPrice + discount;
      const total = subtotal - discount;
  

      const doc = new jsPDF();
  

      doc.setFontSize(20);
      doc.text("Invoice", 105, 20, null, null, "center");
      doc.setFontSize(12);
      doc.text("Sender:", 20, 40);
      doc.text("Wood Street", 20, 45);
      doc.text("America", 20, 50);
      doc.text("ZIP: 2324", 20, 55);
      doc.text("City: Washington Dc", 20, 60);
      doc.text("Country: America", 20, 65);

      doc.text("Client:", 120, 40);
      doc.text(order.customer, 120, 45);
      doc.text(`${order.addresss.house}, ${order.addresss.street}`, 120, 50);
      doc.text(`ZIP: ${order.addresss.pincode}`, 120, 55);
      doc.text(`City: ${order.addresss.city}`, 120, 60);
      doc.text(`Country: ${order.addresss.state}`, 120, 65);
   doc.text(`Invoice Number: INV-${order.orderId}`, 20, 80);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 85);
      doc.text(`Due Date: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}`, 20, 90);
      doc.setFontSize(12);
      doc.setFont("courier", "bold");
      doc.text("Product", 20, 110);
      doc.text("Qty", 120, 110);
      doc.text("Price (INR)", 150, 110);
  

      

      let y = 120;
      order.items.forEach(item => {
        doc.text(item.productName, 20, y);
        doc.text(item.quantity.toString(), 120, y);
        doc.text(item.productPrice.toString(), 150, y);
        y += 10;
      });
  
     
  

      y += 10;
      doc.text(`Applied Coupon: INR ${discount}`, 20, y);
      y += 10;
      doc.text(`Shipping Charge: INR ${order.shippingCharge}`, 20, y);
      y += 10;
      doc.text(`Total: INR ${total}`, 20, y);
  

      const pdfBuffer = doc.output('arraybuffer');
  

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
      res.send(Buffer.from(pdfBuffer));
  
    } catch (error) {
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
    loadOrderList,
    returnProduct,
    loadOrderSuccess,
    generateInvoice,
    



}