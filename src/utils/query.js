import { badRequest } from './httpError.js';

const INT_MAX = 2147483647;

// Мэдэгдэхгүй query параметр ирвэл (жишээ нь ?sortt=name) чимээгүй алгасахгүй, 400.
export function allowOnly(query, names) {
  for (const key of Object.keys(query)) {
    if (!names.includes(key)) throw badRequest(`'${key}' гэсэн параметр байхгүй`, key);
  }
}

// Query-ийн нэг параметрийг авна. ?page=1&page=2 гэх мэт давхардсан бол 400.
export function getParam(query, name) {
  const value = query[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw badRequest(`${name} параметр нэг л удаа ирэх ёстой`, name);
  return value;
}

// Бүхэл тоо уншина. Тоо биш эсвэл хязгаараас гадуур бол 400.
export function parseIntParam(query, name, { min = 1, max = INT_MAX } = {}) {
  const raw = getParam(query, name);
  if (raw === undefined) return undefined;
  if (!/^-?\d+$/.test(raw)) throw badRequest(`${name} бүхэл тоо байх ёстой`, name);
  const n = Number(raw);
  // Дээд хязгаар нь зөвхөн database-ийн Int-ийн хязгаар бол хэрэглэгчид харуулахгүй
  if (max === INT_MAX) {
    if (n < min) throw badRequest(`${name} ${min}-ээс бага байж болохгүй`, name);
    if (n > max) throw badRequest(`${name} хэт том тоо байна`, name);
  } else if (n < min || n > max) {
    throw badRequest(`${name} ${min}–${max} хооронд байх ёстой`, name);
  }
  return n;
}

// "true" / "false"-ээс өөр бол 400.
export function parseBoolParam(query, name) {
  const raw = getParam(query, name);
  if (raw === undefined) return undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw badRequest(`${name} нь true эсвэл false байх ёстой`, name);
}

// Зөвшөөрөгдсөн утгуудын аль нэг байх ёстой.
export function parseEnumParam(query, name, allowed, defaultValue) {
  const raw = getParam(query, name);
  if (raw === undefined) return defaultValue;
  if (!allowed.includes(raw)) {
    throw badRequest(`${name} нь ${allowed.join(', ')}-ийн аль нэг байх ёстой`, name);
  }
  return raw;
}

// page (≥1), limit (1–50, анхдагч 10).
// extra — page, limit-ээс гадна зөвшөөрөх параметрүүд.
export function parsePagination(query, extra = []) {
  allowOnly(query, ['page', 'limit', ...extra]);
  const page = parseIntParam(query, 'page', { min: 1 }) ?? 1;
  const limit = parseIntParam(query, 'limit', { min: 1, max: 50 }) ?? 10;
  return { page, limit, skip: (page - 1) * limit };
}

// Хуудаслалттай бүх жагсаалт ийм хэлбэрээр хариулна.
export function paginated(data, { page, limit }, total) {
  return {
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
