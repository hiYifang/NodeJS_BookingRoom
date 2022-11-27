const mongoose = require('mongoose');

// 建立 Schema
const ratingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, '請填寫評價者 ID'],
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: [true, '請填寫房型 ID'],
    },
    // 評價
    rating: {
      type: Number,
      min: [1, '評價不得小於 1.0'],
      max: [5, '評價不得大於 5.0'],
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

ratingsSchema.pre(/^find/, function (next) { // eslint-disable-line
  // 前置器：使用 find 找尋 collections 裡面的資料
  this.populate({
    path: 'user',
    select: 'id name createdAt',
  });
  next();
});

const Rating = mongoose.model('Rating', ratingsSchema);

module.exports = Rating;
