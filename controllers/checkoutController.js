const User = require('../models/userModel');
const mongoose = require('mongoose'); 
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')




const loadCheckout = async (req, res) => {
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
            grandTotal = totalPriceResult[0]?.grandTotal || 0;
            res.render('checkout', { user, userDetails, products: findProducts , grandTotal,cartCount });

        }


    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




const orderSuccess =  async(req,res)=>{
    try {
        const { ObjectId } = require('mongoose').Types;
        const method = req.query.method
        const userId = req.session.user_id._id
        const order = await Order.findOne({customer:userId})
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
        

  
        
        
        if(method =="COD"){
         
            if(user){
                const activeAddress = user.address.find(addr => addr.isActive);

                if(activeAddress){
                  

                    const newOrder = new Order({
                        customer:userId,
                        address:activeAddress._id,
                        items:cart.products,
                         totalPrice: grandTotal,
                         paymentMethod:"COD",
                         createdAt:Date.now() ,
 
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
        console.log(error.message);
    }
}



const cancelOrder = async (req, res) => {
    try {
      const userId = req.session.user_id._id;
      const productId = req.body.productId;
  
      const updatedOrder = await Order.findOneAndUpdate(
        {
          customer: new mongoose.Types.ObjectId(userId),
          "items._id": new mongoose.Types.ObjectId(productId)
        },
        {
          $set: {
            "items.$.orderStatus": "Cancelled"
          }
        },
        { new: true } 
      );
  
      if (!updatedOrder) {
        console.log('Order not found');
        return res.status(404).json({ message: 'Order not found' });
      }
  
      console.log('Order item status updated successfully');
      res.status(200).json({ success: 'Order item status canceled successfully' });
  
      
    } catch (error) {
      console.error('Error updating order item status:', error.message);
      res.status(500).json({ message: 'Error updating order item status' });
    }
  };
  
  

const recentOrders = async(req,res)=>{
    try {
        const user = req.session.user_id;
        let orders = [];
        if (user) {
            var userDetails = await User.findById(user._id);

            const pipeline = [
                { $match: { customer: new mongoose.Types.ObjectId(user._id) } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        _id: 1,
                        orderStatus: 1,
                        createdAt: 1,
                        "items.quantity": 1,
                        "items._id": 1,
                        "items.orderStatus": 1,
                        "productDetails.productName": 1,
                        "productDetails.productPrice": 1,
                        "productDetails.productCategory": 1,
                        "productDetails.productDescription": 1,
                        "productDetails.images": 1,
                        totalPrice: { $multiply: ["$items.quantity", "$productDetails.productPrice"] }
                    }
                }
            ];

            orders = await Order.aggregate(pipeline);
        }
        res.render('recentorders', { user, userDetails, orders });
        
    } catch (error) {
        
    }
}










const addNewAddress = async(req,res)=>{
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
        console.log(error.message);
    }
}


const markAddressAsActive = async (req, res) => {
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
        console.log('Error:', error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


const deleteAddress = async(req,res)=>{
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
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
}


const loadEditAddress = async (req, res) => {
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
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const editAddress = async(req,res)=>{
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
        console.log(error.message);
    }
}



const loadCreateNewAddress = async(req,res)=>{
    try {
        const user = req.session.user_id
        const page = req.query.id
        res.render('addnewaddress',{user,page})
    } catch (error) {
        console.log(error.message);
    }
}


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
    recentOrders,

}