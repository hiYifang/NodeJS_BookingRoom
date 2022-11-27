const mongoose = require('mongoose');

// 建立 Schema
const paymentsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, '請填寫訂房者 ID'],
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: [true, '請填寫房型 ID'],
    },
    // 交易金額
    Amt: {
      type: Number,
    },
    // 交易項目
    ItemDesc: {
      type: String,
    },
    // 藍新金流交易序
    TradeNo: {
      type: String,
    },
    // 商店訂單編號
    MerchantOrderNo: {
      type: String,
      required: true,
    },
    // 付款方式
    PaymentType: {
      type: String,
    },
    // 付款時間
    PayTime: {
      type: Date,
    },
    // 付款狀態
    isPaid: {
      type: Boolean,
      default: false,
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

paymentsSchema.pre(/^find/, function (next) { // eslint-disable-line
  // 前置器：使用 find 找尋 collections 裡面的資料
  this.populate({
    path: 'user',
    select: 'id name createdAt',
  });
  next();
});

const Payment = mongoose.model('Payment', paymentsSchema);

module.exports = Payment;
