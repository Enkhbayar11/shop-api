// npm run seed — 5 ангилал, 6 брэнд, 25 бараа (3 нь брэндгүй), 60 сэтгэгдэл.
// Дахин ажиллуулахад алдаа гарахгүй: эхлээд бүх хүснэгтийг хоослоод id-г 1-ээс эхлүүлнэ.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'Ухаалаг утас',
  'Зөөврийн компьютер',
  'Чихэвч',
  'Ухаалаг цаг',
  'Дагалдах хэрэгсэл',
];

const brands = [
  { name: 'Apple', foundedYear: 1976 },
  { name: 'Samsung', foundedYear: 1938 },
  { name: 'Sony', foundedYear: 1946 },
  { name: 'Xiaomi', foundedYear: 2010 },
  { name: 'Lenovo', foundedYear: 1984 },
  { name: 'Huawei', foundedYear: 1987 },
];

// [нэр, гарсан он, үнэ (₮), ангилал, брэнд (null = брэндгүй), зарагдаж байгаа эсэх, тайлбар]
const products = [
  ['iPhone 15 Pro', 2023, 4299000, 'Ухаалаг утас', 'Apple', true, 'A17 Pro чип, титан их бие, 48MP камер'],
  ['Galaxy S24 Ultra', 2024, 4590000, 'Ухаалаг утас', 'Samsung', true, 'S Pen-тэй, 200MP камер, Galaxy AI'],
  ['Xiaomi 14', 2024, 2890000, 'Ухаалаг утас', 'Xiaomi', true, 'Leica камертай авсаархан флагшип'],
  ['Huawei P60 Pro', 2023, 3190000, 'Ухаалаг утас', 'Huawei', false, 'Хувьсах диафрагмтай камер'],
  ['Galaxy A55', 2024, 1390000, 'Ухаалаг утас', 'Samsung', true, null],
  ['MacBook Air M3', 2024, 4190000, 'Зөөврийн компьютер', 'Apple', true, '13 инч, сэнсгүй, 18 цаг батерей'],
  ['ThinkPad X1 Carbon Gen 11', 2023, 6490000, 'Зөөврийн компьютер', 'Lenovo', true, 'Бизнесийн хөнгөн зөөврийн компьютер'],
  ['Legion 5 Pro', 2023, 4890000, 'Зөөврийн компьютер', 'Lenovo', false, 'RTX 4060 график карттай тоглоомын компьютер'],
  ['Galaxy Book4 Pro', 2024, 5290000, 'Зөөврийн компьютер', 'Samsung', true, 'AMOLED дэлгэцтэй'],
  ['MateBook X Pro', 2024, 5690000, 'Зөөврийн компьютер', 'Huawei', true, null],
  ['AirPods Pro 2', 2022, 899000, 'Чихэвч', 'Apple', true, 'Идэвхтэй дуу чимээ дарагчтай'],
  ['WH-1000XM5', 2022, 1190000, 'Чихэвч', 'Sony', true, 'Толгойд зүүдэг, дуу чимээ дарагчтай'],
  ['WF-1000XM5', 2023, 990000, 'Чихэвч', 'Sony', true, 'Чихэнд суудаг утасгүй чихэвч'],
  ['Galaxy Buds2 Pro', 2022, 690000, 'Чихэвч', 'Samsung', false, null],
  ['Redmi Buds 5 Pro', 2023, 290000, 'Чихэвч', 'Xiaomi', true, 'Хямд үнэтэй ANC чихэвч'],
  ['Apple Watch Series 9', 2023, 1490000, 'Ухаалаг цаг', 'Apple', true, 'Double tap дохио, тод дэлгэц'],
  ['Galaxy Watch6', 2023, 990000, 'Ухаалаг цаг', 'Samsung', true, 'Нойр болон зүрхний хяналттай'],
  ['Huawei Watch GT 4', 2023, 790000, 'Ухаалаг цаг', 'Huawei', true, '14 хоног цэнэг барина'],
  ['Xiaomi Smart Band 8', 2023, 129000, 'Ухаалаг цаг', 'Xiaomi', true, null],
  ['MagSafe цэнэглэгч', 2020, 179000, 'Дагалдах хэрэгсэл', 'Apple', true, 'iPhone-д соронзоор наалддаг утасгүй цэнэглэгч'],
  ['45W хурдан цэнэглэгч', 2022, 129000, 'Дагалдах хэрэгсэл', 'Samsung', true, 'USB-C Super Fast Charging 2.0'],
  ['Power Bank 20000mAh', 2022, 99000, 'Дагалдах хэрэгсэл', 'Xiaomi', true, null],
  ['USB-C кабель 2м', 2023, 25000, 'Дагалдах хэрэгсэл', null, true, 'Нейлон бүрээстэй 60W кабель'],
  ['Зөөврийн компьютерийн цүнх 15.6"', 2022, 89000, 'Дагалдах хэрэгсэл', null, true, 'Ус нэвтрүүлдэггүй даавуу'],
  ['Дэлгэцийн хамгаалалтын шил', 2024, 19000, 'Дагалдах хэрэгсэл', null, false, '9H хатуулагтай'],
];

const authors = [
  'Бат-Эрдэнэ', 'Сарангэрэл', 'Тэмүүлэн', 'Номин', 'Ганзориг', 'Энхжин',
  'Мөнх-Очир', 'Анужин', 'Билгүүн', 'Хулан', 'Дөлгөөн', 'Түвшинжаргал',
];

const comments = [
  'Маш сайн бараа, санал болгож байна.',
  'Үнэдээ тохирсон чанартай.',
  'Хүргэлт хурдан байсан.',
  'Батерей нь хүлээж байснаас муу.',
  'Дизайн нь гоё, хэрэглэхэд таатай.',
  null,
  'Дунд зэрэг, илүү сайн гэж бодсон.',
  'Хоёр дахь удаагаа авч байна.',
];

async function main() {
  // Бүх хүснэгтийг хоослоод id-г 1-ээс эхлүүлнэ — seed-ийг хэдэн ч удаа ажиллуулж болно.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Review", "Product", "Brand", "Category" RESTART IDENTITY CASCADE'
  );

  const categoryIds = {};
  for (const name of categories) {
    const c = await prisma.category.create({ data: { name } });
    categoryIds[name] = c.id;
  }

  const brandIds = {};
  for (const b of brands) {
    const created = await prisma.brand.create({ data: b });
    brandIds[b.name] = created.id;
  }

  const productIds = [];
  for (const [name, releaseYear, price, category, brand, isAvailable, description] of products) {
    const p = await prisma.product.create({
      data: {
        name,
        releaseYear,
        price,
        isAvailable,
        description,
        categoryId: categoryIds[category],
        brandId: brand ? brandIds[brand] : null,
      },
    });
    productIds.push(p.id);
  }

  // 60 сэтгэгдэл: бараа бүрт 2–3. Нэг бараанд нэг зохиогч давхцахгүйгээр сонгоно.
  const reviews = [];
  for (let k = 0; k < 60; k++) {
    const round = Math.floor(k / productIds.length); // 0, 1, 2
    const productIndex = k % productIds.length;
    reviews.push({
      productId: productIds[productIndex],
      authorName: authors[(productIndex + round * 4) % authors.length],
      rating: ((k * 7 + round) % 5) + 1,
      comment: comments[k % comments.length],
    });
  }
  await prisma.review.createMany({ data: reviews });

  console.log(
    `Seed дууслаа: ${categories.length} ангилал, ${brands.length} брэнд, ` +
      `${products.length} бараа, ${reviews.length} сэтгэгдэл`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
