const nodemailer = require('nodemailer')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
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


const loadHome = async(req, res) => {
    try {
        const categories = await Category.find({});
        const products = await Product.find({});
        const recentProducts = await Product.find({});
        const categoryName = req.query.id || null; 
        res.render('index', { categories, products, categoryName,recentProducts });
    } catch (error) {
        console.log(error.message);
    }
};


const filterCategory = async(req, res) => {
    try {
        const categoryName = req.query.id;
        const categories = await Category.find({}); 
        const recentProducts = await Product.find({});
        let products;
        if (categoryName) {
            products = await Product.find({ productCategory: categoryName }); 
        } else {
            products = await Product.find({}); 

        }
        res.render('index', { categories, products, categoryName ,recentProducts});
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


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
                res.render('register',{message:"regisistarion failed"})
            }

        
        }else{
            res.render('verifyOtp',{message:"Please enter a valid otp" })

     

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
                res.render('register',{message:"regisistarion fialed"})
    
            } 
    
        
        }else{
            return res.render('register',{message:"User Already Exist" })

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
                    res.render('login',{message:"User is Banned"})
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
        const relatedProducts = await Product.find({productCategory:product.productCategory})

        res.render('singlepage',{product,relatedProducts,id})
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


const loadCreateNewAddress = async(req,res)=>{
    try {
        const user = req.session.user_id
        res.render('addnewaddress',{user})
    } catch (error) {
        console.log(error.message);
    }
}



const loadUser = async(req,res)=>{
    try {
        const user = req.session.user_id
        console.log(user);
        if(user){
            var userDetails = await User.findById(user._id)
        }
        res.render('dashboard',{user,userDetails})
    } catch (error) {
        console.log(error.message);
    }
}


const loadShop = async(req,res)=>{
    try {

        const products = await Product.find({})
        const categories = await Category.find({})
     
        console.log(products);
        res.render('shop',{products,categories})
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
        res.render("login",{message:"User is "})
        
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

const addNewAddress = async(req,res)=>{
    try {
        const fullName = req.body.fullName
        const number = req.body.number
        const house = req.body.house
        const street = req.body.street
        const landMark = req.body.landMark
        const city = req.body.city
        const state = req.body.state
        const pincode = req.body.pincode
        const id = req.body.id
        console.log(id);
        const user = await User.findById(id);
        if(user){
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

            console.log('New Address:', newAddress);

            user.address.push(newAddress);

            const savedUser = await user.save();
            console.log('Updated User:', savedUser);
            res.redirect('/user')
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

            await user.save();

            res.redirect('/user')
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
        const addressId = req.query.id;
        const userId = req.session.user_id;

        const user = await User.findById(userId);

        if (user) {
            user.address = user.address.filter(address => address._id.toString() !== addressId);
            await user.save();
            res.redirect('/user');
        } else {
            res.status(404).json({ message: "User not found" });
        }

    } catch (error) {
        console.log(error.message);
    }
}


const loadEditAddress = async (req, res) => {
    try {
        const addressId = req.query.id;
        const user = await User.findOne({ "address._id": addressId });

        if (user) {
            const address = user.address.find(addr => addr._id.toString() === addressId);
            res.render('editaddress', { address });
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
        const addressId = req.body.addressId; 
        const fullName = req.body.fullName;
        const number = req.body.number;
        const house = req.body.house;
        const street = req.body.street;
        const landMark = req.body.landMark;
        const city = req.body.city;
        const state = req.body.state;
        const pincode = req.body.pincode;


        const user = await User.findOne({"address._id":addressId})
        console.log(user);

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
                res.redirect('/user')
            }

        }
    } catch (error) {
        console.log(error.message);
    }
}



module.exports ={
    loadRegister,
    loadHome,
    loadLogin, userLogin,
    insertUser, 
   
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
    filterCategory,
    loadCreateNewAddress, addNewAddress, markAddressAsActive, deleteAddress,loadEditAddress,editAddress,

    

}