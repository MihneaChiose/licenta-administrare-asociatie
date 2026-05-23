import "dotenv/config";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const tenantPassword = await bcrypt.hash("locatar123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      name: "Administrator Test",
      email: "admin@test.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: "locatar@test.com" },
    update: {},
    create: {
      name: "Locatar Test",
      email: "locatar@test.com",
      passwordHash: tenantPassword,
      role: UserRole.TENANT,
    },
  });

  const association = await prisma.association.upsert({
    where: { id: "default-association" },
    update: {},
    create: {
      id: "default-association",
      name: "Asociatia Bloc A1",
      address: "Strada Exemplu nr. 10, Bucuresti",
    },
  });

  await prisma.apartment.upsert({
    where: {
      id: "default-apartment",
    },
    update: {},
    create: {
      id: "default-apartment",
      associationId: association.id,
      ownerId: tenant.id,
      number: "12",
      floor: 3,
      surface: 55.5,
      numberOfResidents: 2,
    },
  });

  console.log("Seed completed");
  console.log("Admin:", admin.email, "password: admin123");
  console.log("Tenant:", tenant.email, "password: locatar123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
