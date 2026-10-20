import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const allowPasswordChange = args.includes("--allow-password-change");
  const makeAdmin = args.includes("--admin");
  const positional = args.filter((arg) => !arg.startsWith("--"));

  const emailRaw = positional[0];
  const password = positional[1];

  if (!emailRaw || !password) {
    console.error("Usage: npx tsx backend/scripts/create-user.ts <email> <password> [--admin] [--allow-password-change]");
    process.exitCode = 1;
    return;
  }

  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    console.error("Enter a valid email address.");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`A user with email ${email} already exists.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      canChangePassword: makeAdmin || allowPasswordChange,
      isAdmin: makeAdmin,
      organization: {
        create: {
          language: "English",
          contact: { create: {} },
        },
      },
    },
  });

  console.info(`Created user ${email}.`);
  if (makeAdmin) {
    console.info("This account is an admin. Open /admin/users after signing in.");
  }
  if (!makeAdmin && !allowPasswordChange) {
    console.info("This account cannot change its password in My Space (provisioned account).");
  }
  console.info("They can sign in at /login with this email and password.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
