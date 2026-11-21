import { HttpError } from '../utils/httpError.js';

// Бүх алдаа энд ирнэ. Алдааны хариу үргэлж { message, field? } хэлбэртэй.
export function errorHandler(err, req, res, next) {
  // 1. Бидний өөрсдөө шидсэн алдаа (validate, controller)
  if (err instanceof HttpError) {
    return send(res, err.status, err.message, err.field);
  }

  // 2. express.json() буруу JSON уншсан үед
  if (err.type === 'entity.parse.failed') {
    return send(res, 400, 'Body-гийн JSON буруу бичигдсэн байна');
  }
  if (err.type === 'entity.too.large') {
    return send(res, 413, 'Body хэт том байна');
  }

  // 3. Prisma-ийн алдааны кодыг HTTP status болгох газар зөвхөн энэ.
  //    (@prisma/client-ийн классыг импортлохгүйгээр err.code-оор танина.)
  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002': {
        // @unique эсвэл @@unique зөрчигдсөн
        const target = err.meta?.target;
        const field = Array.isArray(target) ? target[target.length - 1] : undefined;
        return send(res, 409, 'Ийм утгатай бичлэг аль хэдийн байна', field);
      }
      case 'P2025':
        // update/delete хийх гэсэн бичлэг байхгүй
        return send(res, 404, 'Бичлэг олдсонгүй');
      case 'P2003': {
        // Foreign key зөрчигдсөн
        const field = fkField(err.meta?.constraint ?? err.meta?.field_name);
        if (req.method === 'DELETE') {
          // onDelete: NoAction — холбоотой бичлэг байгаа тул устгахгүй
          return send(res, 409, 'Холбоотой бичлэгүүд байгаа тул устгах боломжгүй');
        }
        // POST/PATCH дээр байхгүй id заасан
        return send(res, 400, `${field ?? 'Холбоос'}-д харгалзах бичлэг байхгүй`, field);
      }
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return send(res, 400, 'Өгөгдлийн төрөл буруу байна');
  }

  // 4. Урьдчилан тооцоогүй алдаа — server унахгүй, 500 буцаана
  console.error(err);
  return send(res, 500, 'Серверийн дотоод алдаа');
}

function send(res, status, message, field) {
  const body = { message };
  if (field) body.field = field;
  res.status(status).json(body);
}

// "Product_categoryId_fkey (index)" → "categoryId"
function fkField(name) {
  if (!name) return undefined;
  const match = /([A-Za-z]+)_fkey/.exec(name);
  return match ? match[1] : name;
}
