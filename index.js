require('dotenv').config(); 
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

 
const express = require('express')
const app = express()
const port = 3000




const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
const authRoute = require('./routes/GoogleAuthRoute')
app.use(express.static('public'));



app.use('/',userRoute)
app.use('/auth',authRoute)
app.use('/admin',adminRoute)




app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
}) 