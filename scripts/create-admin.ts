/**
 * Create or reset a staff account from the command line (e.g. if every admin is locked out).
 *   npm run create-admin -- you@g.ucla.edu "Your Name" "a-long-password" [ADMIN|EDITOR]
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const [email, name, password, role = "ADMIN"] = process.argv.slice(2);
if (!email || !name || !password || password.length < 10 || !["ADMIN", "EDITOR"].includes(role)) {
  console.error('Usage: npm run create-admin -- <email> "<name>" "<password (10+ chars)>" [ADMIN|EDITOR]');
  process.exit(1);
}
const prisma = new PrismaClient();
(async () => {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, role, passwordHash, active: true },
    create: { email: email.toLowerCase(), name, role, passwordHash },
  });
  console.log(`✓ ${role} account ready: ${email}`);
  await prisma.$disconnect();
})();
