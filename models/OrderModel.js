const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
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
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
