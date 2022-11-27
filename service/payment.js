const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const {
  MerchantID, RespondType, HASHKEY, HASHIV, Version,
} = process.env;

// 對應文件 P15：組合字串 - 排列參數並串聯
function genDataChain(order) {
  return `MerchantID=${MerchantID}&RespondType=${RespondType}&TimeStamp=${
    order.TimeStamp
  }&Version=${Version}&MerchantOrderNo=${order.MerchantOrderNo}&Amt=${
    order.Amt
  }&ItemDesc=${encodeURIComponent(order.ItemDesc)}&Email=${encodeURIComponent(order.Email)}`;
}

// 對應文件 P16：使用 aes 加密
// $edata1=bin2hex(openssl_encrypt($data1, "AES-256-CBC", $key, OPENSSL_RAW_DATA, $iv));
function createMpgAesEncrypt(tradeInfo) {
  const encrypt = crypto.createCipheriv('aes256', HASHKEY, HASHIV);
  // 用來產出字串
  const enc = encrypt.update(genDataChain(tradeInfo), 'utf8', 'hex');
  return enc + encrypt.final('hex');
}

// 對應文件 P17：使用 sha256 加密
// $hashs="HashKey=".$key."&".$edata1."&HashIV=".$iv;
function createMpgShaEncrypt(aesEncrypt) {
  const sha = crypto.createHash('sha256');
  const plainText = `HashKey=${HASHKEY}&${aesEncrypt}&HashIV=${HASHIV}`;
  return sha.update(plainText).digest('hex').toUpperCase();
}

// 將 aes 解密
function createMpgAesDecrypt(tradeInfo) {
  const decrypt = crypto.createDecipheriv('aes256', HASHKEY, HASHIV);
  decrypt.setAutoPadding(false);
  const text = decrypt.update(tradeInfo, 'hex', 'utf8');
  const plainText = text + decrypt.final('utf8');
  const result = plainText.replace(/[\x00-\x20]+/g, ''); // eslint-disable-line
  return JSON.parse(result);
}

module.exports = {
  genDataChain,
  createMpgAesEncrypt,
  createMpgShaEncrypt,
  createMpgAesDecrypt,
};
