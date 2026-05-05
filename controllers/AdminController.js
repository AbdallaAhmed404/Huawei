const ProductModel = require("../models/ProductModel")
const { deleteFileFromR2 } = require('../middlewares/r2Upload');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client } = require("@aws-sdk/client-s3");
const AdminModel = require('../models/AdminModel');
const bcrypt = require('bcryptjs');
const customError = require('../customError');
const jwt = require('jsonwebtoken');
const OrderModel = require("../models/OrderModel");
const StoreSettings = require('../models/StoreSettings');
const Coupon = require('../models/Coupon');

const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// 1. توليد رابط رفع للفرونت إند
const getUploadUrl = async (req, res) => {
    try {
        const { folder, filename, contentType } = req.body;
        if (!folder || !filename || !contentType) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const fileKey = `${folder}/${Date.now()}-${filename}`;
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });
        const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`;

        res.status(200).json({ signedUrl, publicUrl });
    } catch (error) {
        res.status(500).json({ message: "Signed URL generation failed" });
    }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find().sort({ createdAt: -1 }); // الأحدث أولًا
    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ✅ Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // التأكد إن الحالة اللي داخلة صحيحة
    const validStatuses = ["Pending", "Processing", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await OrderModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const adminRegister = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const exists = await AdminModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // 1. تشفير كلمة المرور (Hashing)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. حفظ الأدمن بكلمة المرور المشفرة
        const newAdmin = new AdminModel({ 
            email, 
            password: hashedPassword 
        });
        
        await newAdmin.save();

        res.status(201).json({
            message: "Admin registered successfully",
        });

    } catch (err) {
        console.error("Admin register error:", err);
        return next(customError({
            statusCode: 500,
            message: "Failed to register admin"
        }));
    }
};

const adminLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const admin = await AdminModel.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // 3. مقارنة كلمة المرور المدخلة مع المشفرة في قاعدة البيانات
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // 4. إنشاء التوكن في حالة نجاح المطابقة
        const token = jwt.sign(
            { id: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET || 'key',
            { expiresIn: '1d' } // يفضل إضافة وقت لانتهاء التوكن
        );

        res.status(200).json({ 
            message: 'Admin logged in successfully', 
            token 
        });

    } catch (err) {
        console.error("Admin login error:", err);
        return next(customError({
            statusCode: 500,
            message: "Failed to login admin"
        }));
    }
};

const updateAdminPassword = async (req, res, next) => {
    try {
        const adminId = "686ed1d29b55b078c1ffbcd3";
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const admin = await AdminModel.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        if (oldPassword !== admin.password) {
            return res.status(401).json({ message: "Old password is incorrect" });
        }


        admin.password = newPassword;
        await admin.save();

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        console.error("Error updating admin password:", err);
        return next(customError({
            statusCode: 500,
            message: "Failed to update admin password"
        }));
    }
};


const AddProduct = async (req, res, next) => {
    try {
        // البيانات جاية جاهزة باللينكات من الفرونت
        const productData = {
            name: req.body.name,
            description: req.body.description,
            modelName: req.body.modelName,
            image: req.body.image,
            price: req.body.price,
            discount: req.body.discount,
            category: req.body.category,
            subCategory: req.body.subCategory,
            colors: req.body.colors, // مصفوفة {colorName, images: []}
            gifts: req.body.gifts,   // مصفوفة {name, image}
            countInStock: req.body.countInStock
        };

        const newProduct = await ProductModel.create(productData);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error("Add Product Error:", err);
        return next(customError({ statusCode: 500, message: "Failed to create Huawei product" }));
    }
};

// 3. حذف منتج مع تنظيف صور R2
const DeleteProduct = async (req, res, next) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.image) {
            await deleteFileFromR2(product.image);
        }
        // حذف صور الألوان
        for (const color of product.colors) {
            for (const img of color.images) await deleteFileFromR2(img);
        }
        // حذف صور الهدايا
        for (const gift of product.gifts) {
            await deleteFileFromR2(gift.image);
        }

        await ProductModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product and assets deleted" });
    } catch (err) {
        return next(customError({ statusCode: 500, message: "Delete failed" }));
    }
};

const zero = async (req, res) => {
    const products = await ProductModel.find({}).sort({ createdAt: -1 });
    res.json(products);
};

const AllProduct = async (req, res) => {
    // جلب المنتجات التي يكون فيها countInStock لا يساوي 0
    const products = await ProductModel.find({ 
        countInStock: { $ne: 0 } 
    }).sort({ createdAt: -1 });

    res.json(products);
};



const UpdateProduct = async (req, res, next) => {
    try {
        const { _id, name, price, description, category, subCategory, image, discount, modelName, colors, gifts, installmentPrice, countInStock } = req.body;

        // 1. البحث عن المنتج باستخدام الـ _id (التنسيق الافتراضي لمونجو)
        const product = await ProductModel.findById(_id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // 2. [اختياري] منطق حذف الصورة القديمة من R2 لو تم تغييرها
        if (image && product.image !== image) {
            console.log("تغيير الصورة المكتشف: جاري حذف الصورة القديمة...");
            await deleteFileFromR2(product.image); // تأكد من استيراد هذه الدالة
        }
        
        if (product.colors && product.colors.length > 0) {
            const oldColorImages = product.colors.flatMap(c => c.images || []);
            const newColorImages = colors ? colors.flatMap(c => c.images || []) : [];
            
            const imagesToDelete = oldColorImages.filter(img => !newColorImages.includes(img));
            
            for (const imgUrl of imagesToDelete) {
                console.log("حذف صورة لون قديمة:", imgUrl);
                await deleteFileFromR2(imgUrl);
            }
        }

        // --- 3. مسح صور الهدايا المحذوفة ---
        if (product.gifts && product.gifts.length > 0) {
            const oldGiftImages = product.gifts.map(g => g.image).filter(img => img);
            const newGiftImages = gifts ? gifts.map(g => g.image).filter(img => img) : [];

            const giftsToDelete = oldGiftImages.filter(img => !newGiftImages.includes(img));

            for (const imgUrl of giftsToDelete) {
                console.log("حذف صورة هدية قديمة:", imgUrl);
                await deleteFileFromR2(imgUrl);
            }
        }

        
        // 3. تحديث القيم بناءً على الـ Schema الجديد
        product.name = name;
        product.price = price;
        product.description = description;
        product.category = category;
        product.subCategory = subCategory;
        product.image = image;
        product.discount = discount;
        product.modelName = modelName;
        product.colors = colors;
        product.gifts = gifts;
        product.installmentPrice = installmentPrice;
        product.countInStock = countInStock;

        await product.save();
        console.log("✅ تم تحديث المنتج بنجاح:", product.name);
        res.json(product);

    } catch (err) {
        console.error("❌ Error updating product:", err);
        return next(customError({
            statusCode: 500,
            message: "Failed to update product"
        }));
    }
}


const getProductsSortedBySoldCount = async (req, res, next) => {
    try {
        const sortedProducts = await ProductModel.find({}).sort({ soldCount: -1 });
        res.status(200).json(sortedProducts);
    } catch (err) {
        console.error("Error sorting products:", err);
        return next(customError({
            statusCode: 500,
            message: "Failed to sort products"
        }));
    }
};


const getSliders = async (req, res) => {
    try {
        const settings = await StoreSettings.findOne();
        if (!settings) {
            return res.status(200).json({ sliders: [] });
        }
        res.status(200).json({ sliders: settings.homeSliders });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const addSlider = async (req, res) => {
    try {
        const { imageUrl, link } = req.body;
        
        // بنعمل FindOneAndUpdate مع upsert عشان لو مفيش settings أصلاً يكريتها
        const updatedSettings = await StoreSettings.findOneAndUpdate(
            {}, 
            { $push: { homeSliders: { imageUrl, link } } },
            { new: true, upsert: true }
        );

        res.status(201).json({ 
            message: "Slider added successfully", 
            sliders: updatedSettings.homeSliders 
        });
    } catch (error) {
        res.status(400).json({ message: "Failed to add slider", error: error.message });
    }
};

const deleteSlider = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. البحث عن الإعدادات أولاً لجلب بيانات السلايدر المراد حذفه
        const settings = await StoreSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: "Settings not found" });
        }

        // 2. تحديد السلايدر المعين داخل المصفوفة للحصول على رابط الصورة
        const sliderToDelete = settings.homeSliders.id(id); 

        if (sliderToDelete && sliderToDelete.imageUrl) {
            // 3. استدعاء دالة الحذف من Cloudflare R2
            // تأكد أنك عملت require لـ deleteFileFromR2 في بداية الملف
            await deleteFileFromR2(sliderToDelete.imageUrl);
        }

        // 4. حذف السلايدر من المصفوفة في الداتا بيز
        const updatedSettings = await StoreSettings.findOneAndUpdate(
            {},
            { $pull: { homeSliders: { _id: id } } },
            { new: true }
        );

        res.status(200).json({ 
            message: "Slider and associated image deleted successfully", 
            sliders: updatedSettings.homeSliders 
        });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete slider", error: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const settings = await StoreSettings.findOne({}, 'categoriesConfig');
        if (!settings) {
            return res.status(200).json({ categories: [] });
        }
        res.status(200).json({ categories: settings.categoriesConfig });
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};

// تحديث أو إضافة الكاتيجوري الرئيسي
const updateMainCategoryIcon = async (req, res) => {
    try {
        const { mainIcon, mainCategoryName } = req.body; // نستلم الاسم من الفرونت

        let settings = await StoreSettings.findOne({});
        if (!settings) {
            settings = new StoreSettings({ categoriesConfig: [] });
        }

        // البحث عن القسم بالاسم
        const categoryIndex = settings.categoriesConfig.findIndex(
            cat => cat.mainCategoryName === mainCategoryName
        );

        if (categoryIndex > -1) {
            // إذا وُجد: حدّث الصورة[cite: 1]
            settings.categoriesConfig[categoryIndex].mainIcon = mainIcon;
        } else {
            // إذا لم يوجد: أضف كائن جديد بالاسم والصورة[cite: 1]
            settings.categoriesConfig.push({
                mainCategoryName,
                mainIcon,
                subCategories: [] 
            });
        }

        await settings.save();
        res.status(200).json({ message: "Success", categories: settings.categoriesConfig });
    } catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
};

// تحديث أو إضافة الكاتيجوري الفرعي
const updateSubCategoryIcon = async (req, res) => {
    try {
        const { mainCategoryName, subCategoryName, icon } = req.body;

        let settings = await StoreSettings.findOne({});
        if (!settings) return res.status(404).json({ message: "Settings not found" });

        // 1. ابحث عن الماين[cite: 1]
        let mainCat = settings.categoriesConfig.find(cat => cat.mainCategoryName === mainCategoryName);
        
        if (!mainCat) {
            // إذا الماين مش موجود أصلاً، ننشأه ونضيف له الساب[cite: 1]
            mainCat = { mainCategoryName, mainIcon: "", subCategories: [{ name: subCategoryName, icon }] };
            settings.categoriesConfig.push(mainCat);
        } else {
            // 2. إذا الماين موجود، ابحث عن الساب داخله[cite: 1]
            const subCatIndex = mainCat.subCategories.findIndex(sub => sub.name === subCategoryName);
            
            if (subCatIndex > -1) {
                mainCat.subCategories[subCatIndex].icon = icon;
            } else {
                mainCat.subCategories.push({ name: subCategoryName, icon });
            }
        }

        await settings.save();
        res.status(200).json({ message: "Sub-category updated", categories: settings.categoriesConfig });
    } catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
};

const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate("applicableProduct", "name price").sort({ createdAt: -1 });
        res.status(200).json({ coupons });
    } catch (error) {
        res.status(500).json({ message: "Error fetching coupons", error: error.message });
    }
};
const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, expiryDate, usageLimit,couponType,applicableProduct } = req.body;

        // التأكد من عدم تكرار الكود
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: "This coupon code already exists" });
        }

        const newCoupon = new Coupon({
            code: code.toUpperCase(), // ضمان التخزين بحروف كبيرة
            discountType,
            discountValue,
            expiryDate,
            usageLimit: usageLimit || 100,
            couponType: couponType || 'global',
            // إذا كان النوع global، نضمن تخزين القيمة كـ null حتى لو أرسل الفرونت بيانات خاطئة
            applicableProduct: couponType === 'product-specific' ? applicableProduct : null
        });

        await newCoupon.save();
        res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
    } catch (error) {
        res.status(400).json({ message: "Failed to create coupon", error: error.message });
    }
};
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Coupon.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
};
const incrementCouponUsage = async (req, res) => {
    try {
        const { code } = req.body;
        await Coupon.findOneAndUpdate(
            { code: code.toUpperCase() },
            { $inc: { usedCount: 1 } }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "خطأ في تحديث بيانات الكوبون" });
    }
}; 


const validateCoupon = async (req, res) => {
    try {
        // ننتظر الكود ومصفوفة المنتجات من الفرونت إند
        const { code, cartItems } = req.body; 

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }

        // 1. التحقق من الصلاحية العامة (الحالة، التاريخ، عدد الاستخدام)
        const now = new Date();
        if (!coupon.isActive) {
            return res.status(400).json({ message: "This coupon is no longer active" });
        }
        if (coupon.expiryDate < now) {
            return res.status(400).json({ message: "Sorry, this coupon has expired" });
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "This coupon has reached its maximum usage limit" });
        }

        // 2. التحقق من نوع الكوبون (Global vs Product-specific)
        if (coupon.couponType === 'product-specific') {
            if (!cartItems || !Array.isArray(cartItems)) {
                return res.status(400).json({ message: "Cart items are required to validate this coupon" });
            }

            // التأكد هل المنتج المخصص للكوبون موجود في سلة التسوق
            const isProductInCart = cartItems.some(item => 
                item.productId.toString() === coupon.applicableProduct.toString()
            );

            if (!isProductInCart) {
                return res.status(400).json({ 
                    message: "This coupon is only valid for a specific product not found in your cart" 
                });
            }
        }

        // 3. الرد في حالة النجاح
        res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            couponType: coupon.couponType,
            applicableProduct: coupon.applicableProduct,
            code: coupon.code
        });

    } catch (error) {
        console.error("Validation Error:", error);
        res.status(500).json({ message: "An error occurred while validating the coupon" });
    }
};

// جلب بيانات البوب اب
const getPopup = async (req, res) => {
    try {
        const settings = await StoreSettings.findOne();
        res.status(200).json({ popup: settings?.welcomePopup || null });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// تحديث البوب اب (صورة واحدة فقط)
const updatePopup = async (req, res) => {
    try {
        const { imageUrl, link } = req.body;

        const settings = await StoreSettings.findOne();

        // إذا كان هناك صورة قديمة، قم بحذفها من Cloudflare R2 أولاً
        if (settings?.welcomePopup?.imageUrl) {
            await deleteFileFromR2(settings.welcomePopup.imageUrl);
        }

        // تحديث البيانات (أو إنشاؤها إذا لم تكن موجودة)
        const updatedSettings = await StoreSettings.findOneAndUpdate(
            {},
            { welcomePopup: { imageUrl, link, isActive: true } },
            { new: true, upsert: true }
        );

        res.status(200).json({ 
            message: "Popup updated and old image deleted", 
            popup: updatedSettings.welcomePopup 
        });
    } catch (error) {
        res.status(400).json({ message: "Failed to update popup", error: error.message });
    }
};


module.exports = {
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
    adminRegister,
    adminLogin,
    updateAdminPassword,
    AddProduct,
    AllProduct,
    UpdateProduct,
    DeleteProduct,
    getProductsSortedBySoldCount,
    getUploadUrl,
    getSliders,
    addSlider,
    deleteSlider,
    getCategories,
    updateMainCategoryIcon,
    updateSubCategoryIcon,
    getAllCoupons,
    createCoupon,
    deleteCoupon,
    incrementCouponUsage,
    validateCoupon,
    zero,
    getPopup,
    updatePopup
};