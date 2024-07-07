const nodemailer = require('nodemailer')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const bcrypt = require('bcrypt')
const jwt= require('jsonwebtoken')
let generatedOtp 
let userdetails ={}


const loadLogin = async(req,res)=>{
    try {
        res.render('login')
        
    } catch (error) {
        console.log(error.message);
    }
} 


const loadRegister = async(req,res)=>{
    try {
        res.render('register')
        
    } catch (error) {
        console.log(error.message);
    }
} 


const loadHome = async(req,res)=>{
    try {
        res.render('index')
    } catch (error) {
        console.log(error.message);
    }
}


const sendVerifyMail =  async(name,email,otp)=>{
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
            subject:"Verification mail",
            text:`Otp ${otp}`
        }

transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
        console.log(error.message);
        return false

    }else{
        console.log("Email has been send", info.response);
        return true
    }

});

    } catch (error) {
        console.log(error.message);
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
            console.log(error.message);
            
        }
    
    }
    


const verifySignUp =  async(req,res)=>{
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
                req.session.user_id=userData._id;
                res.redirect('/')
            }else{
                res.render('register',{message:"regisistarion failed" ,title:"Sign Up"})
            }

        
        }else{
            res.render('register',{message:"regisistarion failed" ,title:"Sign Up"})

     

        }
    } catch (error) {
        console.log(error.message);
    }
}




const insertUser = async(req,res)=>{
    try {
        userdetails.userName = req.body.registerUsername
        userdetails.phone = req.body.registerPhone
        userdetails.email = req.body.registerEmail
        userdetails.password= req.body.registerPassword
        const isUserExists = await User.findOne({email:userdetails.email})

        
        if(isUserExists==null){
            generatedOtp = generateOTP()



            if(sendVerifyMail(userdetails.userName,userdetails.email,generatedOtp)){
     
                    res.redirect('/verifyOtp')
    
            }else{
                res.render('register',{message:"regisistarion fialed" ,title:"Sign Up"})
    
            } 
    
        
        }else{
            return res.render('register',{message:"User Already Exist" ,title:"Sign Up"})

        } 
        


        
    } catch (error) {
        console.log(error.message);
    }
}

const userLogin = async(req,res)=>{
    try {
        const email =req.body.loginEmail
        const password =req.body.loginPassword
        
        const userData = await User.findOne({email:email})

            if(userData){
                if(userData.is_blocked==0){
                    if(userData.password){

                        const passwordMatch =  await bcrypt.compare(password,userData.password)
            
                        if(passwordMatch){
                            req.session.user_id=userData._id;
                            res.redirect('/')
                        }else{
                            res.render('login',{message:"Password is wrong"})
                        }
                    }else{
                        res.render('login',{message:"Please login with google"})
        
                    }

                }else{
                    res.redirect('/userIsBanned')
                }
                
    
        }else{
            res.render('login',{message:"User Does not exists"})


        }



    } catch (error) {
        console.log(error.message);
    }
}




const loadSinglePage = async(req,res)=>{
    try {
        const id = req.query.id
        const product = await Product.findOne({_id:id})
        res.render('singlepage',{product})
    } catch (error) {
        console.log(error.message);
    }
}

const loadAbout = async(req,res)=>{
    try {
        res.render('about')
    } catch (error) {
        console.log(error.message);
    }
}

const loadContactUs = async(req,res)=>{
    try {
        res.render('contactus')
    } catch (error) {
        console.log(error.message);
    }
}


const loadBlog = async(req,res)=>{
    try {
        res.render('blog')
    } catch (error) {
        console.log(error.message);
    }
}


const loadCart = async(req,res)=>{
    try {
        res.render('cart')
    } catch (error) {
        console.log(error.message);
    }
}

const loadWishlist = async(req,res)=>{
    try {
        res.render('wishlist')
    } catch (error) {
        console.log(error.message);
    }
}



const loadUser = async(req,res)=>{
    try {
        res.render('dashboard')
    } catch (error) {
        console.log(error.message);
    }
}


const loadShop = async(req,res)=>{
    try {

        const products = await Product.find({})
        console.log(products);
        res.render('shop',{products})
    } catch (error) {
        console.log(error.message);
    }
}

const authTest = async(req,res)=>{
    try {
        res.end('auth')
    } catch (error) {
        console.log(error.message);
    }
}


const verifyOtp = async(req,res)=>{
    try {
        console.log();
        res.render('verifyOtp')
        
    } catch (error) {
        console.log(error.message);
    }
}




const resendOtp = async (req, res) => {
    try {
        generatedOtp = generateOTP()

        sendVerifyMail(userdetails.userName,userdetails.email,generatedOtp)


    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'An error occurred' });
    }
}




const userBannedPageLoad = async(req,res)=>{
    try {
        res.render("userIsBanned")
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadforgotpassword = async(req,res)=>{
    try {
        res.render('forgotpassword')
        
    } catch (error) {
        console.log(error.message);
    }
}


function sendMailtoRestPassword(email,userdata,token){
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
            subject:"Reset your Password",
            text:`http://localhost:3000/resetpassword/${userdata._id}/${token}`
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
        console.log(error.message);
    }

}


const resetPassword = async (req,res)=>{
    try {
    const email = req.body.email
        const userdata = await User.findOne({email:email})
        if(userdata){
            if(userdata.is_blocked==0){
                const token = jwt.sign({id:userdata._id},"jwt_secret_key",{expiresIn:"1d"})
                console.log(email);
                const response = await sendMailtoRestPassword(email,userdata,token)
                if(response){
                    res.send('email has been sended')
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
        console.log(error.message);
    }
}


const loadRestPassword = async(req,res)=>{
    try {
        const { id, token } = req.params;
        console.log(id,token);
        res.render('restpassword')
    } catch (error) {
        console.log(error.message);
    }
}



const logout = async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/login')
        
    } catch (error) {
        console.log(error.message);
    }
}


module.exports ={
    loadRegister,
    loadHome,
    insertUser,
    userLogin,
    loadLogin,
    loadSinglePage,
    loadAbout,
    loadContactUs,
    loadBlog,
    loadCart,
    loadWishlist,
    loadUser,
    loadShop,
    authTest,
    verifyOtp,
    verifySignUp,
    resendOtp,
    userBannedPageLoad,
    loadforgotpassword,
    resetPassword,
    loadRestPassword,
    logout,
    

}