const express = require('express');

const UploadControllers = require('../controllers/uploadControllers');
const { isAuth } = require('../service/auth');
const upload = require('../service/upload');
const { handleErrorAsync } = require('../service/handleError');

const router = express.Router();

// 上傳圖片
router.post('/', isAuth, upload, handleErrorAsync(UploadControllers.postImage));

module.exports = router;
