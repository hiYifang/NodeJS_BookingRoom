const express = require('express');
const multer = require('multer');

const PaymentControllers = require('../controllers/paymentControllers');
const { isAuth } = require('../service/auth');
const { handleErrorAsync } = require('../service/handleError');

const router = express.Router();

// (藍新金流 1) 建立訂單
router.post('/createOrder', isAuth, multer().array(), handleErrorAsync(PaymentControllers.insertCreateOrder));

// (藍新金流 2) 組合字串 + 製作加解密
router.get('/getOrder/:MerchantOrderNo', isAuth, handleErrorAsync(PaymentControllers.getOrder));

// (藍新金流 3) 交易成功：Return（可直接解密，將資料呈現在畫面上）
router.post('/return', handleErrorAsync(PaymentControllers.insertReturn));

// (藍新金流 4) 確認交易：Notify（取得藍新金流通知）
router.post('/notify', handleErrorAsync(PaymentControllers.insertNotify));

module.exports = router;
