const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true 
    },
    discountType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'percentage' 
    },
    discountValue: { type: Number, required: true }, // 20 أو 500
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },      // أقصى عدد لاستخدام الكوبون
    usedCount: { type: Number, default: 0 },         // كم مرة استخدم فعلياً
    isActive: { type: Boolean, default: true },
    couponType: {
        type: String,
        enum: ['global', 'product-specific'],
        default: 'global'
    },
    // لو الكوبون لمنتج معين، هنخزن الـ ID بتاعه هنا
    applicableProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // تأكد أن اسم الموديل عندك هو Product
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);