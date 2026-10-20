import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const emailRaw = process.argv[2];
  if (!emailRaw) {
    console.error("Usage: npx tsx backend/scripts/set-admin.ts <email>");
    process.exitCode = 1;
    return;
  }

  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}. Create the account first.`);
    process.exitCode = 1;
    return;
  }

  if (user.isAdmin) {
    if (!user.canChangePassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { canChangePassword: true },
      });
      console.info(`${email} is already an admin; enabled My Space sign-in changes.`);
    } else {
      console.info(`${email} is already an admin.`);
    }
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true, canChangePassword: true },
  });

  console.info(`Granted admin access to ${email}. Sign in again to open /admin/users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
