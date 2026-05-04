const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
    // 1. Home Sliders
    homeSliders: [{
        imageUrl: { type: String, required: true },
        link: String, // اختياري لو عايز السلايدر يودي لصفحة معينة
    }],

    // 2. Categories Architecture & Icons (Main & Sub)
    categoriesConfig: [{
        mainCategoryName: String, 
        mainIcon: String,         // صورة الكاتيجوري الرئيسي
        subCategories: [{
            name: String,         // مثل: Pura Series
            icon: String          // صورة الـ sub-category
        }]
    }],

    // 3. New Arrivals (وصل حديثاً)
    // هنا هنخزن الـ IDs بتاعة المنتجات اللي اخترتها عشان تعرضها
    // newArrivals: [{
    //     categoryGroup: String, // Phones, Laptops...
    //     productId: { 
    //         type: mongoose.Schema.Types.ObjectId, 
    //         ref: 'Product' 
    //     }
    // }]
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);