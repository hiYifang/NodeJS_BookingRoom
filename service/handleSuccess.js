const handleSuccessMain = (httpStatus, successMessage, data, res) => {
  res.status(httpStatus).json({
    status: 'success',
    message: successMessage,
    data,
  });
};

module.exports = handleSuccessMain;
