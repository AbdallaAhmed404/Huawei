const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    // المفتاح الرئيسي للعداد العام للموقع
    key: { type: String, default: 'site_visits', unique: true }, 
    // إجمالي زيارات الموقع بالكامل
    count: { type: Number, default: 0 },
    // مصفوفة لتفصيل الزيارات حسب الـ utm_source
    sources: [
        {
            sourceName: { type: String, required: true },
            count: { type: Number, default: 0 }
        }
    ]
});

module.exports = mongoose.model('Stats', statsSchema);