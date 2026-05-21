const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    // الربط مع موديل المستخدم
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // false عشان يسمح للـ Guest بالشراء
    },
    // بيانات العميل (سواء سجل أو لا)
    userData: {
      firstName: String,
      lastName: String,
      phone: String,
      email: String,
      city: String,
      district: String
    },
    // --- أضف هذا الحقل هنا ---
    trafficSource: {
      utm_source: { type: String, default: 'Direct' },
      utm_medium: { type: String, default: 'None' },
      utm_campaign: { type: String, default: 'None' }
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // يفضل ربط المنتج بـ ID
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
        colorCode: String,
        // --- أضف هذه الحقول هنا ---
        isPreOrder: { type: Boolean, default: false },
        depositAmount: { type: Number, default: 0 }
      },
    ],
    total: Number,

    appliedCouponCode: {
      type: String,
      default: null
    },
    isGuest: { type: Boolean, default: false }, // علامة عشان تعرف هل ده طلب زائر أم مستخدم
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: { // إضافة مفيدة
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
