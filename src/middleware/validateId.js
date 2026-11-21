import { badRequest } from '../utils/httpError.js';

const INT_MAX = 2147483647;

// URL-ийн :id эерэг бүхэл тоо биш бол 400. Тоо болгож req.id-д хадгална.
export function validateId(req, res, next) {
  const raw = req.params.id;

  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > INT_MAX) {
    throw badRequest('id эерэг бүхэл тоо байх ёстой', 'id');
  }

  req.id = Number(raw);
  next();
}
