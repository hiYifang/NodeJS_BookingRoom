const express = require('express');

const UserControllers = require('../controllers/userControllers');
const { isAuth } = require('../service/auth');
const { handleErrorAsync } = require('../service/handleError');

const router = express.Router();

router
  .route('/profile')
  // 取得個人資料
  .get(isAuth, handleErrorAsync(UserControllers.getProfile))
  // 更新個人資料
  .patch(isAuth, handleErrorAsync(UserControllers.patchProfile));

// 取得個人訂房列表
router.get('/:userID/booking', isAuth, handleErrorAsync(UserControllers.getBooking));

// 註冊會員
router.post('/sign_up', handleErrorAsync(UserControllers.signUp));

// 登入會員
router.post('/sign_in', handleErrorAsync(UserControllers.signIn));

// 重設密碼
router.patch('/update_password', isAuth, handleErrorAsync(UserControllers.updatePassword));

module.exports = router;
