const sizeOf = require('image-size');
const { ImgurClient } = require('imgur');
const { appError } = require('../service/handleError');
const handleSuccessMain = require('../service/handleSuccess');

const uploads = {
  async postImage(req, res, next) {
    const { files } = req;
    if (!files.length) {
      return next(appError(400, '尚未上傳檔案', next, 'upload'));
    }

    const dimensions = sizeOf(files[0].buffer);
    if (dimensions.width !== dimensions.height) {
      return next(appError(400, '圖片長寬不符合 1:1 尺寸', next, 'upload'));
    }

    const client = new ImgurClient({
      clientId: process.env.IMGUR_CLIENTID,
      clientSecret: process.env.IMGUR_CLIENT_SECRET,
      refreshToken: process.env.IMGUR_REFRESH_TOKEN,
    });
    const response = await client.upload({
      image: files[0].buffer.toString('base64'),
      type: 'base64',
      album: process.env.IMGUR_ALBUM_ID,
    });

    return handleSuccessMain(201, '上傳成功', { imageUrl: response.data.link }, res);
  },
};

module.exports = uploads;
