const mongoose = require('mongoose');
const validator = require('validator');
const { appError } = require('../service/handleError');
const handleSuccessMain = require('../service/handleSuccess');

const Room = require('../models/roomsModel');
const Rating = require('../models/ratingsModel');
const Comment = require('../models/commentsModel');

const rooms = {
  // 取得或搜尋所有房型
  async getRooms(req, res) {
    const { q, sort = 'desc' } = req.query;
    const filter = q ? { description: new RegExp(q) } : {};
    const getRooms = await Room.find(filter)
      .populate({
        path: 'user',
        select: 'name avatar',
      })
      .populate({
        path: 'comments',
        select: 'user comment',
      })
      .populate({
        path: 'ratings',
        select: 'user rating',
      })
      .sort({ createdAt: sort === 'desc' ? -1 : 1 });
    return handleSuccessMain(200, '操作成功', getRooms, res);
  },
  // 取得一間房型的資料
  async getRoom(req, res, next) {
    const { roomID } = req.params;

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const getRoom = await Room.findById(roomID)
      .populate({
        path: 'user',
        select: 'name avatar',
      })
      .populate({
        path: 'comments',
        select: 'user comment',
      })
      .populate({
        path: 'ratings',
        select: 'user rating',
      });
    return handleSuccessMain(200, '操作成功', getRoom, res);
  },
  // 新增一間房型
  async insertRoom(req, res, next) {
    const { _id } = req.user;
    const {
      roomName, roomNumber, maxPeople, description, image, price,
    } = req.body;

    if (!roomName) {
      return next(appError(400, '新增失敗，請填寫房型名稱欄位', next, 'roomName'));
    }
    if (roomNumber.length === 0) {
      return next(appError(400, '新增失敗，請填寫房型號碼欄位', next, 'roomNumber'));
    }
    if (!maxPeople) {
      return next(appError(400, '新增失敗，請填寫房型容納人數欄位', next, 'maxPeople'));
    }
    if (!description) {
      return next(appError(400, '新增失敗，請填寫房型內容欄位', next, 'description'));
    }
    if (!price) {
      return next(appError(400, '新增失敗，請填寫房型價格欄位', next, 'maxPeople'));
    }

    // 判斷圖片開頭是否為 http
    if (image && image.length > 0) {
      image.forEach((item) => { // eslint-disable-line
        const result = item.split(':');
        if (!validator.equals(result[0], 'https')) {
          return next(appError(400, '新增失敗，圖片網址非 https 開頭', next, 'image'));
        }
      });
    }

    const postRoom = await Room.create({
      user: _id,
      roomName,
      roomNumber,
      maxPeople,
      description,
      image,
      price,
    });
    return handleSuccessMain(201, '新增成功', postRoom, res);
  },
  // 新增一間房型的按讚
  async insertLikes(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.params;

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }
    if (existedRoom.likes.includes(_id)) {
      return next(appError(400, '已對此房型按讚', next, 'roomID'));
    }

    await Room.findByIdAndUpdate(roomID, {
      $addToSet: {
        likes: _id, // 存在重複的 id 就不會 push
      },
    });
    return handleSuccessMain(201, '已按讚', {}, res);
  },
  // 新增一間房型的評價
  async insertRating(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return next(appError(400, '評價介於 1.0 和 5.0 之間', next, 'rating'));
    }

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const existedRating = await Rating.find({
      room: roomID,
      user: { $in: [_id] },
    });
    if (existedRating.length > 0) {
      return next(appError(400, '已建立評價', next, 'user'));
    }

    const newRating = await Rating.create({
      user: _id,
      room: roomID,
      rating: Math.round(rating * 10) / 10,
    });
    const postRating = await Rating.findById(newRating.id);

    // 計算總評價 (寫法一)
    // const getRoom = await Room.findById(roomID).populate({
    //   path: 'ratings',
    //   select: 'user rating',
    // });
    // const len = getRoom.ratings.length;
    // const result = getRoom.ratings
    //   .map((item) => item.rating)
    //   .reduce((prev, item) => prev + item, 0);

    // 計算總評價 (寫法二)
    const getAvg = await Room.aggregate(
      [
        {
          // 參考文章：https://stackoverflow.com/questions/32877064/how-to-use-aggregrate-in-mongodb-to-match-id
          $match: { _id: mongoose.Types.ObjectId(`${roomID}`) },
        },
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'room',
            as: 'ratings',
          },
        },
        {
          $addFields: {
            ratings: {
              $reduce: {
                input: '$ratings',
                initialValue: {
                  count: 0,
                  sum: 0,
                },
                in: {
                  count: {
                    $sum: ['$$value.count', 1],
                  },
                  sum: {
                    $sum: ['$$value.sum', '$$this.rating'],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            ratingAvg: {
              $divide: ['$ratings.sum', '$ratings.count'],
            },
          },
        },
      ],
      (err, results) => {
        if (err) {
          return next(appError(400, '無法計算評價', next, 'ratings'));
        }
        return results;
      },
    );

    if (getAvg[0].ratingAvg >= 1 && getAvg[0].ratingAvg <= 5) {
      await Room.findByIdAndUpdate(roomID, {
        ratingsQuantity: Math.round(getAvg[0].ratingAvg * 10) / 10,
      });
    }

    return handleSuccessMain(201, '新增成功', postRating, res);
  },
  // 新增一間房型的留言
  async insertComment(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return next(appError(400, '新增失敗，請填寫留言欄位', next, 'comment'));
    }

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const newComment = await Comment.create({
      user: _id,
      room: roomID,
      comment,
    });
    const postComment = await Comment.findById(newComment.id);
    return handleSuccessMain(201, '新增成功', postComment, res);
  },
  // 修改一間房型的資訊
  async patchRoom(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.params;
    const {
      roomName, roomNumber, description, image, price,
    } = req.body;

    if (!roomName) {
      return next(appError(400, '更新失敗，請填寫房型名稱欄位', next, 'roomName'));
    }
    if (roomNumber.length === 0) {
      return next(appError(400, '新增失敗，請填寫房型號碼欄位', next, 'roomNumber'));
    }
    if (!description) {
      return next(appError(400, '更新失敗，請填寫房型內容欄位', next, 'description'));
    }

    // 判斷圖片開頭是否為 http
    if (image && image.length > 0) {
      image.forEach((item) => { // eslint-disable-line
        const result = item.split(':');
        if (!validator.equals(result[0], 'https')) {
          return next(appError(400, '更新失敗，圖片網址非 https 開頭', next, 'image'));
        }
      });
    }

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }
    if (existedRoom.user.toString() !== _id.toString()) {
      return next(appError(400, '您無權限編輯此房型', next, 'user'));
    }

    await Room.findByIdAndUpdate(roomID, {
      roomName,
      roomNumber,
      description,
      image,
      price,
    });
    const patchRoom = await Room.findById(roomID).populate({
      path: 'user',
      select: 'name avatar',
    });
    return handleSuccessMain(201, '更新成功', patchRoom, res);
  },
  // 修改一間房型的評價
  async patchRating(req, res, next) {
    const { user } = req;
    const { roomID, ratingID } = req.params;
    const { rating } = req.body;

    if (!rating) {
      return next(appError(400, '請填寫評價欄位', next, 'rating'));
    }
    if (rating < 1 || rating > 5) {
      return next(appError(400, '評價介於 1.0 和 5.0 之間', next, 'rating'));
    }

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const existedRating = await Rating.findById(ratingID);
    if (!existedRating) {
      return next(appError(400, '尚未建立評價', next, 'ratingID'));
    }
    if (existedRating.user._id.toString() !== user.id.toString()) { // eslint-disable-line
      return next(appError(400, '您無權限編輯此評價', next, 'userID'));
    }

    const editRating = await Rating.findByIdAndUpdate(ratingID, { rating });
    const { _id } = editRating;
    const patchRating = await Rating.findById(_id).populate({
      path: 'user',
      select: 'name avatar',
    });

    // 計算總評價
    const getAvg = await Room.aggregate(
      [
        {
          $match: { _id: mongoose.Types.ObjectId(`${roomID}`) },
        },
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'room',
            as: 'ratings',
          },
        },
        {
          $addFields: {
            ratings: {
              $reduce: {
                input: '$ratings',
                initialValue: {
                  count: 0,
                  sum: 0,
                },
                in: {
                  count: {
                    $sum: ['$$value.count', 1],
                  },
                  sum: {
                    $sum: ['$$value.sum', '$$this.rating'],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            ratingAvg: {
              $divide: ['$ratings.sum', '$ratings.count'],
            },
          },
        },
      ],
      (err, results) => {
        if (err) {
          return next(appError(400, '無法計算評價', next, 'ratings'));
        }
        return results;
      },
    );

    if (getAvg[0].ratingAvg >= 1 && getAvg[0].ratingAvg <= 5) {
      await Room.findByIdAndUpdate(roomID, {
        ratingsQuantity: Math.round(getAvg[0].ratingAvg * 10) / 10,
      });
    }

    return handleSuccessMain(201, '更新成功', patchRating, res);
  },
  // 修改一間房型的留言
  async patchComment(req, res, next) {
    const { roomID, commentID } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return next(appError(400, '請填寫留言內容', next, 'comment'));
    }

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const existedComment = await Comment.findById(commentID);
    if (!existedComment) {
      return next(appError(400, '尚未建立留言', next, 'comment'));
    }
    if (existedComment.user._id.toString() !== user.id.toString()) { // eslint-disable-line
      return next(appError(400, '您無權限編輯此留言', next, 'userID'));
    }

    const editComment = await Comment.findByIdAndUpdate(commentID, { comment });
    const { _id } = editComment;
    const patchComment = await Comment.findById(_id).populate({
      path: 'user',
      select: 'name avatar',
    });
    return handleSuccessMain(201, '更新成功', patchComment, res);
  },
  // 刪除一間房型的資訊
  async delRoom(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.params;

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }
    if (existedRoom.user.toString() !== _id.toString()) {
      return next(appError(400, '您無權限編輯此房型', next, 'user'));
    }

    await Room.findByIdAndDelete(roomID);
    await Comment.deleteMany({ room: roomID });
    return handleSuccessMain(201, '刪除成功', {}, res);
  },
  // 取消一間房型的按讚
  async delLikes(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.params;

    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }
    if (!existedRoom.likes.includes(_id)) {
      return next(appError(400, '尚未對此房型按讚', next, 'roomID'));
    }

    await Room.findByIdAndUpdate(roomID, {
      $pull: {
        likes: _id, // id 存在才會執行 delete
      },
    });
    return handleSuccessMain(201, '已取消按讚', {}, res);
  },
  // 刪除一間房型的評價
  async delRating(req, res, next) {
    const { user } = req;
    const { roomID, ratingID } = req.params;
    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const existedRating = await Rating.findById(ratingID);
    if (!existedRating) {
      return next(appError(400, '尚未建立評價', next, 'RatingID'));
    }
    if (existedRating.user._id.toString() !== user.id.toString()) { // eslint-disable-line
      return next(appError(400, '您無權限編輯此評價', next, 'userID'));
    }

    await Rating.findByIdAndDelete(ratingID);

    // 計算總評價
    const getRoom = await Room.findById(roomID).populate({
      path: 'ratings',
      select: 'user rating',
    });
    const len = getRoom.ratings.length;
    if (len === 0) {
      await Room.findByIdAndUpdate(roomID, {
        ratingsQuantity: 0,
      });
    } else {
      const getAvg = await Room.aggregate(
        [
          {
            $match: { _id: mongoose.Types.ObjectId(`${roomID}`) },
          },
          {
            $lookup: {
              from: 'ratings',
              localField: '_id',
              foreignField: 'room',
              as: 'ratings',
            },
          },
          {
            $addFields: {
              ratings: {
                $reduce: {
                  input: '$ratings',
                  initialValue: {
                    count: 0,
                    sum: 0,
                  },
                  in: {
                    count: {
                      $sum: ['$$value.count', 1],
                    },
                    sum: {
                      $sum: ['$$value.sum', '$$this.rating'],
                    },
                  },
                },
              },
            },
          },
          {
            $addFields: {
              ratingAvg: {
                $divide: ['$ratings.sum', '$ratings.count'],
              },
            },
          },
        ],
        (err, results) => {
          if (err) {
            return next(appError(400, '無法計算評價', next, 'ratings'));
          }
          return results;
        },
      );

      if (getAvg[0].ratingAvg >= 1 && getAvg[0].ratingAvg <= 5) {
        await Room.findByIdAndUpdate(roomID, {
          ratingsQuantity: Math.round(getAvg[0].ratingAvg * 10) / 10,
        });
      }
    }

    return handleSuccessMain(201, '刪除成功', {}, res);
  },
  // 刪除一間房型的留言
  async delComment(req, res, next) {
    const { user } = req;
    const { roomID, commentID } = req.params;
    const existedRoom = await Room.findById(roomID);
    if (!existedRoom) {
      return next(appError(400, '尚未建立房型', next, 'roomID'));
    }

    const existedComment = await Comment.findById(commentID);
    if (!existedComment) {
      return next(appError(400, '尚未建立留言', next, 'commentID'));
    }
    if (existedComment.user._id.toString() !== user.id.toString()) { // eslint-disable-line
      return next(appError(400, '您無權限編輯此留言', next, 'userID'));
    }

    await Comment.findByIdAndDelete(commentID);
    return handleSuccessMain(201, '刪除成功', {}, res);
  },
};

module.exports = rooms;
