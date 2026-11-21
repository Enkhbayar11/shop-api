import prisma from '../db.js';
import { notFound } from '../utils/httpError.js';
import { parsePagination, paginated } from '../utils/query.js';
import { productInclude } from './productController.js';

// GET /categories
export async function listCategories(req, res) {
  const pg = parsePagination(req.query);
  const [data, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: 'asc' }, skip: pg.skip, take: pg.limit }),
    prisma.category.count(),
  ]);
  res.json(paginated(data, pg, total));
}

// GET /categories/:id — барааны тоотой
export async function getCategory(req, res) {
  const category = await prisma.category.findUnique({
    where: { id: req.id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw notFound('Ангилал олдсонгүй');

  const { _count, ...rest } = category;
  res.json({ ...rest, productCount: _count.products });
}

// POST /categories — нэр давхцвал P2002 → 409 (errorHandler)
export async function createCategory(req, res) {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json(category);
}

// PATCH /categories/:id — байхгүй бол P2025 → 404, нэр давхцвал P2002 → 409
export async function updateCategory(req, res) {
  const category = await prisma.category.update({ where: { id: req.id }, data: req.body });
  res.json(category);
}

// DELETE /categories/:id — бараатай бол onDelete: NoAction → P2003 → 409
export async function deleteCategory(req, res) {
  await prisma.category.delete({ where: { id: req.id } });
  res.status(204).end();
}

// GET /categories/:id/products
export async function listCategoryProducts(req, res) {
  const pg = parsePagination(req.query);
  const exists = await prisma.category.findUnique({ where: { id: req.id }, select: { id: true } });
  if (!exists) throw notFound('Ангилал олдсонгүй');

  const where = { categoryId: req.id };
  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { id: 'asc' },
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.product.count({ where }),
  ]);
  res.json(paginated(data, pg, total));
}
