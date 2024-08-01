const User = require("../models/userModel");

const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            const userId = req.session.user_id?._id
            const user = await User.findById(userId);
            if (user && user.is_blocked != 1) {
                return next();
            } else {
                req.session.destroy()
            }
        
            
            return next()
        }else{
            return res.redirect('/login')
        }
        
    } catch (error) {
        next(error);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            return res.redirect('/')
        }else{
            return next()
        }
        
    } catch (error) {
        next(error);
    }
}

const isNotAdmin = async(req,res,next)=>{
    try {
        if(req.session.admin_id){
            return res.redirect('/admin')
        }else{
            return next()
        }
        
    } catch (error) {
        next(error);
    }
}


module.exports={
    isLogin,
    isLogout,
    isNotAdmin
}