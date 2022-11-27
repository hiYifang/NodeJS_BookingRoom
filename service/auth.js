const jwt = require('jsonwebtoken');
const { appError, handleErrorAsync } = require('./handleError');
const User = require('../models/usersModel');

// 產生 JWT token
const generateSendJWT = (httpStatus, user, res) => {
  const person = user;
  const { _id, name } = person;
  const token = jwt.sign(
    {
      // PAYLOAD
      id: _id,
    },
    process.env.JWT_SECRET, // 混淆
    {
      // 自訂選項
      expiresIn: process.env.JWT_EXPIRES_DAY, // 時效
    },
  );
  person.password = undefined; // 防呆機制：防止傳送整個 user 內容時，洩漏機密資料
  res.status(httpStatus).json({
    status: 'success',
    data: {
      token,
      id: _id,
      name,
    },
  });
};

// 驗證身份：是否已登入的 middleware
const isAuth = handleErrorAsync(async (req, res, next) => { // eslint-disable-line
  // (1) 確認 token 是否存在
  let token;
  // Headers 帶入 Authorization: Bearer Secret
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // 陣列解構，失敗保護：token = req.headers.authorization.split(' ')[1];
    [, token] = req.headers.authorization.split(' ');
  }

  if (!token) {
    return next(appError(401, '查無 TOKEN！', next, 'token'));
  }

  // (2) 驗證 token 正確性
  const decoded = await new Promise((resolve) => {
    // 解密結果：帶入 token、環境變數，無需造訪資料庫進行驗證
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => { // eslint-disable-line
      // 判斷 Token 時效性
      if (err) {
        return next(appError(401, '認證失敗，請重新登入！', next, 'decoded'));
      }
      resolve(payload);
    });
  });

  // (3) 從資料庫撈取使用者
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(appError(401, '認證失敗，請重新登入！', next, 'decoded.id'));
  }

  req.user = currentUser; // 自訂屬性，傳到下一個 middleware
  next();
});

const isAdmin = handleErrorAsync(async (req, res, next) => { // eslint-disable-line
  const { role } = req.user;
  if (role !== 'admin') {
    return next(appError(403, '認證失敗，您沒有權限！', next, 'role'));
  }
  next();
});

module.exports = {
  isAuth,
  isAdmin,
  generateSendJWT,
};
