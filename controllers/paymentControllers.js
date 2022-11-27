const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const { MerchantID, Version } = process.env;

const { appError } = require('../service/handleError');
const handleSuccessMain = require('../service/handleSuccess');
const {
  createMpgAesEncrypt,
  createMpgShaEncrypt,
  createMpgAesDecrypt,
} = require('../service/payment');

const User = require('../models/usersModel');
const Room = require('../models/roomsModel');
const Payment = require('../models/paymentsModel');

const payments = {
  async insertCreateOrder(req, res, next) {
    const { _id } = req.user;
    const { roomID } = req.body;
    if (typeof roomID !== 'string' && roomID.length <= 0) {
      return next(appError(400, 'roomID 不正確', next, 'roomID'));
    }

    // 取得 user 資料
    const getUser = await User.findOne(_id).select('+email');
    if (!getUser) {
      return next(appError(400, '訂房者不存在', next, 'user'));
    }

    // 取得 room 資料
    const getRoom = await Room.findOne({ _id: roomID });
    if (!getRoom) {
      return next(appError(400, '此房型不存在', next, 'roomID'));
    }

    // 產生訂單資訊
    const orderData = {
      Email: getUser.email,
      ItemDesc: getRoom.roomName,
      Amt: getRoom.price,
      MerchantOrderNo: String(Date.now()),
      TimeStamp: String(Date.now()),
    };

    const postPayment = await Payment.create({
      user: _id,
      room: roomID,
      Amt: orderData.Amt,
      ItemDesc: orderData.ItemDesc,
      MerchantOrderNo: orderData.MerchantOrderNo,
    });

    if (!postPayment) {
      return next(appError(400, '建立失敗', next, 'postPayment'));
    }

    return handleSuccessMain(201, '新增成功', postPayment, res);
  },
  async getOrder(req, res, next) {
    const { MerchantOrderNo } = req.params;
    if (!MerchantOrderNo) {
      return next(appError(400, 'orderID 不正確', next, 'MerchantOrderNo'));
    }

    const getOrder = await Payment.findOne({ MerchantOrderNo });
    if (!getOrder) {
      return next(appError(400, '訂單不存在', next, 'orderID'));
    }

    const { _id } = getOrder.user;
    const getUser = await User.findById({ _id }).select('+email');
    if (!getUser) {
      return next(appError(400, '訂房者不存在', next, 'user'));
    }

    const tradeInfo = {
      Email: getUser.email,
      ItemDesc: getOrder.ItemDesc,
      Amt: getOrder.Amt,
      MerchantOrderNo: getOrder.MerchantOrderNo,
      TimeStamp: getOrder.MerchantOrderNo,
    };

    // 加密第一段字串，此段主要是提供交易內容給予藍新金流
    const aesEncrypt = createMpgAesEncrypt(tradeInfo);

    // 使用 HASH 再次 SHA 加密字串，作為驗證使用
    const shaEncrypt = createMpgShaEncrypt(aesEncrypt);

    try {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(
        `<form action="https://ccore.spgateway.com/MPG/mpg_gateway" method="post">
        <input type="text" name="MerchantID" value="${MerchantID}">
        <input type="text" name="TradeSha" value="${shaEncrypt}">
        <input type="text" name="TradeInfo" value="${aesEncrypt}">
        <input type="text" name="TimeStamp" value="${tradeInfo.TimeStamp}">
        <input type="text" name="Version" value="${Version}">
        <input type="text" name="MerchantOrderNo" value="${tradeInfo.MerchantOrderNo}">
        <input type="text" name="Amt" value="${tradeInfo.Amt}">
        <input type="email" name="Email" value="${tradeInfo.Email}">
        <button type="submit"> 送出 </button>
      </form>`,
      );
      return res.end();
    } catch (err) {
      return err;
    }
  },
  async insertReturn(req, res) {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
      res.write('<h1>交易成功</h1>');
      return res.end();
    } catch (err) {
      return err;
    }
  },
  async insertNotify(req, res) {
    const reqData = req.body;

    const thisShaEncrypt = createMpgShaEncrypt(reqData.TradeInfo);
    // 使用 HASH 再次 SHA 加密字串，確保比對一致（確保不正確的請求觸發交易成功）
    if (!thisShaEncrypt === reqData.TradeSha) {
      console.log('付款失敗：TradeSha 不一致');
      return res.end();
    }

    // 解密交易內容
    const data = createMpgAesDecrypt(reqData.TradeInfo);
    const payTime = `${data.Result.PayTime.replace(
      /([0-9|-]{10}).*/,
      '$1',
    )} ${data.Result.PayTime.replace(/[0-9|-]{10}(.*)/, '$1')}`;

    // 交易完成，將成功資訊儲存於資料庫
    const result = await Payment.findOneAndUpdate(
      {
        MerchantOrderNo: data.Result.MerchantOrderNo,
      },
      {
        isPaid: true,
        PaymentType: data.Result.PaymentType,
        PayTime: new Date(payTime),
        TradeNo: data.Result.TradeNo,
      },
      { returnDocument: 'after', runValidators: true },
    );

    if (!result) {
      console.log('找不到訂單編號');
      return res.end();
    }

    return res.end();
  },
};

module.exports = payments;
