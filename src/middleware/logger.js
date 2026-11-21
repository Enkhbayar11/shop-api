// Хүсэлт бүрийн method, URL, status, хугацааг (ms) terminal-д хэвлэнэ.
// Хариу илгээгдэж дууссаны дараа ('finish') status мэдэгдэх тул тэнд хэвлэнэ.
export function logger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });

  next();
}
