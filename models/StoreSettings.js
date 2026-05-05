const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
    // 1. Home Sliders
    homeSliders: [{
        imageUrl: { type: String, required: true },
        link: String, // اختياري لو عايز السلايدر يودي لصفحة معينة
    }],

    welcomePopup: {
        imageUrl: String,
        link: String,
        isActive: { type: Boolean, default: true }
    },

    // 2. Categories Architecture & Icons (Main & Sub)
    categoriesConfig: [{
        mainCategoryName: String, 
        mainIcon: String,         // صورة الكاتيجوري الرئيسي
        subCategories: [{
            name: String,         // مثل: Pura Series
            icon: String          // صورة الـ sub-category
        }]
    }],
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);