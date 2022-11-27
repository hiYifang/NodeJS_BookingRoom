const mongoose = require('mongoose');

// 建立 Schema
const commentsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, '請填寫留言者 ID'],
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: [true, '請填寫房型 ID'],
    },
    comment: {
      type: String,
      required: [true, '請填寫留言內容'],
      trim: true,
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

commentsSchema.pre(/^find/, function (next) { // eslint-disable-line
  // 前置器：使用 find 找尋 collections 裡面的資料
  this.populate({
    path: 'user',
    select: 'id name createdAt',
  });
  next();
});

const Comment = mongoose.model('Comment', commentsSchema);

module.exports = Comment;
