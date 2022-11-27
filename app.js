const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const roomsRouter = require('./routes/rooms');
const paymentsRouter = require('./routes/payments');
const uploadsRouter = require('./routes/uploads');

const app = express();

require('./connections/db');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/rooms', roomsRouter);
app.use('/payments', paymentsRouter);
app.use('/uploads', uploadsRouter);

/* 錯誤處理 */
require('./service/process');
// HTTP 狀態碼：404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '無此路由資訊',
  });
});
// 自訂錯誤
const { handleErrorMain } = require('./service/handleError');

app.use(handleErrorMain);

module.exports = app;
