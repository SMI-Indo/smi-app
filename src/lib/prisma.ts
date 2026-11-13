import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function runtimeConnectionString() {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url || process.env.VERCEL_ENV !== "preview") return url;

  const connection = new URL(url);
  if (connection.hostname.endsWith(".pooler.supabase.com") && connection.port === "5432") {
    connection.port = "6543";
    return connection.toString();
  }
  return url;
}

function createClient() {
  const pool = new Pool({
    connectionString: runtimeConnectionString(),
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ??= createClient();
