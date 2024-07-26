const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
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