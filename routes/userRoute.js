const express = require('express')
const user_route = express()
const bodyParser = require('body-parser')
const auth = require("../middleware/userAuth")
const session = require('express-session')
const nocache = require('nocache')
const path = require('path')


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

const userController = require('../controllers/userController')



//get 

user_route.get('/register',auth.isLogout,userController.loadRegister)
user_route.get('/login',auth.isNotAdmin,auth.isLogout,userController.loadLogin)
user_route.get('/',auth.isNotAdmin,userController.loadHome)
user_route.get('/shop',userController.loadShop)
user_route.get('/singlepage',userController.loadSinglePage)
user_route.get('/about',userController.loadAbout)
user_route.get('/contactus',userController.loadContactUs)
user_route.get('/blog',userController.loadBlog)
user_route.get('/cart',auth.isLogin,userController.loadCart)
user_route.get('/wishlist',auth.isLogin,userController.loadWishlist)
user_route.get('/user',userController.loadUser)
user_route.get('/verifyOtp',auth.isLogout,userController.verifyOtp)
user_route.get('/userIsBanned',auth.isLogout,userController.userBannedPageLoad)
user_route.get('/forgotpassword',userController.loadforgotpassword)
user_route.get('/resetpassword/:id/:token',userController.loadRestPassword)
user_route.get('/logout',auth.isLogin,userController.logout)
user_route.get('/addnewaddress',auth.isLogin,userController.loadCreateNewAddress)
user_route.get('/filterCategory',userController.filterCategory)






//post
user_route.post('/register',auth.isLogout,userController.insertUser)
user_route.post('/login',auth.isLogout,userController.userLogin)
user_route.post('/verifyOtp',auth.isLogout,userController.verifySignUp)
user_route.post('/resendOtp',auth.isLogout,userController.resendOtp)
user_route.post('/forgotpassword',auth.isLogout,userController.resetPassword)
user_route.post('/addnewaddress',auth.isLogin,userController.addNewAddress)
user_route.post('/markasactive',auth.isLogin,userController.markAddressAsActive)
user_route.get('/delelteaddress',auth.isLogin,userController.deleteAddress)
user_route.get('/editaddress',auth.isLogin,userController.loadEditAddress)
user_route.post('/editaddress',auth.isLogin,userController.editAddress)


module.exports = user_route