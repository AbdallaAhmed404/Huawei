const express = require('express')
const AdminRouter = express.Router()
const isAdmin = require('../middlewares/isAdmin');
const { getUploadUrl,getAllOrders,updateOrderStatus,deleteOrder,adminRegister,updateAdminPassword, AddProduct, AllProduct, 
        UpdateProduct, DeleteProduct,adminLogin,getProductsSortedBySoldCount,getSliders,addSlider,deleteSlider,getCategories,updateMainCategoryIcon,
        updateSubCategoryIcon,getAllCoupons,createCoupon,deleteCoupon,validateCoupon,zero,getPopup,updatePopup } = require('../controllers/AdminController')

AdminRouter.get('/popup', getPopup);

AdminRouter.patch('/popup', updatePopup);

AdminRouter.post('/validate-coupon', validateCoupon);

AdminRouter.get('/getAllCoupons', getAllCoupons);

AdminRouter.post('/createCoupon', createCoupon);

AdminRouter.delete('/deleteCoupon/:id', deleteCoupon);        

AdminRouter.get('/categories',getCategories);

AdminRouter.patch('/categories/main/upsert', updateMainCategoryIcon);

AdminRouter.patch('/categories/sub/upsert', updateSubCategoryIcon);

AdminRouter.get('/sliders', getSliders);

AdminRouter.post('/sliders', addSlider);

AdminRouter.delete('/sliders/:id', deleteSlider);

AdminRouter.post('/get-upload-url', getUploadUrl);

AdminRouter.post('/register', adminRegister);

AdminRouter.put("/Orders/:id/status", updateOrderStatus);

AdminRouter.delete("/Orders/:id", deleteOrder);

AdminRouter.get("/orders", getAllOrders);

AdminRouter.post('/login', adminLogin);

AdminRouter.put('/updatepassword', updateAdminPassword);

AdminRouter.post('/addproduct', AddProduct);

AdminRouter.get('/allproduct', AllProduct);

AdminRouter.get('/allpr', zero);

AdminRouter.post('/updateproduct', UpdateProduct);

AdminRouter.delete('/delete/:id', DeleteProduct);

AdminRouter.get('/soldcount', getProductsSortedBySoldCount);


module.exports = AdminRouter

