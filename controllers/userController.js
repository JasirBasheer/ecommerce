const nodemailer = require('nodemailer')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose'); 
const jwt= require('jsonwebtoken')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
let generatedOtp 
let userdetails ={}
let editUserDetails ={}



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
        const userId = req.session.user_id
        const cart = await Cart.findOne({userId:userId})

        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }


        res.render('index', { categories, products, categoryName,recentProducts,cartCount,userId });
    } catch (error) {
        next(error);
    }
};




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
        console.log("Email has been send", info.response);
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



const loadWishlist = async(req,res,next)=>{
    try {
        res.render('wishlist')
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
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }

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
        res.render('dashboard', { user, userDetails, orders, cartCount });
    } catch (error) {
        next(error);
        
    }
};



const loadShop = async(req,res,next)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 11;


        const products = await Product.find({}).limit(limit*2).skip((page-1)*limit).exec()
        const count = await Product.find({}).countDocuments();
        const categories = await Category.find({})
        const userId = req.session.user_id
        const cart = await Cart.findOne({userId:userId})


        let cartCount = 0;
        if (cart) {
            cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
        }
     
        console.log(products);
        res.render('shop',{products,categories,cartCount,userId,totalPages:Math.ceil(count/limit),currentPage:page})
    } catch (error) {
        next(error);
    }
}




const verifyOtp = async(req,res,next)=>{
    try {
        console.log();
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
                    if (req.session_userId) {
                        req.session.destroy();
                    }
                    return res.status(200).json({success:"email has been sended to reset password"})
                }else{
                    res.send('please conform')
                }
            }  else{
                res.redirect('/userIsBanned')
            }
           
        }else{
           res.render('forgotpassword',{message:"User Not Exists"})
        }
    

       

        
    } catch (error) {
        next(error);
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

            console.log(req.body.userName);

            if (updatedUser) {
                console.log("User details changed");
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
        console.log(user);

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
            console.log("Password matched");


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



module.exports ={
    loadRegister,
    loadLogin, 
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
    loadWishlist,
    loadUser,
    loadShop,
    
    loadAccountDetails,
    loadUpdateUserPassword,
    editUser,
    updateUserPassword,
    
    logout,
}