require('dotenv').config(); 
const mongoose = require('mongoose');


const cors = require('cors');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

 
const express = require('express')
const app = express()
const port = 3000
app.use(express.static('public'));



const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
const authRoute = require('./routes/googleAuthRoute')



app.use('/',userRoute)
app.use('/auth',authRoute)
app.use('/admin',adminRoute)



app.set('view engine','ejs')
app.set('views','./views/user')

app.all('*', (req, res) => {
    res.render('404')
});



app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
}) 