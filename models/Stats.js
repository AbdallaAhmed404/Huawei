const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    // خليناه 'site_visits' عشان ده عداد عام للموقع
    key: { type: String, default: 'site_visits', unique: true }, 
    count: { type: Number, default: 0 }
});

module.exports = mongoose.model('Stats', statsSchema);