const express = require('express')
const user_route = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const nocache = require('nocache')
const path = require('path')




//Middlewares
const auth = require("../middleware/userAuth")
const errorHandler =require('../middleware/errorHandling')


user_route.use(express.static('public'));

user_route.set('view engine','ejs')
user_route.set('views','./views/user')





user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))
user_route.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false 

}))
user_route.use(nocache())
user_route.use(errorHandler)

//CONTROLLERS

const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const productController = require('../controllers/productController')
const checkoutController = require('../controllers/checkoutController')
const wishlistController = require('../controllers/wishlistController')
const paymentController = require('../controllers/paymentController');




//get 

user_route.get('/register',auth.isLogout,userController.loadRegister)
user_route.get('/login',auth.isLogout,userController.loadLogin)
user_route.get('/',userController.loadHome)
user_route.get('/shop',userController.loadShop)
user_route.get('/wallet',userController.loadWallet)




user_route.get('/singlepage',productController.loadSinglePage)
user_route.get('/about',userController.loadAbout)
user_route.get('/contactus',userController.loadContactUs)
user_route.get('/blog',userController.loadBlog)
user_route.get('/cart',auth.isLogin,cartController.loadCart)
user_route.get('/wishlist',auth.isLogin,wishlistController.loadWishlist)
user_route.get('/user',userController.loadUser)
user_route.get('/verifyOtp',auth.isLogout,userController.verifyOtp)
user_route.get('/forgotpassword',userController.loadforgotpassword)
user_route.post('/forgotpassword',userController.forgotpassword)
user_route.get('/logout',auth.isLogin,userController.logout)
user_route.get('/checkout',auth.isLogin,checkoutController.loadCheckout)
user_route.get('/addnewaddress',auth.isLogin,checkoutController.loadCreateNewAddress)
user_route.get('/filterCategory',productController.filterCategory)
user_route.get('/filterprodcutbycategory',productController.filterProdcutByCategory)
user_route.get('/filter',productController.filter)
user_route.get('/quickview',checkoutController.loadQuickView)
user_route.get('/userIsBanned',userController.loaduserIsBanned)
user_route.get('/search',productController.searchProducts)
user_route.post('/applycoupon',checkoutController.applyCoupon)
user_route.post('/removefromwishlist',wishlistController.removeFromWishlist)
user_route.post('/clearcoupon',checkoutController.clearCoupon)
user_route.get('/orderedlist',checkoutController.loadOrderList)

user_route.get('/resetpassword',userController.loadResetPassword)
user_route.post('/resetpassword',userController.resetPassword)

user_route.get('/ordersuccess',auth.isLogin,checkoutController.orderSuccess)
user_route.post('/cancelorder',auth.isLogin,checkoutController.cancelOrder)
user_route.get('/recentorders',auth.isLogin,checkoutController.recentOrders)
user_route.get('/accountdetails',auth.isLogin,userController.loadAccountDetails)
user_route.get('/updateuserpassword',auth.isLogin,userController.loadUpdateUserPassword)
user_route.post('/updateuserpassword',auth.isLogin,userController.updateUserPassword)
user_route.get('/ordersuccesss',auth.isLogin,checkoutController.loadOrderSuccess)
user_route.post('/updateuserdetails',auth.isLogin,userController.editUser)





//post
user_route.post('/register',auth.isLogout,userController.insertUser)
user_route.post('/login',auth.isLogout,userController.userLogin)
user_route.post('/verifyOtp',auth.isLogout,userController.verifySignUp)
user_route.post('/resendOtp',auth.isLogout,userController.resendOtp)
user_route.post('/forgotpassword',auth.isLogout,userController.resetPassword)
user_route.post('/addnewaddress',auth.isLogin,checkoutController.addNewAddress)
user_route.post('/markasactive',auth.isLogin,checkoutController.markAddressAsActive)
user_route.post('/deleteaddress',auth.isLogin,checkoutController.deleteAddress)
user_route.post('/incquantity',auth.isLogin,cartController.incQuantity)
user_route.post('/addtowishlist',auth.isLogin,wishlistController.addToWishlist)

user_route.get('/editaddress',auth.isLogin,checkoutController.loadEditAddress)
user_route.get('/genarateinvoice',auth.isLogin,checkoutController.generateInvoice)
user_route.post('/editaddress',auth.isLogin,checkoutController.editAddress)
user_route.post('/addtocart',auth.isLogin,cartController.addToCart)
user_route.post('/cart/removefromcart',auth.isLogin,cartController.removeFromCart)
user_route.post('/returnproduct',auth.isLogin,checkoutController.returnProduct)
user_route.post('/addreview',auth.isLogin,productController.addreview)
user_route.post('/subscribe-to-newsletter',auth.isLogin,userController.subscribeToNewsletter)






//razorpay
user_route.post('/createOrder', paymentController.createOrder);
user_route.post('/verifyPayment', paymentController.verifyPayment);






module.exports = user_route