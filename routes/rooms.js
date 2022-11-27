const express = require('express');

const RoomControllers = require('../controllers/roomControllers');
const { isAuth, isAdmin } = require('../service/auth');
const { handleErrorAsync } = require('../service/handleError');

const router = express.Router();

router
  .route('/')
  // 取得或搜尋所有房型
  .get(isAuth, handleErrorAsync(RoomControllers.getRooms))
  // 新增一間房型
  .post(isAuth, isAdmin, handleErrorAsync(RoomControllers.insertRoom));

router
  .route('/:roomID/info')
  // 取得一間房型的資訊
  .get(isAuth, handleErrorAsync(RoomControllers.getRoom))
  // 修改一間房型的資訊
  .patch(isAuth, isAdmin, handleErrorAsync(RoomControllers.patchRoom))
  // 刪除一間房型的資訊
  .delete(isAuth, isAdmin, handleErrorAsync(RoomControllers.delRoom));

router
  .route('/:roomID/likes')
  // 新增一間房型的按讚
  .post(isAuth, handleErrorAsync(RoomControllers.insertLikes))
  // 取消一間房型的按讚
  .delete(isAuth, handleErrorAsync(RoomControllers.delLikes));

// 新增一間房型的評價
router.post('/:roomID/rating', isAuth, handleErrorAsync(RoomControllers.insertRating));

router
  .route('/:roomID/rating/:ratingID')
  // 修改一間房型的評價
  .patch(isAuth, handleErrorAsync(RoomControllers.patchRating))
  // 刪除一間房型的評價
  .delete(isAuth, handleErrorAsync(RoomControllers.delRating));

// 新增一間房型的留言
router.post('/:roomID/comment', isAuth, handleErrorAsync(RoomControllers.insertComment));

router
  .route('/:roomID/comment/:commentID')
  // 修改一間房型的留言
  .patch(isAuth, handleErrorAsync(RoomControllers.patchComment))
  // 刪除一間房型的留言
  .delete(isAuth, handleErrorAsync(RoomControllers.delComment));

module.exports = router;
