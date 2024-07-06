require('dotenv').config(); 
const User = require('../models/userModel')
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');



const loadAdminLoginPage = async(req,res)=>{
    try {
        res.render('adminlogin')
        
    } catch (error) {
        console.log(error.message);
    }
}



const loadAdminDashboard = async(req,res)=>{
    try {
        res.render('admindashboard')
        
    } catch (error) {
        console.log(error.message);
    }
}



const loadSalesReport = async(req,res)=>{
    try {
        res.render('salesreport')
        
    } catch (error) {
        console.log(error.message);
    }
}


const loadOrderedList = async(req,res)=>{
    try {
        res.render('orderslist')
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadProductsList = async(req,res)=>{
    try {
        const products = await Product.find({})
        res.render('productslist',{products})
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadUserLists = async(req,res)=>{
    try {
        const users = await User.find({})
        res.render('userslist',{users})
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadCategoryList = async(req,res)=>{
    try {
        res.render('categorylist')
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddCategory = async(req,res)=>{
    try {
        res.render('addcategory')
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadProductsLists = async(req,res)=>{
    try {
        res.render('productlists')
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddProduct = async(req,res)=>{
    try {
        const category = await Category.find({})
        res.render('addproduct',{category})
        
    } catch (error) {
        console.log(error.message);
    }
}





const verifyAdmin =  async(req,res)=>{
    try {
        const {email,password} = req.body
        console.log(email);
        console.log(password);
        if(email == process.env.ADMIN_EMAIL){
            if(password == process.env.ADMIN_PASSWORD){
                req.session.admin_id = email
                res.redirect('/admin/')
            }else{
                console.log("password is woring");
            }

        }else{
            console.log('user does not exists');
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req,res)=>{
    try {
        console.log('session');
        req.session.destroy()
        res.redirect('/admin')
        
    } catch (error) {
        console.log(error.message);
    }
}

const unBlockUser = async(req,res)=>{
    try {
        const userId =req.body.userId
        const userdata = await User.findOne({_id:userId})
        if(userdata){
            var resp = await User.updateOne({_id:userId},{$set:{is_blocked:0}})
        }else{
            console.log("something went wrong");
        }
      
       

        
    } catch (error) {
        console.log(error.message);

    }
}


const BlockUser = async(req,res)=>{
    try {
        const userId =req.body.userId
        const userdata = await User.findOne({_id:userId})
        if(userdata){
            var resp = await User.updateOne({_id:userId},{$set:{is_blocked:1}})
        }else{
            console.log("something went wrong");
        }
      
        
    } catch (error) {
        console.log(error.message);
    }
}

const addCategory = async(req,res)=>{
    try {
        const categoryName = req.body.categoryName
        const categoryexist = await Category.findOne({categoryName:categoryName})
        if(!categoryexist){
            const newCategory = new Category({
                categoryName:categoryName
            });

            const category = await newCategory.save()
            if(category){
                res.end('category created')
            }else{
                res.end('no no error not created')
            }
            


        }else{
            res.end('cateroy already exists')
        }

       


        
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async(req,res)=>{
    try {
        const productname = req.body.productName
        const categoryName = req.body.productCategory
        const productPrice = req.body.productPrice
        const productStocks = req.body.productStocks
        const productDescription = req.body.productDescription


        const newproduct =  new Product({
            productName:productname,
            productCategory:categoryName,
            productDescription:productDescription,
            productPrice:productPrice,
            num_of_stocks:productStocks

        })

        const response = await newproduct.save()
        
        if(response){
            res.redirect('/admin/productslist')

        }else{
            res.end('error')
        }


        
    } catch (error) {
        console.log(error.message);
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
}