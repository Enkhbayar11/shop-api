import { PrismaClient } from '@prisma/client';

// Аппликейшн бүхэлдээ нэг л PrismaClient ашиглана.
const prisma = new PrismaClient();

export default prisma;
