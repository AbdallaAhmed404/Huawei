const ProductModel = require("../models/ProductModel");
const customError = require("../customError");
const OrderModel = require("../models/OrderModel"); // هننشئه بعدين
const ContactModel = require("../models/ContactModel");
const axios = require('axios');
const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const payWithPaymob = async (req, res) => {
    try {
        const { amount_cents, customer_data, orderId } = req.body;

        // طلب الـ Intention (خطوة واحدة فقط)
        const response = await axios.post(
            'https://oman.paymob.com/v1/intention/',
            {
                amount: amount_cents, // المبلغ بالبيسة (الريال العماني = 1000 بيسة)
                currency: "OMR",
                payment_methods: [parseInt(process.env.PAYMOB_INTEGRATION_ID)],
                billing_data: {
                    first_name: customer_data.first_name,
                    last_name: customer_data.last_name || "NA",
                    phone_number: customer_data.phone,
                    email: customer_data.email,
                    country: "OM",
                    city: "NA",
                    street: "NA",
                    apartment: "NA",
                    building: "NA",
                    floor: "NA",
                    state: "NA"
                },extras: {
                    merchant_order_id: orderId // ده اللي الـ Webhook هيستخدمه عشان يعمل FindById
                },
                // الروابط دي اختيارية لو عايز تتحكم في الرجوع للموقع
                "redirection_url": "https://huaweioman.com/order-success", 
                "notification_url": "https://api.huaweioman.com/user/paymob-webhook" 
            },
            {
                headers: {
                    'Authorization': `Token ${process.env.PAYMOB_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // الرابط الموحد (Unified Checkout)
        // بنستخدم الـ client_secret اللي رجع من الرد والـ public key بتاعنا
        const clientSecret = response.data.client_secret;
        const checkoutUrl = `https://oman.paymob.com/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;

        // نبعت الرابط للفرونت اند عشان يفتح صفحة الدفع
        res.json({ url: checkoutUrl });

    } catch (error) {
        console.error("Paymob Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: "Initialization failed", 
            error: error.response ? error.response.data : error.message 
        });
    }
};


const paymobWebhook = async (req, res) => {
    try {
        const hmac = req.query.hmac;
        const data = req.body.obj;

        // التعديل المطلوب لضمان مطابقة التوقيع الرقمي
const stringToHash = 
    (data.amount_cents?.toString() || "") +
    (data.created_at?.toString() || "") +
    (data.currency?.toString() || "") +
    (data.error_occured?.toString() || "") +
    (data.has_parent_transaction?.toString() || "") +
    (data.id?.toString() || "") +
    (data.integration_id?.toString() || "") +
    (data.is_3d_secure?.toString() || "") +
    (data.is_auth?.toString() || "") +
    (data.is_capture?.toString() || "") +
    (data.is_refunded?.toString() || "") +
    (data.is_standalone_payment?.toString() || "") +
    (data.is_voided?.toString() || "") +
    (data.order.id?.toString() || "") +
    (data.owner?.toString() || "") +
    (data.pending?.toString() || "") +
    (data.source_data.pan?.toString() || "") +
    (data.source_data.sub_type?.toString() || "") +
    (data.source_data.type?.toString() || "") +
    (data.success?.toString() || ""); // تحويل true/false لنصوص "true"/"false"

        const hashedHmac = crypto
            .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
            .update(stringToHash)
            .digest('hex');

        if (hmac !== hashedHmac) {
            console.log("❌ Invalid HMAC Signature");
            return res.status(401).send('Invalid HMAC');
        }

        // 2. التحقق من نجاح العملية (Success === true)
        if (data.success === true) {
            // ملاحظة هامة جداً:
            // في طلب الـ Intention، لازم تبعت الـ _id بتاع الاوردر في الـ merchant_order_id
            const orderId = data.order.merchant_order_id;

            // 3. تحديث الطلب في MongoDB
            const updatedOrder = await OrderModel.findByIdAndUpdate(
                orderId,
                { 
                    status: "Processing",      // تم التحويل حسب طلبك
                    paymentStatus: "Paid"       // تم التحويل لمدفوع
                },
                { new: true }
            );

            if (updatedOrder) {
                console.log(`✅ Order ${orderId} updated to Processing and Paid.`);
            } else {
                console.log(`⚠️ Order ${orderId} not found in database.`);
            }
        } else {
            console.log(`❌ Payment failed for transaction: ${data.id}`);
        }

        // 4. الرد بـ 200 ضروري جداً عشان Paymob ميفضلش يبعت الطلب تاني
        res.status(200).send('OK');

    } catch (error) {
        console.error("Webhook Error:", error.message);
        res.status(500).send('Internal Server Error');
    }
};


const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, city, district } = req.body;

        // التأكد من عدم وجود المستخدم مسبقاً
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "هذا البريد الإلكتروني مسجل بالفعل" });
        }

        // إنشاء المستخدم (التشفير سيتم تلقائياً في الـ Pre-save middleware بالموديل)
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            phone,
            city,
            district
        });

        await newUser.save();

        // توليد التوكن
        const token = await newUser.generatetoken();

        res.status(201).json({
            message: "تم إنشاء الحساب بنجاح",
            token,
            user: newUser
        });
    } catch (error) {
        res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
    }
};

// 2. تسجيل الدخول
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        // مقارنة كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        // توليد التوكن
        const token = await user.generatetoken();

        res.status(200).json({
            message: "تم تسجيل الدخول بنجاح",
            token,
            user
        });
    } catch (error) {
        res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
    }
};

// 🧱 عرض كل المنتجات
const AllProduct = async (req, res, next) => {
  try {
    const products = await ProductModel.find({});
    res.json(products);
  } catch (err) {
    console.error("Error retrieving products:", err);
    return next(customError({
      statusCode: 500,
      message: "Failed to retrieve products"
    }));
  }
};

const getUserProfile = async (req, res) => {
    try {
        // req.user.id يتم توفيره عادةً بواسطة الـ auth middleware بعد فك التوكن
        const user = await User.findById(req.user.id);

        if (user) {
            res.json({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                city: user.city || 'Select City',
                district: user.district || ''
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 🧾 استقبال الطلب من المستخدم (بدون login)

const makeOrder = async (req, res) => {
  try {
    const { userData, items, total } = req.body;

    // 🧾 إنشاء طلب جديد فقط بدون تحديث المخزن حالياً
    const newOrder = new OrderModel({ 
      userData, 
      items, 
      total,
      status: "Pending" 
    });
    
    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order saved successfully!",
      _id: newOrder._id,
    });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id).populate({
      path: 'variants',
      select: 'name modelName price image' // بنحدد الحقول اللي محتاجينها بس عشان السرعة
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const products = await ProductModel.find({ category });

    if (products.length === 0)
      return res.status(404).json({ message: "No products found in this category" });

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products by category:", err);
    return next(customError({
      statusCode: 500,
      message: "Failed to fetch products by category"
    }));
  }
};

// 📩 إضافة رسالة جديدة من صفحة Contact
const addMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newMessage = new ContactModel({ name, email, phone, message });
    await newMessage.save();

    res.status(201).json({ message: "Message received successfully!" });
  } catch (error) {
    console.error("❌ Error saving message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📬 عرض كل الرسائل (في الداشبورد)
const getAllMessages = async (req, res) => {
  try {
    const messages = await ContactModel.find().sort({ date: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const deleteMessage = async (req, res) => {
  try {
    await ContactModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete message" });
  }
};


module.exports = {
  AllProduct,
  makeOrder,
  getProductById,
  getProductsByCategory,
  addMessage, 
  getAllMessages,
  deleteMessage,
  payWithPaymob,
  register,
  login,
  getUserProfile,
  paymobWebhook
};
