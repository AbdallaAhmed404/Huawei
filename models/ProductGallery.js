const mongoose = require('mongoose');

const productGallerySchema = new mongoose.Schema({
    // ربط المعرض بالمنتج الأساسي
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
        unique: true // كل منتج له معرض واحد فقط
    },
    // مصفوفة تحتوي على المجموعات المختلفة للصور
    galleryItems: [
        {
            label: { 
                type: String, 
                required: true // مثلاً: "Main Views", "Side Angles", "In Use"
            },
            isGrid: {
                type: Boolean,
                default: false // الوضع الافتراضي هو السلايدر إلا لو اخترت Grid
            },
            images: [
                {
                    type: String, // روابط الصور المرفوعة على Cloudflare R2[cite: 1]
                    required: true
                }
            ]
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('ProductGallery', productGallerySchema);