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
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // يفضل ربط المنتج بـ ID
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
        colorCode: String // ضيف دي عشان إنت عندك ألوان في الفرونت إند
      },
    ],
    total: Number,
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
