# Shop API — BED411 бие даалт

| | |
|---|---|
| Нэр | Enkhbayar Erdenee |
| Оюутны код | B24FM1026 |
| Сэдэв | Дэлгүүр (кодын сүүлийн цифр 6) |
| Model | A = **Category**, D = **Brand**, B = **Product**, C = **Review** |

Express 5, Prisma 6, PostgreSQL дээр бичсэн REST API. Бүх endpoint `/docs` дээр Swagger-ээр баримтжсан.

## Асаах алхам

Шаардлага: Node.js 20+ болон ажиллаж байгаа PostgreSQL.

```bash
git clone <repo-url> shop-api
cd shop-api
npm install
cp .env.example .env          # дараа нь .env доторх DATABASE_URL-д өөрийн нууц үгээ бич
npx prisma migrate dev        # database, хүснэгтүүдийг үүсгэнэ
npm run seed                  # жишээ өгөгдөл (хэдэн ч удаа ажиллуулж болно)
npm run dev                   # http://localhost:3000
```

- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/health → `{ "status": "ok" }`
- Postman: `postman_collection.json`-ийг import хийгээд seed хийсэн шинэ database дээр Runner-аар дарааллаар нь ажиллуулна (`baseUrl` хувьсагч = `http://localhost:3000`).

| Script | Юу хийх |
|---|---|
| `npm run dev` | Файл өөрчлөгдөхөд дахин асдаг горимоор асаана |
| `npm start` | Энгийнээр асаана |
| `npm run migrate` | `prisma migrate dev` |
| `npm run seed` | 5 ангилал, 6 брэнд, 25 бараа (3 нь брэндгүй), 60 сэтгэгдэл |
| `npm run studio` | Prisma Studio |

## Өгөгдлийн загвар

```
Category 1 ── олон Product олон ── 1 Brand
                    │
                    1
                    │
                   олон
                  Review
```

- **Product** хоёр foreign key-тэй: `categoryId` (заавал) ба `brandId` (заавал биш).
- **Review** дээр `@@unique([productId, authorName])` — нэг хүн нэг бараанд хоёр удаа сэтгэгдэл бичиж чадахгүй. Үүнийг database өөрөө хориглодог тул хоёр хүсэлт зэрэг ирсэн ч давхцахгүй. Давхцвал Prisma `P2002` алдаа өгч, errorHandler үүнийг **409** болгоно.

## Устгалтын дүрэм (onDelete) — яагаад ингэж шийдсэн бэ

| Устгах зүйл | Schema | Юу болох | Шалтгаан |
|---|---|---|---|
| Category | `onDelete: NoAction` | Бараатай бол устгахгүй, **409** | Бараа заавал ангилалтай байх ёстой (`categoryId` заавал). Ангиллыг устгаад бараануудыг хамт устгавал санамсаргүй их өгөгдөл алдагдана. Тиймээс эхлээд бараануудаа өөр ангилалд шилжүүл гэж хэрэглэгчид хэлнэ. |
| Brand | `onDelete: SetNull` | Брэнд устна, түүний бараануудын `brandId` нь `null` болно | Брэнд бол бараа заавал байх ёстой мэдээлэл биш (`brandId?`). Брэнд дэлгүүрээс гарсан ч бараа нь борлуулагдсаар байж болно. Тиймээс барааг устгалгүй зөвхөн холбоосыг нь таслана. |
| Product | `onDelete: Cascade` (Review дээр) | Бараа устна, сэтгэгдлүүд нь хамт устна | Сэтгэгдэл ганцаараа утгагүй, ямагт тодорхой бараанд хамаарна. Бараа байхгүй бол сэтгэгдлийг хадгалах шаардлагагүй. |

**Restrict биш NoAction яагаад?** Хоёулаа "холбоотой мөр байвал устгахгүй" гэсэн утгатай. Гэхдээ PostgreSQL дээр `RESTRICT` нь `23001` кодтой алдаа өгдөг бөгөөд Prisma 6 үүнийг таньдаггүй (`PrismaClientUnknownRequestError`), тэгэхээр 500 болчихно. `NO ACTION` нь энгийн foreign key алдаа (`23503`) өгдөг. Prisma үүнийг `P2003` болгодог тул errorHandler-т 409 болгож чадна.

## Бүтэц

```
prisma/        schema.prisma, migrations/, seed.js
src/
  app.js       middleware болон router-уудыг холбоно, /docs, /health
  db.js        ганц PrismaClient
  routes/      зөвхөн хаягийг controller-той холбоно
  controllers/ Prisma-г зөвхөн энд дуудна
  middleware/  logger, validate, validateId, notFound, errorHandler
  utils/       HttpError, query параметр болон хуудаслалтын туслах функцүүд
openapi.yaml   Swagger баримт
postman_collection.json
```

### Middleware

- **logger** — хүсэлт бүрийг `GET /products?q=galaxy 200 12.3ms` хэлбэрээр хэвлэнэ.
- **validateId** — URL-ийн `:id` эерэг бүхэл тоо биш бол 400 буцаана (`abc`, `0`, `-1`, `1e3`, хэт том тоо).
- **validate(model)** — POST/PATCH-ийн body-г шалгана. Model бүр өөрийн дүрэмтэй. POST дээр заавал талбаруудыг шаардана, PATCH дээр зөвхөн ирсэн талбаруудыг шалгана. Model-д байхгүй талбар (`id`, `createdAt` гэх мэт) ирвэл 400 буцаана. Текстийг `trim` хийж, хоосон бол 400 буцаана.
- **notFound** — таараагүй хаягт 404 JSON буцаана.
- **errorHandler** — Prisma-ийн кодыг HTTP status болгох цорын ганц газар:
  - `P2002` (unique давхцал) → 409
  - `P2025` (бичлэг олдсонгүй) → 404
  - `P2003` (foreign key) → DELETE үед 409, POST/PATCH үед 400 (байхгүй `categoryId`/`brandId`)
  - буруу JSON → 400, бусад → 500 (server унахгүй)

Алдааны хариу бүгд `{ "message": "...", "field": "rating" }` хэлбэртэй. `field` нь зөвхөн талбартай холбоотой алдаанд ирнэ.

## Шалгах дүрэм

| Талбар | Дүрэм |
|---|---|
| `rating` | 1–5 бүхэл тоо |
| `releaseYear` | 1900-аас ирэх он хүртэл |
| `price` | эерэг бүхэл тоо (₮) |
| `foundedYear` | 1800-аас энэ он хүртэл, эсвэл `null` |
| `name`, `authorName`, `comment`, `description` | текст, хоосон эсвэл зөвхөн зай байж болохгүй |
| `categoryId`, `brandId` | эерэг бүхэл тоо, database-д байх ёстой |
| `PATCH /reviews/:id` | зөвхөн `rating`, `comment` засна (зохиогчийг солих нь @@unique-г тойрох арга болохоос сэргийлсэн) |

## GET /products

| Параметр | Жишээ | Дүрэм |
|---|---|---|
| `q` | `?q=galaxy` | нэр эсвэл тайлбарт агуулагдсан, том жижиг үсэг ялгахгүй |
| `categoryId` | `?categoryId=2` | тоо биш бол 400 |
| `brandId` | `?brandId=4` | тоо биш бол 400 |
| `hasBrand` | `?hasBrand=false` | false бол брэндгүй бараа |
| `minPrice`, `maxPrice` | `?minPrice=100000` | minPrice > maxPrice бол 400 |
| `isAvailable` | `?isAvailable=true` | true/false-аас өөр бол 400 |
| `sort` | `?sort=price` | `name`, `price`, `releaseYear`, `createdAt` |
| `order` | `?order=asc` | `asc`/`desc`, анхдагч `desc` |
| `page` | `?page=2` | ≥ 1 |
| `limit` | `?limit=20` | 1–50, анхдагч 10 |
| `minRating` *(нэмэлт)* | `?minRating=4` | дундаж үнэлгээ ≥ утга (1–5) |

Кино сэдвийн `minYear/maxYear` параметрийн оронд дэлгүүрт илүү утгатай `minPrice/maxPrice`-г ашигласан. Мөн `title`-ийн оронд `name`, `isShowing`-ийн оронд `isAvailable`, `durationMin`-ийн оронд `price` хэрэглэсэн.

Мэдэгдэхгүй параметр (`?sortt=name`) эсвэл давхардсан параметр (`?page=1&page=2`) ирвэл чимээгүй алгасахгүй, 400 буцаана. `meta.total` нь шүүлтүүрийн дараах тоо. Хуудаслалттай бүх жагсаалт `{ data, meta: { page, limit, total, pages } }` хэлбэртэй.

**Нэмэлт (+5):** `GET /products/:id` нь `averageRating`, `reviewCount`-тэй. `?minRating=` нь `prisma.review.groupBy({ by: ['productId'], having: { rating: { _avg: { gte } } } })`-ээр шаардлага хангасан барааны id-г олоод `where.id.in`-д өгнө.

## Мэдэж байгаа дутагдал

- Нэвтрэлт (auth) байхгүй: хэн ч бүх зүйлийг засаж, устгаж чадна.
- `authorName` нь зөвхөн текст тул "ижил хүн" гэдгийг нэрээр нь л ялгана. "Болд", "болд" гэвэл өөр хүн гэж үзнэ.
- `minRating` нь эхлээд тохирох бүх барааны id-г санах ойд авдаг. Бараа маш олон болвол удаашрах магадлалтай.
- Ангилал, брэндийн жагсаалт зөвхөн хуудаслалттай, шүүлтүүр эсвэл эрэмбэ байхгүй.
- Бараа устгахад сэтгэгдлүүд нь бүрмөсөн устдаг (soft delete хийгээгүй).
- `releaseYear`-ийн дээд хязгаар (ирэх он) серверийн цагаас хамаарна.
