/**
 * Create or update an owner account with a STRONG password.
 *
 * Use this for the hosted/production database — never the default-password seed.
 * Reads credentials from environment variables (so the password doesn't end up
 * in your shell history):
 *
 *   OWNER_USERNAME=eier1 OWNER_NAME="Eier 1" OWNER_PASSWORD='<langt-unikt-passord>' \
 *     npm run db:owner
 *
 * DATABASE_URL must point at the target database.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function main() {
  const username = (process.env.OWNER_USERNAME ?? "").trim().toLowerCase();
  const name = (process.env.OWNER_NAME ?? "").trim() || username;
  const password = process.env.OWNER_PASSWORD ?? "";

  if (!username || !password) {
    console.error(
      "Mangler OWNER_USERNAME og/eller OWNER_PASSWORD.\n" +
        "Eksempel:\n" +
        "  OWNER_USERNAME=eier1 OWNER_NAME=\"Eier 1\" OWNER_PASSWORD='…' npm run db:owner",
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Passordet må være minst 12 tegn (helst langt og unikt).");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { username },
    create: { username, name, passwordHash },
    update: { name, passwordHash, failedAttempts: 0, lockedUntil: null },
  });

  console.log(`Eier «${username}» er opprettet/oppdatert med nytt passord.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
