import mongoose from 'mongoose';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from "crypto"
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter Your name'],
  },
  email: {
    type: String,
    required: [true, 'Please enter the your email'],
    unique: true,
    validator: validator.isEmail,
  },
  password: {
    type: String,
    required: [true, 'Please enter the password'],
    minLength: [6, 'password must be at list 6 character'],
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  subscription: {
    id: String,
    status: String,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    poster: String,
  }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: String,
});

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schema.methods.getJWTToken = function () {
  return jwt.sign(
    { _id: this._id, name: this.name, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '15d' }
  );
};

schema.methods.ComparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

schema.methods.getResetToken = async function (){
  const resetToken = await crypto.randomBytes(20).toString("hex")
  this.resetPasswordToken= await crypto.createHash("sha256")
  .update(resetToken)
  .digest("hex")
  this.resetPasswordExpire =Date.now()+15*60*1000;
  return resetToken;
}

export const User = mongoose.model('User', schema);
