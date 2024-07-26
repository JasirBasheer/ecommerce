const express = require('express');
const admin_route =express();
const bodyParser = require('body-parser')
const auth = require("../middleware/adminAuth")
const session = require('express-session')
const nocache = require('nocache')
const upload = require('../middleware/multer')
const flash = require('connect-flash')
const errorHandler = require('../middleware/errorHandling')


admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')
admin_route.use(express.static('public'));
admin_route.use(errorHandler)


admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))
admin_route.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000, secure: false }
    

}))
admin_route.use(nocache())
admin_route.use(flash())
admin_route.use((req,res,next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');

    next();
});




const adminController = require('../controllers/adminController')

admin_route.get('/login',auth.isNotUser,auth.isLogout,adminController.loadAdminLoginPage)
admin_route.get('/',auth.isLogin,adminController.loadAdminDashboard)
admin_route.get('/salesreport',auth.isLogin,adminController.loadSalesReport)
admin_route.get('/orderslist',auth.isLogin,adminController.loadOrderedList)
admin_route.get('/orderview',auth.isLogin,adminController.loadOrderview)
admin_route.get('/productslist',auth.isLogin,adminController.loadProductsList)
admin_route.get('/userslist',auth.isLogin,adminController.loadUserLists)
admin_route.get('/categorylist',auth.isLogin,adminController.loadCategoryList)
admin_route.get('/addcategory',auth.isLogin,adminController.loadAddCategory)
admin_route.get('/addproduct',auth.isLogin,adminController.loadAddProduct)
admin_route.get('/editproduct',auth.isLogin,adminController.loadEditProduct)
admin_route.get('/logout',auth.isLogin,adminController.logout)
admin_route.get('/editcategory',auth.isLogin,adminController.loadEditCategory)







admin_route.post('/login',adminController.verifyAdmin)
admin_route.post('/unblockuser',auth.isLogin,adminController.unBlockUser)
admin_route.post('/blockuser',auth.isLogin,adminController.BlockUser)
admin_route.post('/addcategory',auth.isLogin,upload.array('categoryPhotos', 1),auth.isLogin,adminController.addCategory)
admin_route.post('/editcategory',auth.isLogin,upload.single('categoryPhoto'),auth.isLogin,adminController.editCategory)
admin_route.post('/addproduct',auth.isLogin,upload.array('productImages', 10),adminController.addProduct)
admin_route.post('/blockproduct',auth.isLogin,adminController.blockProduct)
admin_route.post('/unblockproduct',auth.isLogin,adminController.unBlockProduct)
admin_route.post('/editproduct',auth.isLogin,upload.array('productImages', 10),adminController.editProduct)
admin_route.post('/blockcategory',auth.isLogin,adminController.blockCategory)
admin_route.post('/unblockcategory',auth.isLogin,adminController.unblockCategory)
admin_route.get('/deletecategory',auth.isLogin,adminController.deleteCategory)
admin_route.post('/deleteProductImage',auth.isLogin,adminController.deleteProductImage)
admin_route.post('/updateOrderStatus',auth.isLogin,adminController.updateOrderStatus)



module.exports = admin_route