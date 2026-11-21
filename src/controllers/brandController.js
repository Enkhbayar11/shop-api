import prisma from '../db.js';
import { notFound } from '../utils/httpError.js';
import { parsePagination, paginated } from '../utils/query.js';
import { productInclude } from './productController.js';

// GET /brands
export async function listBrands(req, res) {
  const pg = parsePagination(req.query);
  const [data, total] = await Promise.all([
    prisma.brand.findMany({ orderBy: { id: 'asc' }, skip: pg.skip, take: pg.limit }),
    prisma.brand.count(),
  ]);
  res.json(paginated(data, pg, total));
}

// GET /brands/:id — барааны тоотой
export async function getBrand(req, res) {
  const brand = await prisma.brand.findUnique({
    where: { id: req.id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw notFound('Брэнд олдсонгүй');

  const { _count, ...rest } = brand;
  res.json({ ...rest, productCount: _count.products });
}

// POST /brands
export async function createBrand(req, res) {
  const brand = await prisma.brand.create({ data: req.body });
  res.status(201).json(brand);
}

// PATCH /brands/:id
export async function updateBrand(req, res) {
  const brand = await prisma.brand.update({ where: { id: req.id }, data: req.body });
  res.json(brand);
}

// DELETE /brands/:id — onDelete: SetNull тул бараанууд үлдэж brandId нь null болно
export async function deleteBrand(req, res) {
  await prisma.brand.delete({ where: { id: req.id } });
  res.status(204).end();
}

// GET /brands/:id/products
export async function listBrandProducts(req, res) {
  const pg = parsePagination(req.query);
  const exists = await prisma.brand.findUnique({ where: { id: req.id }, select: { id: true } });
  if (!exists) throw notFound('Брэнд олдсонгүй');

  const where = { brandId: req.id };
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
