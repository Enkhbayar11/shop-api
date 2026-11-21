import prisma from '../db.js';

// PATCH /reviews/:id — зөвхөн rating, comment засна. Байхгүй бол P2025 → 404
export async function updateReview(req, res) {
  const review = await prisma.review.update({ where: { id: req.id }, data: req.body });
  res.json(review);
}

// DELETE /reviews/:id
export async function deleteReview(req, res) {
  await prisma.review.delete({ where: { id: req.id } });
  res.status(204).end();
}
