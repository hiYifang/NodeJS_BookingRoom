// 自定義 error
const appError = (httpStatus, errMessage, next, field = '') => {
  const error = new Error(errMessage);
  error.field = field !== '' ? field : '';
  error.statusCode = httpStatus;
  error.isOperational = true;
  next(error);
};

// async func catch
const handleErrorAsync = (func) => (req, res, next) => {
  func(req, res, next).catch((error) => next(error));
};

// 開發狀態：開發環境錯誤
const resErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    field: err.field,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// 上線狀態：自己設定的 err 錯誤
const resErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
  } else {
    // HTTP 狀態碼：500 -> 送出罐頭預設訊息
    res.status(500).json({
      status: 'error',
      message: '系統錯誤，請恰系統管理員',
    });
  }
};

const handleErrorMain = (err, req, res, next) => { // eslint-disable-line
  const error = err;
  error.statusCode = err.statusCode || 500;

  // dev
  if (process.env.NODE_ENV === 'dev') {
    return resErrorDev(error, res);
  }

  // production
  if (process.env.NODE_ENV === 'production') {
    if (err.isAxiosError === true) {
      error.message = 'axios 連線錯誤';
      error.isOperational = true;
      return resErrorProd(error, res);
    }
    if (err.name === 'CastError') {
      // mongoose 無法轉換值
      error.message = '無效的 ID，請重新確認！';
      error.isOperational = true;
      return resErrorProd(error, res);
    }
    if (err.name === 'SyntaxError') {
      error.statusCode = 400;
      error.message = '語法結構錯誤，請重新確認！';
      error.isOperational = true;
      return resErrorProd(error, res);
    }
    if (err.code === 11000) {
      // mongoose 存在重複的 _id
      error.message = 'Email 已有人使用，請重新註冊！';
      error.isOperational = true;
      return resErrorProd(error, res);
    }
    return resErrorProd(error, res);
  }
};

module.exports = {
  handleErrorMain,
  appError,
  resErrorDev,
  resErrorProd,
  handleErrorAsync,
};
