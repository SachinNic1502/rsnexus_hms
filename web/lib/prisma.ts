import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient()
}

// Lazy initialization - only create when first accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    return globalForPrisma.prisma[prop as keyof PrismaClient]
  },
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = createPrismaClient()
}
