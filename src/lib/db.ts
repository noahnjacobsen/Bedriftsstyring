import { PrismaClient } from "@prisma/client";

// Globally omit the large PDF bytes from Contract queries — they're only
// fetched explicitly in the download route (via `select: { fileData: true }`).
const prismaClientSingleton = () =>
  new PrismaClient({ omit: { contract: { fileData: true } } });

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Reuse a single PrismaClient across hot reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientSingleton;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
