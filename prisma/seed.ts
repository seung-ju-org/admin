import { hash } from "bcryptjs";

import { PrismaClient, Role } from "@prisma/client";
import { createId } from "../src/lib/id";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "admin";
  const adminPassword = "admin";

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log("Admin user already exists.");
    return;
  }

  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      id: createId(),
      username: adminUsername,
      email: "admin@local.dev",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seed completed: admin/admin");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
