import { badRequest } from '../utils/httpError.js';

const INT_MAX = 2147483647; // PostgreSQL Int-ийн дээд хязгаар
const nextYear = () => new Date().getFullYear() + 1;
const thisYear = () => new Date().getFullYear();

// Model бүрийн body-гийн дүрэм.
// type: 'string' | 'int' | 'boolean'
// required: POST үед заавал. nullable: null утга авч болно.
export const rules = {
  category: {
    name: { type: 'string', required: true, maxLength: 100 },
  },
  brand: {
    name: { type: 'string', required: true, maxLength: 100 },
    foundedYear: { type: 'int', nullable: true, min: 1800, max: thisYear },
  },
  product: {
    name: { type: 'string', required: true, maxLength: 200 },
    releaseYear: { type: 'int', required: true, min: 1900, max: nextYear },
    price: { type: 'int', required: true, min: 1, max: INT_MAX },
    description: { type: 'string', nullable: true, maxLength: 2000 },
    isAvailable: { type: 'boolean' },
    categoryId: { type: 'int', required: true, min: 1, max: INT_MAX },
    brandId: { type: 'int', nullable: true, min: 1, max: INT_MAX },
  },
  review: {
    rating: { type: 'int', required: true, min: 1, max: 5 },
    comment: { type: 'string', nullable: true, maxLength: 1000 },
    authorName: { type: 'string', required: true, maxLength: 100 },
  },
  // PATCH /reviews/:id — зохиогч, бараа солигдохгүй; зөвхөн үнэлгээ, сэтгэгдэл засна
  reviewUpdate: {
    rating: { type: 'int', min: 1, max: 5 },
    comment: { type: 'string', nullable: true, maxLength: 1000 },
  },
};

// validate('product') — POST дээр бүх заавал талбарыг шаардана,
// PATCH дээр зөвхөн ирсэн талбаруудыг шалгана.
export function validate(ruleName) {
  const schema = rules[ruleName];

  return (req, res, next) => {
    const isPatch = req.method === 'PATCH';
    const body = req.body;

    if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw badRequest('Body нь JSON объект байх ёстой');
    }

    // Model-д байхгүй талбар (id, createdAt, ...) ирвэл 400
    for (const key of Object.keys(body)) {
      if (!Object.hasOwn(schema, key)) {
        throw badRequest(`'${key}' талбарыг илгээх боломжгүй`, key);
      }
    }

    if (isPatch && Object.keys(body).length === 0) {
      throw badRequest('Засах талбар алга байна');
    }

    const clean = {};
    for (const [field, rule] of Object.entries(schema)) {
      const has = Object.hasOwn(body, field);

      if (!has) {
        if (rule.required && !isPatch) throw badRequest(`${field} заавал байх ёстой`, field);
        continue;
      }

      clean[field] = checkValue(field, body[field], rule);
    }

    req.body = clean; // текстийг trim хийсэн цэвэр body
    next();
  };
}

function checkValue(field, value, rule) {
  if (value === null) {
    if (rule.nullable) return null;
    throw badRequest(`${field} хоосон (null) байж болохгүй`, field);
  }

  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') throw badRequest(`${field} текст байх ёстой`, field);
      const trimmed = value.trim();
      if (trimmed === '') throw badRequest(`${field} хоосон байж болохгүй`, field);
      if (rule.maxLength && trimmed.length > rule.maxLength) {
        throw badRequest(`${field} ${rule.maxLength} тэмдэгтээс урт байж болохгүй`, field);
      }
      return trimmed;
    }

    case 'int': {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw badRequest(`${field} бүхэл тоо байх ёстой`, field);
      }
      const min = typeof rule.min === 'function' ? rule.min() : rule.min;
      const max = typeof rule.max === 'function' ? rule.max() : rule.max;
      if (min !== undefined && value < min) throw badRequest(`${field} ${min}-ээс бага байж болохгүй`, field);
      if (max !== undefined && value > max) throw badRequest(`${field} ${max}-ээс их байж болохгүй`, field);
      return value;
    }

    case 'boolean': {
      if (typeof value !== 'boolean') throw badRequest(`${field} true эсвэл false байх ёстой`, field);
      return value;
    }
  }
}
