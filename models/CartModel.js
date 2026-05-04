const mongoose = require('mongoose');
const __ = require('lodash')


const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, default: 0 }
        }
    ]
},{ 
    toJSON: {
        transform: (doc, ret) => {
            return __.omit(ret, ['__v','_id']);
        }
    }
});

const CartModel = mongoose.model('Cart', CartSchema);
module.exports = CartModel;
