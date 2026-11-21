// Ямар ч route таараагүй хүсэлтэд 404 JSON буцаана.
export function notFound(req, res) {
  res.status(404).json({ message: `Хаяг олдсонгүй: ${req.method} ${req.originalUrl}` });
}
