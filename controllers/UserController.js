const ProductModel = require("../models/ProductModel");
const customError = require("../customError");
const OrderModel = require("../models/OrderModel"); // هننشئه بعدين
const ContactModel = require("../models/ContactModel");
const axios = require('axios');

const payWithPaymob = async (req, res) => {
    try {
        const { amount_cents, customer_data } = req.body; 

        // الخطوة 1: الـ Authentication
        const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY
        });
        const token = authResponse.data.token;

        // الخطوة 2: تسجيل الطلب
        const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            auth_token: token,
            delivery_needed: "false",
            amount_cents: amount_cents, // السعر بالقرش (مثلاً 10000 يعني 100 ريال)
            currency: "OMR",
            items: []
        });
        const orderId = orderResponse.data.id;

        // الخطوة 3: الحصول على الـ Payment Token
        const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
            auth_token: token,
            amount_cents: amount_cents,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                apartment: "NA", email: customer_data.email, floor: "NA",
                first_name: customer_data.first_name, street: customer_data.street,
                building: "NA", phone_number: customer_data.phone,
                shipping_method: "NA", postal_code: "NA", city: "NA",
                country: "OM", last_name: "NA", state: "NA"
            },
            currency: "OMR",
            integration_id: process.env.PAYMOB_INTEGRATION_ID
        });

        const paymentToken = paymentKeyResponse.data.token;
        
        // نبعت الرابط الجاهز للفرونت اند
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
        res.json({ url: iframeUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Payment initialization failed" });
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
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

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
  payWithPaymob
};
