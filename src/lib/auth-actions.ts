"use server";

import { redirect } from "next/navigation";
import { prisma } from "./db";
import { verifyPassword, createSession, destroySession } from "./auth";

// Brute-force protection: lock an account for a while after repeated failures.
const MAX_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

// Login server action. On failure, redirects back to /login with an error flag
// (?error=1 = wrong credentials, ?error=locked = temporarily locked).
export async function login(formData: FormData) {
  const username = (formData.get("username") ?? "").toString().trim().toLowerCase();
  const password = (formData.get("password") ?? "").toString();

  const user = await prisma.user.findUnique({ where: { username } });

  // Account temporarily locked → reject without even checking the password.
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    redirect("/login?error=locked");
  }

  const ok = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !ok) {
    if (user) {
      const attempts = user.failedAttempts + 1;
      const locked = attempts >= MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: locked ? 0 : attempts,
          lockedUntil: locked
            ? new Date(Date.now() + LOCK_MINUTES * 60_000)
            : user.lockedUntil,
        },
      });
      if (locked) redirect("/login?error=locked");
    }
    redirect("/login?error=1");
  }

  // Success → clear any failure state, then start the session.
  if (user.failedAttempts !== 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
