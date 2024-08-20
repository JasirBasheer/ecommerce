const nodemailer = require('nodemailer')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose'); 
const jwt= require('jsonwebtoken')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Wishlist = require('../models/wishlistModel')
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')

let generatedOtp 
let userdetails ={}
let editUserDetails ={}



const getWishlistCount = async (userId) => {
    try {
        const wishlist = await Wishlist.findOne({ userId:userId });

        if (wishlist) {
            return wishlist.products.length;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error fetching wishlist count:', error);
        return 0; 
    }
};



const loadLogin = async(req,res,next)=>{
    try {
        const message = req.query.message
        if(!message){
            res.render('login')
        }else{
            res.render('login',{message:message})
        }
        
    } catch (error) {
        next(error);
    }
} 



const loadRegister = async(req,res,next)=>{
    try {
        res.render('register')
        
    } catch (error) {
        next(error);
    }
} 


const loadHome = async(req,res,next) => {
    try {
        const categories = await Category.find({});
        const products = await Product.find({});
        const recentProducts = await Product.find({});
        const categoryName = req.query.id || null; 
        const userId = req.session.user_id || null
        const cart = await Cart.findOne({userId:userId})

        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        let wishlistCount ;
        if(userId){
         wishlistCount =  await getWishlistCount(userId._id);
        }else{
            wishlist =0
        }

        res.render('index', { categories, products,search:"", categoryName,recentProducts,cartCount,userId,wishlistCount });
    } catch (error) {
        next(error);
    }
};


const loadWallet = async(req,res,next)=>{
    try {
        let user =0
        let cartCount = 0;
        let wallet ={}

        if(req.session){
            user = req.session.user_id

            
            const cart = await Cart.findOne({userId:user})

            if (cart) {
                cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
            }
            wallet = await Wallet.findOne({userId:user})

        }
        if(user ==0){
            res.redirect('/login')
        }

        
        res.render('wallet',{wallet,cartCount})        
    } catch (error) {
        next(error)
    }
}



const sendVerifyMail =  async(name,email,otp,subject)=>{
    try {
        
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure:false,
            requireTLS:true,
            auth:{
                user:"jasirbinbasheerpp@gmail.com",
                pass:"ubbq mfxs cahr ycok"
            }
        });
        const mailOptions = {
            from:"jasirbinbasheerpp@gmail.com",
            to:email,
            subject:`${subject}`,
            text:`Otp ${otp}`
        }

transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
        next(error);
        return false

    }else{

        return true
    }

});

    } catch (error) {
        next(error);
    }

}


function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

    const securePassword = async(password)=>{
        try {
            const passwordHash = await bcrypt.hash(password,10);
            return passwordHash;
            
        } catch (error) {
            next(error);
            
        }
    
    }
    


const verifySignUp =  async(req,res,next)=>{
    try {
        if(generatedOtp==req.body.otp){
            const spassword = await securePassword(userdetails.password)

            const user = new User({
                name:userdetails.userName,
                phone:userdetails.phone,
                email:userdetails.email,
                password:spassword,
                is_blocked:0,
            });  
            

            const userData = await user.save();

            if(userData){
                req.session.user_id=userData;

                const firstFive = userdetails.userName.slice(0, 5);
                    
                const lastFive = userData._id.toString().slice(-5);

                const referralCode = `${firstFive}@Reffreal${lastFive}`

                const wallet = new Wallet({
                    userId:userData._id,
                    referralCode:referralCode

                })

            await wallet.save()
                
                res.redirect('/')
            }else{
                res.render('register',{message:"regisistarion failed"})
            }

        
        }else{
            res.render('verifyOtp',{message:"Please enter a valid otp" })

     

        }
    } catch (error) {
        next(error);
    }
}




const insertUser = async(req,res,next)=>{
    try {
        userdetails.userName = req.body.registerUsername
        userdetails.phone = req.body.registerPhone
        userdetails.email = req.body.registerEmail
        userdetails.password= req.body.registerPassword
        const isUserExists = await User.findOne({email:userdetails.email})

        
        if(isUserExists==null){
            generatedOtp = generateOTP()

            const subject = "Otp Veryfication"


            if(sendVerifyMail(userdetails.userName,userdetails.email,generatedOtp,subject)){
     
                    res.redirect('/verifyOtp')
    
            }else{
                res.render('register',{message:"regisistarion fialed"})
    
            } 
    
        
        }else{
            return res.render('register',{message:"User Already Exist" })

        } 
        


        
    } catch (error) {
        next(error);
    }
}

const userLogin = async(req,res,next)=>{
    try {
        const email =req.body.loginEmail
        const password =req.body.loginPassword
        
        const userData = await User.findOne({email:email})

            if(userData){
                if(userData.is_blocked==0){
                    if(userData.password){

                        const passwordMatch =  await bcrypt.compare(password,userData.password)

            
                        if(passwordMatch){
                            req.session.user_id=userData;
                            res.redirect('/')
                        }else{
                            res.render('login',{message:"Password is wrong"})
                        }
                    }else{
                        res.render('login',{message:"Please login with google"})
        
                    }

                }else{
                    res.render('login',{message:"User is Banned"})
                }
                
    
        }else{
            res.render('login',{message:"User Does not exists"})


        }



    } catch (error) {
        next(error);
    }
}




const loadAbout = async(req,res,next)=>{
    try {
        res.render('about')
    } catch (error) {
        next(error);
    }
}

const loadContactUs = async(req,res,next)=>{
    try {
        res.render('contactus')
    } catch (error) {
        next(error);
    }
}


const loadBlog = async(req,res,next)=>{
    try {
        res.render('blog')
    } catch (error) {
        next(error);
    }
}





const loadUser = async (req,res,next) => {
    try {
        const user = req.session.user_id;


        let orders = [];
        const cart = await Cart.findOne({userId:user})

        let cartCount = 0;
        let carttotal = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
            carttotal = cart.products.reduce((total,item)=> total + item.quantity*item.productPrice,0)
        }

        if (user) {
            const userId = new mongoose.Types.ObjectId(user._id);
            var userDetails = await User.findById(user._id);



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
                {$sort: { createdAt: 1 }}
            ];
           
            orders = await Order.aggregate(pipeline);
        }

         
        let coupons=[]

        if(user){
            coupons = await Coupon.find()
        }


        
        res.render('dashboard', { user, userDetails, orders, cartCount,coupons, cart,carttotal });
    } catch (error) {
        next(error);
        
    }
};



const loadShop = async(req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 11;

        const products = await Product.find({}).limit(limit).skip((page - 1) * limit).exec();
        const count = await Product.countDocuments();
        const categories = await Category.find({});
        const userId = req.session.user_id || null
        const cart = await Cart.findOne({ userId: userId });

        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        let wishlistCount ;
        if(userId){
         wishlistCount =  await getWishlistCount(userId._id);
        }else{
            wishlist =0
        }

        res.render('shop', {
            products,categories,wishlistCount,cartCount,search:"",userId,totalPages: Math.ceil(count / limit),currentPage: page,url: '/shop?'
        });
    } catch (error) {
        next(error);
    }
};




const verifyOtp = async(req,res,next)=>{
    try {

        res.render('verifyOtp')
        
    } catch (error) {
        next(error);
    }
}




const resendOtp = async (req,res,next) => {
    try {
        generatedOtp = generateOTP()
        const subject = "Otp Veryfication"

        sendVerifyMail(userdetails.userName,userdetails.email,generatedOtp,subject)


    } catch (error) {
        next(error);
    }
}





const loadforgotpassword = async(req,res,next)=>{
    try {

        if(req.session.user_id){
            const userId = new mongoose.Types.ObjectId(req.session.user_id._id);
            const cart = await Cart.findOne({ userId: userId });
            let cartCount = 0;
            if (cart) {
                cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
            }
    
            res.render('forgotpassword',{cartCount})
        }else{
            res.render('forgotpassword')

        }
        
       
        
    } catch (error) {
        next(error);
    }
}


function sendMailtoResetPassword(email, token){
    try {
        
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure:false,
            requireTLS:true,
            auth:{
                user:"jasirbinbasheerpp@gmail.com",
                pass:"ubbq mfxs cahr ycok"
            }
        });

        const resetLink = `http://localhost:3000/resetpassword?token=${token}`;

        
        const mailOptions = {
            from:"jasirbinbasheerpp@gmail.com",
            to:email,
               subject: 'Password Reset Request',
               html: `Click <a href="${resetLink}">here</a> to reset your password.`
        }

        return new Promise((resolve,reject)=>{
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    reject(error)
                }else{
                    resolve("Email has been send", info.response)
                }
            })


        })


    } catch (error) {
        next(error);
    }

}

const generateToken = (userId) => {
    const token = jwt.sign({ userId },"jwt_secret_key", { expiresIn: '1h' }); 
    return token;
  };

const forgotpassword = async (req,res,next)=>{
    try {
    const email = req.body.email
        const userdata = await User.findOne({email:email})
        if(userdata){
            if(userdata.is_blocked==0){
                const generatedToken = await generateToken(userdata._id)
                const response = await sendMailtoResetPassword(email,generatedToken)
                if(response){
                    if (req.session.user_id) {
                        req.session.destroy();
                    }
                    return res.status(200).json({success:"email has been sended to reset password"})
                }else{
                    return res.status(200).json({error:"user not found"})
                }
            }  else{
                res.redirect('/userIsBanned')
            }
           
        }else{
            return res.status(200).json({error:"user not found"})
        }
    

       

        
    } catch (error) {
        next(error);
    }
}

const loaduserIsBanned = async (req,res,next)=>{
    try {
        res.send("User is Banned")
        
    } catch (error) {
        next(error)
    }
}



const logout = async(req,res,next)=>{
    try {
        req.session.destroy()
        res.redirect('/login')
        
    } catch (error) {
        next(error);
    }
}

const editUser = async (req,res,next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id);
        let user = await User.findOne({ _id: userId });
        const cart = await Cart.findOne({ userId: userId });
        let userDetails = await User.findById(user._id);


        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        if (user) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { name: req.body.userName, phone: req.body.phone } },
                { new: true } 
            );


            
            if (updatedUser) {

                return res.redirect('/accountdetails');
            } else {

                return res.render('accountdetails',{userDetails,user,message:"Failed to update "});
            }
        } else {
            return res.render('accountdetails',{userDetails,user,message:"User not found "});

        }
    } catch (error) {
        next(error);
    }
};

const loadUpdateUserPassword = async(req,res,next)=>{
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id); 
        const user = await User.findById({_id:userId})
        const cart = await Cart.findOne({ userId: userId });
        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        
        res.render('changepasswordwitholdpass',{user,cartCount})
        
    } catch (error) {
        next(error);
    }
}


const updateUserPassword = async (req,res,next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id); 
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        const cart = await Cart.findOne({ userId: userId });
        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

        const { oldPassword, newPassword } = req.body;

        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (passwordMatch) {

            

            const spassword = await securePassword(newPassword);
            user.password = spassword;

            const updateUserProfile = await user.save();
            if (updateUserProfile) {
                req.session.destroy();
                return res.redirect('/login');
            } else {
                return res.render('changepasswordwitholdpass', {userDetails: user,user,cartCount,message: "Failed to update password",cartCount});

            }
        } else {
            return res.render('changepasswordwitholdpass', {userDetails: user,cartCount,user,message: "Entered password is wrong"});
        }
    } catch (error) {
        next(error);
    }
};




const loadAccountDetails = async(req,res,next)=>{
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id._id); 
        const user = await User.findById({_id:userId})
        const cart= await Cart.findOne({userId:user})

        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }
        

         var userDetails = await User.findById(user._id);
        res.render('accountdetails',{userDetails,user,cartCount})
    } catch (error) {
        next(error);
    }
}



const loadResetPassword = async(req,res,next)=>{
    try {
        const token = req.query.token
        res.render('resetpassword',{token})
        
    } catch (error) {
        next(error);
    }
}


const resetPassword = async(req,res,next)=>{
    try {
        const password = req.body.password;
        const token = req.body.token;
    
        jwt.verify(token, "jwt_secret_key", async (err, decoded) => {
          if (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
          }
    
          try {
            const user = await User.findById(decoded.userId);
            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }
    
            const spassword = await securePassword(password);
            user.password = spassword;
            await user.save();
            res.redirect('/login')
    

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to reset password' });
          }
        });

    } catch (error) {
        next(error);
    }
}


const subscribeToNewsletter = async(req,res,next)=>{
    try {
        const email =req.body.email
      
        
        
    } catch (error) {
        next(error)
    }
}



module.exports ={
    loadRegister,
    loadLogin, 
    loaduserIsBanned,
    userLogin,

    verifyOtp,
    resendOtp,
    verifySignUp,

    loadforgotpassword,
    resetPassword,
    forgotpassword,
    loadResetPassword,

    loadHome,
    insertUser, 

    loadAbout,
    loadBlog,
    loadContactUs,
    loadUser,
    loadShop,
    loadWallet,
    
    loadAccountDetails,
    loadUpdateUserPassword,
    editUser,
    updateUserPassword,
    subscribeToNewsletter,
    
    logout,
}