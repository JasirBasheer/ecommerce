const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
    },
    is_blocked:{
        type:Number,
    }
})

module.exports = mongoose.model('User',userSchema)