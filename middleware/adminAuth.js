const isLogin = async(req,res,next)=>{
    try {
        if(req.session.admin_id){
            return next()
        }else{
            return res.redirect('/admin/login')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.admin_id){
            return res.redirect('/admin/')
        }else{
            return next()
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const isNotUser = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            return res.redirect('/')
        }else{
            return next()
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    isLogin,
    isLogout,
    isNotUser
}