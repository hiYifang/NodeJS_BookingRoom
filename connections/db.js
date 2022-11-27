const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

// 連接資料庫
mongoose
  .connect(DB)
  .then(() => console.log('資料庫連接成功'))
  .catch((err) => {
    console.log(err);
  });
