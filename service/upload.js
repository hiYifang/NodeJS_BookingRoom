const multer = require('multer');
const path = require('path');
const { appError } = require('./handleError');

const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter(req, file, cb) {
    const { originalname } = file;
    const ext = path.extname(originalname).toLowerCase(); // 副檔名
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg') {
      cb(appError(400, '檔案格式錯誤，僅限上傳 jpg、jpeg 與 png 格式'));
    }
    cb(null, true); // cb：給予布林值 true 進入到下一個 middleware
  },
}).any();

module.exports = upload;
