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
    },
    address:[{
      fullName:{type:String},
      number:{type:Number},
      house:{type:String},
      street:{type:String},
      landMark:{type:String},
      city:{type:String},
      state:{type:String},
      pincode:{type:Number},
      isActive: { type: Boolean, default: false }  
    }]
})

module.exports = mongoose.model('User',userSchema)