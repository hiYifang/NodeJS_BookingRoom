// 程式出現重大錯誤
process.on('uncaughtException', (err) => {
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// 未捕捉到的 catch
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕捉到的 rejection：', promise);
  console.error('原因：', reason);
});
