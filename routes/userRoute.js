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

const userController = require('../contorllers/userController')



//get 

user_route.get('/register',auth.isLogout,userController.loadRegister)
user_route.get('/login',auth.isNotAdmin,auth.isLogout,userController.loadLogin)
user_route.get('/',auth.isNotAdmin,userController.loadHome)
user_route.get('/shop',userController.loadShop)
user_route.get('/singlepage',userController.loadSinglePage)
user_route.get('/about',userController.loadAbout)
user_route.get('/contactus',userController.loadContactUs)
user_route.get('/blog',userController.loadBlog)
user_route.get('/cart',userController.loadCart)
user_route.get('/wishlist',userController.loadWishlist)
user_route.get('/user',userController.loadUser)
user_route.get('/verifyOtp',auth.isLogout,userController.verifyOtp)
user_route.get('/userIsBanned',userController.userBannedPageLoad)
user_route.get('/forgotpassword',userController.loadforgotpassword)
user_route.get('/resetpassword/:id/:token',userController.loadRestPassword)
user_route.get('/logout',auth.isLogin,userController.logout)






//post
user_route.post('/register',auth.isLogout,userController.insertUser)
user_route.post('/login',auth.isLogout,userController.userLogin)
user_route.post('/verifyOtp',userController.verifySignUp)
user_route.post('/resendOtp',userController.resendOtp)
user_route.post('/forgotpassword',userController.resetPassword)


module.exports = user_route