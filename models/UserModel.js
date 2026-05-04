const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const saltround = 10
const jwt = require('jsonwebtoken')
const util = require('util')
const sign = util.promisify(jwt.sign)
const JWT_SECRET = 'key'
const __ = require('lodash')

const userSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String},
    resetCode: { type: String, select: false }
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        return __.omit(ret, ['__v', 'password','resetCode']);
      }
    }
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // فقط إذا تغيرت
  try {
    const hashedPassword = await bcrypt.hash(this.password, saltround);
    this.password = hashedPassword;
    next();
  } catch (err) {
    console.error("Password hashing error:", err);
    next(err);
  }
});

// Token generation
userSchema.methods.generatetoken = async function () {
  const token = await sign({
    id: this._id,
    email: this.email
  }, JWT_SECRET);
  return token;
};

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;
