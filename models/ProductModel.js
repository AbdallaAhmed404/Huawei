const mongoose = require('mongoose');

// سكيما فرعية للهدايا (Gifts)
const giftSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true } // رابط صورة الهدية
});

// سكيما فرعية للألوان مع صورها
const colorVariantSchema = new mongoose.Schema({
    colorCode: { type: String, required: true }, // اسم اللون (مثلاً: أسود كربوني)
    images: [{ type: String, required: true }]   // مصفوفة صور خاصة بهذا اللون فقط
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    modelName: { type: String, required: true }, // الموديل (مثل: P60 Pro)
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },      // نسبة أو قيمة الخصم          // القسط الشهري
    
    // الألوان والصور المرتبطة بها
    colors: [colorVariantSchema], 

    category: { 
        type: String, 
        required: true,
        enum: ['Smartphone', 'Tablet', 'Audio', 'Wearable'] 
    },
    subCategory: { type: String, required: true }, // (مثل: Mate Series, Nova Series)
    
    // الهدايا المرتبطة بالمنتج
    gifts: [giftSchema], 

    countInStock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);