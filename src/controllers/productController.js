import prisma from '../db.js';
import { badRequest, notFound } from '../utils/httpError.js';
import {
  getParam,
  parseIntParam,
  parseBoolParam,
  parseEnumParam,
  parsePagination,
  paginated,
} from '../utils/query.js';

// Жагсаалтад бараа бүрийн ангилал, брэндийг хамт харуулна.
export const productInclude = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
};

const SORT_FIELDS = ['name', 'price', 'releaseYear', 'createdAt'];

// GET /products — шүүлтүүр, эрэмбэ, хуудаслалт хамт ажиллана.
export async function listProducts(req, res) {
  const q = req.query;
  const where = {};

  // q — нэр эсвэл тайлбарт агуулагдсан (том жижиг үсэг ялгахгүй)
  const search = getParam(q, 'q');
  if (search !== undefined) {
    const term = search.trim();
    if (term === '') throw badRequest('q хоосон байж болохгүй', 'q');
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  const categoryId = parseIntParam(q, 'categoryId');
  if (categoryId !== undefined) where.categoryId = categoryId;

  const brandId = parseIntParam(q, 'brandId');
  const hasBrand = parseBoolParam(q, 'hasBrand');
  if (brandId !== undefined) where.brandId = brandId;
  if (hasBrand !== undefined) {
    // brandId-тай хамт ирвэл AND болж нийлнэ
    where.AND = [{ brandId: hasBrand ? { not: null } : null }];
  }

  const minPrice = parseIntParam(q, 'minPrice', { min: 0 });
  const maxPrice = parseIntParam(q, 'maxPrice', { min: 0 });
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw badRequest('minPrice нь maxPrice-аас их байж болохгүй', 'minPrice');
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const isAvailable = parseBoolParam(q, 'isAvailable');
  if (isAvailable !== undefined) where.isAvailable = isAvailable;

  // Нэмэлт: ?minRating=4 — дундаж үнэлгээ нь 4-өөс багагүй бараа
  const minRating = parseIntParam(q, 'minRating', { min: 1, max: 5 });
  if (minRating !== undefined) {
    const groups = await prisma.review.groupBy({
      by: ['productId'],
      having: { rating: { _avg: { gte: minRating } } },
    });
    where.id = { in: groups.map((g) => g.productId) };
  }

  const sort = parseEnumParam(q, 'sort', SORT_FIELDS, 'createdAt');
  const order = parseEnumParam(q, 'order', ['asc', 'desc'], 'desc');
  const pg = parsePagination(q);

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      // ижил утгатай үед хуудас хооронд тогтвортой байхаар id-аар нэмж эрэмбэлнэ
      orderBy: [{ [sort]: order }, { id: order }],
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.product.count({ where }), // total нь шүүлтүүрийн дараах тоо
  ]);

  res.json(paginated(data, pg, total));
}

// GET /products/:id — ангилал, брэнд, сэтгэгдлийн тоо, дундаж үнэлгээтэй
export async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.id },
    include: { ...productInclude, _count: { select: { reviews: true } } },
  });
  if (!product) throw notFound('Бараа олдсонгүй');

  const avg = await prisma.review.aggregate({
    where: { productId: req.id },
    _avg: { rating: true },
  });

  const { _count, ...rest } = product;
  res.json({
    ...rest,
    reviewCount: _count.reviews,
    averageRating: avg._avg.rating === null ? null : Number(avg._avg.rating.toFixed(2)),
  });
}

// POST /products — байхгүй categoryId/brandId бол P2003 → 400 (errorHandler)
export async function createProduct(req, res) {
  const product = await prisma.product.create({ data: req.body, include: productInclude });
  res.status(201).json(product);
}

// PATCH /products/:id — validate зөвхөн ирсэн талбаруудыг шалгасан
export async function updateProduct(req, res) {
  const product = await prisma.product.update({
    where: { id: req.id },
    data: req.body,
    include: productInclude,
  });
  res.json(product);
}

// DELETE /products/:id — onDelete: Cascade тул сэтгэгдлүүд хамт устна
export async function deleteProduct(req, res) {
  await prisma.product.delete({ where: { id: req.id } });
  res.status(204).end();
}

// GET /products/:id/reviews — rating эсвэл createdAt-аар эрэмбэлнэ
export async function listProductReviews(req, res) {
  const sort = parseEnumParam(req.query, 'sort', ['rating', 'createdAt'], 'createdAt');
  const order = parseEnumParam(req.query, 'order', ['asc', 'desc'], 'desc');
  const pg = parsePagination(req.query);

  const exists = await prisma.product.findUnique({ where: { id: req.id }, select: { id: true } });
  if (!exists) throw notFound('Бараа олдсонгүй');

  const where = { productId: req.id };
  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: [{ [sort]: order }, { id: order }],
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.review.count({ where }),
  ]);
  res.json(paginated(data, pg, total));
}

// POST /products/:id/reviews — нэг хүн давхар бичвэл @@unique → P2002 → 409
export async function createProductReview(req, res) {
  const exists = await prisma.product.findUnique({ where: { id: req.id }, select: { id: true } });
  if (!exists) throw notFound('Бараа олдсонгүй');

  const review = await prisma.review.create({ data: { ...req.body, productId: req.id } });
  res.status(201).json(review);
}
