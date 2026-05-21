import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const createPrismaClient = () =>
  new PrismaClient({
    adapter,
  });

const hasSettingsDelegates = (client: PrismaClient) => {
  const candidate = client as unknown as Record<string, unknown>;
  return (
    "notificationPreferences" in candidate && "privacyPreferences" in candidate
  );
};

const prisma =
  globalForPrisma.prisma && hasSettingsDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
