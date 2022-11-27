const bcrypt = require('bcryptjs');
const validator = require('validator');
const { appError } = require('../service/handleError');
const handleSuccessMain = require('../service/handleSuccess');

const { generateSendJWT } = require('../service/auth');

const User = require('../models/usersModel');
const Payment = require('../models/paymentsModel');

const users = {
  // 取得個人資料
  async getProfile(req, res) {
    const { user } = req;
    const profile = await User.findById(user.id);
    return handleSuccessMain(200, '操作成功', profile, res);
  },
  // 取得個人訂房列表
  async getBooking(req, res, next) {
    const { userID } = req.params;

    const existedUser = await User.findById(userID);
    if (!existedUser) {
      return next(appError(400, '尚未註冊', next, 'userID'));
    }

    const getBooking = await Payment.find({ user: { $eq: userID } })
      .populate({
        path: 'user',
        select: 'email',
      });
    return handleSuccessMain(200, '操作成功', getBooking, res);
  },
  // 註冊會員
  async signUp(req, res, next) {
    const { email, password, name } = req.body;

    if (!name) {
      return next(appError(400, '註冊失敗，請填寫姓名欄位', next, 'name'));
    }
    if (!validator.isLength(name, { min: 2 })) {
      return next(appError(400, '姓名至少 2 個字元以上', next, 'name'));
    }

    const emailExist = await User.findOne({ email });
    if (!email) {
      return next(appError(400, '註冊失敗，請填寫 Email 欄位', next, 'email'));
    }
    if (!validator.isEmail(email)) {
      return next(appError(400, 'Email 格式錯誤，請重新填寫 Email 欄位', next, 'email'));
    }
    if (emailExist) {
      return next(appError(400, 'Email 已被註冊，請替換新的 Email', next, 'email'));
    }

    if (!password) {
      return next(appError(400, '註冊失敗，請填寫密碼欄位', next, 'password'));
    }
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minUppercase: 0,
        minSymbols: 0,
      })
    ) {
      return next(appError(400, '密碼需至少 8 碼以上，並英數混合', next, 'password'));
    }

    const Password = await bcrypt.hash(password, 12); // 加密密碼
    const newUser = await User.create({
      email,
      password: Password,
      name,
    });
    return generateSendJWT(201, newUser, res);
  },
  // 登入會員
  async signIn(req, res, next) {
    const { email, password } = req.body;

    if (!email) {
      return next(appError(400, '登入失敗，請重新填寫 Email 欄位', next, 'email'));
    }
    if (!validator.isEmail(email)) {
      return next(appError(400, 'Email 格式錯誤，請重新填寫 Email 欄位', next, 'email'));
    }

    if (!password) {
      return next(appError(400, '登入失敗，請重新填寫密碼欄位', next, 'password'));
    }
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minUppercase: 0,
        minSymbols: 0,
      })
    ) {
      return next(appError(400, '密碼需至少 8 碼以上，並英數混合', next, 'password'));
    }

    const user = await User.findOne({ email }).select('+password'); // 顯示密碼
    if (!user) {
      return next(appError(400, '資料填寫錯誤或尚未註冊', next, 'email or password'));
    }

    const auth = await bcrypt.compare(password, user.password); // 比對密碼
    if (!auth) {
      return next(appError(400, '登入失敗，密碼不正確', next, 'password'));
    }

    return generateSendJWT(201, user, res);
  },
  // 重設密碼
  async updatePassword(req, res, next) {
    const { _id } = req.user;
    const { password, confirmPassword } = req.body;

    if (!password) {
      return next(appError(400, '設定失敗，請填寫密碼欄位', next, 'password'));
    }
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minUppercase: 0,
        minSymbols: 0,
      })
    ) {
      return next(appError(400, '密碼需至少 8 碼以上，並英數混合', next, 'password'));
    }
    if (!confirmPassword) {
      return next(
        appError(400, '設定失敗，請填寫 confirmPassword 欄位！', next, 'confirmPassword'),
      );
    }
    if (!validator.equals(confirmPassword, password)) {
      return next(appError(400, '驗證失敗，密碼不一致！', next, 'confirmPassword'));
    }

    const newPassword = await bcrypt.hash(password, 12); // 加密密碼
    await User.findByIdAndUpdate(_id, { password: newPassword });
    return handleSuccessMain(200, '更新成功', {}, res);
  },
  // 更新個人資料
  async patchProfile(req, res, next) {
    const { _id } = req.user;
    const { name, gender, avatar } = req.body;

    if (!name) {
      return next(appError(400, '更新失敗，請填寫姓名欄位', next, 'name'));
    }
    if (!gender) {
      return next(appError(400, '更新失敗，請填寫性別欄位', next, 'gender'));
    }
    if (!validator.isLength(name, { min: 2 })) {
      return next(appError(400, '姓名至少 2 個字元以上', next, 'name'));
    }
    if (avatar && !avatar.startsWith('https')) {
      return next(appError(400, '更新失敗，大頭照圖片網址非 https 開頭', next, 'avatar'));
    }

    await User.findByIdAndUpdate(_id, { name, gender, avatar });
    return handleSuccessMain(201, '更新成功', {}, res);
  },
};

module.exports = users;
