const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true // الأدمن الجديد يكون نشط تلقائياً
    }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);