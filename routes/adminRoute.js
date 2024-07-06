const express = require('express')
const admin_route = express()
const bodyParser = require('body-parser')
const auth = require("../middleware/adminAuth")
const session = require('express-session')
const nocache = require('nocache')
const path = require('path')

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')
admin_route.use(express.static('public'));


admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))
admin_route.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false 

}))
admin_route.use(nocache())

const adminController = require('../contorllers/adminController')

admin_route.get('/login',auth.isNotUser,auth.isLogout,adminController.loadAdminLoginPage)
admin_route.get('/',auth.isLogin,adminController.loadAdminDashboard)
admin_route.get('/salesreport',adminController.loadSalesReport)
admin_route.get('/orderslist',adminController.loadOrderedList)
admin_route.get('/productslist',adminController.loadProductsList)
admin_route.get('/userslist',adminController.loadUserLists)
admin_route.get('/categorylist',adminController.loadCategoryList)
admin_route.get('/addcategory',adminController.loadAddCategory)
admin_route.get('/productslist',adminController.loadProductsLists)
admin_route.get('/addproduct',adminController.loadAddProduct)
admin_route.get('/logout',auth.isLogin,adminController.logout)






admin_route.post('/login',adminController.verifyAdmin)
admin_route.post('/unblockuser',auth.isLogin,adminController.unBlockUser)
admin_route.post('/blockuser',auth.isLogin,adminController.BlockUser)
admin_route.post('/addcategory',auth.isLogin,adminController.addCategory)
admin_route.post('/addproduct',auth.isLogin,adminController.addProduct)



module.exports = admin_route