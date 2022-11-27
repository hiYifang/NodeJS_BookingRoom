const mongoose = require('mongoose');

// 建立 Schema
const roomsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, '請填寫建立者 ID'],
    },
    roomName: {
      type: String,
      required: [true, '請填寫房型名稱'],
      trim: true,
    },
    roomNumber: {
      type: [String],
      required: [true, '請填寫房型號碼'],
      trim: true,
    },
    maxPeople: {
      type: Number,
      required: [true, '請填寫房型容納人數'],
      default: 1,
    },
    description: {
      type: String,
      required: [true, '請填寫房型內容'],
      trim: true,
    },
    // 房間圖片
    image: {
      type: [String],
    },
    price: {
      type: Number,
      required: [true, '請填寫房型價格'],
      default: 0,
    },
    // 按讚
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // 總評價
    ratingsQuantity: {
      type: Number,
      default: 0,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

roomsSchema.virtual('comments', {
  // virtual(虛擬)：掛上 comments
  ref: 'Comment',
  foreignField: 'room',
  localField: '_id', // 引用：類似 join
});

roomsSchema.virtual('ratings', {
  ref: 'Rating',
  foreignField: 'room',
  localField: '_id', // 引用：類似 join
});

const Room = mongoose.model('Room', roomsSchema);

module.exports = Room;
