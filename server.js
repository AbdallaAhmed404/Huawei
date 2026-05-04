const express = require('express')
const cors = require('cors');
const app = express()
const connectDB = require('./conect')
const UserRouter = require('./routes/UserRouts')
const AdminRouter = require('./routes/AdminRouts')
const errorHandler = require('./middlewares/errorhandler');
require('dotenv').config();

app.use(cors());
app.use(express.json())
app.use('/user',UserRouter)
app.use('/admin',AdminRouter)
app.use(errorHandler);
connectDB()
app.listen(4000,()=>{
    console.log('server is running on port 4000')
})
