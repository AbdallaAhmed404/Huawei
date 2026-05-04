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
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);