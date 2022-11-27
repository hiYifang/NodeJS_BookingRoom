const mongoose = require('mongoose');

// 建立 Schema
const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, ' 請填寫姓名'],
      trim: true,
    },
    // 男性: 0，女性: 1，跨性別: 2
    gender: {
      type: Number,
      default: 0,
      enum: [0, 1, 2],
    },
    avatar: {
      type: String,
    },
    email: {
      type: String,
      required: [true, ' 請填寫 Email'],
      unique: true,
      lowercase: true,
      select: false,
      trim: true,
    },
    password: {
      type: String,
      required: [true, ' 請填寫密碼'],
      minlength: 8,
      select: false,
      trim: true,
    },
    // member: 會員，admin: 管理者
    role: {
      type: String,
      default: 'member',
      enum: ['member', 'admin'],
    },
    // 建立時間
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // 更新時間
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

const User = mongoose.model('User', usersSchema);

module.exports = User;
