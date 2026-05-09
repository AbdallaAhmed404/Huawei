const express = require('express')
const UserRouter = express.Router()
const authorized = require('../middlewares/Authorized')
const {paymobWebhook,register,login,getUserProfile,addMessage,deleteMessage, getAllMessages, AllProduct, makeOrder,getUserOrders ,getProductById,getProductsByCategory,payWithPaymob} = require('../controllers/UserController')

UserRouter.get("/my-orders",authorized, getUserOrders);
UserRouter.post('/paymob-webhook', paymobWebhook);
UserRouter.get('/profile', authorized, getUserProfile);
UserRouter.post('/register', register);
UserRouter.post('/login', login);
UserRouter.post('/paymob', payWithPaymob);
UserRouter.get("/product/:id", getProductById);
UserRouter.get('/allproduct', AllProduct); 
UserRouter.post('/Order', makeOrder); 
UserRouter.get('/category/:category', getProductsByCategory); 
UserRouter.post("/contact", addMessage); // استقبال الرسائل من الموقع
UserRouter.get("/contact", getAllMessages); // عرضها في الداشبورد
UserRouter.delete("/contact/:id", deleteMessage); 




module.exports = UserRouter;











